const { pipeline } = require('@xenova/transformers');
const { lexicalSynonymSimilarity } = require('./synonymService');

// Model configuration
const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2';
let textModelPromise = null;

/**
 * Initialize and cache the text similarity model
 * @returns {Promise<Object>} - The feature extraction pipeline
 */
async function getTextModel() {
  if (textModelPromise) {
    return textModelPromise;
  }

  textModelPromise = (async () => {
    try {
      console.log('🤖 Loading text similarity model:', MODEL_NAME);
      const model = await pipeline('feature-extraction', MODEL_NAME);
      console.log('✅ Text similarity model loaded and cached successfully');
      return model;
    } catch (error) {
      console.error('❌ Error loading text similarity model:', error);
      throw error;
    }
  })();

  return textModelPromise;
}

/**
 * Generate embedding for text using Xenova all-MiniLM-L6-v2 model
 * @param {string} text - The text to generate embedding for
 * @returns {Promise<Array<number>>} - The embedding vector (384 dimensions)
 */
async function generateTextEmbedding(text) {
  try {
    if (!text || typeof text !== 'string' || !text.trim()) {
      throw new Error('Text cannot be empty');
    }

    const normalizedText = text.toLowerCase().trim();
    const extractor = await getTextModel();
    
    const output = await extractor(normalizedText, {
      pooling: 'mean',
      normalize: true
    });

    let embedding;
    if (output && typeof output.tolist === 'function') {
      embedding = output.tolist();
      if (Array.isArray(embedding[0]) && !Array.isArray(embedding[0][0])) {
        embedding = embedding[0];
      }
    } else if (output && output.data) {
      embedding = Array.from(output.data);
    } else if (Array.isArray(output)) {
      embedding = output;
      if (Array.isArray(embedding[0]) && !Array.isArray(embedding[0][0])) {
        embedding = embedding[0];
      }
    } else {
      embedding = Array.from(output);
    }

    if (!Array.isArray(embedding) || embedding.length === 0) {
      throw new Error('Failed to generate valid text embedding');
    }
    
    if (Array.isArray(embedding[0]) && typeof embedding[0][0] === 'number') {
      embedding = embedding.flat();
    }

    return embedding;
  } catch (error) {
    console.error('❌ Error generating text embedding:', error);
    throw error;
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

  if (embedding1.length !== embedding2.length) {
    console.warn(`Text embedding length mismatch: ${embedding1.length} vs ${embedding2.length}`);
    return 0;
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    norm1 += embedding1[i] * embedding1[i];
    norm2 += embedding2[i] * embedding2[i];
  }

  norm1 = Math.sqrt(norm1);
  norm2 = Math.sqrt(norm2);

  if (norm1 === 0 || norm2 === 0) {
    return 0;
  }

  return dotProduct / (norm1 * norm2);
}

/**
 * Compare two texts and return similarity score (0-100 scale)
 * @param {string} text1 - First text
 * @param {string} text2 - Second text
 * @returns {Promise<number>} - Similarity score as rounded integer (0-100)
 */
async function compareTexts(text1, text2) {
  try {
    console.log('📝 Comparing texts using text-only similarity');
    
    if (!text1 || !text2) {
      console.log('⚠️ One or both texts are empty, returning 0');
      return 0;
    }

    const [embedding1, embedding2] = await Promise.all([
      generateTextEmbedding(text1),
      generateTextEmbedding(text2)
    ]);

    const similarity = calculateCosineSimilarity(embedding1, embedding2);
    
    // Convert to 0-100 scale and round
    const score = Math.round(similarity * 100);
    
    console.log(`✅ Text similarity calculated: ${score}/100`);
    
    return score;
  } catch (error) {
    console.error('❌ Error comparing texts:', error);
    throw error;
  }
}

/**
 * Compare two items using only itemName and description for Xenova similarity
 * @param {Object} item1 - First item (must have itemName and description)
 * @param {Object} item2 - Second item (must have itemName and description)
 * @returns {Promise<number>} - Similarity score as rounded integer (0-100)
 */
async function compareItemNameAndDescription(item1, item2) {
  try {
    // Combine only itemName and description
    const text1 = `${item1.itemName || ''} ${item1.description || ''}`.trim();
    const text2 = `${item2.itemName || ''} ${item2.description || ''}`.trim();
    
    if (!text1 || !text2) {
      console.log('⚠️ One or both items missing itemName or description, returning 0');
      return 0;
    }
    
    console.log(`[compareItemNameAndDescription] Comparing: "${text1.substring(0, 50)}..." vs "${text2.substring(0, 50)}..."`);
    
    // Use Xenova to get similarity score
    const score = await compareTexts(text1, text2);
    
    console.log(`[compareItemNameAndDescription] Similarity score: ${score}/100`);
    
    return score;
  } catch (error) {
    console.error('❌ Error comparing itemName and description:', error);
    throw error;
  }
}

/**
 * Compare two texts using combined semantic (Xenova) and lexical (synonym-aware) similarity
 * This provides a more robust comparison that handles both semantic meaning and word-level matching
 * @param {string} text1 - First text
 * @param {string} text2 - Second text
 * @param {number} semanticWeight - Weight for semantic similarity (0-1, default 0.7)
 * @param {number} lexicalWeight - Weight for lexical similarity (0-1, default 0.3)
 * @returns {Promise<number>} - Combined similarity score as rounded integer (0-100)
 */
async function compareTextsSemanticAndLexical(text1, text2, semanticWeight = 0.7, lexicalWeight = 0.3) {
  try {
    console.log('📝 Comparing texts using combined semantic + lexical similarity');
    
    if (!text1 || !text2) {
      console.log('⚠️ One or both texts are empty, returning 0');
      return 0;
    }

    // Get semantic similarity using Xenova (returns 0-100)
    const semanticScore = await compareTexts(text1, text2);
    
    // Get lexical similarity using synonym-aware comparison (returns 0-1)
    const lexicalScoreDecimal = await lexicalSynonymSimilarity(text1, text2);
    const lexicalScore = Math.round(lexicalScoreDecimal * 100); // Convert to 0-100
    
    // Combine scores with weighted average
    const combinedScore = Math.round(
      (semanticScore * semanticWeight) + (lexicalScore * lexicalWeight)
    );
    
    console.log(`✅ Combined similarity: Semantic=${semanticScore}%, Lexical=${lexicalScore}%, Combined=${combinedScore}%`);
    
    return combinedScore;
  } catch (error) {
    console.error('❌ Error comparing texts semantically and lexically:', error);
    // Fallback to semantic only if lexical fails
    try {
      return await compareTexts(text1, text2);
    } catch (fallbackError) {
      console.error('❌ Fallback semantic comparison also failed:', fallbackError);
      return 0;
    }
  }
}

module.exports = {
  generateTextEmbedding,
  calculateCosineSimilarity,
  compareTexts,
  compareItemNameAndDescription,
  compareTextsSemanticAndLexical,
  getTextModel
};


