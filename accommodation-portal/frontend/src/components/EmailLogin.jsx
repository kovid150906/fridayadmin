import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/Login.css';
import ReCAPTCHA from 'react-google-recaptcha';

const RECAPTCHA_SITE_KEY = '6Le7Q84rAAAAAOTGayF1e_-9mViDrmuPiNTbHE9E';

const EmailLogin = () => {
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const sendOtp = async () => {
    setError('');
    if (!email) {
      setError('Please enter your email');
      return;
    }
    if (!captchaToken) {
      setError('Please complete the CAPTCHA');
      return;
    }

    setLoading(true);
    setLoadingMessage('Generating OTP...');

    const messages = ['Generating OTP...', 'Preparing your email...', 'Sending OTP to your inbox...'];
    let msgIndex = 0;
    const msgInterval = setInterval(() => {
      setLoadingMessage(messages[msgIndex % messages.length]);
      msgIndex++;
    }, 1500);

    try {
      localStorage.removeItem('jwtToken');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
      localStorage.removeItem('miNo');

      const res = await fetch('https://edith.moodi.org/api/miauth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, captchaToken }),
      });

      clearInterval(msgInterval);
      setLoading(false);

      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
        setTimer(60);
        alert('OTP sent to your email');
        setCaptchaToken('');
      } else {
        setError(data.error || 'Failed to send OTP');
        setCaptchaToken('');
      }
    } catch (err) {
      clearInterval(msgInterval);
      setLoading(false);
      setError('Network error. Try again.');
      setCaptchaToken('');
    }
  };

  const verifyOtp = async () => {
    setError('');
    if (!otp) {
      setError('Please enter the OTP');
      return;
    }

    setLoading(true);
    setLoadingMessage('Verifying OTP...');

    try {
      const res = await fetch('https://edith.moodi.org/api/miauth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (res.ok && data.verified && data.token) {
        localStorage.setItem('jwtToken', data.token);
        localStorage.setItem('userEmail', email);

        // Check accommodation with our backend
        const accommodationRes = await fetch('/api/accommodation/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        const accommodationData = await accommodationRes.json();

        setLoading(false);

        if (accommodationData.hasAccommodation) {
          localStorage.setItem('userName', accommodationData.name);
          localStorage.setItem('miNo', accommodationData.miNo);
          
          if (accommodationData.imageUploaded) {
            navigate('/pass');
          } else {
            navigate('/upload');
          }
        } else {
          setError('No accommodation found for this email.');
          localStorage.clear();
        }
      } else {
        setLoading(false);
        setError(data.error || 'Invalid OTP');
      }
    } catch (err) {
      setLoading(false);
      setError('Verification failed. Try again.');
    }
  };

  return (
    <div className="email-login">
      {!otpSent && !loading ? (
        <div className="input-group">
          <label>Email Address</label>
          <input
            type="email"
            className="email-input"
            placeholder="Enter your registered email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />

          <div className="recaptcha-container">
            <ReCAPTCHA
              sitekey={RECAPTCHA_SITE_KEY}
              onChange={token => setCaptchaToken(token)}
              onExpired={() => setCaptchaToken('')}
            />
          </div>

          <button 
            className="send-otp-btn" 
            onClick={sendOtp} 
            disabled={!captchaToken || !email}
          >
            Send OTP
          </button>
        </div>
      ) : loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-message">{loadingMessage}</p>
        </div>
      ) : (
        <div className="otp-section">
          <div className="success-message">
            OTP sent to <strong>{email}</strong>
          </div>
          {timer > 0 && (
            <div className="otp-timer">
              Resend OTP in {timer} seconds
            </div>
          )}
          <div className="input-group">
            <label>Enter OTP</label>
            <input
              type="text"
              className="otp-input"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              maxLength={6}
            />
          </div>
          <button 
            className="verify-otp-btn" 
            onClick={verifyOtp}
            disabled={!otp || loading}
          >
            Verify OTP
          </button>
          <button
            className="send-otp-btn"
            onClick={sendOtp}
            disabled={timer > 0}
            style={{ marginTop: '10px' }}
          >
            {timer > 0 ? `Resend OTP (${timer}s)` : 'Resend OTP'}
          </button>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default EmailLogin;
