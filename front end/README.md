# Mood Indigo - Hospi Portal

React-based authentication interface for the Mood Indigo Hospitality team portal.

## Features

- Clean, responsive team login interface
- Role-based authentication (Team Lead/Team Member)
- Username/password authentication with remember-me option
- Accessibility-focused design with proper ARIA labels
- Modern CSS with smooth animations optimized for festival branding
- Mobile-first responsive design

## Tech Stack

- React 19.2.0
- Vite for fast development and building
- Vanilla CSS with Mood Indigo theming
- ESLint for code quality

## Prerequisites

- Node.js 18+ 
- npm or yarn

## Development

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Build for Production

```bash
npm run build
```

Built files will be output to the `dist/` directory.

## Project Structure

```
src/
├── pages/          # Page components
│   └── Login.jsx   # Hospi team login page
├── css/            # Stylesheet files
│   └── Login.css   # Login page styles with MI branding
├── App.jsx         # Main app component
├── main.jsx        # Application entry point
└── index.css       # Global styles
```
