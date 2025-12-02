/**
 * Dashboard Routes
 * Handles CSV upload with validation and data management
 */

const express = require('express');
const router = express.Router();

// In-memory storage for CSV data (replace with database in production)
let hostelData = [];

// Required columns for CSV validation
// 'room password' is now required (password may be same across rows, uniqueness is by hostel+room)
const REQUIRED_COLUMNS = ['hostel name', 'available room no.', 'room capacity', 'room password'];

/**
 * Validate CSV columns
 */
const validateColumns = (headers) => {
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
  const missingColumns = [];
  
  REQUIRED_COLUMNS.forEach(col => {
    if (!normalizedHeaders.includes(col)) {
      missingColumns.push(col);
    }
  });
  
  return {
    isValid: missingColumns.length === 0,
    missingColumns
  };
};

/**
 * POST /api/dashboard/upload
 * Handle CSV file upload with validation
 */
router.post('/upload', (req, res) => {
  try {
    const { csvData } = req.body;

    if (!csvData || !Array.isArray(csvData) || csvData.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid CSV data format or empty file'
      });
    }

    // Extract headers from first row
    const headers = Object.keys(csvData[0]).filter(key => key !== 'id');
    
    // Validate required columns
    const validation = validateColumns(headers);
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Missing required columns',
        missingColumns: validation.missingColumns,
        requiredColumns: REQUIRED_COLUMNS
      });
    }

      // Prepare new records (normalize keys). 'room password' is optional — preserved if present.
      const newRecords = csvData.map((row) => ({
        'hostel name': row['hostel name'] || row['Hostel Name'] || '',
        'available room no.': row['available room no.'] || row['Available Room No.'] || '',
        'room capacity': row['room capacity'] || row['Room Capacity'] || '',
        'room password': row['room password'] || row['Room Password'] || ''
      }));

      // Combine and deduplicate: keep one entry per (hostel name + available room no.)
      // Build a map keyed by normalized hostel + room to ensure uniqueness
      const normalize = (s) => (s || '').toString().trim().toLowerCase();

      const combinedMap = {};

      // Start with existing data (older records)
      hostelData.forEach(r => {
        const key = `${normalize(r['hostel name'])}||${normalize(r['available room no.'])}`;
        combinedMap[key] = {
          'hostel name': r['hostel name'],
          'available room no.': r['available room no.'],
          'room capacity': r['room capacity'],
          'room password': r['room password'] || ''
        };
      });

      // New records override existing entries with the same hostel+room
      newRecords.forEach(r => {
        const key = `${normalize(r['hostel name'])}||${normalize(r['available room no.'])}`;
        combinedMap[key] = {
          'hostel name': r['hostel name'],
          'available room no.': r['available room no.'],
          'room capacity': r['room capacity'],
          'room password': r['room password'] || ''
        };
      });

      // Rebuild hostelData from map and assign sequential ids
      const finalRecords = Object.values(combinedMap).map((r, idx) => ({
        id: idx + 1,
        'hostel name': r['hostel name'],
        'available room no.': r['available room no.'],
        'room capacity': r['room capacity'],
        'room password': r['room password'] || ''
      }));

      hostelData = finalRecords;

      res.json({
        success: true,
        message: `Successfully uploaded ${newRecords.length} records, total unique: ${hostelData.length}`,
        data: {
          recordCount: hostelData.length,
          records: hostelData
        }
      });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to upload CSV data'
    });
  }
});

/**
 * GET /api/dashboard/data
 * Retrieve all hostel data with optional filtering
 */
router.get('/data', (req, res) => {
  try {
    const { hostel } = req.query;
    
    let filteredData = hostelData;
    
    // Filter by hostel if specified
    if (hostel && hostel !== 'all') {
      filteredData = hostelData.filter(row => row['hostel name'] === hostel);
    }
    
    res.json({
      success: true,
      data: filteredData,
      recordCount: filteredData.length,
      message: 'Data retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch data'
    });
  }
});

/**
 * GET /api/dashboard/hostels
 * Get unique hostel names with room counts
 */
router.get('/hostels', (req, res) => {
  try {
    // Get unique hostel names
    const hostelMap = {};
    
    hostelData.forEach(row => {
      const hostelName = row['hostel name'];
      if (hostelName) {
        if (!hostelMap[hostelName]) {
          hostelMap[hostelName] = 0;
        }
        hostelMap[hostelName]++;
      }
    });
    
    // Convert to array format
    const hostels = Object.keys(hostelMap).sort().map(name => ({
      name,
      roomCount: hostelMap[name]
    }));
    
    res.json({
      success: true,
      hostels,
      totalHostels: hostels.length,
      totalRooms: hostelData.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch hostel list'
    });
  }
});

module.exports = router;
