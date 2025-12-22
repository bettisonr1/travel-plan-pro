const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Trip = require('./models/Trip');
const Item = require('./models/Item');
const User = require('./models/User');

// Load env vars
dotenv.config();

const users = [
  {
    firstname: 'John',
    lastname: 'Doe',
    email: 'john@example.com',
    password: 'password123',
  },
  {
    firstname: 'Jane',
    lastname: 'Smith',
    email: 'jane@example.com',
    password: 'password123',
  },
];

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
  {
    destination: 'London, UK',
    startDate: new Date('2026-03-10'),
    endDate: new Date('2026-03-17'),
    description: 'Visiting the British Museum and enjoying afternoon tea.',
  },
  {
    destination: 'Rome, Italy',
    startDate: new Date('2026-06-20'),
    endDate: new Date('2026-06-30'),
    description: 'Exploring the Colosseum and Vatican City.',
  },
  {
    destination: 'Sydney, Australia',
    startDate: new Date('2026-12-15'),
    endDate: new Date('2026-12-28'),
    description: 'Summer Christmas by the beach and fireworks at the harbour.',
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
    await User.deleteMany();
    console.log('Cleared existing data.');

    // Insert users
    const createdUsers = await User.create(users);
    console.log('Inserted test users.');

    // Insert trips with user associations
    const tripsWithUsers = trips.map((trip, index) => ({
      ...trip,
      users: [createdUsers[index % createdUsers.length]._id],
    }));
    await Trip.insertMany(tripsWithUsers);
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

