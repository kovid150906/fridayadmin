/**
 * SQLite Database Configuration
 * No installation required - database stored in file
 */

const Database = require('better-sqlite3');
const path = require('path');

// Create/open SQLite database file
const dbPath = path.join(__dirname, '../friday_hospi.db');
const db = new Database(dbPath);

console.log('✅ Connected to SQLite database at:', dbPath);

// Initialize database tables
const initDatabase = async () => {
  try {
    // Create allocations table
    db.exec(`
      CREATE TABLE IF NOT EXISTS allocations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        mi_no TEXT UNIQUE NOT NULL,
        email TEXT NOT NULL,
        hostel TEXT NOT NULL,
        room_no TEXT NOT NULL,
        room_password TEXT,
        allocated_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for faster queries
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_allocations_hostel_room 
      ON allocations(hostel, room_no)
    `);

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_allocations_mi_no 
      ON allocations(mi_no)
    `);

    console.log('✅ Database tables initialized successfully');
  } catch (err) {
    console.error('❌ Error initializing database:', err);
    throw err;
  }
};

// Export database instance and init function
module.exports = {
  db,
  initDatabase
};
