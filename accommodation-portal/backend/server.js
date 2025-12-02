const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Import database functions
const { 
  initDatabase, 
  getAccommodationByEmail, 
  updateImageUpload,
  upsertAccommodation,
  bulkInsertAccommodations,
  getAllAccommodations
} = require('./database');

// Import accommodation data (for initial seed)
const accommodationData = require('./accommodationData');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
initDatabase();

// Seed database with initial data if needed
setTimeout(() => {
  accommodationData.forEach(user => {
    upsertAccommodation(user.email, user.name, user.miNo, (err) => {
      if (err) console.error('Error seeding data:', err);
    });
  });
  console.log('✅ Database seeded with initial accommodation data');
}, 500);

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'user-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 1 * 1024 * 1024 }, // 1MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
  }
});

// JWT secret (use environment variable in production)
const JWT_SECRET = process.env.JWT_SECRET || 'moodi-accommodation-secret-2025';

// Middleware to verify JWT token (accepts both local and external tokens)
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  // For now, trust the token from external API and extract email from request body
  // In production, you should verify the token with the external API
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    // If local token fails, assume it's from external API
    // Extract email from the request (it should be in the form data)
    const email = req.body?.email || req.query?.email;
    if (email) {
      req.user = { email };
      next();
    } else {
      return res.status(401).json({ error: 'Invalid token' });
    }
  }
};

// Routes

// Check accommodation data for a user (supports both POST body and GET query)
app.post('/api/accommodation/check', (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  getAccommodationByEmail(email, (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      return res.status(404).json({ 
        error: 'No accommodation found for this email',
        hasAccommodation: false 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { email: user.email, name: user.name, miNo: user.mi_no },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      hasAccommodation: true,
      name: user.name,
      email: user.email,
      miNo: user.mi_no,
      imageUploaded: user.image_uploaded === 1,
      token
    });
  });
});

// GET version for status checks
app.get('/api/accommodation/check', (req, res) => {
  const email = req.query.email;
  console.log('🔍 Checking accommodation for:', email);

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  getAccommodationByEmail(email, (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      return res.status(404).json({ 
        error: 'No accommodation found for this email',
        hasAccommodation: false 
      });
    }

    res.json({
      success: true,
      hasAccommodation: true,
      name: user.name,
      email: user.email,
      miNo: user.mi_no,
      imageUploaded: user.image_uploaded === 1
    });
  });
});

// Upload user image
app.post('/api/accommodation/upload-image', upload.single('image'), verifyToken, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Get email from form data or from verified token
    const userEmail = req.body.email || req.user.email;
    
    if (!userEmail) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Email is required' });
    }
    
    getAccommodationByEmail(userEmail, (err, user) => {
      if (err || !user) {
        // Delete uploaded file if user not found
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ error: 'User not found' });
      }

      // Delete old image if exists
      if (user.image_path && fs.existsSync(user.image_path)) {
        fs.unlinkSync(user.image_path);
      }

      // Update database with new image path
      updateImageUpload(userEmail, req.file.path, (err) => {
        if (err) {
          console.error('Database update error:', err);
          return res.status(500).json({ error: 'Failed to update database' });
        }

        res.json({
          success: true,
          message: 'Image uploaded successfully',
          imagePath: `/uploads/${req.file.filename}`
        });
      });
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Get user image (no token required, use email)
app.get('/api/accommodation/get-image', (req, res) => {
  try {
    const email = req.query.email;
    console.log('📸 Fetching image for:', email);
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    getAccommodationByEmail(email, (err, user) => {
      if (err || !user || !user.image_path) {
        console.error('❌ Image not found in DB:', err, 'User:', user?.email, 'Path:', user?.image_path);
        return res.status(404).json({ error: 'Image not found' });
      }

      console.log('✅ Found user record, image_path:', user.image_path);

      // Handle both relative and absolute paths
      let imagePath = user.image_path;
      if (!path.isAbsolute(imagePath)) {
        imagePath = path.join(__dirname, user.image_path);
      }
      
      console.log('🔍 Checking file at:', imagePath);
      
      if (!fs.existsSync(imagePath)) {
        console.error('❌ Image file not found at:', imagePath);
        return res.status(404).json({ error: 'Image file not found', path: imagePath });
      }

      console.log('✅ Sending file:', imagePath);
      res.sendFile(imagePath);
    });
  } catch (err) {
    console.error('❌ Get image error:', err);
    res.status(500).json({ error: 'Failed to retrieve image' });
  }
});

// Get user profile data
app.get('/api/accommodation/profile', verifyToken, (req, res) => {
  getAccommodationByEmail(req.user.email, (err, user) => {
    if (err || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        email: user.email,
        name: user.name,
        miNo: user.mi_no,
        imageUploaded: user.image_uploaded === 1
      }
    });
  });
});

// Get all accommodations (admin endpoint)
app.get('/api/accommodation/all', (req, res) => {
  getAllAccommodations((err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({
      success: true,
      count: rows.length,
      accommodations: rows.map(row => ({
        id: row.id,
        email: row.email,
        name: row.name,
        miNo: row.mi_no,
        imageUploaded: row.image_uploaded === 1,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }))
    });
  });
});

// Add single accommodation (admin endpoint)
app.post('/api/accommodation/add', (req, res) => {
  const { email, name, miNo } = req.body;

  if (!email || !name || !miNo) {
    return res.status(400).json({ error: 'Email, name, and MI number are required' });
  }

  upsertAccommodation(email, name, miNo, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to add accommodation' });
    }

    res.json({
      success: true,
      message: 'Accommodation added successfully',
      data: { email, name, miNo }
    });
  });
});

// Bulk add accommodations (admin endpoint for CSV import)
app.post('/api/accommodation/bulk-add', (req, res) => {
  const { accommodations } = req.body;

  if (!Array.isArray(accommodations) || accommodations.length === 0) {
    return res.status(400).json({ error: 'Accommodations array is required' });
  }

  bulkInsertAccommodations(accommodations, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to bulk insert accommodations' });
    }

    res.json({
      success: true,
      message: `${accommodations.length} accommodations added successfully`,
      count: accommodations.length
    });
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Accommodation API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`🎭 Accommodation API server running on port ${PORT}`);
  console.log(`📁 Uploads directory: ${uploadsDir}`);
});
