const User = require('../models/User');

class UserRepository {
  async findByEmail(email) {
    return await User.findOne({ email }).select('+password');
  }

  async findById(id) {
    return await User.findById(id);
  }

  async create(userData) {
    return await User.create(userData);
  }

  async findAll() {
    return await User.find();
  }

  async search(query) {
    const regex = new RegExp(query, 'i');
    return await User.find({
      $or: [
        { firstname: regex },
        { lastname: regex },
        { email: regex }
      ]
    });
  }
}

module.exports = new UserRepository();
