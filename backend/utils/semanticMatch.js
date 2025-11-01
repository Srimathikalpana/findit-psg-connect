const stringSimilarity = require('string-similarity');
const { lexicalSynonymSimilarity } = require('./synonymService');

// Model configuration
const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2';
let modelPromise = null; // Cache for the model

// Embedding cache to avoid recomputing
const embeddingCache = new Map();

/**
 * Initialize and cache the model on first use
 * @returns {Promise<Object>} - The feature extraction pipeline
 */
async function getModel() {
  if (modelPromise) {
    return modelPromise;
  }

  modelPromise = (async () => {
    try {
      console.log('🤖 Loading local embedding model:', MODEL_NAME);
      // Dynamic import for ES module
      const { pipeline } = await import('@xenova/transformers');
      const model = await pipeline('feature-extraction', MODEL_NAME);
      console.log('✅ Model loaded and cached successfully');
      return model;
    } catch (error) {
      console.error('❌ Error loading model:', error);
      throw error;
    }
  })();

  return modelPromise;
}

/**
 * Generate embedding for text using local all-MiniLM-L6-v2 model
 * @param {string} text - The text to generate embedding for
 * @returns {Promise<Array<number>>} - The embedding vector (384 dimensions)
 */
async function generateEmbedding(text) {
  try {
    // Check cache first
    const cacheKey = text.toLowerCase().trim();
    if (embeddingCache.has(cacheKey)) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('📋 Using cached embedding for:', cacheKey.substring(0, 50) + '...');
      }
      return embeddingCache.get(cacheKey);
    }

    // Normalize text
    const normalizedText = text.toLowerCase().trim();
    
    if (!normalizedText) {
      throw new Error('Text cannot be empty');
    }

    // Load model if not already loaded
    const extractor = await getModel();
    
    // Generate embedding
    const output = await extractor(normalizedText, {
      pooling: 'mean',
      normalize: true
    });

    // Convert tensor to array
    // @xenova/transformers returns a tensor object with .data and .tolist() methods
    let embedding;
    if (output && typeof output.tolist === 'function') {
      // Use tolist() method if available (recommended way)
      embedding = output.tolist();
      // If it's nested (batch output), flatten it
      if (Array.isArray(embedding[0]) && !Array.isArray(embedding[0][0])) {
        embedding = embedding[0]; // Take first item if batch
      }
    } else if (output && output.data) {
      // Fallback to .data property
      embedding = Array.from(output.data);
    } else if (Array.isArray(output)) {
      embedding = output;
      // Flatten nested arrays
      if (Array.isArray(embedding[0]) && !Array.isArray(embedding[0][0])) {
        embedding = embedding[0];
      }
    } else {
      // Last resort: try to convert to array
      embedding = Array.from(output);
    }

    // Ensure we have a valid 1D array
    if (!Array.isArray(embedding) || embedding.length === 0) {
      throw new Error('Failed to generate valid embedding');
    }
    
    // Flatten if somehow still nested
    if (Array.isArray(embedding[0]) && typeof embedding[0][0] === 'number') {
      embedding = embedding.flat();
    }

    // Cache the embedding
    embeddingCache.set(cacheKey, embedding);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('✨ Generated new embedding for:', cacheKey.substring(0, 50) + '...', `(${embedding.length} dimensions)`);
    }
    
    return embedding;
  } catch (error) {
    console.error('❌ Error generating embedding:', error);
    // Don't throw - return null to allow graceful fallback to lexical matching
    return null;
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
    console.warn(`Embedding length mismatch: ${embedding1.length} vs ${embedding2.length}`);
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
 * Generate embedding for item description and store in item
 * @param {Object} item - The item object (lost or found)
 * @returns {Promise<Object>} - Updated item with embedding
 */
async function generateItemEmbedding(item) {
  try {
    // Combine relevant fields for embedding
    const combinedText = `${item.itemName} ${item.description} ${item.category || ''} ${item.color || ''} ${item.brand || ''}`.trim();
    
    if (!combinedText) {
      throw new Error('Item must have at least itemName and description');
    }

    const embedding = await generateEmbedding(combinedText);
    // If embedding generation failed, we leave descriptionEmbedding null to indicate fallback
    item.descriptionEmbedding = embedding || null;
    
    return item;
  } catch (error) {
    console.error('❌ Error generating item embedding:', error);
    // Graceful fallback: don't throw, return item with no embedding
    item.descriptionEmbedding = null;
    return item;
  }
}

/**
 * Generate embedding for verification answer
 * @param {string} answer - The verification answer
 * @returns {Promise<Array<number>>} - The embedding vector
 */
async function generateAnswerEmbedding(answer) {
  try {
    return await generateEmbedding(answer);
  } catch (error) {
    console.error('❌ Error generating answer embedding:', error);
    // Return null so verification can fallback to lexical compare
    return null;
  }
}

/**
 * Find semantic matches for a new item against existing items of opposite type
 * @param {Object} newItem - The new item (lost or found)
 * @param {Array<Object>} existingItems - Array of existing items to match against
 * @param {number} threshold - Similarity threshold (default: 0.8)
 * @returns {Promise<Array<Object>>} - Array of matches with similarity scores
 */
async function findSemanticMatches(newItem, existingItems, threshold = 0.8) {
  try {
    // Generate embedding for new item if not already present
    if (!newItem.descriptionEmbedding) {
      await generateItemEmbedding(newItem);
    }

    const matches = [];

    // Use provided threshold or environment override (SEMANTIC_COMBINED_THRESHOLD), default lowered to 0.7 for looser matching
    const combinedThreshold = parseFloat(process.env.SEMANTIC_COMBINED_THRESHOLD || String(threshold || 0.7));

    for (const existingItem of existingItems) {
      // Compute lexical similarity (name + description) as fallback / augment
      // Use synonym-aware lexical similarity (falls back to string-similarity if API not available)
      const nameLex = await lexicalSynonymSimilarity(newItem.itemName || '', existingItem.itemName || '');
      const descLex = await lexicalSynonymSimilarity(newItem.description || '', existingItem.description || '');
      const lexicalSim = Math.max(nameLex, descLex);

      // Calculate semantic similarity if embeddings are available; otherwise fallback to lexical similarity
      let semanticSim = 0;
      if (newItem.descriptionEmbedding && existingItem.descriptionEmbedding) {
        try {
          semanticSim = calculateCosineSimilarity(
            newItem.descriptionEmbedding,
            existingItem.descriptionEmbedding
          );
        } catch (e) {
          console.warn('⚠️ Error calculating cosine similarity for', existingItem._id, e.message);
          semanticSim = 0;
        }
      } else {
        // No embeddings available; use lexical similarity as semantic placeholder
        semanticSim = lexicalSim;
      }

      // Combine semantic and lexical scores. Weight semantic higher but allow lexical to rescue synonyms
      // Tunable via environment variables: SEMANTIC_WEIGHT and LEXICAL_WEIGHT (they should sum to 1 ideally)
      const semanticWeight = parseFloat(process.env.SEMANTIC_WEIGHT || '0.75');
      const lexicalWeight = parseFloat(process.env.LEXICAL_WEIGHT || '0.25');
      const combinedScore = (semanticSim * semanticWeight) + (lexicalSim * lexicalWeight);

      if (process.env.NODE_ENV !== 'production') {
        console.log(`📊 Item ${existingItem._id} - semantic:${semanticSim.toFixed(3)} lexical:${lexicalSim.toFixed(3)} combined:${combinedScore.toFixed(3)}`);
      }

      if (combinedScore >= combinedThreshold) {
        matches.push({
          item: existingItem,
          similarity: combinedScore,
          semanticSim,
          lexicalSim: lexicalSim,
          itemId: existingItem._id
        });
      }
    }

    // Sort by similarity (combined) score descending
    matches.sort((a, b) => b.similarity - a.similarity);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log(`✅ Found ${matches.length} semantic+lexical matches above threshold ${combinedThreshold}`);
    }
    
    return matches;
  } catch (error) {
    console.error('❌ Error finding semantic matches:', error);
    throw error;
  }
}

