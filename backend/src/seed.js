const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Trip = require('./models/Trip');
const Item = require('./models/Item');

// Load env vars
dotenv.config();

const trips = [
  {
    destination: 'Paris, France',
    startDate: new Date('2024-05-01'),
    endDate: new Date('2024-05-10'),
    description: 'A romantic trip to the City of Light, visiting the Eiffel Tower and Louvre.',
  },
  {
    destination: 'Tokyo, Japan',
    startDate: new Date('2024-10-15'),
    endDate: new Date('2024-10-25'),
    description: 'Exploring the neon streets of Shinjuku and ancient temples in Kyoto.',
  },
  {
    destination: 'New York City, USA',
    startDate: new Date('2025-01-05'),
    endDate: new Date('2025-01-12'),
    description: 'Broadway shows, Central Park walks, and plenty of pizza.',
  },
];

const items = [
  {
    name: 'Passport',
    description: 'Essential for international travel. Keep it safe!',
  },
  {
    name: 'Camera',
    description: 'To capture all the beautiful memories.',
  },
  {
    name: 'Comfortable Walking Shoes',
    description: 'Very important for long days of sightseeing.',
  },
];

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await Trip.deleteMany();
    await Item.deleteMany();
    console.log('Cleared existing data.');

    // Insert trips
    await Trip.insertMany(trips);
    console.log('Inserted test trips.');

    // Insert items
    await Item.insertMany(items);
    console.log('Inserted test items.');

    console.log('Seeding completed successfully!');
    process.exit();
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();

