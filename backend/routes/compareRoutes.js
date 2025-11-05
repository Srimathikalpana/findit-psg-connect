const express = require('express');
const router = express.Router();
const { compareItems } = require('../controllers/compareController');
const auth = require('../middleware/auth');

/**
 * @route POST /api/compare
 * @desc Compare a lost item with a found item using text and/or image similarity
 * @access Private
 */
router.post('/compare', auth, compareItems);

module.exports = router;

