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
    phone: {
      type: String,
      required: false,
      validate: {
        validator: function(v) {
          return /^\d{7,15}$/.test((v || '').toString());
        },
        message: 'phone must be a numeric string (7-15 digits)'
      }
    },
    email: String
  },
  // Add verification fields
  verificationQuestion: { 
    type: String,
    required: function() { return this.type === 'found'; } // Only required for found items
  },
  correctAnswer: {
    type: String,
    required: function() { return this.type === 'found'; } // Only required for found items
  },
  // Add type field to distinguish between lost and found items
  type: {
    type: String,
    enum: ['lost', 'found'],
    required: true
  }
}, { timestamps: true });

module.exports = itemSchema;