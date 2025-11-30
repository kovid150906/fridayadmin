# Friday Portal Backend

Express.js API server for the Friday Portal authentication system.

## Features

- User authentication with JWT tokens
- Password hashing with bcrypt
- Rate limiting for security
- CORS support for frontend integration
- Input validation and sanitization
- Protected route examples
- Mock user database (easily replaceable with real DB)

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Edit `.env` file with your configuration

4. Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## Test Users

The server comes with pre-configured test users:

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | admin |
| john_doe | password123 | user |
| jane_smith | friday2024 | user |

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify JWT token
- `POST /api/auth/logout` - User logout

### User Management
- `GET /api/user/profile` - Get user profile (protected)

### System
- `GET /api/health` - Health check

## API Usage Examples

### Login Request
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123",
    "rememberMe": true
  }'
```

### Protected Request
```bash
curl -X GET http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Security Features

- JWT token authentication
- Password hashing with bcrypt
- Rate limiting (5 login attempts per 15 minutes)
- Input validation
- CORS protection
- Error handling

## Integration with Frontend

The backend is configured to work with the React frontend running on `http://localhost:5173`. Update the `FRONTEND_URL` in your `.env` file if using a different port.

## Database Integration

Currently uses an in-memory mock database. To integrate with a real database:

1. Install your preferred database driver (e.g., `pg` for PostgreSQL, `mysql2` for MySQL)
2. Replace the `users` array with database queries
3. Update the user management functions
4. Add database connection configuration to `.env`

## Production Deployment

1. Set `NODE_ENV=production` in your environment
2. Update `JWT_SECRET` with a secure random string
3. Configure your production database
4. Update `FRONTEND_URL` to your production frontend URL
5. Consider using a process manager like PM2

## Development Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload
- `npm test` - Run tests (when implemented)
- `npm run test:watch` - Run tests in watch mode