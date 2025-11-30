import { useState } from 'react';
import '../css/Login.css';

// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

/**
 * Login page component - Backend authentication
 */
const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Handle login with backend API
   */
  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      setStatusMessage('Please enter username and password');
      return;
    }

    setIsLoading(true);
    setStatusMessage('Authenticating...');

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (data.success) {
        setStatusMessage(`Welcome to Mood Indigo, ${username}!`);
        setTimeout(() => {
          const userInfo = { username: data.data.username };
          onLogin(userInfo);
        }, 800);
      } else {
        setStatusMessage(data.error || 'Invalid credentials');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      setStatusMessage('Connection error. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Brand section */}
      <section className="brand-section">
        <div className="brand-content">
          <p className="brand-label">Mood Indigo Portal</p>
          <h1 className="brand-title">
            Hospi & PR<span className="accent">.</span>
          </h1>
          <p className="brand-description">
            The backbone of Mood Indigo. Hospitality & PR team manages 
            accommodations, passes, security, and all essential operations 
            that make the festival possible.
          </p>
        </div>
      </section>

      {/* Login form section */}
      <main className="login-section">
        <div className="login-card">
          <header className="login-header">
            <h2>Hospi & PR Access</h2>
            <p>Enter your Mood Indigo team credentials</p>
          </header>

          <form className="login-form" onSubmit={handleLogin}>
            {/* Username field */}
            <div className="form-group">
              <label htmlFor="username" className="form-label">
                Username
              </label>
              <input
                id="username"
                type="text"
                className="form-input"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            {/* Password field */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className={`submit-button ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Access Portal'}
            </button>
          </form>

          {/* Status messages */}
          {statusMessage && (
            <div className={`status-message ${isLoading ? 'loading' : ''}`}>
              {statusMessage}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Login;