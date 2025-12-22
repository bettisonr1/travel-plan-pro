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
}

module.exports = new UserRepository();
