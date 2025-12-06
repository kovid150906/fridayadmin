import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import '../../css/QRScanner.css';

/**
 * QR & Barcode Scanner Component
 * Supports both web camera (phone) and hardware QR/barcode scanners
 */
const QRScanner = ({ onScanSuccess, onScanError, isSyncing = false }) => {
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
  const hardwareScannerRef = useRef(''); // Buffer for hardware scanner

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

  // Load cameras
  useEffect(() => {
    const loadCameras = async () => {
      if (scanMode === 'camera' && !camerasLoaded) {
        return;
      }
    };
    loadCameras();
  }, [scanMode, camerasLoaded]);

  // Start camera scanning
  const startCameraScanning = async () => {
    if (!camerasLoaded) {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length) {
          setCameras(devices);
          const backCamera = devices.find(d => d.label.toLowerCase().includes('back')) || devices[0];
          setSelectedCamera(backCamera.id);
          setCamerasLoaded(true);
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

    try {
      const html5QrCode = new Html5Qrcode('qr-reader');
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.CODE_93,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.ITF,
            Html5QrcodeSupportedFormats.CODABAR
          ]
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

  // Process scanned QR/Barcode data
  const handleScanResult = (decodedText) => {
    console.log('Scanned Raw Data:', decodedText); 
    
    // 1. Try Parsing as JSON (for your QR codes)
    try {
      const data = JSON.parse(decodedText);
      if (data.name && data.miNo && data.email) {
        onScanSuccess?.(data);
        setLastScanTime(new Date().toLocaleTimeString());
        return;
      }
    } catch (e) {
      // Not JSON, continue to Step 2
    }

    // 2. Fallback: Treat as Raw ID (for simple Barcodes)
    if (decodedText.length > 3 && decodedText.length < 50) {
      console.log('Detected Raw Barcode/ID');
      const rawData = {
        name: "Unknown (Scanner)", 
        miNo: decodedText, 
        email: "manual@scan.com"
      };
      onScanSuccess?.(rawData);
      setLastScanTime(new Date().toLocaleTimeString());
    } else {
       console.error('Invalid data format:', decodedText);
       onScanError?.('Invalid Scan. Expected JSON or Valid ID.');
    }
  };

  // ==========================================
  //  FIXED HARDWARE SCANNING LOGIC START
  // ==========================================

  const startHardwareScanning = () => {
    setHardwareScanning(true);
    setScannerStatus('scanning');
    hardwareScannerRef.current = ''; 
    
    // ✅ CRITICAL FIX: BLUR THE BUTTON
    // This stops the scanner's "Enter" key from "clicking" the button again
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  const stopHardwareScanning = () => {
    setHardwareScanning(false);
    setScannerStatus('ready');
    hardwareScannerRef.current = '';
  };

  // THE KEYBOARD LISTENER
  useEffect(() => {
    // Only attach listener if hardware scanning is actually ON
    if (!hardwareScanning) return;

    const handleKeyDown = (e) => {
      // SAFETY: Don't intercept if user is typing in the manual input box
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      // 1. Handle Characters (Accumulate into buffer)
      if (e.key.length === 1) {
        hardwareScannerRef.current = (hardwareScannerRef.current || '') + e.key;
      }
      
      // 2. Handle Enter (Process the buffer)
      else if (e.key === 'Enter') {
        // ✅ CRITICAL FIX: Prevent "Enter" from clicking buttons or refreshing
        e.preventDefault(); 
        e.stopPropagation();

        if (hardwareScannerRef.current && hardwareScannerRef.current.trim().length > 0) {
          handleScanResult(hardwareScannerRef.current.trim());
          hardwareScannerRef.current = ''; // Clear buffer
        }
      }
    };

    // Use 'keydown' instead of 'keypress' for better compatibility
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup listener on unmount or when hardwareScanning turns off
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [hardwareScanning]);

  // ==========================================
  //  FIXED HARDWARE SCANNING LOGIC END
  // ==========================================

  // Handle manual input submit
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualInput.trim()) {
      handleScanResult(manualInput.trim());
      setManualInput('');
    }
  };

  // Global Cleanup on unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  // Stop scanning when syncing starts
  useEffect(() => {
    if (isSyncing) {
      if (isScanning) {
        stopCameraScanning();
      }
      if (hardwareScanning) {
        stopHardwareScanning();
      }
    }
  }, [isSyncing]);

  return (
    <div className="qr-scanner-container">
      <div className="scanner-header">
        <h3>Scan QR Code / Barcode</h3>
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
                {scannerStatus === 'scanning' && '📡 Scanning Active - Scan Now'}
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
              <p>⚠️ No hardware QR/Barcode scanner detected via USB/HID</p>
              <p className="info-text">
                Most QR/Barcode scanners work as keyboard devices and won't be detected here.<br/>
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
                    ? 'Scanning active. Point your scanner at a code now.'
                    : 'Click "Scan QR/Barcode" to start listening for input.'}
                </p>
              </div>
              
              <div className="scanner-controls">
                {!hardwareScanning ? (
                  <>
                    <button 
                      onClick={startHardwareScanning} 
                      className="scan-btn start"
                    >
                      Scan QR/Barcode
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
            <summary>Or paste QR/Barcode data manually</summary>
            <form onSubmit={handleManualSubmit} className="manual-input-form">
              <textarea
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder='Paste QR/Barcode data: {"name":"John Doe","miNo":"MI-xyz-1234","email":"john@example.com"}'
                className="manual-input"
                rows="4"
              />
              <button 
                type="submit" 
                className="scan-btn submit"
                disabled={!manualInput.trim()}
              >
                Process QR/Barcode Data
              </button>
            </form>
          </details>
        </div>
      )}

      <div className="qr-format-info">
        <strong>Expected QR Format:</strong>
        <code>
          {`{"name":"Full Name","miNo":"MI-xyz-1234","email":"email@example.com"}`}
        </code>
      </div>
    </div>
  );
};

export default QRScanner;