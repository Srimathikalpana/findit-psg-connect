const Claim = require('../models/claim');
const LostItem = require('../models/lostItem');
const FoundItem = require('../models/foundItem');
const User = require('../models/user');

// Create Claim
exports.createClaim = async (req, res) => {
  try {
    const { lostItemId, foundItemId, proofOfOwnership, meetingDetails } = req.body;

    if (!lostItemId || !foundItemId) {
      return res.status(400).json({
        success: false,
        message: 'Lost item ID and Found item ID are required'
      });
    }

    // Check if items exist
    const lostItem = await LostItem.findById(lostItemId);
    const foundItem = await FoundItem.findById(foundItemId);

    if (!lostItem || !foundItem) {
      return res.status(404).json({
        success: false,
        message: 'Lost item or Found item not found'
      });
    }

    // Check if items are still active
    if (lostItem.status !== 'active' || foundItem.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'One or both items are no longer available for claiming'
      });
    }

    // Check if user owns the lost item
    if (lostItem.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only claim items you reported as lost'
      });
    }

    // Check if claim already exists
    const existingClaim = await Claim.findOne({
      lostItem: lostItemId,
      foundItem: foundItemId,
      status: { $in: ['pending', 'approved'] }
    });

    if (existingClaim) {
      return res.status(400).json({
        success: false,
        message: 'A claim for these items already exists'
      });
    }

    // Create claim
    const claim = new Claim({
      lostItem: lostItemId,
      foundItem: foundItemId,
      claimant: req.user._id,
      finder: foundItem.user,
      proofOfOwnership,
      meetingDetails
    });

    await claim.save();

    // Populate user details for response
    await claim.populate('claimant', 'name email studentId');
    await claim.populate('finder', 'name email studentId');

    res.status(201).json({
      success: true,
      message: 'Claim created successfully',
      data: claim
    });
  } catch (error) {
    console.error('Create claim error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get User's Claims
exports.getUserClaims = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, type } = req.query;

    let query = {};
    
    if (type === 'claimed') {
      query.claimant = userId;
    } else if (type === 'received') {
      query.finder = userId;
    } else {
      query.$or = [{ claimant: userId }, { finder: userId }];
    }

    if (status) {
      query.status = status;
    }

    const claims = await Claim.find(query)
      .populate('lostItem', 'itemName description placeLost dateLost imageUrl')
      .populate('foundItem', 'itemName description placeFound dateFound imageUrl')
      .populate('claimant', 'name email studentId')
      .populate('finder', 'name email studentId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: claims
    });
  } catch (error) {
    console.error('Get user claims error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get Claim by ID
exports.getClaimById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const claim = await Claim.findById(id)
      .populate('lostItem', 'itemName description placeLost dateLost imageUrl user')
      .populate('foundItem', 'itemName description placeFound dateFound imageUrl user')
      .populate('claimant', 'name email studentId')
      .populate('finder', 'name email studentId');

    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Claim not found'
      });
    }

    // Check if user is involved in this claim
    if (claim.claimant.toString() !== userId.toString() && 
        claim.finder.toString() !== userId.toString() && 
        req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this claim'
      });
    }

    res.json({
      success: true,
      data: claim
    });
  } catch (error) {
    console.error('Get claim by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update Claim Status (for finder to approve/reject)
exports.updateClaimStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either "approved" or "rejected"'
      });
    }

    const claim = await Claim.findById(id);

    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Claim not found'
      });
    }

    // Check if user is the finder
    if (claim.finder.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the finder can update claim status'
      });
    }

    // Check if claim is still pending
    if (claim.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Claim status cannot be updated'
      });
    }

    claim.status = status;
    if (status === 'rejected' && rejectionReason) {
      claim.rejectionReason = rejectionReason;
    }

    await claim.save();

    res.json({
      success: true,
      message: `Claim ${status} successfully`,
      data: claim
    });
  } catch (error) {
    console.error('Update claim status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Complete Claim (mark items as claimed)
exports.completeClaim = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const claim = await Claim.findById(id);

    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Claim not found'
      });
    }

    // Check if user is involved in this claim
    if (claim.claimant.toString() !== userId.toString() && 
        claim.finder.toString() !== userId.toString() && 
        req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to complete this claim'
      });
    }

    // Check if claim is approved
    if (claim.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Claim must be approved before completion'
      });
    }

    // Update claim status
    claim.status = 'completed';
    claim.approvedDate = new Date();

    // Update items status
    const lostItem = await LostItem.findById(claim.lostItem);
    const foundItem = await FoundItem.findById(claim.foundItem);

    if (lostItem) {
      lostItem.status = 'claimed';
      await lostItem.save();
    }

    if (foundItem) {
      foundItem.status = 'claimed';
      await foundItem.save();
    }

    await claim.save();

    res.json({
      success: true,
      message: 'Claim completed successfully',
      data: claim
    });
  } catch (error) {
    console.error('Complete claim error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get All Claims (Admin only)
exports.getAllClaims = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    let query = {};
    if (status) {
      query.status = status;
    }

    const claims = await Claim.find(query)
      .populate('lostItem', 'itemName description placeLost dateLost')
      .populate('foundItem', 'itemName description placeFound dateFound')
      .populate('claimant', 'name email studentId')
      .populate('finder', 'name email studentId')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Claim.countDocuments(query);

    res.json({
      success: true,
      data: claims,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalItems: count
    });
  } catch (error) {
    console.error('Get all claims error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Cancel Claim
exports.cancelClaim = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const claim = await Claim.findById(id);

    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Claim not found'
      });
    }

    // Check if user is the claimant
    if (claim.claimant.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the claimant can cancel the claim'
      });
    }

    // Check if claim is still pending
    if (claim.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Claim cannot be cancelled'
      });
    }

    await claim.remove();

    res.json({
      success: true,
      message: 'Claim cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel claim error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
