const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema({
  lostItem: { type: mongoose.Schema.Types.ObjectId, ref: 'LostItem', required: true },
  foundItem: { type: mongoose.Schema.Types.ObjectId, ref: 'FoundItem', required: true },
  claimant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  finder: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'completed'], 
    default: 'pending' 
  },
  claimDate: { type: Date, default: Date.now },
  approvedDate: { type: Date },
  rejectionReason: { type: String },
  adminNotes: { type: String },
  proofOfOwnership: { type: String }, // URL to proof document
  meetingDetails: {
    location: String,
    date: Date,
    time: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Claim', claimSchema);  