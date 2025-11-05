const { findMatches, calculateItemSimilarity, isLocationNearby, isTimeValid } = require('../utils/itemMatcher');
const { findVerifiedMatches, verifyAnswerSemantically } = require('../utils/semanticMatch');
const { uploadImage } = require('../utils/cloudinary');
const { compareTextAndImage } = require('./compareController');
const { notifyPotentialMatch } = require('../utils/emailService');
const LostItem = require('../models/lostItem');
const FoundItem = require('../models/foundItem');
const User = require('../models/user');
const Claim = require('../models/claim');

// Create Lost Item
exports.createLostItem = async (req, res) => {
  try {
    const { 
      itemName,
      description,
      placeLost,
      dateLost,
      imageUrl, // Can be Cloudinary URL from frontend or base64 string
      category, 
      color, 
      brand, 
      reward, 
      isUrgent,
      contactInfo 
    } = req.body;

    let finalImageUrl = imageUrl;

    // If imageUrl is a base64 string, upload it to Cloudinary
    if (imageUrl && imageUrl.startsWith('data:image/')) {
      try {
        const uploadResult = await uploadImage(imageUrl, {
          resource_type: 'auto'
        });
        finalImageUrl = uploadResult.secure_url;
        console.log('✅ Image uploaded to Cloudinary for lost item');
      } catch (uploadError) {
        console.error('❌ Error uploading image to Cloudinary:', uploadError);
        // Continue without image if upload fails
        finalImageUrl = null;
      }
    }

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
      imageUrl: finalImageUrl,
      category,
      color,
      brand,
      reward: reward || 0,
      isUrgent: isUrgent || false,
      contactInfo,
      user: req.user._id,
      type: 'lost'
    });

    // Save the lost item first
    await lostItem.save();

    // Try to find matches, but don't fail the request if matching fails
    let matchesWithDetails = [];
    let matchCount = 0;
    
    try {
      // Efficient matching: Use itemMatcher with Xenova (itemName + description only) + location/time validation
      // IMPORTANT: When submitting lost item, ONLY search FoundItem database (not LostItem)
      console.log(`[createLostItem] Finding matches for: "${lostItem.itemName}"`);
      
      // Find potential matches in FOUND ITEMS database ONLY (only active items, exclude own items and claimed items)
      const foundItems = await FoundItem.find({ 
        status: 'active', // Only active found items (claimed items are excluded automatically)
        user: { $ne: req.user._id } // Exclude own items
      });
      
      if (foundItems.length > 0) {
        console.log(`[createLostItem] Using itemMatcher to compare against ${foundItems.length} found items`);
        
        // Use itemMatcher.findMatches() which:
        // 1. Uses Xenova to compare itemName + description only
        // 2. Checks location match (isLocationNearby)
        // 3. Checks time validity (isTimeValid)
        // 4. Returns only matches that satisfy ALL conditions
        const matches = await findMatches(lostItem, foundItems, 0.7); // 70% minimum similarity
        
        // Store matches in database (one-time calculation, reusable for all future retrievals)
        const matchRefsToStore = matches.map(match => ({
          foundItem: match.itemId,
          similarity: match.similarity, // 0-1 scale
          similarityPercent: match.similarityPercent, // 0-100 scale
          method: 'itemName+description-xenova', // Method indicator
          locationMatch: match.locationMatch,
          timeValid: match.timeValid,
          matchedAt: new Date()
        }));
        
        lostItem.potentialMatches = matches.map(match => match.itemId);
        lostItem.matchRefs = matchRefsToStore;
        await lostItem.save();
        
        console.log(`[createLostItem] Found ${matches.length} matches (≥70% similarity, location & time validated)`);
        
        matchCount = matches.length;

        // Format matches with found item details for response (handle errors gracefully)
        matchesWithDetails = await Promise.all(
          matches.slice(0, 10).map(async (match) => {
            try {
              const foundItemDoc = await FoundItem.findById(match.itemId)
                .populate('user', 'name email studentId');
              
              if (!foundItemDoc) {
                console.warn(`[createLostItem] Found item ${match.itemId} not found`);
                return null;
              }
              
              return {
                foundItem: foundItemDoc,
                itemId: match.itemId,
                similarity: match.similarity,
                similarityPercent: match.similarityPercent,
                method: 'itemName+description-xenova',
                locationMatch: match.locationMatch,
                timeValid: match.timeValid
              };
            } catch (matchError) {
              console.error(`[createLostItem] Error formatting match ${match.itemId}:`, matchError.message);
              return null; // Return null for failed matches
            }
          })
        );
        
        // Filter out null values from failed match lookups
        matchesWithDetails = matchesWithDetails.filter(m => m !== null);
      } else {
        console.log(`[createLostItem] No found items to match against`);
      }
    } catch (matchingError) {
      // Log the error but don't fail the request - item was already saved successfully
      console.error(`[createLostItem] Error during matching (item saved successfully):`, matchingError);
      console.error(`[createLostItem] Error details:`, matchingError.stack);
      // Continue with empty matches - item was saved successfully
    }

    // Always return success - item was saved successfully
    res.status(201).json({ 
      success: true,
      message: 'Lost item reported successfully', 
      data: lostItem,
      matches: matchesWithDetails, // Return matches (empty if matching failed)
      matchCount: matchCount
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
      imageUrl, // Can be Cloudinary URL from frontend or base64 string
      category, 
      color, 
      brand, 
      handedOverTo, 
      storageLocation,
      contactInfo,
      verificationQuestion,
      correctAnswer
    } = req.body;

    let finalImageUrl = imageUrl;

    // If imageUrl is a base64 string, upload it to Cloudinary
    if (imageUrl && imageUrl.startsWith('data:image/')) {
      try {
        const uploadResult = await uploadImage(imageUrl, {
          resource_type: 'auto'
        });
        finalImageUrl = uploadResult.secure_url;
        console.log('✅ Image uploaded to Cloudinary for found item');
      } catch (uploadError) {
        console.error('❌ Error uploading image to Cloudinary:', uploadError);
        // Continue without image if upload fails
        finalImageUrl = null;
      }
    }

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
      imageUrl: finalImageUrl,
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

    // Save the found item first
    await foundItem.save();

    // Try to find matches, but don't fail the request if matching fails
    let accurateMatches = [];
    let matchCount = 0;
    
    try {
      // Efficient matching: Use itemMatcher with Xenova (itemName + description only) + location/time validation
      // IMPORTANT: When submitting found item, ONLY search LostItem database (not FoundItem)
      console.log(`[createFoundItem] Finding matches for: "${foundItem.itemName}"`);
      
      // Find potential matches in LOST ITEMS database ONLY (only active items, exclude own items and claimed items)
      const lostItems = await LostItem.find({ 
        status: 'active', // Only active lost items (claimed items are excluded automatically)
        user: { $ne: req.user._id } // Exclude own items
      });
      
      if (lostItems.length > 0) {
        console.log(`[createFoundItem] Using itemMatcher to compare against ${lostItems.length} lost items`);
        
        // Use itemMatcher.findMatches() which:
        // 1. Uses Xenova to compare itemName + description only
        // 2. Checks location match (isLocationNearby)
        // 3. Checks time validity (isTimeValid)
        // 4. Returns only matches that satisfy ALL conditions
        const matches = await findMatches(foundItem, lostItems, 0.7); // 70% minimum similarity
        
        // Store matches in found item's matchRefs (one-time calculation)
        const matchRefsToStore = matches.map(match => ({
          lostItem: match.itemId,
          similarity: match.similarity, // 0-1 scale
          similarityPercent: match.similarityPercent, // 0-100 scale
          method: 'itemName+description-xenova', // Method indicator
          locationMatch: match.locationMatch,
          timeValid: match.timeValid,
          matchedAt: new Date()
        }));
        
        foundItem.matchRefs = matchRefsToStore;
        await foundItem.save();
        
        // Update lost items' matchRefs bidirectionally (bulk update for efficiency)
        if (matches.length > 0) {
          try {
      const bulk = LostItem.collection.initializeUnorderedBulkOp();
            matches.forEach(match => {
              try {
                bulk.find({ _id: match.itemId, status: 'active' }).updateOne({
                  $push: {
                    matchRefs: {
                      foundItem: foundItem._id,
                      similarity: match.similarity,
                      similarityPercent: match.similarityPercent,
                      method: 'itemName+description-xenova',
                      locationMatch: match.locationMatch,
                      timeValid: match.timeValid,
                      matchedAt: new Date()
                    }
                  },
              $addToSet: { potentialMatches: foundItem._id }
            });
          } catch (e) {
                console.warn(`Failed to queue update for lostItem ${match.itemId}:`, e.message);
        }
      });
      if (bulk.length > 0) {
        await bulk.execute();
            }
          } catch (bulkError) {
            console.error(`[createFoundItem] Error in bulk update:`, bulkError.message);
            // Continue - matches are already stored in foundItem
          }
        }
        
        matchCount = matches.length;
        
        // Format matches for response (include lostItem details, handle errors gracefully)
        accurateMatches = await Promise.all(
          matches.map(async (match) => {
            try {
              const lostItemDoc = await LostItem.findById(match.itemId)
                .populate('user', 'name email studentId');
              
              if (!lostItemDoc) {
                console.warn(`[createFoundItem] Lost item ${match.itemId} not found`);
                return null;
              }
              
              return {
                lostItem: lostItemDoc,
                itemId: match.itemId,
                similarity: match.similarity,
                similarityPercent: match.similarityPercent,
                method: 'itemName+description-xenova',
                locationMatch: match.locationMatch,
                timeValid: match.timeValid
              };
            } catch (matchError) {
              console.error(`[createFoundItem] Error formatting match ${match.itemId}:`, matchError.message);
              return null; // Return null for failed matches
            }
          })
        );
        
        // Filter out null values from failed match lookups
        accurateMatches = accurateMatches.filter(m => m !== null);
        
        console.log(`[createFoundItem] Found ${accurateMatches.length} matches (≥70% similarity, location & time validated)`);
      } else {
        console.log(`[createFoundItem] No lost items to match against`);
      }
    } catch (matchingError) {
      // Log the error but don't fail the request - item was already saved successfully
      console.error(`[createFoundItem] Error during matching (item saved successfully):`, matchingError);
      console.error(`[createFoundItem] Error details:`, matchingError.stack);
      // Continue with empty matches - item was saved successfully
    }

    // Notify lost item owners about potential match (best-effort, don't block response)
    if (accurateMatches.length > 0 && notifyPotentialMatch && req.user) {
      // Capture values for async notification
      const reporterInfo = {
        name: req.user.name || 'Someone',
        email: req.user.email
      };
      const foundItemInfo = {
              itemName: foundItem.itemName,
              placeFound: foundItem.placeFound,
              dateFound: foundItem.dateFound,
        id: foundItem._id.toString()
      };
      
      // Run notifications in background without blocking the response
      setImmediate(async () => {
        try {
          for (const m of accurateMatches) {
            try {
              if (m && m.lostItem && m.lostItem.user && m.lostItem.user.email) {
                const lostUser = { 
                  name: m.lostItem.user.name || 'User', 
                  email: m.lostItem.user.email 
                };
                const foundSummary = {
                  ...foundItemInfo,
                  reporterName: reporterInfo.name,
                  reporterEmail: reporterInfo.email,
                  lostItemId: m.lostItem._id.toString()
                };
                // fire-and-forget notification
            const r = await notifyPotentialMatch(lostUser, foundSummary, m.lostItem.itemName);
            if (r && r.sent === false) {
              console.error('Failed to notify lost user about potential match:', r.error);
            }
              }
            } catch (notifyErr) {
              console.error('Error notifying user about match:', notifyErr.message);
          }
        }
      } catch (notifyErr) {
          console.error('Error in notification loop:', notifyErr);
      }
      });
    }

    // Always return success - item was saved successfully
    res.status(201).json({ 
      success: true,
      message: 'Found item reported successfully', 
      data: foundItem,
      matches: accurateMatches.slice(0, 10), // Return matches (empty if matching failed)
      matchCount: matchCount
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
    
    let query = {};
    
    // Only filter by status if it's provided and not 'all'
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (category && category !== 'all') {
      query.category = category;
    }
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
    
    let query = {};
    
    // Only filter by status if it's provided and not 'all'
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (category && category !== 'all') {
      query.category = category;
    }
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
        .sort({ createdAt: -1 })
        // Populate matchRefs with foundItem details (these contain stored similarity scores)
        // No need to populate potentialMatches separately - we'll use matchRefs
        .populate({ 
          path: 'matchRefs.foundItem', 
          match: { status: 'active' },
          select: 'itemName description placeFound dateFound category status user verificationQuestion contactInfo imageUrl',
          strictPopulate: false, 
          populate: { path: 'user', select: 'name email studentId' }
        });
    }

    if (!type || type === 'found') {
      foundItems = await FoundItem.find({ user: userId })
        .sort({ createdAt: -1 })
        .populate({ path: 'matchRefs.lostItem', select: 'itemName description placeLost dateLost category status user contactInfo', strictPopulate: false, populate: { path: 'user', select: 'name email studentId' } });
    }

    // Fetch completed claims involving this user to attach counterpart details
    const lostItemIds = lostItems.map(i => i._id);
    const foundItemIds = foundItems.map(i => i._id);
    const claims = await Claim.find({
      status: 'completed',
      $or: [
        { lostItem: { $in: lostItemIds } },
        { foundItem: { $in: foundItemIds } }
      ]
    })
      .populate({ path: 'lostItem', select: 'contactInfo user', populate: { path: 'user', select: 'name email studentId' } })
      .populate({ path: 'foundItem', select: 'contactInfo user', populate: { path: 'user', select: 'name email studentId' } });

    const byLostId = new Map();
    const byFoundId = new Map();
    for (const c of claims) {
      if (c.lostItem) byLostId.set(c.lostItem._id.toString(), c);
      if (c.foundItem) byFoundId.set(c.foundItem._id.toString(), c);
    }

    const serializeLost = [];
    for (const li of lostItems) {
      const claim = byLostId.get(li._id.toString());
      let claimedCounterpart = undefined;
      if (li.status === 'claimed' && claim && claim.foundItem && claim.foundItem.user) {
        claimedCounterpart = {
          name: claim.foundItem.user.name,
          studentId: claim.foundItem.user.studentId,
          email: claim.foundItem.user.email,
          phone: claim.foundItem.contactInfo?.phone
        };
      }

      const obj = li.toObject();

      // Use stored matchRefs (calculated at creation time) - no recalculation needed
      // Only filter by >70% threshold using stored similarity scores
      const MIN_SIMILARITY_USERITEMS = 70; // 70% minimum in 0-100 scale (must be > 70%)
        const normalized = [];
      
      // Use stored matchRefs ONLY (no recalculation - data already calculated at creation time)
      // This is efficient - just filter by threshold and return stored data
      if (li.matchRefs && li.matchRefs.length > 0) {
        for (const matchRef of li.matchRefs) {
          try {
            // Filter by stored similarity score (>70%) - no comparison needed
            if (matchRef.similarityPercent && matchRef.similarityPercent > MIN_SIMILARITY_USERITEMS) {
              const foundDoc = matchRef.foundItem;
              
              // Check if foundItem is populated, if not skip (will be populated by query)
              if (!foundDoc || (foundDoc && foundDoc.status !== 'active')) continue;
              
              // Format match to include all necessary fields for dashboard display
            normalized.push({
                similarity: matchRef.similarity, // 0-1 scale (stored)
                similarityPercent: matchRef.similarityPercent, // 0-100 scale (stored)
                method: matchRef.method || 'itemName+description-xenova', // Method used (stored)
                locationMatch: matchRef.locationMatch !== undefined ? matchRef.locationMatch : true, // Location match status
                timeValid: matchRef.timeValid !== undefined ? matchRef.timeValid : true, // Time validation status
              foundItem: {
                _id: foundDoc._id,
                itemName: foundDoc.itemName,
                description: foundDoc.description,
                placeFound: foundDoc.placeFound,
                dateFound: foundDoc.dateFound,
                status: foundDoc.status,
                verificationQuestion: foundDoc.verificationQuestion,
                  imageUrl: foundDoc.imageUrl,
                  user: foundDoc.user,
                  category: foundDoc.category,
                  color: foundDoc.color,
                  brand: foundDoc.brand
                }
              });
            }
          } catch (e) {
            console.warn('Error processing matchRef for lost item', li._id, e && e.message);
          }
        }
      }
      // Note: We don't use potentialMatches fallback anymore - only matchRefs are used
      // This ensures we never recalculate - only use stored scores
      
      // Sort by similarity in descending order (highest to lowest) - reverse sorted order
      normalized.sort((a, b) => {
        const aScore = a.similarityPercent || 0;
        const bScore = b.similarityPercent || 0;
        return bScore - aScore; // Descending: highest first
      });
      obj.potentialMatches = normalized;

      serializeLost.push({ ...obj, claimedCounterpart });
    }

    const serializeFound = foundItems.map(fi => {
      const claim = byFoundId.get(fi._id.toString());
      let claimedCounterpart = undefined;
      if (fi.status === 'claimed' && claim && claim.lostItem && claim.lostItem.user) {
        claimedCounterpart = {
          name: claim.lostItem.user.name,
          studentId: claim.lostItem.user.studentId,
          email: claim.lostItem.user.email,
          phone: claim.lostItem.contactInfo?.phone
        };
      }
      return { ...fi.toObject(), claimedCounterpart };
    });

    res.json({
      success: true,
      data: {
        lostItems: serializeLost,
        foundItems: serializeFound
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
    } else if (path.includes('/items/')) {
      // Admin route - try both models
      item = await LostItem.findById(id);
      if (!item) {
        item = await FoundItem.findById(id);
      }
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

    // Support both adminAuth (req.admin) and regular auth (req.user)
    const isAdmin = req.admin?.role === 'admin' || req.user?.role === 'admin';
    const userId = req.user?._id;

    // Check if user owns the item or is admin
    if (!isAdmin && (!userId || item.user.toString() !== userId.toString())) {
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
    // Check path to determine item type
    if (path.includes('/lost-items/') || path.includes('/items/')) {
      // Try lost item first, then found item (for admin routes)
      item = await LostItem.findById(id);
      if (!item) {
        item = await FoundItem.findById(id);
      }
    } else if (path.includes('/found-items/')) {
      item = await FoundItem.findById(id);
    } else {
      // Fallback: try both models (for admin routes that use generic /items/:id)
      item = await LostItem.findById(id);
      if (!item) {
        item = await FoundItem.findById(id);
      }
    }

    if (!item) {
      return res.status(404).json({ 
        success: false,
        message: 'Item not found' 
      });
    }

    // Support both adminAuth (req.admin) and regular auth (req.user)
    const isAdmin = req.admin?.role === 'admin' || req.user?.role === 'admin';
    const userId = req.user?._id;
    
    // Check if user owns the item or is admin
    if (!isAdmin && (!userId || item.user.toString() !== userId.toString())) {
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
// Efficient: Uses stored matchRefs only - no recalculation
exports.getLostItemMatches = async (req, res) => {
  try {
    const lostItem = await LostItem.findById(req.params.id);
    
    if (!lostItem) {
      return res.status(404).json({
        success: false,
        message: 'Lost item not found'
      });
    }

    // Use stored matchRefs ONLY (calculated once at creation time)
    // No database searches, no comparisons - just filter stored scores
    const MIN_SIMILARITY_MATCHES = 70; // 70% minimum in 0-100 scale (must be > 70%)
    const matches = [];
    
    // Populate matchRefs with foundItem details (efficient single query)
    await lostItem.populate({
      path: 'matchRefs.foundItem',
      match: { status: 'active' }, // Only active items
      select: 'itemName description placeFound dateFound category status user verificationQuestion contactInfo imageUrl',
      populate: { path: 'user', select: 'name email studentId' }
    });
    
    // Use stored similarity scores from matchRefs (no recalculation)
    for (const matchRef of lostItem.matchRefs || []) {
      try {
        const foundItem = matchRef.foundItem;
        if (!foundItem) continue; // Skip if populate didn't return item (filtered by status)
        
        // Filter by stored similarity score (>70%)
        if (matchRef.similarityPercent && matchRef.similarityPercent > MIN_SIMILARITY_MATCHES) {
          matches.push({
          foundItem,
            similarity: matchRef.similarity, // 0-1 scale (stored at creation)
            similarityPercent: matchRef.similarityPercent, // 0-100 scale (stored at creation)
            method: matchRef.method || 'text-only', // Method used (stored at creation)
          locationMatch: isLocationNearby(lostItem.placeLost, foundItem.placeFound),
          timeValid: isTimeValid(lostItem.dateLost, foundItem.dateFound)
          });
        }
      } catch (e) {
        console.warn('Error processing stored match:', e.message);
      }
    }
    
    // Sort by similarity in descending order (highest to lowest) - reverse sorted order
    matches.sort((a, b) => {
      const aScore = a.similarityPercent || 0;
      const bScore = b.similarityPercent || 0;
      return bScore - aScore; // Descending: highest first
    });

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

// Add endpoint to get matches for a found item
// Efficient: Uses stored matchRefs only - no recalculation
exports.getFoundItemMatches = async (req, res) => {
  try {
    const foundItem = await FoundItem.findById(req.params.id);
    if (!foundItem) {
      return res.status(404).json({
        success: false,
        message: 'Found item not found'
      });
    }

    // Use stored matchRefs ONLY (calculated once at creation time)
    // No database searches, no comparisons - just filter stored scores
    const MIN_SIMILARITY_FOUND_MATCHES = 70; // 70% minimum in 0-100 scale
    const matches = [];
    
    // Populate matchRefs with lostItem details (efficient single query)
    await foundItem.populate({
      path: 'matchRefs.lostItem',
      match: { status: 'active' }, // Only active items
      select: 'itemName description placeLost dateLost category status user contactInfo imageUrl',
      populate: { path: 'user', select: 'name email studentId' }
    });
    
    // Use stored similarity scores from matchRefs (no recalculation)
    for (const matchRef of foundItem.matchRefs || []) {
      try {
        const lostItem = matchRef.lostItem;
        if (!lostItem) continue; // Skip if populate didn't return item (filtered by status)
        
        // Skip if same user (don't show own items)
        if (lostItem.user && lostItem.user._id.toString() === req.user._id.toString()) continue;
        
        // Filter by stored similarity score (≥70%)
        if (matchRef.similarityPercent && matchRef.similarityPercent >= MIN_SIMILARITY_FOUND_MATCHES) {
        matches.push({
          lostItem: lostItem.toObject(),
            similarity: matchRef.similarity, // 0-1 scale (stored at creation)
            similarityPercent: matchRef.similarityPercent, // 0-100 scale (stored at creation)
            matchScore: matchRef.similarity, // Alias for compatibility
            method: matchRef.method || 'text-only' // Method used (stored at creation)
          });
        }
      } catch (e) {
        console.warn('Error processing stored match:', e.message);
      }
    }
    
    // Sort by similarity (descending) - using stored scores
    matches.sort((a, b) => (b.similarityPercent || 0) - (a.similarityPercent || 0));

    res.json({
      success: true,
      matches: matches
    });
  } catch (error) {
    console.error('Error getting found item matches:', error);
    res.status(500).json({
      success: false,
      message: 'Error finding matches',
      error: error.message
    });
  }
};

// Semantic verification endpoint
exports.verifyAnswerSemantically = async (req, res) => {
  try {
    const { foundItemId, providedAnswer } = req.body;

    if (!foundItemId || !providedAnswer) {
      return res.status(400).json({
        success: false,
        message: 'foundItemId and providedAnswer are required'
      });
    }

    const foundItem = await FoundItem.findById(foundItemId);
    if (!foundItem) {
      return res.status(404).json({
        success: false,
        message: 'Found item not found'
      });
    }

    if (!foundItem.correctAnswer) {
      return res.status(400).json({
        success: false,
        message: 'No verification answer available for this found item'
      });
    }

    // Perform semantic verification (uses default/env-configured threshold)
    const verificationResult = await verifyAnswerSemantically(providedAnswer, foundItem.correctAnswer);

    res.json({
      success: true,
      verification: verificationResult,
      foundItem: {
        id: foundItem._id,
        itemName: foundItem.itemName,
        verificationQuestion: foundItem.verificationQuestion
      }
    });

  } catch (error) {
    console.error('Error in semantic verification:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying answer',
      error: error.message
    });
  }
};