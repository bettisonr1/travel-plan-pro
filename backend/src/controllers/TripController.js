const TripService = require('../services/TripService');

class TripController {
  async getTrips(req, res) {
    try {
      const trips = await TripService.getAllTrips(req.user.id);
      res.status(200).json({ success: true, data: trips });
    } catch (error) {
      console.error('Error in getTrips:', error);
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
      const tripData = { ...req.body, users: [req.user.id] };
      const trip = await TripService.createTrip(tripData);
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

  async addUser(req, res) {
    try {
      const { userId } = req.body;
      const trip = await TripService.addUserToTrip(req.params.id, userId);
      res.status(200).json({ success: true, data: trip });
    } catch (error) {
      const status = error.message === 'Trip not found' ? 404 : 500;
      res.status(status).json({ success: false, error: error.message });
    }
  }

  async removeUser(req, res) {
    try {
      const { userId } = req.params;
      const trip = await TripService.removeUserFromTrip(req.params.id, userId);
      res.status(200).json({ success: true, data: trip });
    } catch (error) {
      const status = error.message === 'Trip not found' ? 404 : 500;
      res.status(status).json({ success: false, error: error.message });
    }
  }

  async addMessage(req, res) {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ success: false, error: 'Message text is required' });
      }
      const messageData = {
        text,
        user: req.user.id
      };
      const trip = await TripService.addMessage(req.params.id, messageData);
      res.status(200).json({ success: true, data: trip });
    } catch (error) {
      const status = error.message === 'Trip not found' ? 404 : 500;
      res.status(status).json({ success: false, error: error.message });
    }
  }

  async toggleLikeMessage(req, res) {
    try {
      const { messageId } = req.params;
      const trip = await TripService.toggleLikeMessage(req.params.id, messageId, req.user.id);
      res.status(200).json({ success: true, data: trip });
    } catch (error) {
      const status = error.message.includes('not found') ? 404 : 500;
      res.status(status).json({ success: false, error: error.message });
    }
  }
}

module.exports = new TripController();
