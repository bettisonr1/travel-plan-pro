const express = require('express');
const router = express.Router();
const TripController = require('../controllers/TripController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', (req, res) => TripController.getTrips(req, res));
router.get('/:id', (req, res) => TripController.getTrip(req, res));
router.post('/', (req, res) => TripController.createTrip(req, res));
router.put('/:id', (req, res) => TripController.updateTrip(req, res));
router.delete('/:id', (req, res) => TripController.deleteTrip(req, res));
router.post('/:id/users', (req, res) => TripController.addUser(req, res));
router.delete('/:id/users/:userId', (req, res) => TripController.removeUser(req, res));
router.post('/:id/messages', (req, res) => TripController.addMessage(req, res));
router.post('/:id/messages/:messageId/like', (req, res) => TripController.toggleLikeMessage(req, res));
router.get('/:id/research', (req, res) => TripController.startDeepResearch(req, res));

module.exports = router;
