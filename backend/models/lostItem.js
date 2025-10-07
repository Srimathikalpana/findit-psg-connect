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
  potentialMatches: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FoundItem'
  }],
  reward: { type: Number, default: 0 },
  isUrgent: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('LostItem', lostItemSchema);
