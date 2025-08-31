const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { createLostItem, createFoundItem } = require('../controllers/itemController');

router.post('/lost-items', auth, createLostItem);
router.post('/found-items', auth, createFoundItem);

module.exports = router;