/**
 * Authentication Routes
 * Handles login with hardcoded credentials and JWT tokens
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// JWT Secret - In production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'friday_hospi_pr_secret_key_2025';

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
      // Generate JWT token
      const token = jwt.sign(
        { 
          id: user.id, 
          username: user.username 
        },
        JWT_SECRET,
        { expiresIn: '7d' } // Token expires in 7 days
      );

      // Successful login
      res.json({
        success: true,
        message: 'Login successful',
        data: {
          username: user.username,
          token: token
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
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/auth/verify
 * Verify JWT token
 */
router.post('/verify', (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    res.json({
      success: true,
      data: {
        username: decoded.username
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
});

module.exports = router;
