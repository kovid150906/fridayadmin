import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ImageUpload from './pages/ImageUpload';
import AccommodationPass from './pages/AccommodationPass';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/upload" element={<ImageUpload />} />
        <Route path="/pass" element={<AccommodationPass />} />
      </Routes>
    </Router>
  );
}

export default App;
