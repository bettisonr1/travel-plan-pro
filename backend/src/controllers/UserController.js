const UserService = require('../services/UserService');

class UserController {
  async register(req, res) {
    try {
      const user = await UserService.register(req.body);
      const token = UserService.generateToken(user._id);
      res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          token,
        },
      });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const user = await UserService.login(email, password);
      const token = UserService.generateToken(user._id);
      res.status(200).json({
        success: true,
        data: {
          _id: user._id,
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          token,
        },
      });
    } catch (error) {
      res.status(401).json({ success: false, error: error.message });
    }
  }

  async getMe(req, res) {
    try {
      const user = await UserService.getUserById(req.user.id);
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getUsers(req, res) {
    try {
      const users = await UserService.getAllUsers();
      res.status(200).json({ success: true, data: users });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new UserController();
