const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { 
  createLostItem, 
  getLostItemMatches,
  getAllLostItems,
  getAllFoundItems,
  searchItems,
  getItemById,
  createFoundItem,
  getUserItems,
  updateItem,
  deleteItem,
  verifyAnswerSemantically
} = require('../controllers/itemController');

// Public routes (viewing items)
router.get('/lost-items', getAllLostItems);
router.get('/found-items', getAllFoundItems);
router.get('/search', searchItems);

// Item-specific routes
router.get('/lost-items/:id', getItemById);
router.get('/found-items/:id', getItemById);

// Protected routes (managing items)
router.post('/lost-items', auth, createLostItem);
router.post('/found-items', auth, createFoundItem);
router.get('/my-items', auth, getUserItems);
router.get('/matches/:id', auth, getLostItemMatches);
router.put('/lost-items/:id', auth, updateItem);
router.put('/found-items/:id', auth, updateItem);
router.delete('/lost-items/:id', auth, deleteItem);
router.delete('/found-items/:id', auth, deleteItem);
router.get('/lost-items/:id/matches', auth, getLostItemMatches);

// Semantic verification endpoint
router.post('/verify-answer', auth, verifyAnswerSemantically);

// Cleanup endpoints (for cleaning up low-quality matches)
const { cleanupLowQualityMatches, cleanupItemMatches } = require('../controllers/cleanupController');
router.post('/cleanup-matches', auth, cleanupLowQualityMatches);
router.post('/lost-items/:itemId/cleanup-matches', auth, cleanupItemMatches);

module.exports = router;