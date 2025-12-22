const TripRepository = require('../repositories/TripRepository');

class TripService {
  async getAllTrips() {
    return await TripRepository.findAll();
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
}

module.exports = new TripService();
