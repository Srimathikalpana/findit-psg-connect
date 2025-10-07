const express = require('express');
const router = express.Router();
const claimController = require('../controllers/claimController');
const auth = require('../middleware/auth');

// Protected routes
router.post('/claims', auth, claimController.createClaim);
router.post('/claims/verify/:id', auth, claimController.verifyAnswer);
router.post('/claims/verify-and-claim', auth, claimController.verifyAndClaim);
router.get('/claims', auth, claimController.getUserClaims);
router.get('/claims/:id', auth, claimController.getClaimById);
router.put('/claims/:id/status', auth, claimController.updateClaimStatus);
router.put('/claims/:id/complete', auth, claimController.completeClaim);
router.delete('/claims/:id', auth, claimController.cancelClaim);

module.exports = router;
