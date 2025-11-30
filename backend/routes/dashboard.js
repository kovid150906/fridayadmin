/**
 * Dashboard Routes
 * Handles CSV upload with validation and data management
 */

const express = require('express');
const router = express.Router();

// In-memory storage for CSV data (replace with database in production)
let hostelData = [];

// Required columns for CSV validation
const REQUIRED_COLUMNS = ['hostel name', 'available room no.', 'room capacity'];

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

      // Prepare new records (normalize keys)
      const newRecords = csvData.map((row) => ({
        'hostel name': row['hostel name'] || row['Hostel Name'] || '',
        'available room no.': row['available room no.'] || row['Available Room No.'] || '',
        'room capacity': row['room capacity'] || row['Room Capacity'] || ''
      }));

      // Assign unique IDs to new records, continuing from existing max id
      const existingMaxId = hostelData.length > 0 ? Math.max(...hostelData.map(r => r.id || 0)) : 0;
      let nextId = existingMaxId + 1;
      newRecords.forEach(r => { r.id = nextId++; });

      // Combine data (append new uploads)
      hostelData = hostelData.concat(newRecords);

      console.log(`✅ Uploaded ${newRecords.length} new hostel records, total: ${hostelData.length}`);

      res.json({
        success: true,
        message: `Successfully uploaded ${newRecords.length} records, total: ${hostelData.length}`,
        data: {
          recordCount: hostelData.length,
          records: hostelData
        }
      });
  } catch (error) {
    console.error('Error uploading CSV:', error);
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
    console.error('Error fetching dashboard data:', error);
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
    console.error('Error fetching hostels:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch hostel list'
    });
  }
});

/**
 * DELETE /api/dashboard/data/:id
 * Delete a specific record
 */
router.delete('/data/:id', (req, res) => {
  try {
    const { id } = req.params;
    const recordId = parseInt(id);

    const initialLength = hostelData.length;
    hostelData = hostelData.filter(record => record.id !== recordId);

    if (hostelData.length < initialLength) {
      console.log(`🗑️ Deleted record with id: ${id}`);
      res.json({
        success: true,
        message: 'Record deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Record not found'
      });
    }
  } catch (error) {
    console.error('Error deleting record:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete record'
    });
  }
});

/**
 * DELETE /api/dashboard/data
 * Clear all data
 */
router.delete('/data', (req, res) => {
  try {
    hostelData = [];
    console.log('🗑️ Cleared all hostel data');
    
    res.json({
      success: true,
      message: 'All data cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear data'
    });
  }
});

module.exports = router;
