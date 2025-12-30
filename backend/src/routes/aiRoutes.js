const express = require('express');
const router = express.Router();
const AIController = require('../controllers/AIController');
const { protect } = require('../middleware/auth');

// Protect these routes if needed, or leave open if appropriate. 
// Assuming we want authenticated users to use this feature.
router.use(protect);

router.post('/suggest', AIController.suggestTripDetails);
router.post('/generate-image', AIController.generateTripImage);
router.post('/generate-logo', AIController.generateLogo);

module.exports = router;
