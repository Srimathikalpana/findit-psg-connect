const OpenAI = require('openai');
const { config } = require('dotenv');
const stringSimilarity = require('string-similarity');
const { lexicalSynonymSimilarity } = require('./synonymService');

// Load environment variables
config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Embedding cache to avoid recomputing
const embeddingCache = new Map();

/**
 * Generate embedding for text using OpenAI's text-embedding-3-small model
 * @param {string} text - The text to generate embedding for
 * @returns {Promise<Array<number>>} - The embedding vector
 */
async function generateEmbedding(text) {
  try {
    // Allow disabling OpenAI embeddings in environments without quota or by choice
    if (process.env.DISABLE_OPENAI_EMBEDDINGS === 'true') {
      console.warn('OpenAI embeddings disabled via DISABLE_OPENAI_EMBEDDINGS. Returning null embedding.');
      return null;
    }
    // Check cache first
    const cacheKey = text.toLowerCase().trim();
    if (embeddingCache.has(cacheKey)) {
      console.log('Using cached embedding for:', cacheKey.substring(0, 50) + '...');
      return embeddingCache.get(cacheKey);
    }

    // Normalize text
    const normalizedText = text.toLowerCase().trim();
    
    if (!normalizedText) {
      throw new Error('Text cannot be empty');
    }

    let embedding = null;
    try {
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: normalizedText,
      });

      embedding = response.data[0].embedding;
    } catch (openaiErr) {
      // Handle common quota or API errors gracefully and fallback to null embedding
      console.error('OpenAI embedding error:', openaiErr?.message || openaiErr);
      // If it's an insufficient_quota error, surface a concise warning but continue
      if (openaiErr?.response?.data?.error?.code === 'insufficient_quota' || openaiErr?.code === 'insufficient_quota') {
        console.warn('OpenAI insufficient_quota: embeddings not available. Falling back to lexical-only matching.');
      }
      embedding = null;
    }
    
  // Cache the embedding (or null sentinel) so we don't repeatedly call the API on failure
  embeddingCache.set(cacheKey, embedding);
  console.log('Generated new embedding for:', cacheKey.substring(0, 50) + '...');
    
    return embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
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
  if (embedding1.length !== embedding2.length) {
    throw new Error('Embedding vectors must have the same length');
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
    console.error('Error generating item embedding:', error);
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
    console.error('Error generating answer embedding:', error);
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
          console.warn('Error calculating cosine similarity for', existingItem._id, e.message);
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

      console.log(`Item ${existingItem._id} - semantic:${semanticSim.toFixed(3)} lexical:${lexicalSim.toFixed(3)} combined:${combinedScore.toFixed(3)}`);

  // Use provided threshold or environment override (SEMANTIC_COMBINED_THRESHOLD), default lowered to 0.7 for looser matching
  const combinedThreshold = parseFloat(process.env.SEMANTIC_COMBINED_THRESHOLD || String(threshold || 0.7));

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
    console.log(`Found ${matches.length} semantic+lexical matches above threshold ${threshold}`);
    return matches;
  } catch (error) {
    console.error('Error finding semantic matches:', error);
    throw error;
  }
}

/**
 * Verify answer using semantic similarity
 * @param {string} providedAnswer - The answer provided by the user
 * @param {string} correctAnswer - The correct answer from the found item
 * @param {number} threshold - Similarity threshold (default: 0.85)
 * @returns {Promise<Object>} - Verification result with similarity score
 */
async function verifyAnswerSemantically(providedAnswer, correctAnswer, threshold = parseFloat(process.env.ANSWER_VERIFICATION_THRESHOLD || '0.8')) {
  try {
    // Always compute lexical synonym-aware similarity (fast fallback if network disabled)
    const lexicalSim = await lexicalSynonymSimilarity(providedAnswer || '', correctAnswer || '');

    // Try to generate embeddings for both answers. If embeddings available, compute semantic similarity
    const [providedEmbedding, correctEmbedding] = await Promise.all([
      generateAnswerEmbedding(providedAnswer),
      generateAnswerEmbedding(correctAnswer)
    ]);

    let semanticSim = null;
    if (providedEmbedding && correctEmbedding) {
      try {
        semanticSim = calculateCosineSimilarity(providedEmbedding, correctEmbedding);
      } catch (e) {
        console.warn('Error calculating cosine similarity for verification:', e.message);
        semanticSim = null;
      }
    }

    // Combine semantic and lexical strengths. If semanticSim is not available (null),
    // use lexicalSim directly so missing embeddings don't drag the combined score down.
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

    console.log(`Answer verification - semantic:${semanticSim === null ? 'n/a' : semanticSim.toFixed(3)} lexical:${lexicalSim.toFixed(3)} combined:${combined.toFixed(3)} Threshold: ${threshold}`);

    return {
      isVerified: combined >= threshold,
      similarity: combined,
      semanticSim,
      lexicalSim,
      threshold
    };
  } catch (error) {
    console.error('Error verifying answer semantically:', error);
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
    const semanticMatches = await findSemanticMatches(newItem, existingItems, 0.8);
    
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
    console.error('Error finding verified matches:', error);
    throw error;
  }
}

/**
 * Clear embedding cache (useful for testing or memory management)
 */
function clearEmbeddingCache() {
  embeddingCache.clear();
  console.log('Embedding cache cleared');
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
  answerVerificationThreshold: parseFloat(process.env.ANSWER_VERIFICATION_THRESHOLD || '0.8')
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
  getCacheStats
  , DEFAULTS
};
