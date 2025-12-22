const TripService = require('../services/TripService');

class TripController {
  async getTrips(req, res) {
    try {
      const trips = await TripService.getAllTrips();
      res.status(200).json({ success: true, data: trips });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getTrip(req, res) {
    try {
      const trip = await TripService.getTripById(req.params.id);
      res.status(200).json({ success: true, data: trip });
    } catch (error) {
      const status = error.message === 'Trip not found' ? 404 : 500;
      res.status(status).json({ success: false, error: error.message });
    }
  }

  async createTrip(req, res) {
    try {
      const trip = await TripService.createTrip(req.body);
      res.status(201).json({ success: true, data: trip });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async updateTrip(req, res) {
    try {
      const trip = await TripService.updateTrip(req.params.id, req.body);
      res.status(200).json({ success: true, data: trip });
    } catch (error) {
      const status = error.message === 'Trip not found' ? 404 : 500;
      res.status(status).json({ success: false, error: error.message });
    }
  }

  async deleteTrip(req, res) {
    try {
      await TripService.deleteTrip(req.params.id);
      res.status(200).json({ success: true, data: {} });
    } catch (error) {
      const status = error.message === 'Trip not found' ? 404 : 500;
      res.status(status).json({ success: false, error: error.message });
    }
  }
}

module.exports = new TripController();
