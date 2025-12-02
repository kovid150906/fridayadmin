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
  const [captchaToken, setCaptchaToken] = useState(''); // <-- ADD THIS LINE
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

      const res = await fetch('https://edith.moodi.org/api/miauth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, captchaToken }), // <-- SEND CAPTCHA TOKEN TO BACKEND
      });

      clearInterval(msgInterval);
      setLoading(false);

      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
        setTimer(60);
        alert('OTP sent to your email');
        setCaptchaToken(''); // <-- RESET CAPTCHA SO USER HAS TO SOLVE AGAIN FOR NEXT OTP
      } else {
        setError(data.error || 'Failed to send OTP');
        setCaptchaToken(''); // <-- RESET CAPTCHA ON ERROR
      }
    } catch (err) {
      clearInterval(msgInterval);
      setLoading(false);
      setError('Network error. Try again.');
      setCaptchaToken(''); // <-- RESET CAPTCHA ON ERROR
    }
  };

  const verifyOtp = async () => {
    setError('');
    if (!otp) {
      setError('Please enter the OTP');
      return;
    }

    try {
      const res = await fetch('https://edith.moodi.org/api/miauth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (res.ok && data.verified && data.token) {
        localStorage.setItem('jwtToken', data.token);

        const checkRes = await fetch(`https://edith.moodi.org/api/users/check?email=${encodeURIComponent(email)}`, {
          headers: {
            Authorization: `Bearer ${data.token}`,
          }
        });

        const exists = await checkRes.json();

        if (exists.userExists) {
          localStorage.setItem('userEmail', email);
          localStorage.setItem('userName', exists.name);

          navigate('/ccp', {
            state: {
              email,
              name: exists.name,
              mi_id: exists.mi_id,
              referralCode: exists.referralCode,
              points: exists.points
            }
          });
        } else {
          navigate('/register', {
            state: {
              email,
              name: data.name || ''
            }
          });
        }
      } else {
        setError(data.error || 'Invalid OTP');
      }
    } catch (err) {
      setError('Verification failed. Try again.');
    }
  };

  return (
    <div className="ccp-email-login-container">
      <h2>Email Login</h2>

      {!otpSent && !loading ? (
        <>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />

          {/* reCAPTCHA widget right before Send OTP */}
          <div style={{ margin: '1rem 0' }}>
            <ReCAPTCHA
              sitekey={RECAPTCHA_SITE_KEY}
              onChange={token => setCaptchaToken(token)}
              onExpired={() => setCaptchaToken('')}
            />
          </div>

          <button onClick={sendOtp} disabled={!captchaToken}>
            Send OTP
          </button>
        </>
      ) : loading ? (
        <div>
          <p>{loadingMessage}</p>
          <div className="spinner" />
        </div>
      ) : (
        <>
          <p>OTP sent to <strong>{email}</strong></p>
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={e => setOtp(e.target.value)}
          />
          <button onClick={verifyOtp} >
            Verify OTP
          </button>
          <button
            onClick={sendOtp}
            disabled={timer > 0}
          >
            {timer > 0 ? `Resend OTP in ${timer}s` : 'Resend OTP'}
          </button>
        </>
      )}

      {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}
    </div>
  );
};

export default EmailLogin;
