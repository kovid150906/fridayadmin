# Mood Indigo - Hospi Portal

Official Hospitality team portal for Mood Indigo, Asia's largest college cultural festival. Secure authentication and team management platform for guest coordination and festival operations.

## Project Structure

- `front end/` – React-based team interface with authentication
- `backend/` – Express.js API server with JWT authentication for team access

## Quick Start

### Backend Setup
1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment configuration:
```bash
cp .env.example .env
```

4. Start the backend server:
```bash
npm run dev
```

Backend will run on `http://localhost:3000`

### Frontend Setup
1. Navigate to frontend directory:
```bash
cd "front end"
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

## Hospi Team Access

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Team Lead |
| john_doe | password123 | Team Member |
| jane_smith | friday2024 | Team Member |

## Production Deployment

Build the frontend for production:

```bash
cd "front end"
npm run build
```

The optimized files will be generated in the `front end/dist/` directory.

## Development Roadmap

- [x] Authentication UI design and implementation
- [x] Responsive design with accessibility features
- [ ] Backend API development
- [ ] User session management
- [ ] Workspace dashboard
- [ ] Project tracking features

## Contributing

Please follow the existing code style and include appropriate comments for new features.
