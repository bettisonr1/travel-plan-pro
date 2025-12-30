const TripRepository = require('../repositories/TripRepository');

class TripService {
  async getAllTrips(userId) {
    return await TripRepository.findAll(userId);
  }

  async getTripById(id) {
    const trip = await TripRepository.findById(id);
    if (!trip) {
      throw new Error('Trip not found');
    }
    return trip;
  }

  async createTrip(data) {
    return await TripRepository.create(data);
  }

  async updateTrip(id, data) {
    const trip = await TripRepository.update(id, data);
    if (!trip) {
      throw new Error('Trip not found');
    }
    return trip;
  }

  async deleteTrip(id) {
    const trip = await TripRepository.delete(id);
    if (!trip) {
      throw new Error('Trip not found');
    }
    return trip;
  }

  async addUserToTrip(tripId, userId) {
    const trip = await TripRepository.addUserToTrip(tripId, userId);
    if (!trip) {
      throw new Error('Trip not found');
    }
    return trip;
  }

  async removeUserFromTrip(tripId, userId) {
    const trip = await TripRepository.removeUserFromTrip(tripId, userId);
    if (!trip) {
      throw new Error('Trip not found');
    }
    return trip;
  }

  async addMessage(tripId, messageData) {
    const trip = await TripRepository.addMessage(tripId, messageData);
    if (!trip) {
      throw new Error('Trip not found');
    }
    return trip;
  }

  async toggleLikeMessage(tripId, messageId, userId) {
    const trip = await TripRepository.toggleLikeMessage(tripId, messageId, userId);
    if (!trip) {
      throw new Error('Trip not found or message not found');
    }
    return trip;
  }
}

module.exports = new TripService();
