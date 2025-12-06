const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { initDatabase } = require('./config/database');

const app = express();

// ==========================================
// ✅ UPDATED CORS CONFIGURATION
// ==========================================
app.use(cors({
  origin: [
    process.env.FRONTEND_URL,      // From .env file
    'http://localhost:5173',       // Vite Localhost
    'http://localhost:5174',       // Vite Alternative Port
    'http://127.0.0.1:5173',       // Vite IP (Critical Fix)
    'http://127.0.0.1:5174'        // Vite IP Alternative
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Increase payload limit for ID Card images/data
app.use(express.json({ limit: '10mb' }));

// Import route modules
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const allocationRoutes = require('./routes/allocation');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/allocation', allocationRoutes);

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
  console.error('Server Error:', error); // Added console log for debugging
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

const PORT = process.env.PORT || 3001;

// Initialize database and start server
initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`\n==================================================`);
      console.log(`🚀 Mood Indigo Hospitality & PR Portal API running on port ${PORT}`);
      console.log(`📍 API endpoints available at http://localhost:${PORT}/api`);
      console.log(`🏗️  Hospi Team - The Backbone of Moodi`);
      console.log(`==================================================\n`);
      
      console.log(`📋 Available Routes:`);
      console.log(`  - POST /api/auth/login`);
      console.log(`  - GET  /api/health`);
      console.log(`  - GET  /api/dashboard/data`);
      console.log(`  - GET  /api/dashboard/hostels`);
      console.log(`  - POST /api/dashboard/upload`);
      console.log(`  - POST /api/allocation/save`);
      console.log(`  - GET  /api/allocation/list`);
      console.log(`  - GET  /api/allocation/stats`);
    });
  })
  .catch(err => {
    console.error('❌ Failed to initialize database:', err);
    console.error('Server not started. Please check database configuration.');
    process.exit(1);
  });

module.exports = app;