const Claim = require('../models/claim');
const LostItem = require('../models/lostItem');
const FoundItem = require('../models/foundItem');
const User = require('../models/user');
const stringSimilarity = require('string-similarity');
const { notifyMatchedUsers } = require('../utils/emailService');
const { compareTextsSemanticAndLexical } = require('../utils/textSimilarity');

// Verify answer and immediately confirm claim by marking both items as claimed
exports.verifyAndClaim = async (req, res) => {
  try {
    // Ensure authenticated user present
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const { lostItemId, foundItemId, answer } = req.body;

    if (!lostItemId || !foundItemId || typeof answer !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'lostItemId, foundItemId and answer are required'
      });
    }

    const lostItem = await LostItem.findById(lostItemId);
    const foundItem = await FoundItem.findById(foundItemId);

    if (!lostItem || !foundItem) {
      return res.status(404).json({ success: false, message: 'Lost or Found item not found' });
    }

    if (lostItem.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only claim items linked to your lost report' });
    }

    if (lostItem.status !== 'active' || foundItem.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Items are not available for claiming' });
    }

    // Use combined semantic + lexical similarity for verification (40% threshold for rough matching)
    const providedAnswer = (answer || '').trim();
    const correctAnswer = (foundItem.correctAnswer || '').trim();
    
    console.log(`[verifyAndClaim] Verifying answer using combined semantic + lexical similarity`);
    const similarityScore = await compareTextsSemanticAndLexical(providedAnswer, correctAnswer);
    const thresholdPercent = 40; // Lower threshold for rough similarity matching
    const isVerified = similarityScore >= thresholdPercent;

    console.log(`[verifyAndClaim] Similarity score: ${similarityScore}/100, Threshold: ${thresholdPercent}%, Verified: ${isVerified ? 'YES' : 'NO'}`);

    if (!isVerified) {
      return res.status(200).json({ 
        success: false, 
        message: 'Verification failed. Incorrect answer.',
        similarity: similarityScore / 100, // Return as 0-1 scale for consistency
        threshold: thresholdPercent / 100
      });
    }

    // Create a completed claim and mark items claimed immediately
    const claim = new Claim({
      lostItem: lostItem._id,
      foundItem: foundItem._id,
      claimant: req.user._id,
      finder: foundItem.user,
      verificationQuestion: foundItem.verificationQuestion,
      claimantAnswer: answer,
      verificationStatus: 'approved',
      status: 'completed',
      approvedDate: new Date()
    });

    await claim.save();

    // Remove items from active listings by marking as claimed
    // Items will no longer appear in active searches for lost/found items
    lostItem.status = 'claimed';
    foundItem.status = 'claimed';
    await lostItem.save();
    await foundItem.save();
    
    console.log(`[verifyAndClaim] Claim ${claim._id} created - Lost item ${lostItem._id} and Found item ${foundItem._id} marked as claimed and removed from active listings`);

      // Send notification emails (best-effort)
    try {
      // populate claimant and finder so we have name/email
      await claim.populate('claimant', 'name email');
      await claim.populate('finder', 'name email');

      const lostUser = claim.claimant;
      const foundUser = claim.finder;
      const itemName = lostItem.itemName || foundItem.itemName || 'item';

      const emailResult = await notifyMatchedUsers(lostUser, foundUser, itemName);

      if ((emailResult.sentToLost || emailResult.sentToFound)) {
        if (!Array.isArray(claim.notificationsSent)) claim.notificationsSent = [];
        claim.notificationsSent.push(new Date());
        await claim.save();
      }

      if (emailResult.errors && emailResult.errors.length) {
        console.error('notifyMatchedUsers errors:', emailResult.errors);
      }
    } catch (emailErr) {
      console.error('Error sending notification emails:', emailErr);
    }

    // Populate finder's user info for contact details
    await foundItem.populate('user', 'name email studentId');

    // Prepare contact info for the finder
    const finderContactInfo = {
      name: foundItem.user?.name || '',
      email: foundItem.user?.email || '',
      studentId: foundItem.user?.studentId || '',
      phone: foundItem.contactInfo?.phone || ''
    };

    return res.json({
      success: true,
      message: 'Claim verified and completed. Items marked as claimed.',
      data: { 
        claimId: claim._id, 
        lostItem, 
        foundItem,
        finderContactInfo // Include finder's contact info for instant display
      }
    });
  } catch (error) {
    console.error('Verify and claim error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Verify answer for found item
exports.verifyAnswer = async (req, res) => {
  try {
    const { id } = req.params;
    const { answer } = req.body;

    const foundItem = await FoundItem.findById(id);
    if (!foundItem) {
      return res.status(404).json({
        success: false,
        message: 'Found item not found'
      });
    }

    // Use combined semantic + lexical similarity for verification (40% threshold for rough matching)
    const providedAnswer = answer.trim();
    const correctAnswer = foundItem.correctAnswer.trim();
    
    console.log(`[verifyAnswer] Verifying answer using combined semantic + lexical similarity`);
    const similarityScore = await compareTextsSemanticAndLexical(providedAnswer, correctAnswer);
    const thresholdPercent = 40; // Lower threshold for rough similarity matching
    const isVerified = similarityScore >= thresholdPercent;

    console.log(`[verifyAnswer] Similarity score: ${similarityScore}/100, Threshold: ${thresholdPercent}%, Verified: ${isVerified ? 'YES' : 'NO'}`);

    if (isVerified) {
      return res.json({
        success: true,
        message: 'Answer verified successfully',
        similarity: similarityScore / 100, // Return as 0-1 scale for consistency
        threshold: thresholdPercent / 100
      });
    }

    return res.json({
      success: false,
      message: 'Incorrect answer',
      similarity: similarityScore / 100,
      threshold: thresholdPercent / 100
    });
  } catch (error) {
    console.error('Error verifying answer:', error);
    return res.status(500).json({
      success: false,
      message: 'Error verifying answer'
    });
  }
};

// Create Claim
exports.createClaim = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
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
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
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
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
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

    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
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

    // Allow approving a completed claim only if items already marked claimed (idempotency)
    if (claim.status !== 'pending' && !(claim.status === 'completed' && status === 'approved')) {
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
     // If approved, notify both users (finder approved claimant)
    if (status === 'approved') {
      try {
        // populate users and load item names
        await claim.populate('claimant', 'name email');
        await claim.populate('finder', 'name email');

        const lostItem = await LostItem.findById(claim.lostItem);
        const foundItem = await FoundItem.findById(claim.foundItem);
        const itemName = (lostItem && lostItem.itemName) || (foundItem && foundItem.itemName) || 'item';

        const emailResult = await notifyMatchedUsers(claim.claimant, claim.finder, itemName);
        if ((emailResult.sentToLost || emailResult.sentToFound)) {
          if (!Array.isArray(claim.notificationsSent)) claim.notificationsSent = [];
          claim.notificationsSent.push(new Date());
          await claim.save();
        }
        if (emailResult.errors && emailResult.errors.length) {
          console.error('notifyMatchedUsers errors on approval:', emailResult.errors);
        }
      } catch (emailErr) {
        console.error('Error sending emails on claim approval:', emailErr);
      }
    }
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
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
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

    // Remove items from active listings by marking as claimed
    // Items will no longer appear in active searches for lost/found items
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
    
    console.log(`[completeClaim] Claim ${claim._id} completed - Lost item ${lostItem?._id} and Found item ${foundItem?._id} marked as claimed and removed from active listings`);

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
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
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
