const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const itemRoutes = require('./routes/itemRoutes');

// Load env vars
dotenv.config();

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors());

// Routes
app.use('/api/items', itemRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

module.exports = app;