/**
 * Verify answer using semantic similarity with local embeddings
 * Handles synonyms and paraphrasing - e.g., "Black leather wallet" ≈ "Leather purse, black color"
 * @param {string} providedAnswer - The answer provided by the user
 * @param {string} correctAnswer - The correct answer from the found item
 * @param {number} threshold - Similarity threshold (default: 0.75 for leniency, can be adjusted to 0.8 for stricter)
 * @returns {Promise<Object>} - Verification result with similarity score
 */
async function verifyAnswerSemantically(providedAnswer, correctAnswer, threshold = parseFloat(process.env.ANSWER_VERIFICATION_THRESHOLD || '0.75')) {
  try {
    // Always compute lexical synonym-aware similarity (fast fallback if network disabled)
    const lexicalSim = await lexicalSynonymSimilarity(providedAnswer || '', correctAnswer || '');

    // Generate embeddings for both answers using local @xenova/transformers model
    const [providedEmbedding, correctEmbedding] = await Promise.all([
      generateAnswerEmbedding(providedAnswer),
      generateAnswerEmbedding(correctAnswer)
    ]);

    let semanticSim = null;
    if (providedEmbedding && correctEmbedding) {
      try {
        semanticSim = calculateCosineSimilarity(providedEmbedding, correctEmbedding);
      } catch (e) {
        console.warn('⚠️ Error calculating cosine similarity for verification:', e.message);
        semanticSim = null;
      }
    }

    // Combine semantic and lexical strengths (75% semantic, 25% lexical)
    // If semanticSim is not available (null), use lexicalSim directly
    const semanticWeight = parseFloat(process.env.SEMANTIC_WEIGHT || '0.75');
    const lexicalWeight = parseFloat(process.env.LEXICAL_WEIGHT || '0.25');
    let combined;
    if (semanticSim === null) {
      combined = lexicalSim;
    } else {
      // normalize weights in case they don't sum to 1
      const totalW = semanticWeight + lexicalWeight || 1;
      const sW = semanticWeight / totalW;
      const lW = lexicalWeight / totalW;
      combined = (semanticSim * sW) + (lexicalSim * lW);
    }

    // Lightweight logging - always show both similarity scores
    const isVerified = combined >= threshold;
    console.log(`🔍 Answer verification - Provided: "${providedAnswer}" | Correct: "${correctAnswer}"`);
    console.log(`   📊 Semantic: ${semanticSim === null ? 'n/a' : semanticSim.toFixed(3)} | Lexical: ${lexicalSim.toFixed(3)} | Combined: ${combined.toFixed(3)} | Threshold: ${threshold} | ✅ Verified: ${isVerified ? 'YES' : 'NO'}`);

    return {
      isVerified,
      similarity: combined,
      semanticSim,
      lexicalSim,
      threshold
    };
  } catch (error) {
    console.error('❌ Error verifying answer semantically:', error);
    throw error;
  }
}

