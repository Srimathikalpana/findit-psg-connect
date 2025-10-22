const mongoose = require('mongoose');
const itemSchema = require('./item');

const foundItemSchema = new mongoose.Schema({
  ...itemSchema.obj,
  placeFound: { type: String, required: true },
  dateFound: { type: Date, required: true },
  handedOverTo: { type: String },
  storageLocation: { type: String },
  // Cross-references to matched lost items with scores
  matchRefs: [
    {
      lostItem: { type: mongoose.Schema.Types.ObjectId, ref: 'LostItem', required: true },
      similarity: { type: Number, required: true, min: 0, max: 1 },
      matchedAt: { type: Date, default: Date.now }
    }
  ],
  // Set type as 'found' by default
  type: {
    type: String,
    default: 'found',
    enum: ['found']
  }
}, { timestamps: true });

// Pre-save middleware to ensure verification fields for found items
foundItemSchema.pre('save', function(next) {
  if (!this.verificationQuestion || !this.correctAnswer) {
    const error = new Error('Verification question and answer are required for found items');
    return next(error);
  }
  next();
});

// Pre-save middleware to generate embeddings for semantic matching
foundItemSchema.pre('save', async function(next) {
  try {
    // Only generate embeddings if they don't exist or if the description/answer has changed
    const needsDescriptionEmbedding = !this.descriptionEmbedding || this.isModified('itemName') || this.isModified('description') || this.isModified('category');
    const needsAnswerEmbedding = !this.answerEmbedding || this.isModified('correctAnswer');

    if (needsDescriptionEmbedding || needsAnswerEmbedding) {
      const { generateItemEmbedding, generateAnswerEmbedding } = require('../utils/semanticMatch');
      
      if (needsDescriptionEmbedding) {
        await generateItemEmbedding(this);
      }
      
      if (needsAnswerEmbedding && this.correctAnswer) {
        this.answerEmbedding = await generateAnswerEmbedding(this.correctAnswer);
      }
    }
    
    next();
  } catch (error) {
    console.error('Error generating embeddings in pre-save hook:', error);
    next(error);
  }
});

module.exports = mongoose.model('FoundItem', foundItemSchema);