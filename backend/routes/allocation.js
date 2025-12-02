/**
 * Allocation Routes
 * Handles room allocation saving to SQLite
 */

const express = require('express');
const router = express.Router();
const { db } = require('../config/database');

/**
 * POST /api/allocation/save
 * Save allocations to database
 */
router.post('/save', async (req, res) => {
  const { allocations } = req.body;

  if (!allocations || !Array.isArray(allocations) || allocations.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Invalid allocations data'
    });
  }

  try {
    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO allocations (name, mi_no, email, hostel, room_no, room_password, allocated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((allocations) => {
      for (const alloc of allocations) {
        insertStmt.run(
          alloc.name,
          alloc.miNo,
          alloc.email,
          alloc.hostel,
          alloc.roomNo,
          alloc.roomPassword || null,
          alloc.timestamp || new Date().toISOString()
        );
      }
    });

    insertMany(allocations);

    res.json({
      success: true,
      message: `Successfully saved ${allocations.length} allocations`,
      count: allocations.length
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to save allocations to database'
    });
  }
});

/**
 * GET /api/allocation/list
 * Get all allocations from database
 */
router.get('/list', async (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM allocations ORDER BY allocated_at DESC');
    const rows = stmt.all();

    res.json({
      success: true,
      allocations: rows,
      count: rows.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch allocations'
    });
  }
});

/**
 * GET /api/allocation/by-room/:hostel/:roomNo
 * Get allocations for a specific room
 */
router.get('/by-room/:hostel/:roomNo', async (req, res) => {
  const { hostel, roomNo } = req.params;

  try {
    const stmt = db.prepare(
      'SELECT * FROM allocations WHERE hostel = ? AND room_no = ? ORDER BY allocated_at DESC'
    );
    const rows = stmt.all(hostel, roomNo);

    res.json({
      success: true,
      allocations: rows,
      count: rows.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch room allocations'
    });
  }
});

/**
 * GET /api/allocation/stats
 * Get allocation statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const totalStmt = db.prepare('SELECT COUNT(*) as total FROM allocations');
    const totalResult = totalStmt.get();
    
    const roomsStmt = db.prepare(
      'SELECT hostel, room_no, COUNT(*) as count FROM allocations GROUP BY hostel, room_no ORDER BY hostel, room_no'
    );
    const roomsResult = roomsStmt.all();

    res.json({
      success: true,
      stats: {
        totalAllocations: totalResult.total,
        roomsUsed: roomsResult.length,
        rooms: roomsResult
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

module.exports = router;
