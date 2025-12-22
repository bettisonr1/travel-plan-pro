const ItemRepository = require('../repositories/ItemRepository');

class ItemService {
  async getAllItems() {
    return await ItemRepository.findAll();
  }

  async getItemById(id) {
    const item = await ItemRepository.findById(id);
    if (!item) {
      throw new Error('Item not found');
    }
    return item;
  }

  async createItem(data) {
    return await ItemRepository.create(data);
  }

  async updateItem(id, data) {
    const item = await ItemRepository.update(id, data);
    if (!item) {
      throw new Error('Item not found');
    }
    return item;
  }

  async deleteItem(id) {
    const item = await ItemRepository.delete(id);
    if (!item) {
      throw new Error('Item not found');
    }
    return item;
  }
}

module.exports = new ItemService();
