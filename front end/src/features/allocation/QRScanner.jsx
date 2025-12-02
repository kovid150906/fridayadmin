import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import './QRScanner.css';

/**
 * QR Scanner Component
 * Supports both web camera (phone) and hardware QR scanners
 * QR Code Expected Format: JSON string with { name, miNo, email }
 */
const QRScanner = ({ onScanSuccess, onScanError }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [scanMode, setScanMode] = useState('camera'); // 'camera' or 'hardware'
  const [scannerStatus, setScannerStatus] = useState('ready'); // 'checking', 'disconnected', 'ready', 'scanning'
  const [lastScanTime, setLastScanTime] = useState(null);
  const [hardwareScanning, setHardwareScanning] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [detectedDevices, setDetectedDevices] = useState([]);
  const [camerasLoaded, setCamerasLoaded] = useState(false);
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const hardwareScannerRef = useRef(null);

  // Detect hardware devices (centralized function)
  const detectHardwareDevices = async () => {
    let foundDevices = [];
    
    // Check HID devices
    if (navigator.hid) {
      try {
        const hidDevices = await navigator.hid.getDevices();
        if (hidDevices.length > 0) {
          foundDevices = hidDevices.map(d => ({
            type: 'HID',
            name: d.productName || 'HID Device',
            id: d.productId
          }));
        }
      } catch (err) {
        console.log('HID not available');
      }
    }
    
    // Check USB devices
    if (navigator.usb && foundDevices.length === 0) {
      try {
        const usbDevices = await navigator.usb.getDevices();
        if (usbDevices.length > 0) {
          foundDevices = usbDevices.map(d => ({
            type: 'USB',
            name: d.productName || 'USB Device',
            id: d.productId
          }));
        }
      } catch (err) {
        console.log('USB not available');
      }
    }
    
    // Check serial devices
    if ('serial' in navigator && foundDevices.length === 0) {
      try {
        const serialDevices = await navigator.serial.getPorts();
        if (serialDevices.length > 0) {
          foundDevices = serialDevices.map((d, i) => ({
            type: 'Serial',
            name: `Serial Device ${i + 1}`,
            id: i
          }));
        }
      } catch (err) {
        console.log('Serial not available');
      }
    }
    
    return foundDevices;
  };

  // Detect hardware scanner devices on mode change
  useEffect(() => {
    const detectHardwareScanner = async () => {
      if (scanMode !== 'hardware') return;
      
      setScannerStatus('checking');
      setDetectedDevices([]);
      
      try {
        const foundDevices = await detectHardwareDevices();
        
        if (foundDevices.length > 0) {
          setDetectedDevices(foundDevices);
          setScannerStatus('ready');
        } else {
          setScannerStatus('disconnected');
        }
      } catch (err) {
        console.log('Hardware detection error:', err);
        setScannerStatus('disconnected');
      }
    };

    detectHardwareScanner();
  }, [scanMode]);

  // Load cameras (only when user clicks Start Scanning)
  useEffect(() => {
    const loadCameras = async () => {
      // Only load cameras when explicitly needed (not on initial mount)
      if (scanMode === 'camera' && !camerasLoaded) {
        // Don't load until user clicks start scanning
        return;
      }
    };

    loadCameras();
  }, [scanMode, camerasLoaded]);

  // Start camera scanning
  const startCameraScanning = async () => {
    // Load cameras if not already loaded
    if (!camerasLoaded) {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length) {
          setCameras(devices);
          // Default to back camera (usually index 0 or find environment-facing)
          const backCamera = devices.find(d => d.label.toLowerCase().includes('back')) || devices[0];
          setSelectedCamera(backCamera.id);
          setCamerasLoaded(true);
          
          // Start scanning with the selected camera
          setTimeout(() => startCameraWithDevice(backCamera.id), 100);
          return;
        } else {
          onScanError?.('No cameras detected on this device');
          return;
        }
      } catch (err) {
        console.error('Camera access error:', err);
        onScanError?.('Camera access denied. Please allow camera permissions.');
        return;
      }
    }

    startCameraWithDevice(selectedCamera);
  };

  const startCameraWithDevice = async (cameraId) => {
    if (!cameraId) {
      onScanError?.('No camera selected. Please check camera permissions.');
      return;
    }

    if (!cameras || cameras.length === 0) {
      onScanError?.('No cameras available. Please connect a camera or check permissions.');
      return;
    }

    try {
      const html5QrCode = new Html5Qrcode('qr-reader');
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          handleScanResult(decodedText);
        },
        (errorMessage) => {
          // Ignore continuous scan errors
        }
      );

      setIsScanning(true);
    } catch (err) {
      console.error('Camera start error:', err);
      onScanError?.('Failed to start camera: ' + err.message);
      setIsScanning(false);
    }
  };

  // Stop camera scanning
  const stopCameraScanning = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current = null;
        setIsScanning(false);
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
    }
  };

  // Re-detect hardware scanners
  const refreshHardwareDetection = async () => {
    setScannerStatus('checking');
    setDetectedDevices([]);
    
    setTimeout(async () => {
      try {
        const foundDevices = await detectHardwareDevices();
        
        if (foundDevices.length > 0) {
          setDetectedDevices(foundDevices);
          setScannerStatus('ready');
        } else {
          setScannerStatus('disconnected');
        }
      } catch (err) {
        console.log('Hardware detection error:', err);
        setScannerStatus('disconnected');
      }
    }, 500);
  };

  // Process scanned QR data
  const handleScanResult = (decodedText) => {
    try {
      // Try parsing as JSON
      const data = JSON.parse(decodedText);
      
      if (data.name && data.miNo && data.email) {
        onScanSuccess?.(data);
        if (scanMode === 'camera') {
          stopCameraScanning(); // Auto-stop camera after successful scan
        } else {
          // For hardware scanner, just update status
          setScannerStatus('ready');
          setHardwareScanning(false);
          setLastScanTime(new Date().toLocaleTimeString());
        }
      } else {
        onScanError?.('Invalid QR format. Expected: name, miNo, email');
        if (scanMode === 'hardware') {
          setScannerStatus('ready');
          setHardwareScanning(false);
        }
      }
    } catch (err) {
      onScanError?.('QR code must contain JSON: {"name":"...","miNo":"...","email":"..."}');
      if (scanMode === 'hardware') {
        setScannerStatus('ready');
        setHardwareScanning(false);
      }
    }
  };

  // Start hardware scanner listening
  const startHardwareScanning = () => {
    setHardwareScanning(true);
    setScannerStatus('scanning');
    
    // Listen for keyboard input (hardware scanners act as keyboards)
    const handleKeyPress = (e) => {
      if (!hardwareScanning) return;
      
      // Hardware scanners typically send data followed by Enter
      if (e.key === 'Enter' && hardwareScannerRef.current) {
        const scannedData = hardwareScannerRef.current;
        if (scannedData.trim()) {
          handleScanResult(scannedData.trim());
          hardwareScannerRef.current = '';
        }
      } else if (e.key.length === 1) {
        // Accumulate characters
        hardwareScannerRef.current = (hardwareScannerRef.current || '') + e.key;
      }
    };

    document.addEventListener('keypress', handleKeyPress);
    
    // Store cleanup function
    window.__hardwareScannerCleanup = () => {
      document.removeEventListener('keypress', handleKeyPress);
    };
  };

  // Stop hardware scanner listening
  const stopHardwareScanning = () => {
    setHardwareScanning(false);
    setScannerStatus('ready');
    hardwareScannerRef.current = '';
    
    if (window.__hardwareScannerCleanup) {
      window.__hardwareScannerCleanup();
      window.__hardwareScannerCleanup = null;
    }
  };

  // Handle manual/hardware scanner input
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualInput.trim()) {
      handleScanResult(manualInput.trim());
      setManualInput('');
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
      if (window.__hardwareScannerCleanup) {
        window.__hardwareScannerCleanup();
      }
    };
  }, []);

  return (
    <div className="qr-scanner-container">
      <div className="scanner-header">
        <h3>Scan Visitor QR Code</h3>
        <div className="scan-mode-toggle">
          <button
            className={scanMode === 'camera' ? 'active' : ''}
            onClick={() => setScanMode('camera')}
          >
            📷 Camera
          </button>
          <button
            className={scanMode === 'hardware' ? 'active' : ''}
            onClick={() => setScanMode('hardware')}
          >
            🔧 Hardware Scanner
          </button>
        </div>
      </div>

      {scanMode === 'camera' ? (
        <div className="camera-scanner">
          {!camerasLoaded ? (
            <div className="camera-ready">
              <p>📷 Camera Mode</p>
              <p className="info-text">Click "Start Scanning" to activate your camera</p>
              
              <div id="qr-reader" className="qr-reader-box"></div>

              <div className="scanner-controls">
                <button onClick={startCameraScanning} className="scan-btn start">
                  Start Scanning
                </button>
              </div>
            </div>
          ) : (
            <>
              {cameras.length > 1 && (
                <select
                  value={selectedCamera}
                  onChange={(e) => setSelectedCamera(e.target.value)}
                  disabled={isScanning}
                  className="camera-select"
                >
                  {cameras.map(camera => (
                    <option key={camera.id} value={camera.id}>
                      {camera.label || `Camera ${camera.id}`}
                    </option>
                  ))}
                </select>
              )}

              {cameras.length === 1 && !isScanning && (
                <div className="single-camera-info">
                  <p>📷 Using: {cameras[0].label || 'Default Camera'}</p>
                </div>
              )}

              <div id="qr-reader" className="qr-reader-box"></div>

              <div className="scanner-controls">
                {!isScanning ? (
                  <button onClick={startCameraScanning} className="scan-btn start">
                    Start Scanning
                  </button>
                ) : (
                  <button onClick={stopCameraScanning} className="scan-btn stop">
                    Stop Scanning
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="hardware-scanner">
          {/* Scanner Status Indicator */}
          <div className={`scanner-status scanner-status-${scannerStatus}`}>
            <div className="status-indicator">
              <span className="status-dot"></span>
              <span className="status-text">
                {scannerStatus === 'checking' && '🔍 Detecting Scanner...'}
                {scannerStatus === 'disconnected' && '⚠️ No Scanner Connected'}
                {scannerStatus === 'ready' && `✅ Scanner Ready (${detectedDevices.length} device${detectedDevices.length > 1 ? 's' : ''} found)`}
                {scannerStatus === 'scanning' && '📡 Scanning QR Code...'}
              </span>
            </div>
            {lastScanTime && scannerStatus === 'ready' && (
              <span className="last-scan">Last scan: {lastScanTime}</span>
            )}
          </div>

          {/* Show detected devices */}
          {detectedDevices.length > 0 && (
            <div className="detected-devices">
              <p className="devices-title">🔌 Detected Devices:</p>
              <ul className="devices-list">
                {detectedDevices.map((device, idx) => (
                  <li key={idx}>
                    <span className="device-type">{device.type}</span>
                    <span className="device-name">{device.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {scannerStatus === 'disconnected' ? (
            <div className="no-scanner-message">
              <p>⚠️ No hardware QR scanner detected via USB/HID</p>
              <p className="info-text">
                Most QR scanners work as keyboard devices and won't be detected here.<br/>
                If you have a keyboard-type scanner, you can still use it!
              </p>
              <div className="button-group">
                <button 
                  onClick={refreshHardwareDetection} 
                  className="scan-btn refresh"
                >
                  🔄 Refresh Detection
                </button>
                <button 
                  onClick={() => setScannerStatus('ready')} 
                  className="scan-btn start"
                >
                  ✓ Use Keyboard Scanner Anyway
                </button>
              </div>
            </div>
          ) : scannerStatus === 'ready' || scannerStatus === 'scanning' ? (
            <>
              <div className="hardware-info">
                <p className="info-text">
                  {scannerStatus === 'scanning' 
                    ? 'Scanning active. Scan your QR code now or click Stop to cancel.'
                    : 'Click "Scan QR Code" to start scanning.'}
                </p>
              </div>
              
              <div className="scanner-controls">
                {!hardwareScanning ? (
                  <>
                    <button 
                      onClick={startHardwareScanning} 
                      className="scan-btn start"
                    >
                      Scan QR Code
                    </button>
                    <button 
                      onClick={refreshHardwareDetection} 
                      className="scan-btn refresh-small"
                    >
                      🔄 Refresh Detection
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={stopHardwareScanning} 
                    className="scan-btn stop"
                  >
                    Stop Scanning
                  </button>
                )}
              </div>
            </>
          ) : scannerStatus === 'checking' ? (
            <div className="checking-message">
              <p>⏳ Checking for connected devices...</p>
            </div>
          ) : null}

          {/* Manual input as fallback */}
          <details className="manual-input-section">
            <summary>Or paste QR data manually</summary>
            <form onSubmit={handleManualSubmit} className="manual-input-form">
              <textarea
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder='Paste QR data: {"name":"John Doe","miNo":"MIxyz1234","email":"john@example.com"}'
                className="manual-input"
                rows="4"
              />
              <button 
                type="submit" 
                className="scan-btn submit"
                disabled={!manualInput.trim()}
              >
                Process QR Data
              </button>
            </form>
          </details>
        </div>
      )}

      <div className="qr-format-info">
        <strong>Expected QR Format:</strong>
        <code>
          {`{"name":"Full Name","miNo":"MIxyz1234","email":"email@example.com"}`}
        </code>
      </div>
    </div>
  );
};

export default QRScanner;
