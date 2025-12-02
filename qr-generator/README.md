# Mood Indigo QR Code Generator

A standalone QR code generator for the Mood Indigo Hospitality & PR Portal allocation system.

## Features

- ✅ Generate QR codes in the correct JSON format
- ✅ Validate MI Number format (MIxyz1234)
- ✅ Auto-formatting for MI Number input
- ✅ Download QR code as PNG image
- ✅ Print QR code directly
- ✅ Visual preview of JSON data
- ✅ Responsive design

## Usage

1. Open `index.html` in your browser
2. Fill in visitor details:
   - Full Name
   - MI Number (format: MIxyz1234)
   - Email Address
3. Click "Generate QR Code"
4. Download or print the QR code

## QR Code Format

The generated QR code contains JSON data in this format:

```json
{
  "name": "Full Name",
  "miNo": "MIxyz1234",
  "email": "email@example.com"
}
```

## MI Number Format

- Must start with "MI"
- Followed by 3 lowercase letters
- Followed by 4 digits
- Example: `MIxyz1234`, `MIabc5678`

## Files

- `index.html` - Main HTML structure
- `style.css` - Styling and responsive design
- `script.js` - QR generation and validation logic

## Dependencies

- QRCode.js (loaded via CDN)

## No Installation Required

This is a standalone HTML application. Just open `index.html` in any modern web browser.

## Testing with Allocation System

1. Generate a QR code using this tool
2. Display it on your screen
3. Use the camera scanner in the allocation system to scan it
4. The visitor details will be automatically filled in

## Browser Compatibility

- Chrome/Edge ✅
- Firefox ✅
- Safari ✅
- Opera ✅

---

Created for Mood Indigo Hospitality & PR Portal
