# 🏨 Room Allocation System - Complete Setup Guide

## Overview
The allocation system allows coordinators to:
1. **Scan QR codes** (phone camera or hardware scanner)
2. **Allocate rooms** to visitors with capacity tracking
3. **Store temporarily** in localStorage
4. **Print PDF** reports of allocations
5. **Sync to PostgreSQL** database on print

## Quick Start

### 1. Install Dependencies

**Backend:**
```bash
cd backend
npm install pg dotenv
```

**Frontend:**
```bash
cd "front end"
npm install html5-qrcode jspdf jspdf-autotable
```

### 2. Setup PostgreSQL Database

**Option A: Docker (Easiest)**
```bash
docker run --name friday-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=friday_hospi \
  -p 5432:5432 \
  -d postgres:15
```

**Option B: Local Installation**
See `backend/DATABASE_SETUP.md` for detailed instructions.

### 3. Configure Environment

Create `backend/.env`:
```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=friday_hospi
DB_PASSWORD=postgres
DB_PORT=5432
PORT=3000
FRONTEND_URL=http://localhost:5173
```

### 4. Start Servers

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd "front end"
npm run dev
```

### 5. Access the Application

Open browser: `http://localhost:5173`
- Login with credentials (nikhil, aditya, or vishwajeet)
- Navigate to "Allocation" page

## How It Works

### QR Code Format
The system expects QR codes with this JSON format:
```json
{
  "name": "John Doe",
  "miNo": "MI12345",
  "email": "john@example.com"
}
```

### Workflow

1. **Scan QR Code**
   - Switch between Camera mode (phone) or Hardware Scanner mode
   - Person details will appear after successful scan

2. **Select Room**
   - Choose hostel from dropdown
   - Select available room (system tracks capacity)
   - Rooms show: Room No., Capacity (X/Y available), Password

3. **Allocate**
   - Click "Allocate Room" button
   - Allocation is saved to localStorage
   - Person cannot be allocated twice (duplicate check)

4. **Print & Sync**
   - View current allocations summary
   - **Print Preview**: Generate PDF without saving to DB
   - **Print & Save**: Generate PDF + sync to database + clear localStorage

### Features

✅ **QR Scanner**
- Web camera support (works on phones)
- Hardware scanner support (easy to swap)
- Manual paste option for testing

✅ **Room Management**
- Real-time capacity tracking
- Duplicate person detection
- Full room warning

✅ **Local Storage**
- Temporary allocation storage
- Survives page refresh
- Only cleared after successful sync

✅ **PDF Generation**
- Grouped by room
- Shows room password
- Professional format with timestamp

✅ **Database Sync**
- PostgreSQL storage
- Atomic transactions
- Error handling with rollback

## Testing Without Hardware Scanner

### Generate Test QR Code

Use any online QR code generator (e.g., https://www.qr-code-generator.com/):

**Text to encode:**
```json
{"name":"Test User","miNo":"MI001","email":"test@example.com"}
```

### Use Manual Input

1. Go to Allocation page
2. Click "🔧 Hardware Scanner" button
3. Paste the JSON in the textarea
4. Click "Process QR Data"

## API Endpoints

### Allocation Routes

```
POST   /api/allocation/save
       Body: { allocations: [...] }
       → Saves allocations to database

GET    /api/allocation/list
       → Gets all allocations

GET    /api/allocation/by-room/:hostel/:roomNo
       → Gets allocations for specific room

GET    /api/allocation/stats
       → Gets allocation statistics
```

## Database Schema

```sql
CREATE TABLE allocations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  mi_no VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  hostel VARCHAR(255) NOT NULL,
  room_no VARCHAR(50) NOT NULL,
  room_password VARCHAR(255),
  allocated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## File Structure

```
front end/src/
  features/
    allocation/
      QRScanner.jsx          # QR scanning component
      QRScanner.css
      AllocationForm.jsx     # Room selection & allocation
      AllocationForm.css
      AllocationStorage.js   # localStorage manager
      PrintAllocation.jsx    # PDF generation & sync
      PrintAllocation.css

backend/
  config/
    database.js             # PostgreSQL connection & init
  routes/
    allocation.js           # Allocation API endpoints
  DATABASE_SETUP.md         # Database setup guide
```

## Troubleshooting

**Camera not working?**
- Grant camera permissions in browser
- Use HTTPS or localhost only (camera requires secure context)
- Try "Hardware Scanner" mode as fallback

**Database connection error?**
- Check if PostgreSQL is running: `docker ps` or `pg_isready`
- Verify credentials in `.env` file
- Check port 5432 is not blocked

**Print not working?**
- Check browser console for errors
- Verify backend is running and accessible
- Ensure allocations exist in localStorage

**Allocation not saved?**
- Check room capacity (may be full)
- Verify person not already allocated
- Check for duplicate MI numbers

## Production Deployment

1. **Update API URL** in frontend:
   ```javascript
   // In frontend components
   const API_BASE_URL = 'https://your-domain.com/api';
   ```

2. **Secure Database**:
   - Use strong passwords
   - Enable SSL connections
   - Set proper firewall rules

3. **Environment Variables**:
   - Never commit `.env` file
   - Set environment variables in hosting platform

4. **Hardware Scanner Integration**:
   - Most USB/Bluetooth QR scanners work as keyboard input
   - They will automatically fill the textarea in "Hardware Scanner" mode
   - No code changes needed!

## Need Help?

- Check `backend/DATABASE_SETUP.md` for database issues
- See browser console for frontend errors
- Check backend logs for API errors
- Verify all dependencies are installed with `npm list`
