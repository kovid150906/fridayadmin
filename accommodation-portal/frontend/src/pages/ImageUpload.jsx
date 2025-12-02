import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/ImageUpload.css';
import { FaCamera, FaUpload, FaCheckCircle } from 'react-icons/fa';

const ImageUpload = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [showCamera, setShowCamera] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  const userName = localStorage.getItem('userName');
  const userEmail = localStorage.getItem('userEmail');
  const token = localStorage.getItem('jwtToken');

  // Redirect if not logged in
  if (!userName || !userEmail) {
    navigate('/login');
    return null;
  }

  // Check if image already uploaded on component mount
  useEffect(() => {
    const checkUploadStatus = async () => {
      try {
        const response = await fetch(`/api/accommodation/check?email=${encodeURIComponent(userEmail)}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.status === 401 || response.status === 403) {
          // Token is invalid or expired
          localStorage.clear();
          navigate('/login');
          return;
        }
        
        if (response.ok) {
          const data = await response.json();
          if (data.imageUploaded) {
            // Image already uploaded, redirect to pass page
            navigate('/pass');
            return;
          }
        }
      } catch (err) {
        console.error('Error checking upload status:', err);
      } finally {
        setCheckingStatus(false);
      }
    };

    checkUploadStatus();
  }, [navigate, token, userEmail]);

  // Show loading while checking status
  if (checkingStatus) {
    return (
      <div className="image-upload-page">
        <div className="upload-container">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Checking your upload status...</p>
          </div>
        </div>
      </div>
    );
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError('');

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (1MB = 1048576 bytes)
    if (file.size > 1048576) {
      setError('Image size must be less than 1MB');
      return;
    }

    setSelectedImage(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleCameraCapture = async () => {
    // Try to open webcam on desktop
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      setShowCamera(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 100);
    } catch (err) {
      console.error('Camera access denied:', err);
      // Fallback to file input with capture
      cameraInputRef.current.click();
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video && canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });
          
          // Validate file size
          if (blob.size > 1048576) {
            setError('Image size must be less than 1MB. Try capturing again.');
            return;
          }
          
          setSelectedImage(file);
          const reader = new FileReader();
          reader.onloadend = () => {
            setImagePreview(reader.result);
            closeCamera();
          };
          reader.readAsDataURL(blob);
        }
      }, 'image/jpeg', 0.8);
    }
  };

  const closeCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setShowCamera(false);
  };

  const handleFileUpload = () => {
    fileInputRef.current.click();
  };

  const handleUpload = async () => {
    if (!selectedImage) {
      setError('Please select an image first');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', selectedImage);
      formData.append('email', userEmail);

      const token = localStorage.getItem('jwtToken');
      
      const response = await fetch('/api/accommodation/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.status === 401 || response.status === 403) {
        setUploading(false);
        setError('Session expired. Please login again.');
        setTimeout(() => {
          localStorage.clear();
          navigate('/login');
        }, 2000);
        return;
      }

      const data = await response.json();

      if (response.ok && data.success) {
        // Success - navigate to pass page
        setTimeout(() => {
          navigate('/pass');
        }, 1500);
      } else {
        setUploading(false);
        setError(data.error || 'Failed to upload image');
      }
    } catch (err) {
      setUploading(false);
      setError('Upload failed. Please try again.');
      console.error('Upload error:', err);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  return (
    <div className="image-upload-page">
      <div className="upload-container">
        <div className="upload-header">
          <div className="moodi-logo">🎭</div>
          <h1>Upload Your Photo</h1>
          <p className="user-greeting">Welcome, <strong>{userName}</strong>!</p>
          <p className="upload-instruction">Please upload a clear photo for your accommodation pass</p>
        </div>

        <div className="upload-content">
          {showCamera ? (
            <div className="camera-view">
              <video ref={videoRef} autoPlay playsInline className="camera-video"></video>
              <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
              <div className="camera-controls">
                <button className="capture-photo-btn" onClick={capturePhoto}>
                  <FaCamera className="btn-icon" />
                  <span>Capture Photo</span>
                </button>
                <button className="close-camera-btn" onClick={closeCamera}>
                  Close Camera
                </button>
              </div>
            </div>
          ) : !imagePreview ? (
            <div className="upload-area">
              <div className="upload-icon">📸</div>
              <p className="upload-text">Click below to capture or upload your photo</p>
              <p className="upload-hint">Maximum file size: 1MB</p>
              
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="user"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              
              <div className="upload-buttons">
                <button className="capture-btn" onClick={handleCameraCapture}>
                  <FaCamera className="btn-icon" />
                  <span>Take Photo</span>
                </button>
                
                <button className="upload-btn" onClick={handleFileUpload}>
                  <FaUpload className="btn-icon" />
                  <span>Choose from Device</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="preview-area">
              <div className="image-preview-container">
                <img src={imagePreview} alt="Preview" className="image-preview" />
                {uploading && (
                  <div className="upload-overlay">
                    <div className="spinner"></div>
                    <p>Uploading your photo...</p>
                  </div>
                )}
              </div>
              
              {!uploading && (
                <div className="preview-actions">
                  <button className="submit-btn" onClick={handleUpload}>
                    <FaCheckCircle className="btn-icon" />
                    <span>Submit Photo</span>
                  </button>
                  <button className="reset-btn" onClick={handleReset}>
                    Retake Photo
                  </button>
                </div>
              )}
            </div>
          )}

          {error && <div className="error-message">{error}</div>}
        </div>

        <div className="upload-footer">
          <p className="guideline-title">Photo Guidelines:</p>
          <ul className="guidelines">
            <li>✓ Clear, well-lit face photo</li>
            <li>✓ Look directly at the camera</li>
            <li>✓ File size under 1MB</li>
            <li>✓ JPEG, PNG formats supported</li>
          </ul>
        </div>
      </div>

      <div className="background-decoration">
        <div className="decoration-circle circle-1"></div>
        <div className="decoration-circle circle-2"></div>
      </div>
    </div>
  );
};

export default ImageUpload;
