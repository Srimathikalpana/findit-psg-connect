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

module.exports = mongoose.model('FoundItem', foundItemSchema);