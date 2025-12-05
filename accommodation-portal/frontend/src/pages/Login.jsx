import { useState } from 'react';
import { auth, provider, signInWithPopup } from '../firebase';
import { useNavigate } from 'react-router-dom';
import EmailLogin from '../components/EmailLogin';
import '../css/Login.css';
import { FcGoogle } from 'react-icons/fc';
import { MdEmail } from 'react-icons/md';

const Login = () => {
  const [useEmailLogin, setUseEmailLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      // Clear existing localStorage before login
      localStorage.removeItem('jwtToken');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
      localStorage.removeItem('miNo');

      const popupPromise = signInWithPopup(auth, provider);

      const timeout = setTimeout(() => {
        setLoading(true);
        setLoadingMessage('Waiting for Google response...');
      }, 1000);

      const result = await popupPromise;
      clearTimeout(timeout);

      setLoading(true);
      setLoadingMessage('Getting your information...');
      const messages = ['Getting your information...', 'Verifying credentials...', 'Checking accommodation...'];
      let msgIndex = 0;
      const msgInterval = setInterval(() => {
        setLoadingMessage(messages[msgIndex % messages.length]);
        msgIndex++;
      }, 1000);

      const firebaseToken = await result.user.getIdToken();

      const verifyRes = await fetch('https://edith.moodi.org/api/miauth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: firebaseToken }),
        credentials: 'include',
      });

      const data = await verifyRes.json();

      if (!data.verified || !data.token) {
        clearInterval(msgInterval);
        setLoading(false);
        alert('Verification failed');
        return;
      }

      localStorage.setItem('jwtToken', data.token);
      localStorage.setItem('userEmail', data.email);

      // Check accommodation with our backend
      const accommodationRes = await fetch('/api/accommodation/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      });

      const accommodationData = await accommodationRes.json();

      clearInterval(msgInterval);
      setLoading(false);

      if (accommodationData.hasAccommodation) {
        // Store server-issued JWT (overwrites external token) so backend accepts authenticated requests
        if (accommodationData.token) {
          localStorage.setItem('jwtToken', accommodationData.token);
        }
        localStorage.setItem('userName', accommodationData.name);
        localStorage.setItem('miNo', accommodationData.miNo);
        
        // Check if image already uploaded
        if (accommodationData.imageUploaded) {
          navigate('/pass');
        } else {
          navigate('/upload');
        }
      } else {
        alert('No accommodation found for this email. Please contact support.');
        localStorage.clear();
      }
    } catch (err) {
      setLoading(false);
      if (err.code === 'auth/popup-closed-by-user') {
        alert('Sign-in cancelled.');
      } else {
        console.error('Login error:', err);
        alert('Login failed. Please try again.');
      }
    }
  };

  return (
    <div className='login-page'>
      <div className="login-container">
        <div className="login-header">
          <img src="/moodilogo.png" alt="Mood Indigo" className="moodi-logo" />
          <h2 className="login-subtitle">Accommodation Portal</h2>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p className="loading-message">{loadingMessage}</p>
          </div>
        ) : (
          <>
            <div className="login-buttons">
              <button 
                className={`login-btn google-btn ${!useEmailLogin ? 'active' : ''}`}
                onClick={() => setUseEmailLogin(false)}
              >
                <FcGoogle className="btn-icon" />
                <span>Google Login</span>
              </button>
              <button 
                className={`login-btn email-btn ${useEmailLogin ? 'active' : ''}`}
                onClick={() => setUseEmailLogin(true)}
              >
                <MdEmail className="btn-icon" />
                <span>Email Login</span>
              </button>
            </div>

            <div className="login-method">
              {!useEmailLogin ? (
                <button className="submit-btn" onClick={handleLogin}>
                  <span>Sign in with Google</span>
                </button>
              ) : (
                <EmailLogin />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
