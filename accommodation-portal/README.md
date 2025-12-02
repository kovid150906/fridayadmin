# Mood Indigo 2025 - Accommodation Portal

A complete accommodation management system for Mood Indigo attendees with Google/Email authentication, image upload, and digital pass generation.

## 🎭 Features

- **Dual Authentication**: Login with Google or Email (OTP)
- **Accommodation Verification**: Check if user has accommodation assigned
- **Image Upload**: Capture photo via camera or upload from device (max 1MB)
- **Digital Pass**: Generate pass with QR code and barcode
- **Responsive Design**: Mobile-friendly interface for attendees
- **JWT Security**: 7-day token-based authentication

## 📁 Project Structure

```
accommodation-portal/
├── backend/                    # Express API server
│   ├── server.js              # Main server file
│   ├── package.json           # Backend dependencies
│   ├── .env                   # Environment variables
│   └── uploads/               # User images (auto-created)
├── frontend/                  # React application
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx             # Login page
│   │   │   ├── ImageUpload.jsx       # Photo upload page
│   │   │   └── AccommodationPass.jsx # Digital pass display
│   │   ├── components/
│   │   │   └── EmailLogin.jsx        # Email OTP component
│   │   ├── css/
│   │   │   ├── Login.css
│   │   │   ├── ImageUpload.css
│   │   │   └── AccommodationPass.css
│   │   ├── firebase.js        # Firebase config
│   │   └── App.jsx            # Main app with routing
│   ├── package.json           # Frontend dependencies
│   └── vite.config.js         # Vite configuration
└── README.md                  # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd accommodation-portal/backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment (`.env` file already created):
```env
PORT=5001
JWT_SECRET=moodi-accommodation-secret-2025-change-this-in-production
```

4. Start the server:
```bash
# Development mode with auto-reload
npm run dev

# OR production mode
npm start
```

Server will run on `http://localhost:5001`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd accommodation-portal/frontend
```

2. Dependencies are already installed (firebase, react-router-dom, react-qr-code, react-barcode, etc.)

3. Start the development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

## 🔐 Authentication Flow

1. **Login Page** (`/login`)
   - User chooses Google or Email login
   - Google: Firebase authentication popup
   - Email: OTP sent via edith.moodi.org API

2. **Accommodation Check**
   - Backend verifies email against accommodation data
   - If found: Generate JWT token and proceed
   - If not found: Show error message

3. **Image Upload** (`/upload`)
   - User captures photo or uploads from device
   - Max file size: 1MB (enforced both frontend & backend)
   - Supported formats: JPG, JPEG, PNG

4. **Digital Pass** (`/pass`)
   - Display user image, name, MI number, email
   - Generate QR code with user data
   - Generate barcode with MI number
   - Print/download functionality

## 📝 Adding Accommodation Data

The system now uses **SQLite database** for persistent storage.

### Option 1: Edit CSV and Import

1. Edit `backend/accommodations.csv`:
```csv
email,name,miNo
student1@example.com,Alice Johnson,MI-ali-0201
student2@example.com,Bob Smith,MI-bob-0202
```

2. Import to database:
```bash
cd backend
node import-csv.js
```

### Option 2: Use API Endpoint

```bash
curl -X POST http://localhost:5001/api/accommodation/add \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "name": "Full Name", "miNo": "MI-xyz-1234"}'
```

### Option 3: Use Database Browser

1. Download [DB Browser for SQLite](https://sqlitebrowser.org/)
2. Open `backend/accommodation.db`
3. Edit the `accommodation` table directly

See `backend/DATABASE_SETUP.md` for detailed instructions.

## 🎨 Design Guidelines

- **Brand Colors**: Purple gradient (#667eea to #764ba2)
- **Loading States**: Animated spinners with messages
- **Responsive**: Mobile-first design approach
- **Accessibility**: High contrast, clear labels
- **User Experience**: Smooth animations and transitions

## 🔧 API Endpoints

### POST /api/accommodation/check
Verify user accommodation and generate JWT token.

### POST /api/accommodation/upload-image
Upload user photo (JWT required, max 1MB).

### GET /api/accommodation/get-image
Retrieve user's uploaded photo (JWT required).

### GET /api/accommodation/profile
Get user profile data (JWT required).

### GET /api/health
Health check endpoint.

See `backend/README.md` for detailed API documentation.

## 🔒 Security Features

- JWT authentication with 7-day expiration
- File size validation (1MB limit)
- File type validation (images only)
- CORS enabled for local development
- Environment variable protection
- Token verification middleware

## 📱 Usage

### For Attendees

1. Visit the portal URL
2. Login with your Google account or email
3. System checks your accommodation status
4. Upload your photo (clear face photo recommended)
5. View and download your digital pass
6. Present QR/barcode for accommodation check-in

### For Administrators

1. Add accommodation data to backend
2. Monitor server logs for issues
3. Manage uploaded images in `backend/uploads/`
4. Update environment variables for production

## 🚧 Development Notes

### Testing Accounts

Default test accounts in backend:
- `test@moodi.org` → Test User (MI-abc-0001)
- `student@iitb.ac.in` → John Doe (MI-xyz-0002)

### Firebase Configuration

Firebase config is set up for Mood Indigo 2025 project. Update `frontend/src/firebase.js` if using different project.

### External API Integration

Email OTP uses `edith.moodi.org/api/miauth` endpoints:
- `/send` - Send OTP
- `/verify` - Verify OTP

## 🐛 Troubleshooting

### Backend not starting
- Check if port 5001 is available
- Verify `.env` file exists
- Run `npm install` to ensure dependencies

### Frontend proxy errors
- Ensure backend is running on port 5001
- Check `vite.config.js` proxy settings
- Restart frontend dev server

### Image upload fails
- Check file size (must be < 1MB)
- Verify file format (JPG/JPEG/PNG only)
- Ensure `uploads/` directory exists in backend

### QR/Barcode not showing
- Check browser console for errors
- Verify `react-qr-code` and `react-barcode` are installed
- Ensure user data exists in localStorage

## 📦 Dependencies

### Backend
- express - Web framework
- cors - Cross-origin resource sharing
- multer - File upload handling
- jsonwebtoken - JWT authentication
- dotenv - Environment variables

### Frontend
- react - UI framework
- react-router-dom - Routing
- firebase - Google authentication
- react-qr-code - QR code generation
- react-barcode - Barcode generation
- react-google-recaptcha - reCAPTCHA
- react-icons - Icon library
- vite - Build tool

## 🎯 Future Enhancements

- Database integration (MongoDB/PostgreSQL)
- CSV import for accommodation data
- Admin dashboard for management
- Email notifications
- SMS integration
- PDF download for passes
- Multi-language support
- Analytics dashboard

## 📄 License

Built for Mood Indigo 2025 - IIT Bombay

## 🤝 Support

For issues or questions:
- Email: accommodation@moodi.org
- GitHub Issues: [Create an issue]

---

**Made with ❤️ for Asia's Largest College Cultural Festival**
