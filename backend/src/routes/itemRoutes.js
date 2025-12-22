const express = require('express');
const router = express.Router();
const ItemController = require('../controllers/ItemController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', (req, res) => ItemController.getItems(req, res));
router.get('/:id', (req, res) => ItemController.getItem(req, res));
router.post('/', (req, res) => ItemController.createItem(req, res));
router.put('/:id', (req, res) => ItemController.updateItem(req, res));
router.delete('/:id', (req, res) => ItemController.deleteItem(req, res));

module.exports = router;
