# 🚀 Quick Setup Guide - Accommodation Portal

Follow these steps to get the accommodation portal running:

## Step 1: Backend Setup

1. Open a terminal and navigate to backend:
```bash
cd accommodation-portal/backend
```

2. Dependencies are already installed! Start the server:
```bash
npm run dev
```

You should see:
```
🎭 Accommodation API server running on port 5001
📁 Uploads directory: /path/to/uploads
```

**Keep this terminal open!**

## Step 2: Frontend Setup

1. Open a **NEW** terminal and navigate to frontend:
```bash
cd accommodation-portal/frontend
```

2. Dependencies are already installed! Start the dev server:
```bash
npm run dev
```

You should see:
```
VITE ready in XXX ms
➜  Local:   http://localhost:5173/
```

3. Open your browser to `http://localhost:5173`

## Step 3: Test the Portal

### Test Login:
Use one of these test accounts:
- **Email**: `test@moodi.org` → **Name**: Test User (MI-abc-0001)
- **Email**: `student@iitb.ac.in` → **Name**: John Doe (MI-xyz-0002)

### Login Flow:
1. Choose "Email Login"
2. Enter test email (e.g., `test@moodi.org`)
3. Complete reCAPTCHA
4. Click "Send OTP"
5. Enter any 6-digit OTP (the external API will validate)
6. If accommodation found → Proceed to upload page

**OR**

1. Choose "Google Login"
2. Sign in with your Google account
3. Backend checks if your Gmail is in accommodation data

### Upload Photo:
1. Click "Use Device Upload" or "Use Camera"
2. Select/capture a photo (max 1MB)
3. Preview will appear
4. Click "Upload Photo & Get Pass"
5. Redirects to digital pass page

### View Pass:
- Your photo, name, MI number, and email will display
- QR code and barcode will be generated
- Click "Print Pass" or "Download Pass"

## 📝 Adding Your Accommodation Data

Edit `backend/accommodationData.js`:

```javascript
const accommodationData = [
  {
    email: 'newuser@example.com',
    name: 'New User Name',
    miNo: 'MI-xyz-1234',
    imageUploaded: false,
    imagePath: null
  },
  // Add more entries...
];
```

Save the file and restart the backend server (Ctrl+C, then `npm run dev`).

## 🔧 Troubleshooting

### Backend won't start:
- Check if port 5001 is already in use
- Try `npm install` again in backend folder

### Frontend shows proxy error:
- Make sure backend is running on port 5001
- Restart frontend server

### Image upload fails:
- Check file is under 1MB
- Use JPG, JPEG, or PNG format only

### Can't login:
- Check your email is in `accommodationData.js`
- Backend must be running
- Check browser console for errors

## ✅ Success Checklist

- [ ] Backend running on port 5001
- [ ] Frontend running on port 5173
- [ ] Can access http://localhost:5173 in browser
- [ ] Test login works with test accounts
- [ ] Can upload image successfully
- [ ] Digital pass displays with QR/barcode

## 🎯 Next Steps

1. **Add Real Data**: Replace test data in `accommodationData.js` with actual attendee emails
2. **Firebase Setup**: If using different Firebase project, update `frontend/src/firebase.js`
3. **Production Deployment**: 
   - Change JWT_SECRET in backend/.env
   - Deploy backend to a server
   - Update frontend API URLs
   - Build frontend: `npm run build`

## 📞 Need Help?

- Check `README.md` for detailed documentation
- Check `backend/README.md` for API details
- Look at browser console for frontend errors
- Check terminal for backend errors

---

**Ready to go! Both servers should be running. Open http://localhost:5173 to start! 🎭**
