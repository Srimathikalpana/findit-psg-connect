const LostItem = require('../models/lostItem');
const FoundItem = require('../models/foundItem');
const { compareTextAndImage } = require('./compareController');

/**
 * Clean up low-quality matches from all items in the database
 * Removes matches with similarity < 70% from potentialMatches arrays
 */
exports.cleanupLowQualityMatches = async (req, res) => {
  try {
    console.log('🧹 Starting cleanup of low-quality matches...');
    const MIN_SIMILARITY = 70; // 70% threshold
    let cleanedLostItems = 0;
    let cleanedFoundItems = 0;
    let totalRemovedMatches = 0;

    // Clean up lost items
    const lostItems = await LostItem.find({ 
      status: 'active',
      potentialMatches: { $exists: true, $ne: [] }
    });

    for (const lostItem of lostItems) {
      if (!lostItem.potentialMatches || lostItem.potentialMatches.length === 0) continue;

      const validMatches = [];
      
      for (const matchId of lostItem.potentialMatches) {
        try {
          const foundItem = await FoundItem.findById(matchId);
          if (!foundItem || foundItem.status !== 'active') continue;

          // Calculate accurate similarity
          const comparisonResult = await compareTextAndImage(lostItem, foundItem);
          
          // Only keep matches with ≥70% similarity
          if (comparisonResult.score >= MIN_SIMILARITY) {
            validMatches.push(matchId);
          } else {
            totalRemovedMatches++;
            console.log(`❌ Removed low-quality match: Lost "${lostItem.itemName}" vs Found "${foundItem.itemName}" (${comparisonResult.score}%)`);
          }
        } catch (e) {
          console.warn(`Error checking match for lost item ${lostItem._id}:`, e.message);
          // Keep the match if we can't verify it
          validMatches.push(matchId);
        }
      }

      // Update if matches were removed
      if (validMatches.length !== lostItem.potentialMatches.length) {
        lostItem.potentialMatches = validMatches;
        await lostItem.save();
        cleanedLostItems++;
      }
    }

    // Clean up found items (remove from lost items' potentialMatches)
    // This is handled above when cleaning lost items

    console.log(`✅ Cleanup complete!`);
    console.log(`   - Cleaned ${cleanedLostItems} lost items`);
    console.log(`   - Removed ${totalRemovedMatches} low-quality matches`);

    res.json({
      success: true,
      message: 'Cleanup completed successfully',
      data: {
        cleanedLostItems,
        cleanedFoundItems,
        totalRemovedMatches
      }
    });
  } catch (error) {
    console.error('Error during cleanup:', error);
    res.status(500).json({
      success: false,
      message: 'Error during cleanup',
      error: error.message
    });
  }
};

/**
 * Clean up matches for a specific lost item
 */
exports.cleanupItemMatches = async (req, res) => {
  try {
    const { itemId } = req.params;
    const MIN_SIMILARITY = 70;
    
    const lostItem = await LostItem.findById(itemId);
    if (!lostItem) {
      return res.status(404).json({
        success: false,
        message: 'Lost item not found'
      });
    }

    if (!lostItem.potentialMatches || lostItem.potentialMatches.length === 0) {
      return res.json({
        success: true,
        message: 'No matches to clean up',
        data: { removedMatches: 0 }
      });
    }

    const validMatches = [];
    let removedMatches = 0;

    for (const matchId of lostItem.potentialMatches) {
      try {
        const foundItem = await FoundItem.findById(matchId);
        if (!foundItem || foundItem.status !== 'active') {
          removedMatches++;
          continue;
        }

        const comparisonResult = await compareTextAndImage(lostItem, foundItem);
        
        if (comparisonResult.score >= MIN_SIMILARITY) {
          validMatches.push(matchId);
        } else {
          removedMatches++;
          console.log(`❌ Removed low-quality match: ${comparisonResult.score}% similarity`);
        }
      } catch (e) {
        console.warn(`Error checking match:`, e.message);
        validMatches.push(matchId); // Keep if we can't verify
      }
    }

    lostItem.potentialMatches = validMatches;
    await lostItem.save();

    res.json({
      success: true,
      message: 'Matches cleaned up successfully',
      data: {
        removedMatches,
        remainingMatches: validMatches.length
      }
    });
  } catch (error) {
    console.error('Error cleaning up item matches:', error);
    res.status(500).json({
      success: false,
      message: 'Error cleaning up matches',
      error: error.message
    });
  }
};

