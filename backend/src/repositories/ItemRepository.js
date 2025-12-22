const Item = require('../models/Item');

class ItemRepository {
  async findAll() {
    return await Item.find();
  }

  async findById(id) {
    return await Item.findById(id);
  }

  async create(data) {
    return await Item.create(data);
  }

  async update(id, data) {
    return await Item.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
  }

  async delete(id) {
    return await Item.findByIdAndDelete(id);
  }
}

module.exports = new ItemRepository();
