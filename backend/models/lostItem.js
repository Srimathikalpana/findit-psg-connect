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

module.exports = mongoose.model('LostItem', lostItemSchema);
