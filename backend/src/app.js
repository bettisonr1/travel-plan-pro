const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const itemRoutes = require('./routes/itemRoutes');
const tripRoutes = require('./routes/tripRoutes');
const userRoutes = require('./routes/userRoutes');
const aiRoutes = require('./routes/aiRoutes');

// Load env vars
dotenv.config();

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Routes
app.use('/api/items', itemRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ai', aiRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

module.exports = app;
