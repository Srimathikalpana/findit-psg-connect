const mongoose = require('mongoose');
const itemSchema = require('./item');

const foundItemSchema = new mongoose.Schema({
  ...itemSchema.obj,
  placeFound: { type: String, required: true },
  dateFound: { type: Date, required: true },
  handedOverTo: { type: String },
  storageLocation: { type: String },
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