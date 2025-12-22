const Trip = require('../models/Trip');

class TripRepository {
  async findAll(userId) {
    if (userId) {
      return await Trip.find({ users: userId });
    }
    return await Trip.find();
  }

  async findById(id) {
    return await Trip.findById(id);
  }

  async create(data) {
    return await Trip.create(data);
  }

  async update(id, data) {
    return await Trip.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
  }

  async delete(id) {
    return await Trip.findByIdAndDelete(id);
  }

  async addUserToTrip(tripId, userId) {
    return await Trip.findByIdAndUpdate(
      tripId,
      { $addToSet: { users: userId } },
      { new: true }
    );
  }
}

module.exports = new TripRepository();
