const mongoose = require('mongoose');
const itemSchema = require('./item');

const lostItemSchema = new mongoose.Schema({
  ...itemSchema.obj,
  placeLost: { type: String, required: true },
  dateLost: { type: Date, required: true },
  // Ensure base item `type` is satisfied for lost items
  type: {
    type: String,
    default: 'lost',
    enum: ['lost']
  },
  // Cross-references to matched found items with scores
  matchRefs: [
    {
      foundItem: { type: mongoose.Schema.Types.ObjectId, ref: 'FoundItem', required: true },
      similarity: { type: Number, required: true, min: 0, max: 1 },
      matchedAt: { type: Date, default: Date.now }
    }
  ],
  potentialMatches: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FoundItem'
  }],
  reward: { type: Number, default: 0 },
  isUrgent: { type: Boolean, default: false }
}, { timestamps: true });

// Pre-save middleware to generate embeddings for semantic matching
lostItemSchema.pre('save', async function(next) {
  try {
    // Only generate embeddings if they don't exist or if the description has changed
    const needsDescriptionEmbedding = !this.descriptionEmbedding || this.isModified('itemName') || this.isModified('description') || this.isModified('category');

    if (needsDescriptionEmbedding) {
      const { generateItemEmbedding } = require('../utils/semanticMatch');
      await generateItemEmbedding(this);
    }
    
    next();
  } catch (error) {
    console.error('Error generating embeddings in pre-save hook:', error);
    next(error);
  }
});

module.exports = mongoose.model('LostItem', lostItemSchema);
