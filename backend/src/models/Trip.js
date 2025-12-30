const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  destination: {
    type: String,
    required: [true, 'Please add a destination'],
    trim: true,
  },
  startDate: {
    type: Date,
    required: [true, 'Please add a start date'],
  },
  endDate: {
    type: Date,
    required: [true, 'Please add an end date'],
  },
  description: {
    type: String,
  },
  color: {
    type: String,
    default: '#3B82F6', // Default blue
  },
  thumbnailUrl: {
    type: String,
    default: '',
  },
  pointsOfInterest: {
    type: [String],
    default: []
  },
  users: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Trip', tripSchema);
