/**
 * Authentication Routes
 * Handles login with hardcoded credentials
 */

const express = require('express');
const router = express.Router();

// Hardcoded credentials - stored in backend
const CREDENTIALS = [
  { id: 1, username: 'nikhil', password: 'minikhil' },
  { id: 2, username: 'aditya', password: 'miaditya' },
  { id: 3, username: 'vishwajeet', password: 'mivishwajeet' }
];

/**
 * POST /api/auth/login
 * Authenticate user with hardcoded credentials
 */
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }

    // Check credentials
    const user = CREDENTIALS.find(
      cred => cred.username === username && cred.password === password
    );

    if (user) {
      // Successful login
      res.json({
        success: true,
        message: 'Login successful',
        data: {
          username: user.username
        }
      });
    } else {
      // Invalid credentials
      res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;
