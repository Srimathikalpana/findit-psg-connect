const { findMatches, calculateItemSimilarity, isLocationNearby, isTimeValid } = require('../utils/itemMatcher');
const LostItem = require('../models/lostItem');
const FoundItem = require('../models/foundItem');
const User = require('../models/user');
const stringSimilarity = require('string-similarity');

// Get matches for a lost item
exports.getMatchesForLostItem = async (req, res) => {
  try {
    const { id } = req.params;
    const lostItem = await LostItem.findById(id);
    if (!lostItem) {
      return res.status(404).json({
        success: false,
        message: 'Lost item not found'
      });
    }

    // Find potential matches from found items
    const foundItems = await FoundItem.find({ 
      status: 'active',
      user: { $ne: req.user._id } // Exclude user's own found items
    });

    const matches = [];
    foundItems.forEach(foundItem => {
      const nameSimilarity = stringSimilarity.compareTwoStrings(
        lostItem.itemName.toLowerCase(),
        foundItem.itemName.toLowerCase()
      );
      
      const descriptionSimilarity = stringSimilarity.compareTwoStrings(
        lostItem.description.toLowerCase(),
        foundItem.description.toLowerCase()
      );

      const locationSimilarity = stringSimilarity.compareTwoStrings(
        lostItem.placeLost.toLowerCase(),
        foundItem.placeFound.toLowerCase()
      );

      const overallScore = (nameSimilarity * 0.5) + (descriptionSimilarity * 0.3) + (locationSimilarity * 0.2);

      if (overallScore > 0.6) {
        matches.push({
          ...foundItem.toObject(),
          matchScore: overallScore
        });
      }
    });

    res.json({
      success: true,
      matches: matches.sort((a, b) => b.matchScore - a.matchScore)
    });

  } catch (error) {
    console.error('Error getting matches:', error);
    res.status(500).json({
      success: false,
      message: 'Error finding matches'
    });
  }
};

// NLP Matching Service
const findMatchesService = async (foundItem) => {
  try {
    const lostItems = await LostItem.find({ status: 'active' }).populate('user', 'name email studentId');
    const matches = [];

    lostItems.forEach(lostItem => {
      // Calculate similarity scores
      const nameSimilarity = stringSimilarity.compareTwoStrings(
        foundItem.itemName.toLowerCase(), 
        lostItem.itemName.toLowerCase()
      );
      
      const descriptionSimilarity = stringSimilarity.compareTwoStrings(
        foundItem.description.toLowerCase(), 
        lostItem.description.toLowerCase()
      );

      const locationSimilarity = stringSimilarity.compareTwoStrings(
        foundItem.placeFound.toLowerCase(), 
        lostItem.placeLost.toLowerCase()
      );

      // Weighted average score
      const overallScore = (nameSimilarity * 0.5) + (descriptionSimilarity * 0.3) + (locationSimilarity * 0.2);

      if (overallScore > 0.6) { // Threshold for potential match
        matches.push({
          lostItem,
          score: overallScore,
          nameSimilarity,
          descriptionSimilarity,
          locationSimilarity
        });
      }
    });

    // Sort by score descending
    return matches.sort((a, b) => b.score - a.score);
  } catch (error) {
    console.error('Error finding matches:', error);
    return [];
  }
};

