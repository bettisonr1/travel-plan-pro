const ItemService = require('../services/ItemService');

class ItemController {
  async getItems(req, res) {
    try {
      const items = await ItemService.getAllItems();
      res.status(200).json({ success: true, data: items });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getItem(req, res) {
    try {
      const item = await ItemService.getItemById(req.params.id);
      res.status(200).json({ success: true, data: item });
    } catch (error) {
      const status = error.message === 'Item not found' ? 404 : 500;
      res.status(status).json({ success: false, error: error.message });
    }
  }

  async createItem(req, res) {
    try {
      const item = await ItemService.createItem(req.body);
      res.status(201).json({ success: true, data: item });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async updateItem(req, res) {
    try {
      const item = await ItemService.updateItem(req.params.id, req.body);
      res.status(200).json({ success: true, data: item });
    } catch (error) {
      const status = error.message === 'Item not found' ? 404 : 500;
      res.status(status).json({ success: false, error: error.message });
    }
  }

  async deleteItem(req, res) {
    try {
      await ItemService.deleteItem(req.params.id);
      res.status(200).json({ success: true, data: {} });
    } catch (error) {
      const status = error.message === 'Item not found' ? 404 : 500;
      res.status(status).json({ success: false, error: error.message });
    }
  }
}

module.exports = new ItemController();
