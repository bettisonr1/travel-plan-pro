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
