const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const auth = require('../middleware/auth');

// Public routes (viewing items)
router.get('/lost-items', itemController.getAllLostItems);
router.get('/found-items', itemController.getAllFoundItems);
router.get('/search', itemController.searchItems);

// Item-specific routes
router.get('/lost-items/:id', itemController.getItemById);
router.get('/found-items/:id', itemController.getItemById);

// Protected routes (managing items)
router.post('/lost-items', auth, itemController.createLostItem);
router.post('/found-items', auth, itemController.createFoundItem);
router.get('/my-items', auth, itemController.getUserItems);
router.put('/lost-items/:id', auth, itemController.updateItem);
router.put('/found-items/:id', auth, itemController.updateItem);
router.delete('/lost-items/:id', auth, itemController.deleteItem);
router.delete('/found-items/:id', auth, itemController.deleteItem);

module.exports = router;