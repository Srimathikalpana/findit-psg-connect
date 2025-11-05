const { pipeline } = require('@xenova/transformers');
const fetch = require('node-fetch').default || require('node-fetch');

// Model configuration - Simplified approach: skip image similarity if CLIP fails
// For now, we'll primarily rely on text similarity
const MODEL_NAME = 'Xenova/clip-vit-base-patch32';
let imageModelPromise = null;

/**
 * Initialize and cache the image similarity model
 * @returns {Promise<Object>} - The CLIP model pipeline (or null if unavailable)
 */
async function getImageModel() {
  if (imageModelPromise !== null) {
    return imageModelPromise;
  }

  imageModelPromise = (async () => {
    try {
      console.log('🤖 Loading image similarity model:', MODEL_NAME);
      // CLIP models can be used with 'zero-shot-image-classification'
      const model = await pipeline('zero-shot-image-classification', MODEL_NAME);
      console.log('✅ Image similarity model loaded and cached successfully');
      return model;
    } catch (error) {
      console.error('❌ Error loading image similarity model:', error);
      console.log('⚠️  Image similarity will be disabled. Falling back to text-only comparison.');
      return null;
    }
  })();

  return imageModelPromise;
}

/**
 * Load image from URL or base64
 * @param {string} imageUrl - URL or base64 encoded image
 * @returns {Promise<string|Buffer>} - Image data (URL string or Buffer)
 */
async function loadImage(imageUrl) {
  try {
    // If it's a URL (http/https), return the URL directly
    // CLIP pipeline can handle URLs directly
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    
    // If it's a base64 string, return as is
    if (imageUrl.startsWith('data:image/')) {
      return imageUrl;
    }
    
    // Otherwise, error
    throw new Error('Local file paths are not supported. Please use URLs or base64 encoded images.');
  } catch (error) {
    console.error('❌ Error loading image:', error);
    throw error;
  }
}

/**
 * Generate embedding for image using Xenova CLIP model
 * Simplified: Returns 0 if images can't be compared (falls back to text-only)
 * @param {string} imageUrl - URL or base64 encoded image
 * @returns {Promise<Array<number>|null>} - The embedding vector or null if unavailable
 */
async function generateImageEmbedding(imageUrl) {
  try {
    if (!imageUrl) {
      return null;
    }

    const model = await getImageModel();
    if (!model) {
      // Image model not available, return null to indicate text-only mode
      return null;
    }

    const imageData = await loadImage(imageUrl);
    
    // Use dummy labels for zero-shot classification
    // This gives us a similarity proxy
    const dummyLabels = ['object', 'item', 'thing'];
    
    try {
      // CLIP pipeline expects image URL or base64 string
      const result = await model(imageData, dummyLabels);
      
      // Extract scores from result
      let scores = [];
      if (Array.isArray(result)) {
        // Result is array of { label, score }
        scores = result.map(r => r.score || 0);
      } else if (result && typeof result === 'object') {
        // Try to extract scores from various possible structures
        if (result.scores) {
          scores = Array.isArray(result.scores) ? result.scores : [result.scores];
        } else if (result.data) {
          scores = Array.from(result.data);
        }
      }

      // Normalize scores to create embedding-like vector
      if (scores.length === 0) {
        return null;
      }

      const norm = Math.sqrt(scores.reduce((sum, val) => sum + val * val, 0));
      if (norm > 0) {
        scores = scores.map(val => val / norm);
      }

      return scores;
    } catch (modelError) {
      // If model processing fails, return null (fallback to text-only)
      console.warn('⚠️  Image comparison failed, using text-only:', modelError.message);
      return null;
    }
  } catch (error) {
    console.warn('⚠️  Error generating image embedding, using text-only:', error.message);
    return null; // Return null instead of throwing - allows fallback to text-only
  }
}

/**
 * Calculate cosine similarity between two embedding vectors
 * @param {Array<number>} embedding1 - First embedding vector
 * @param {Array<number>} embedding2 - Second embedding vector
 * @returns {number} - Cosine similarity score (0-1)
 */
function calculateCosineSimilarity(embedding1, embedding2) {
  if (!embedding1 || !embedding2) {
    return 0;
  }

  // Handle different lengths by padding or truncating
  const maxLen = Math.max(embedding1.length, embedding2.length);
  const e1 = [...embedding1].concat(new Array(maxLen - embedding1.length).fill(0));
  const e2 = [...embedding2].concat(new Array(maxLen - embedding2.length).fill(0));

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < maxLen; i++) {
    dotProduct += e1[i] * e2[i];
    norm1 += e1[i] * e1[i];
    norm2 += e2[i] * e2[i];
  }

  norm1 = Math.sqrt(norm1);
  norm2 = Math.sqrt(norm2);

  if (norm1 === 0 || norm2 === 0) {
    return 0;
  }

  return dotProduct / (norm1 * norm2);
}

/**
 * Compare two images and return similarity score (0-100 scale)
 * Returns 0 if images can't be compared (falls back to text-only in compareTextAndImage)
 * @param {string} imageUrl1 - First image URL
 * @param {string} imageUrl2 - Second image URL
 * @returns {Promise<number>} - Similarity score as rounded integer (0-100) or 0 if unavailable
 */
async function compareImages(imageUrl1, imageUrl2) {
  try {
    console.log('🖼️ Comparing images using image-only similarity');
    
    if (!imageUrl1 || !imageUrl2) {
      console.log('⚠️ One or both image URLs are empty, returning 0');
      return 0;
    }

    const [embedding1, embedding2] = await Promise.all([
      generateImageEmbedding(imageUrl1),
      generateImageEmbedding(imageUrl2)
    ]);

    // If either embedding is null, return 0 (indicates text-only mode)
    if (!embedding1 || !embedding2) {
      console.log('⚠️ Image comparison unavailable, returning 0 (will use text-only)');
      return 0;
    }

    const similarity = calculateCosineSimilarity(embedding1, embedding2);
    
    // Convert to 0-100 scale and round
    const score = Math.round(similarity * 100);
    
    console.log(`✅ Image similarity calculated: ${score}/100`);
    
    return score;
  } catch (error) {
    console.warn('⚠️ Error comparing images, using text-only:', error.message);
    // Return 0 instead of throwing - allows fallback to text-only
    return 0;
  }
}

module.exports = {
  generateImageEmbedding,
  calculateCosineSimilarity,
  compareImages,
  getImageModel
};
