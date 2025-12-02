import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import Barcode from 'react-barcode';
import '../css/AccommodationPass.css';
import { FaDownload, FaPrint } from 'react-icons/fa';

const AccommodationPass = () => {
  const [userImage, setUserImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const userName = localStorage.getItem('userName');
  const userEmail = localStorage.getItem('userEmail');
  const miNo = localStorage.getItem('miNo');

  // Redirect if not logged in
  if (!userName || !userEmail || !miNo) {
    navigate('/login');
    return null;
  }

  useEffect(() => {
    // Try to fetch the image directly via static path first
    const email = userEmail;
    console.log('📧 User email:', email);
    
    // Also try fetching via API
    fetchUserImage();
  }, []);

  const fetchUserImage = async () => {
    try {
      console.log('📧 Fetching image for email:', userEmail);
      
      const url = `/api/accommodation/get-image?email=${encodeURIComponent(userEmail)}`;
      console.log('🌐 Fetching from:', url);
      
      const response = await fetch(url);

      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        const blob = await response.blob();
        console.log('📦 Blob size:', blob.size, 'Type:', blob.type);
        const imageUrl = URL.createObjectURL(blob);
        console.log('✅ Image URL created:', imageUrl);
        setUserImage(imageUrl);
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to fetch image. Status:', response.status, 'Error:', errorText);
      }
      setLoading(false);
    } catch (err) {
      console.error('❌ Failed to load image:', err);
      setLoading(false);
    }
  };

  const qrData = JSON.stringify({
    name: userName,
    miNo: miNo,
    email: userEmail
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    try {
      const passCard = document.querySelector('.pass-card');
      if (!passCard) return;

      // Use html2canvas to capture the pass
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(passCard, {
        scale: 2,
        backgroundColor: null,
        logging: false,
        useCORS: true
      });

      // Convert to blob and download
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `MoodIndigo_2025_Pass_${miNo}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 'image/png');
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download pass. Please try printing instead.');
    }
  };

  if (loading) {
    return (
      <div className="pass-loading">
        <div className="spinner"></div>
        <p>Loading your accommodation pass...</p>
      </div>
    );
  }

  return (
    <div className="accommodation-pass-page">
      <div className="pass-actions no-print">
        <button className="action-btn print-btn" onClick={handlePrint}>
          <FaPrint className="btn-icon" />
          <span>Print Pass</span>
        </button>
        <button className="action-btn download-btn" onClick={handleDownload}>
          <FaDownload className="btn-icon" />
          <span>Download Pass</span>
        </button>
      </div>

      <div className="pass-container">
        <div className="pass-card front">
          <div className="pass-header">
            <div className="header-content">
              <h1 className="moodi-title">MOOD INDIGO</h1>
              <p className="festival-year">2025</p>
              <p className="pass-type">Accommodation Pass</p>
            </div>
          </div>

          <div className="pass-body">
            {/* Left Column - Photo and Info */}
            <div className="pass-left-col">
              <div className="pass-photo-section">
                {userImage ? (
                  <img src={userImage} alt="User" className="pass-photo" />
                ) : (
                  <div className="pass-photo-placeholder">
                    <span>📷</span>
                  </div>
                )}
              </div>

              <div className="pass-info">
                <div className="info-row">
                  <span className="info-label">Participant Name</span>
                  <span className="info-value">{userName}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">MI Number</span>
                  <span className="info-value highlight">{miNo}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Email Address</span>
                  <span className="info-value">{userEmail}</span>
                </div>
              </div>
            </div>

            {/* Right Column - QR and Barcode */}
            <div className="pass-right-col">
              <div className="pass-codes">
                <div className="qr-section">
                  <span className="code-label">QR Code</span>
                  <div className="qr-code-wrapper">
                    <QRCode 
                      value={qrData} 
                      size={180}
                      level="H"
                      style={{ height: "auto", maxWidth: "100%", width: "180px" }}
                    />
                  </div>
                </div>

                <div className="barcode-section">
                  <span className="code-label">Barcode</span>
                  <div className="barcode-wrapper">
                    <Barcode 
                      value={qrData}
                      format="CODE128"
                      width={5}
                      height={700}
                      displayValue={false}
                      background="transparent"
                      margin={0}
                    />
                  </div>
                  <div className="barcode-info">
                    <span className="barcode-mi">{miNo}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pass-footer">
            <p className="footer-text">Asia's Largest College Cultural Festival</p>
            <p className="footer-text"><span className="footer-highlight">Mood Indigo 2025</span> • IIT Bombay</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccommodationPass;
