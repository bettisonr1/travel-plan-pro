const UserRepository = require('../repositories/UserRepository');
const jwt = require('jsonwebtoken');

class UserService {
  async register(userData) {
    const user = await UserRepository.create(userData);
    return user;
  }

  async login(email, password) {
    const user = await UserRepository.findByEmail(email);

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    return user;
  }

  async getUserById(id) {
    return await UserRepository.findById(id);
  }

  async getAllUsers() {
    return await UserRepository.findAll();
  }

  async searchUsers(query) {
    return await UserRepository.search(query);
  }

  generateToken(id) {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
      expiresIn: '30d',
    });
  }
}

module.exports = new UserService();