// Create Lost Item
exports.createLostItem = async (req, res) => {
  try {
    const { 
      itemName,
      description,
      placeLost,
      dateLost,
      imageUrl,
      category, 
      color, 
      brand, 
      reward, 
      isUrgent,
      contactInfo 
    } = req.body;

    if (!itemName || !description || !placeLost || !dateLost || !category) {
      return res.status(400).json({ 
        success: false,
        message: 'Required fields: itemName, description, placeLost, dateLost, category' 
      });
    }

    const lostItem = new LostItem({
      itemName,
      description,
      placeLost,
      dateLost: new Date(dateLost),
      imageUrl,
      category,
      color,
      brand,
      reward: reward || 0,
      isUrgent: isUrgent || false,
      contactInfo,
      user: req.user._id,
      type: 'lost'
    });

    // Find potential matches in found items
    const foundItems = await FoundItem.find({ 
      status: 'active'  // Only look for unclaimed found items
    });
    
    const potentialMatches = await findMatches(lostItem, foundItems);
    
    // Save matches reference in lost item
    lostItem.potentialMatches = potentialMatches.map(match => match.itemId);
    await lostItem.save();

    // Add reference to matched found items
    for (const match of potentialMatches) {
      await FoundItem.findByIdAndUpdate(match.itemId, {
        $addToSet: { matchedWith: lostItem._id }
      });
    }

    await lostItem.save();

    res.status(201).json({ 
      success: true,
      message: 'Lost item reported successfully', 
      data: lostItem,
      matches: potentialMatches
    });
  } catch (error) {
    console.error('Create lost item error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Create Found Item
exports.createFoundItem = async (req, res) => {
  try {
    const { 
      itemName,
      description,
      placeFound,
      dateFound,
      imageUrl,
      category, 
      color, 
      brand, 
      handedOverTo, 
      storageLocation,
      contactInfo,
      verificationQuestion,
      correctAnswer
    } = req.body;

    if (!itemName || !description || !placeFound || !dateFound || !category || !verificationQuestion || !correctAnswer) {
      return res.status(400).json({ 
        success: false,
        message: 'Required fields: itemName, description, placeFound, dateFound, category, verificationQuestion, correctAnswer' 
      });
    }

    const foundItem = new FoundItem({
      itemName,
      description,
      placeFound,
      dateFound: new Date(dateFound),
      imageUrl,
      category,
      color,
      brand,
      handedOverTo,
      storageLocation,
      contactInfo,
      verificationQuestion,
      correctAnswer,
      user: req.user._id
    });

    await foundItem.save();

    // Find potential matches
    const matches = await findMatchesService(foundItem);

    res.status(201).json({ 
      success: true,
      message: 'Found item reported successfully', 
      data: foundItem,
      matches: matches.slice(0, 5) // Return top 5 matches
    });
  } catch (error) {
    console.error('Create found item error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get All Lost Items
exports.getAllLostItems = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, category, search } = req.query;
    
    let query = { status: 'active' };
    
    if (status) query.status = status;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { itemName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { placeLost: { $regex: search, $options: 'i' } }
      ];
    }

    const lostItems = await LostItem.find(query)
      .populate('user', 'name studentId')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await LostItem.countDocuments(query);

    res.json({
      success: true,
      data: lostItems,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalItems: count
    });
  } catch (error) {
    console.error('Get lost items error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get All Found Items
exports.getAllFoundItems = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, category, search } = req.query;
    
    let query = { status: 'active' };
    
    if (status) query.status = status;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { itemName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { placeFound: { $regex: search, $options: 'i' } }
      ];
    }

    const foundItems = await FoundItem.find(query)
      .populate('user', 'name studentId')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await FoundItem.countDocuments(query);

    res.json({
      success: true,
      data: foundItems,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalItems: count
    });
  } catch (error) {
    console.error('Get found items error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get Item by ID
exports.getItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const path = req.path;
    
    let item;
    if (path.includes('/lost-items/')) {
      item = await LostItem.findById(id).populate('user', 'name studentId email');
    } else if (path.includes('/found-items/')) {
      item = await FoundItem.findById(id).populate('user', 'name studentId email');
    } else {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid item type' 
      });
    }

    if (!item) {
      return res.status(404).json({ 
        success: false,
        message: 'Item not found' 
      });
    }

    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    console.error('Get item by ID error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get User's Items
exports.getUserItems = async (req, res) => {
  try {
    const { type } = req.query;
    const userId = req.user._id;

    let lostItems = [];
    let foundItems = [];

    if (!type || type === 'lost') {
      lostItems = await LostItem.find({ user: userId })
        .sort({ createdAt: -1 });
    }

    if (!type || type === 'found') {
      foundItems = await FoundItem.find({ user: userId })
        .sort({ createdAt: -1 });
    }

    res.json({
      success: true,
      data: {
        lostItems,
        foundItems
      }
    });
  } catch (error) {
    console.error('Get user items error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Update Item
exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const path = req.path;
    const updateData = req.body;

    let item;
    if (path.includes('/lost-items/')) {
      item = await LostItem.findById(id);
    } else if (path.includes('/found-items/')) {
      item = await FoundItem.findById(id);
    } else {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid item type' 
      });
    }

    if (!item) {
      return res.status(404).json({ 
        success: false,
        message: 'Item not found' 
      });
    }

    // Check if user owns the item
    if (item.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to update this item' 
      });
    }

    Object.assign(item, updateData);
    await item.save();

    res.json({
      success: true,
      message: 'Item updated successfully',
      data: item
    });
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Delete Item
exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const path = req.path;

    let item;
    if (path.includes('/lost-items/')) {
      item = await LostItem.findById(id);
    } else if (path.includes('/found-items/')) {
      item = await FoundItem.findById(id);
    } else {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid item type' 
      });
    }

    if (!item) {
      return res.status(404).json({ 
        success: false,
        message: 'Item not found' 
      });
    }

    // Check if user owns the item or is admin
    if (item.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to delete this item' 
      });
    }

    // Prefer document.deleteOne when available; otherwise choose model by inspecting the item
    if (typeof item.deleteOne === 'function') {
      await item.deleteOne();
    } else {
      const ModelToUse = item.placeLost !== undefined ? LostItem : FoundItem;
      await ModelToUse.deleteOne({ _id: id });
    }

    res.json({
      success: true,
      message: 'Item deleted successfully'
    });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Search Items
exports.searchItems = async (req, res) => {
  try {
    const { q, type, category } = req.query;
    
    if (!q) {
      return res.status(400).json({ 
        success: false,
        message: 'Search query is required' 
      });
    }

    const searchQuery = {
      $or: [
        { itemName: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ],
      status: 'active'
    };

    if (category) {
      searchQuery.category = category;
    }

    let lostItems = [];
    let foundItems = [];

    if (!type || type === 'lost') {
      lostItems = await LostItem.find(searchQuery)
        .populate('user', 'name studentId')
        .sort({ createdAt: -1 })
        .limit(10);
    }

    if (!type || type === 'found') {
      foundItems = await FoundItem.find(searchQuery)
        .populate('user', 'name studentId')
        .sort({ createdAt: -1 })
        .limit(10);
    }

    res.json({
      success: true,
      data: {
        lostItems,
        foundItems
      }
    });
  } catch (error) {
    console.error('Search items error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Add endpoint to get matches for a lost item
exports.getLostItemMatches = async (req, res) => {
  try {
    const lostItem = await LostItem.findById(req.params.id)
      .populate('potentialMatches');
    
    if (!lostItem) {
      return res.status(404).json({
        success: false,
        message: 'Lost item not found'
      });
    }

    // Get full match details
    const matches = await Promise.all(
      lostItem.potentialMatches.map(async (matchId) => {
        const foundItem = await FoundItem.findById(matchId)
          .populate('user', 'name email');
        const similarity = await calculateItemSimilarity(lostItem, foundItem);
        return {
          foundItem,
          similarity,
          locationMatch: isLocationNearby(lostItem.placeLost, foundItem.placeFound),
          timeValid: isTimeValid(lostItem.dateLost, foundItem.dateFound)
        };
      })
    );

    res.json({
      success: true,
      data: matches
    });
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting matches',
      error: error.message
    });
  }
};