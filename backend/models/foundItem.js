const mongoose = require('mongoose');
const itemSchema = require('./item');

const foundItemSchema = new mongoose.Schema({
  ...itemSchema.obj,
  placeFound: { type: String, required: true },
  dateFound: { type: Date, required: true },
  handedOverTo: { type: String },
  storageLocation: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('FoundItem', foundItemSchema);
