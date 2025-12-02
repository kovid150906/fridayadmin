const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'accommodation.db');
const db = new sqlite3.Database(dbPath);

// Initialize database schema
const initDatabase = () => {
  db.serialize(() => {
    // Create accommodation table
    db.run(`
      CREATE TABLE IF NOT EXISTS accommodation (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        mi_no TEXT NOT NULL,
        image_path TEXT,
        image_uploaded INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create index on email for faster lookups
    db.run(`CREATE INDEX IF NOT EXISTS idx_email ON accommodation(email)`);

    console.log('✅ Database initialized successfully');
  });
};

// Insert or update accommodation data
const upsertAccommodation = (email, name, miNo, callback) => {
  const sql = `
    INSERT INTO accommodation (email, name, mi_no) 
    VALUES (?, ?, ?)
    ON CONFLICT(email) 
    DO UPDATE SET name = ?, mi_no = ?, updated_at = CURRENT_TIMESTAMP
  `;
  
  db.run(sql, [email, name, miNo, name, miNo], function(err) {
    if (callback) callback(err, this);
  });
};

// Get accommodation by email
const getAccommodationByEmail = (email, callback) => {
  const sql = `SELECT * FROM accommodation WHERE LOWER(email) = LOWER(?)`;
  db.get(sql, [email], callback);
};

// Update image upload status
const updateImageUpload = (email, imagePath, callback) => {
  const sql = `
    UPDATE accommodation 
    SET image_path = ?, image_uploaded = 1, updated_at = CURRENT_TIMESTAMP 
    WHERE LOWER(email) = LOWER(?)
  `;
  
  db.run(sql, [imagePath, email], function(err) {
    if (callback) callback(err, this);
  });
};

// Get all accommodations
const getAllAccommodations = (callback) => {
  const sql = `SELECT * FROM accommodation ORDER BY created_at DESC`;
  db.all(sql, [], callback);
};

// Bulk insert accommodations (for CSV import)
const bulkInsertAccommodations = (dataArray, callback) => {
  const sql = `
    INSERT OR REPLACE INTO accommodation (email, name, mi_no) 
    VALUES (?, ?, ?)
  `;
  
  const stmt = db.prepare(sql);
  
  db.serialize(() => {
    dataArray.forEach(data => {
      stmt.run(data.email, data.name, data.miNo);
    });
    
    stmt.finalize((err) => {
      if (callback) callback(err);
    });
  });
};

// Delete accommodation by email
const deleteAccommodation = (email, callback) => {
  const sql = `DELETE FROM accommodation WHERE LOWER(email) = LOWER(?)`;
  db.run(sql, [email], function(err) {
    if (callback) callback(err, this);
  });
};

module.exports = {
  db,
  initDatabase,
  upsertAccommodation,
  getAccommodationByEmail,
  updateImageUpload,
  getAllAccommodations,
  bulkInsertAccommodations,
  deleteAccommodation
};
