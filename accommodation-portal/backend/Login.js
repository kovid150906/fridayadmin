import React, { useState } from 'react';
import { auth, provider, signInWithPopup } from '../../firebase';
import { useNavigate } from 'react-router-dom';
import EmailLogin from './EmailLogin';
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

      const popupPromise = signInWithPopup(auth, provider);

      const timeout = setTimeout(() => {
        setLoading(true);
        setLoadingMessage('Waiting for Google response...');
      }, 1000);

      const result = await popupPromise;
      clearTimeout(timeout);

      setLoading(true);
      setLoadingMessage('Getting your information...');
      const messages = ['Getting your information...', 'Verifying credentials...', 'Redirecting...'];
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
        navigate('/login');
        return;
      }

      localStorage.setItem('jwtToken', data.token);

      const checkRes = await fetch(
        `https://edith.moodi.org/api/users/check?email=${encodeURIComponent(data.email)}`,
        {
          headers: { Authorization: `Bearer ${data.token}` },
        }
      );

      const exists = await checkRes.json();

      clearInterval(msgInterval);
      setLoading(false);

      if (exists.userExists) {
        localStorage.setItem('userEmail', data.email);
        localStorage.setItem('userName', exists.name);
        navigate('/ccp');
      } else {
        navigate('/register', {
          state: {
            email: data.email,
            name: data.name,
          },
        });
      }
    } catch (err) {
      setLoading(false);
      if (err.code === 'auth/popup-closed-by-user') {
        alert('Sign-in cancelled.');
      } else {
        console.error('Login error:', err);
        alert('Login failed. Refresh and try again.');
      }
      navigate('/login');
    }
  };


  return (
    <div className='ccp-login-page'>
      <div className="ccp-login-container">
        <div className="ccp-login-text">
          <h1>Login Into Your Account</h1>
          <h3>Welcome! Select a method to login</h3>
        </div>

        {loading ? (
          <>
            <p>{loadingMessage}</p>
            <div className="spinner" />
          </>
        ) : !useEmailLogin ? (
          <div className="ccp-login-button-container">
            <button onClick={handleLogin}>
              <FcGoogle style={{ marginRight: 8 }} />
              Sign in with Google
            </button>
            <p>or</p>
            <button onClick={() => setUseEmailLogin(true)}>
              <MdEmail style={{ marginRight: 8 }} />
              Login with Email OTP
            </button>
          </div>
        ) : (
          <div className="ccp-login-button-container">
            <EmailLogin />
            <p>or</p>
            <button
              onClick={() => {
                setUseEmailLogin(false);
                handleLogin();
              }}
            >
              <FcGoogle style={{ marginRight: 8 }} />
              Sign in with Google
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
