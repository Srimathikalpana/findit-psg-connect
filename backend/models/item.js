const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { 
    type: String, 
    enum: ['active', 'claimed', 'archived'], 
    default: 'active' 
  },
  category: { type: String, required: true },
  color: { type: String },
  brand: { type: String },
  contactInfo: {
    phone: String,
    email: String
  }
}, { timestamps: true });

module.exports = itemSchema;