/**
 * Complete semantic matching with verification for lost/found items
 * @param {Object} newItem - The new item
 * @param {Array<Object>} existingItems - Existing items to match against
 * @param {string} providedAnswer - Answer provided for verification (if any)
 * @returns {Promise<Array<Object>>} - Array of verified matches
 */
async function findVerifiedMatches(newItem, existingItems, providedAnswer = null) {
  try {
    // Find semantic matches
    const semanticMatches = await findSemanticMatches(newItem, existingItems, 0.65);
    
    if (semanticMatches.length === 0) {
      return [];
    }

    // If verification answer is provided, verify each match
    if (providedAnswer) {
      const verifiedMatches = [];
      
      for (const match of semanticMatches) {
        if (match.item.correctAnswer) {
            const verification = await verifyAnswerSemantically(providedAnswer, match.item.correctAnswer);
          
          if (verification.isVerified) {
            verifiedMatches.push({
              ...match,
              verification: verification,
              isVerifiedMatch: true
            });
          } else {
            // Still include as potential match but not verified
            verifiedMatches.push({
              ...match,
              verification: verification,
              isVerifiedMatch: false
            });
          }
        } else {
          // No verification answer available, include as potential match
          verifiedMatches.push({
            ...match,
            verification: null,
            isVerifiedMatch: false
          });
        }
      }
      
      return verifiedMatches;
    }
    
    return semanticMatches.map(match => ({
      ...match,
      verification: null,
      isVerifiedMatch: false
    }));
  } catch (error) {
    console.error('❌ Error finding verified matches:', error);
    throw error;
  }
}

/**
 * Clear embedding cache (useful for testing or memory management)
 */
function clearEmbeddingCache() {
  embeddingCache.clear();
  console.log('🗑️ Embedding cache cleared');
}

/**
 * Get cache statistics
 * @returns {Object} - Cache statistics
 */
function getCacheStats() {
  return {
    size: embeddingCache.size,
    keys: Array.from(embeddingCache.keys()).slice(0, 10) // First 10 keys for debugging
  };
}

// Expose current defaults (read from env or fallback values)
const DEFAULTS = {
  combinedThreshold: parseFloat(process.env.SEMANTIC_COMBINED_THRESHOLD || '0.7'),
  semanticWeight: parseFloat(process.env.SEMANTIC_WEIGHT || '0.75'),
  lexicalWeight: parseFloat(process.env.LEXICAL_WEIGHT || '0.25'),
  answerVerificationThreshold: parseFloat(process.env.ANSWER_VERIFICATION_THRESHOLD || '0.75') // Default 0.75 for leniency
};

module.exports = {
  generateEmbedding,
  calculateCosineSimilarity,
  generateItemEmbedding,
  generateAnswerEmbedding,
  findSemanticMatches,
  verifyAnswerSemantically,
  findVerifiedMatches,
  clearEmbeddingCache,
  getCacheStats,
  DEFAULTS
};
