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
  researchFindings: [{
    category: String,
    content: String
  }],
  researchSummary: {
    type: String,
    default: ''
  },
  isResearching: {
    type: Boolean,
    default: false
  },
  messages: [{
    text: {
      type: String,
      required: true
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      // required: true - Removed to allow AI messages
    },
    senderType: {
      type: String,
      enum: ['user', 'ai'],
      default: 'user'
    },
    senderName: {
      type: String
    },
    likes: [{
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    }],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  users: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
  ],
  itinerary: [{
    day: Number, // 1, 2, 3... or Date
    date: Date,
    title: String,
    description: String,
    location: String,
    startTime: String,
    endTime: String
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Trip', tripSchema);
