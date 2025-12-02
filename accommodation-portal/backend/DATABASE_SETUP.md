# SQLite Database Setup

The accommodation portal now uses **SQLite database** for persistent storage instead of in-memory arrays.

## 📊 Database Schema

### Table: `accommodation`

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PRIMARY KEY | Auto-increment ID |
| `email` | TEXT UNIQUE | User's email (unique constraint) |
| `name` | TEXT | User's full name |
| `mi_no` | TEXT | Mood Indigo number |
| `image_path` | TEXT | Path to uploaded image |
| `image_uploaded` | INTEGER | 0 = not uploaded, 1 = uploaded |
| `created_at` | DATETIME | Record creation timestamp |
| `updated_at` | DATETIME | Last update timestamp |

## 🚀 Getting Started

### 1. Database Auto-Creation

The database file `accommodation.db` is created automatically when you start the server:

```bash
cd backend
npm run dev
```

You'll see:
```
✅ Database initialized successfully
✅ Database seeded with initial accommodation data
```

### 2. Initial Data

The server automatically loads data from `accommodationData.js` on first run.

## 📝 Adding Accommodation Data

### Method 1: Using API Endpoints

#### Add Single Entry
```bash
curl -X POST http://localhost:5001/api/accommodation/add \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "name": "John Doe",
    "miNo": "MI-xyz-0100"
  }'
```

#### Bulk Add (CSV Import)
```bash
curl -X POST http://localhost:5001/api/accommodation/bulk-add \
  -H "Content-Type: application/json" \
  -d '{
    "accommodations": [
      {"email": "user1@example.com", "name": "User One", "miNo": "MI-usr-0101"},
      {"email": "user2@example.com", "name": "User Two", "miNo": "MI-usr-0102"}
    ]
  }'
```

#### View All Accommodations
```bash
curl http://localhost:5001/api/accommodation/all
```

### Method 2: Direct Database Editing

You can use any SQLite browser tool:
- **DB Browser for SQLite** (recommended) - https://sqlitebrowser.org/
- **SQLite Viewer** (VS Code extension)
- **Command line**: `sqlite3 accommodation.db`

### Method 3: Using Node.js Script

Create `import-csv.js` in backend folder:

```javascript
const fs = require('fs');
const { bulkInsertAccommodations, db } = require('./database');

// Read CSV file
const csvData = fs.readFileSync('accommodations.csv', 'utf8');
const lines = csvData.split('\n').slice(1); // Skip header

const accommodations = lines
  .filter(line => line.trim())
  .map(line => {
    const [email, name, miNo] = line.split(',');
    return { email: email.trim(), name: name.trim(), miNo: miNo.trim() };
  });

bulkInsertAccommodations(accommodations, (err) => {
  if (err) {
    console.error('❌ Import failed:', err);
  } else {
    console.log(`✅ Imported ${accommodations.length} accommodations`);
  }
  db.close();
});
```

Run: `node import-csv.js`

### CSV Format Example

Create `accommodations.csv`:
```csv
email,name,miNo
student1@example.com,Alice Johnson,MI-ali-0201
student2@example.com,Bob Smith,MI-bob-0202
student3@example.com,Charlie Brown,MI-cha-0203
```

## 🔍 Query Examples

### SQLite Command Line

```bash
# Open database
sqlite3 accommodation.db

# View all data
SELECT * FROM accommodation;

# Search by email
SELECT * FROM accommodation WHERE email LIKE '%@iitb.ac.in';

# Check uploaded images
SELECT name, email, image_uploaded FROM accommodation WHERE image_uploaded = 1;

# Count total accommodations
SELECT COUNT(*) FROM accommodation;

# Clear all data (be careful!)
DELETE FROM accommodation;
```

## 📦 Database File Location

**Path:** `backend/accommodation.db`

- ✅ **Persistent** - Data survives server restarts
- ✅ **Single file** - Easy to backup/restore
- ✅ **Portable** - Can copy to production server

## 🔄 Migrating to MySQL/PostgreSQL

The code is ready for easy migration. Replace in `database.js`:

```javascript
// Instead of:
const sqlite3 = require('sqlite3');

// Use:
const mysql = require('mysql2');
// OR
const { Client } = require('pg');
```

Update the connection and queries to match your database syntax.

## 🛠️ API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/accommodation/check` | Check if email has accommodation |
| GET | `/api/accommodation/check?email=...` | Get accommodation status |
| POST | `/api/accommodation/upload-image` | Upload user photo |
| GET | `/api/accommodation/get-image?email=...` | Get user photo |
| GET | `/api/accommodation/profile` | Get user profile |
| GET | `/api/accommodation/all` | Get all accommodations (admin) |
| POST | `/api/accommodation/add` | Add single accommodation (admin) |
| POST | `/api/accommodation/bulk-add` | Bulk import (admin) |

## 🔒 Backup & Restore

### Backup
```bash
cp backend/accommodation.db backend/accommodation.db.backup
```

### Restore
```bash
cp backend/accommodation.db.backup backend/accommodation.db
```

## 📊 Database Statistics

View stats:
```bash
curl http://localhost:5001/api/accommodation/all | jq '.count'
```

## 🆕 Adding New Users

Just add to the database via any method above. No server restart needed!

The next time they login, they'll be able to access the accommodation portal.
