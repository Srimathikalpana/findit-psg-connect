const { compareTexts } = require('../utils/textSimilarity');
const { compareImages } = require('../utils/imageSimilarity');
const LostItem = require('../models/lostItem');
const FoundItem = require('../models/foundItem');

/**
 * Compare lost and found items using text and/or image similarity
 * Adaptive logic:
 * - Case 1: Both items have only text → use text similarity only (method: 'text-only')
 * - Case 2: One item missing image → use text similarity only (method: 'text-only')
 * - Case 3: Both have images → compute combined score: 0.4 * textSimilarity + 0.6 * imageSimilarity (method: 'text+image')
 * 
 * @param {Object} lostItem - The lost item object
 * @param {Object} foundItem - The found item object
 * @returns {Promise<Object>} - { score: number (0-100), method: string }
 */
async function compareTextAndImage(lostItem, foundItem) {
  try {
    // Use only itemName + description (as per requirement)
    const lostText = `${lostItem.itemName || ''} ${lostItem.description || ''}`.trim();
    const foundText = `${foundItem.itemName || ''} ${foundItem.description || ''}`.trim();

    // Check if both items have images
    const lostHasImage = lostItem.imageUrl && lostItem.imageUrl.trim() !== '';
    const foundHasImage = foundItem.imageUrl && foundItem.imageUrl.trim() !== '';

    let score = 0;
    let method = '';

    if (!lostHasImage || !foundHasImage) {
      // Case 1 or Case 2: One or both items missing images → use text similarity only (itemName + description)
      method = 'itemName+description-xenova';
      console.log(`[compareTextAndImage] Using ${method} method - one or both items missing images`);
      
      const textScore = await compareTexts(lostText, foundText);
      score = textScore;
      
      console.log(`[compareTextAndImage] Final score: ${score}/100 using ${method}`);
    } else {
      // Case 3: Both have images → compute combined score
      method = 'itemName+description+image';
      console.log(`[compareTextAndImage] Using ${method} method - both items have images`);
      
      // Calculate text similarity (itemName + description only)
      const textScore = await compareTexts(lostText, foundText);
      
      // Calculate image similarity
      const imageScore = await compareImages(lostItem.imageUrl, foundItem.imageUrl);
      
      // Combined score: 0.4 * textSimilarity + 0.6 * imageSimilarity
      const combinedScore = (0.4 * textScore) + (0.6 * imageScore);
      score = Math.round(combinedScore);
      
      console.log(`[compareTextAndImage] Text score (itemName+description): ${textScore}/100, Image score: ${imageScore}/100`);
      console.log(`[compareTextAndImage] Final combined score: ${score}/100 using ${method}`);
    }

    return {
      score,
      method
    };
  } catch (error) {
    console.error('❌ Error in compareTextAndImage:', error);
    throw error;
  }
}

/**
 * Compare a lost item with a found item by ID
 * @route POST /api/compare
 */
exports.compareItems = async (req, res) => {
  try {
    const { lostItemId, foundItemId } = req.body;

    if (!lostItemId || !foundItemId) {
      return res.status(400).json({
        success: false,
        message: 'lostItemId and foundItemId are required'
      });
    }

    const lostItem = await LostItem.findById(lostItemId);
    const foundItem = await FoundItem.findById(foundItemId);

    if (!lostItem) {
      return res.status(404).json({
        success: false,
        message: 'Lost item not found'
      });
    }

    if (!foundItem) {
      return res.status(404).json({
        success: false,
        message: 'Found item not found'
      });
    }

    const result = await compareTextAndImage(lostItem, foundItem);

    res.json({
      success: true,
      data: {
        lostItemId: lostItem._id,
        foundItemId: foundItem._id,
        similarityScore: result.score,
        method: result.method
      }
    });
  } catch (error) {
    console.error('Error comparing items:', error);
    res.status(500).json({
      success: false,
      message: 'Error comparing items',
      error: error.message
    });
  }
};

// Export the core comparison function for use in other modules
module.exports.compareTextAndImage = compareTextAndImage;


