import { useState, useRef, useEffect } from 'react';
import '../css/Dashboard.css';
import RoomAllocationView from '../components/RoomAllocationView';

// API Configuration
const API_BASE_URL = 'http://localhost:3001/api';

const Dashboard = () => {
  const [csvData, setCsvData] = useState([]);
  const [hostelList, setHostelList] = useState([]);
  const [selectedHostel, setSelectedHostel] = useState('all');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  // routing handled by react-router now

  // Get user info from localStorage
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const { username } = userInfo;

  // Load existing data on mount
  useEffect(() => {
    fetchData();
    fetchHostelList();
  }, []);

  // Fetch data when hostel filter changes
  useEffect(() => {
    fetchData();
  }, [selectedHostel]);

  /**
   * Fetch data from backend
   */
  const fetchData = async () => {
    try {
      const url = selectedHostel === 'all' 
        ? `${API_BASE_URL}/dashboard/data`
        : `${API_BASE_URL}/dashboard/data?hostel=${encodeURIComponent(selectedHostel)}`;
        
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success && result.data.length > 0) {
        setCsvData(result.data);
      } else {
        setCsvData([]);
      }
    } catch (error) {
      // Silently handle fetch errors
    }
  };

  /**
   * Fetch hostel list from backend
   */
  const fetchHostelList = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/hostels`);
      const result = await response.json();
      
      if (result.success) {
        setHostelList(result.hostels);
      }
    } catch (error) {
      // Silently handle fetch errors
    }
  };

  /**
   * Handle CSV file selection and parsing (multiple files supported)
   */
  const handleFileSelect = (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    processFiles(Array.from(files));
  };

  /**
   * Handle drag events
   */
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files || []).filter(f => f);
    if (files.length > 0) {
      processFiles(files);
    }
  };

  /**
   * Process multiple CSV files, combine and upload
   */
  const processFiles = async (files) => {
    const allRows = [];
    let headers = null;

    setIsUploading(true);
    setUploadStatus('Processing CSV files...');

    try {
      for (const file of files) {
        if (!file.name.toLowerCase().endsWith('.csv')) {
          setUploadStatus(`Please select only CSV files. '${file.name}' skipped.`);
          continue;
        }

        const text = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = (e) => reject(e);
          reader.readAsText(file);
        });

        const rows = text.split('\n').map(r => r.trim()).filter(r => r.length > 0);
        if (rows.length === 0) continue;

        const fileHeaders = rows[0].split(',').map(h => h.trim());
        if (!headers) headers = fileHeaders;

        // If headers differ, still accept but map by header names
        const parsed = rows.slice(1).map((row) => {
          const values = row.split(',').map(v => v.trim());
          const obj = {};
          fileHeaders.forEach((h, i) => { obj[h] = values[i] || ''; });
          return obj;
        });

        allRows.push(...parsed);
      }

      if (allRows.length === 0) {
        setUploadStatus('No valid CSV rows found in selected files');
        setIsUploading(false);
        return;
      }

      // Upload combined rows to backend
      await uploadToBackend(allRows);
    } catch (error) {
      setUploadStatus('Error processing files');
      setIsUploading(false);
    }
  };

  /**
   * Upload CSV data to backend
   */
  const uploadToBackend = async (data) => {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ csvData: data })
      });

      const result = await response.json();

      if (result.success) {
        setCsvData(result.data.records);
        setSelectedHostel('all');
        setUploadStatus(`✅ Successfully uploaded ${result.data.recordCount} records`);
        setIsUploading(false);
        
        // Refresh hostel list
        await fetchHostelList();
      } else {
        // Show validation error
        if (result.missingColumns) {
          setUploadStatus(`❌ Missing required columns: ${result.missingColumns.join(', ')}`);
        } else {
          setUploadStatus(`❌ ${result.error}`);
        }
        setIsUploading(false);
      }
    } catch (error) {
      setUploadStatus('❌ Failed to upload data to server');
      setIsUploading(false);
    }
  };

  /**
   * Handle logout
   */
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    window.location.reload();
  };

  // Clear functionality removed — data is managed via uploads and deduplication on the backend

  return (
    <div className="dashboard-container">

      {/* Main Content */}
      <main className="dashboard-main">
          <div className="dashboard-grid">
            {/* CSV Upload Section */}
            <section className="upload-section">
              <div className="section-header">
                <h2>📋 Data Upload</h2>
                <p>Upload CSV with: Hostel Name, Available Room No., Room Capacity</p>
              </div>
              <div className="upload-area">
                <div 
                  className={`upload-box ${isDragging ? 'dragging' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="upload-icon">📁</div>
                  <h3>Select or Drop CSV File</h3>
                  <p>Required columns:<br/>
                    • Hostel Name<br/>
                    • Available Room No.<br/>
                    • Room Capacity<br/>
                    • Room Password (required)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    multiple
                    onChange={handleFileSelect}
                    className="file-input"
                    id="csvFile"
                    disabled={isUploading}
                  />

                  <label htmlFor="csvFile" className={`upload-btn ${isUploading ? 'disabled' : ''}`}>
                    {isUploading ? 'Processing...' : 'Choose Files'}
                  </label>

                  {uploadStatus && (
                    <div className={`upload-status ${csvData.length > 0 ? 'success' : uploadStatus.includes('❌') ? 'error' : 'info'}`}>
                      {uploadStatus}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Data Display Section */}
            <section className="data-section">
              <div className="section-header">
                <h2>📊 Room Allocation Overview</h2>
                <p>View and manage hostel room allocations</p>
              </div>
              <div className="data-container">
                {csvData.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📄</div>
                    <h3>No Data Available</h3>
                    <p>Upload a CSV file with hostel data to view here</p>
                  </div>
                ) : (
                  <RoomAllocationView />
                )}
              </div>
            </section>
          </div>
        </main>
    </div>
  );
};

export default Dashboard;
