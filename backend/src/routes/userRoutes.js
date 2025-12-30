const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const { protect } = require('../middleware/auth');

router.post('/register', UserController.register);
router.post('/login', UserController.login);
router.get('/me', protect, UserController.getMe);
router.put('/me', protect, UserController.updateMe);
router.get('/', protect, UserController.getUsers);

module.exports = router;
