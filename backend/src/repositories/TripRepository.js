const Trip = require('../models/Trip');

class TripRepository {
  async findAll(userId) {
    if (userId) {
      return await Trip.find({ users: userId }).populate('users', 'firstname lastname email avatarColor');
    }
    return await Trip.find().populate('users', 'firstname lastname email avatarColor');
  }

  async findById(id) {
    return await Trip.findById(id).populate('users', 'firstname lastname email avatarColor');
  }

  async create(data) {
    const trip = await Trip.create(data);
    return await trip.populate('users', 'firstname lastname email avatarColor');
  }

  async update(id, data) {
    return await Trip.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).populate('users', 'firstname lastname email avatarColor');
  }

  async delete(id) {
    return await Trip.findByIdAndDelete(id);
  }

  async addUserToTrip(tripId, userId) {
    return await Trip.findByIdAndUpdate(
      tripId,
      { $addToSet: { users: userId } },
      { new: true }
    ).populate('users', 'firstname lastname email avatarColor');
  }

  async removeUserFromTrip(tripId, userId) {
    return await Trip.findByIdAndUpdate(
      tripId,
      { $pull: { users: userId } },
      { new: true }
    ).populate('users', 'firstname lastname email avatarColor');
  }
}

module.exports = new TripRepository();
