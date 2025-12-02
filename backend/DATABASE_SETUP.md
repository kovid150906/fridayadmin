# Database Setup Instructions

## PostgreSQL Installation & Setup

### Option 1: Install PostgreSQL Locally (Recommended for Development)

#### Windows:
1. Download PostgreSQL from: https://www.postgresql.org/download/windows/
2. Run the installer and follow the setup wizard
3. Default settings are fine (port 5432, user: postgres)
4. Remember the password you set for the `postgres` user

#### macOS:
```bash
# Using Homebrew
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb friday_hospi
```

#### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database
sudo -u postgres createdb friday_hospi
```

### Option 2: Use Docker (Easiest)

```bash
# Pull and run PostgreSQL in Docker
docker run --name friday-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=friday_hospi \
  -p 5432:5432 \
  -d postgres:15

# Check if running
docker ps
```

### Option 3: Use Free Cloud PostgreSQL (No Installation)

- **Supabase**: https://supabase.com (Free tier available)
- **ElephantSQL**: https://www.elephantsql.com (Free tier)
- **Neon**: https://neon.tech (Free tier)

## Backend Setup

1. **Install PostgreSQL driver:**
```bash
cd backend
npm install pg dotenv
```

2. **Create `.env` file in `backend/` folder:**
```env
# Database Configuration
DB_USER=postgres
DB_HOST=localhost
DB_NAME=friday_hospi
DB_PASSWORD=postgres
DB_PORT=5432

# Server Configuration
PORT=3000
FRONTEND_URL=http://localhost:5173
```

3. **Update `server.js` to initialize database:**

Add these lines at the top after requires:
```javascript
const { initDatabase } = require('./config/database');
```

Add before `app.listen()`:
```javascript
// Initialize database on startup
initDatabase().catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
```

4. **Mount allocation routes in `server.js`:**
```javascript
const allocationRoutes = require('./routes/allocation');
app.use('/api/allocation', allocationRoutes);
```

## Frontend Setup

1. **Install required packages:**
```bash
cd "front end"
npm install html5-qrcode jspdf jspdf-autotable
```

2. **That's it!** The frontend components are ready to use.

## Testing the Database

After setup, test the connection:

```bash
# In backend folder
node -e "const db = require('./config/database'); db.initDatabase().then(() => console.log('DB OK')).catch(console.error)"
```

## Database Schema

The `allocations` table will be created automatically with:
- `id` (auto-increment primary key)
- `name` (person's full name)
- `mi_no` (MI number, unique)
- `email` (email address)
- `hostel` (hostel name)
- `room_no` (room number)
- `room_password` (room password)
- `allocated_at` (allocation timestamp)
- `created_at` (record creation timestamp)

## Quick Start Commands

```bash
# Start PostgreSQL (if using Docker)
docker start friday-postgres

# Start Backend
cd backend
npm start

# Start Frontend
cd "front end"
npm run dev
```

## Troubleshooting

**Connection refused?**
- Check if PostgreSQL is running: `docker ps` or `sudo systemctl status postgresql`
- Verify credentials in `.env` file

**Port 5432 already in use?**
- Change `DB_PORT` in `.env` to another port (e.g., 5433)
- Update Docker command: `-p 5433:5432`

**Permission denied?**
- Make sure the database user has proper permissions
- Try: `GRANT ALL PRIVILEGES ON DATABASE friday_hospi TO postgres;`
