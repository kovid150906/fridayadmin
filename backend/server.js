const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Import route modules
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Mood Indigo Hospitality & PR Portal API is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Mood Indigo Hospitality & PR Portal API running on port ${PORT}`);
  console.log(`📍 API endpoints available at http://localhost:${PORT}/api`);
  console.log(`🏗️  Hospi Team - The Backbone of Moodi | Accommodations | Passes | Security`);
  console.log(`\n📋 Available Routes:`);
  console.log(`  - POST /api/auth/login`);
  console.log(`  - GET  /api/health`);
  console.log(`  - GET  /api/dashboard/data`);
  console.log(`  - GET  /api/dashboard/hostels`);
  console.log(`  - POST /api/dashboard/upload`);
  console.log(`  - DEL  /api/dashboard/data`);
  console.log(`  - DEL  /api/dashboard/data/:id`);
});

module.exports = app;
