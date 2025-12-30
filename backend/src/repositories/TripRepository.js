const Trip = require('../models/Trip');

class TripRepository {
  async findAll(userId) {
    if (userId) {
      return await Trip.find({ users: userId })
        .populate('users', 'firstname lastname email avatarColor')
        .populate('messages.user', 'firstname lastname email avatarColor');
    }
    return await Trip.find()
      .populate('users', 'firstname lastname email avatarColor')
      .populate('messages.user', 'firstname lastname email avatarColor');
  }

  async findById(id) {
    return await Trip.findById(id)
      .populate('users', 'firstname lastname email avatarColor')
      .populate('messages.user', 'firstname lastname email avatarColor');
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

  async addMessage(tripId, messageData) {
    return await Trip.findByIdAndUpdate(
      tripId,
      { $push: { messages: messageData } },
      { new: true }
    ).populate('users', 'firstname lastname email avatarColor')
     .populate('messages.user', 'firstname lastname email avatarColor');
  }

  async toggleLikeMessage(tripId, messageId, userId) {
    const trip = await Trip.findById(tripId);
    if (!trip) return null;

    if (!trip.messages || typeof trip.messages.id !== 'function') {
      return null;
    }

    const message = trip.messages.id(messageId);
    if (!message) return null;

    if (!message.likes) {
      message.likes = [];
    }

    const likeIndex = message.likes.findIndex(id => id.toString() === userId.toString());
    if (likeIndex > -1) {
      message.likes.splice(likeIndex, 1);
    } else {
      message.likes.push(userId);
    }

    await trip.save();
    return await Trip.findById(tripId)
      .populate('users', 'firstname lastname email avatarColor')
      .populate('messages.user', 'firstname lastname email avatarColor');
  }
}

module.exports = new TripRepository();
