import { useEffect, useState } from 'react';
import '../css/Dashboard.css';
import '../css/allocation.css';
import QRScanner from '../features/allocation/QRScanner';
import AllocationForm from '../features/allocation/AllocationForm';
import PrintAllocation from '../features/allocation/PrintAllocation';

const API_BASE_URL = '/api';

const Allocation = () => {
  const [hostels, setHostels] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [allocatedRooms, setAllocatedRooms] = useState([]);
  const [scannedPerson, setScannedPerson] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState(''); // 'success' or 'error'
  const [isLoadingAllocations, setIsLoadingAllocations] = useState(true);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [allocationLoadError, setAllocationLoadError] = useState(false);

  useEffect(() => {
    fetchRooms();
    fetchAllocations();
  }, []);

  const fetchRooms = async () => {
    setIsLoadingRooms(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const res = await fetch(`${API_BASE_URL}/dashboard/data`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      const json = await res.json();
      if (json.success) {
        setRooms(json.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
      showStatus('Failed to load rooms. Using cached data.', 'error');
    } finally {
      setIsLoadingRooms(false);
    }
  };

  const fetchAllocations = async (retryCount = 0) => {
    setIsLoadingAllocations(true);
    setAllocationLoadError(false);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
      
      const res = await fetch(`${API_BASE_URL}/allocation/list`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      const json = await res.json();
      if (json.success) {
        setAllocatedRooms(json.allocations || []);
        setAllocationLoadError(false);
      } else {
        throw new Error('Failed to fetch allocations');
      }
    } catch (err) {
      console.error('Failed to fetch allocations:', err);
      
      if (retryCount < 2) {
        // Retry up to 2 times
        setTimeout(() => fetchAllocations(retryCount + 1), 2000);
        showStatus(`Loading allocations... (attempt ${retryCount + 2}/3)`, 'error');
      } else {
        setAllocationLoadError(true);
        showStatus('⚠️ Failed to load allocations. Please refresh or check connection.', 'error');
      }
    } finally {
      setIsLoadingAllocations(false);
    }
  };

  const handleScanSuccess = (personData) => {
    setScannedPerson(personData);
    showStatus(`Scanned: ${personData.name} (${personData.miNo})`, 'success');
  };

  const handleScanError = (error) => {
    showStatus(error, 'error');
  };

  const handleAllocationSuccess = (allocation) => {
    showStatus(
      `✅ Allocated ${allocation.hostel} - Room ${allocation.roomNo} to ${allocation.name}`,
      'success'
    );
    setScannedPerson(null); // Reset for next scan
  };

  const handleAllocationError = (error) => {
    showStatus(error, 'error');
  };

  const handleSyncSuccess = (message) => {
    showStatus(message, 'success');
    // Refresh allocations after successful sync
    fetchAllocations();
  };

  const handleSyncError = (error) => {
    showStatus(error, 'error');
  };

  const showStatus = (message, type) => {
    setStatusMessage(message);
    setStatusType(type);
    setTimeout(() => {
      setStatusMessage('');
      setStatusType('');
    }, 5000);
  };

  return (
    <div className="allocation-page">
      <main className="dashboard-main">
        <div className="allocation-header">
          <h2>🏨 Room Allocation System</h2>
          <p className="subtitle">Scan QR codes, allocate rooms, and print allocation reports</p>
        </div>

        {statusMessage && (
          <div className={`status-banner ${statusType}`}>
            {statusMessage}
          </div>
        )}

        {isLoadingAllocations && (
          <div className="status-banner info">
            ⏳ Loading allocation data from database...
          </div>
        )}

        {allocationLoadError && (
          <div className="status-banner error">
            ⚠️ Failed to load allocations. 
            <button 
              onClick={() => fetchAllocations()} 
              style={{ marginLeft: '10px', padding: '5px 10px', cursor: 'pointer' }}
            >
              Retry
            </button>
          </div>
        )}

        <div className="allocation-layout">
          {/* Left Column: QR Scanner */}
          <div className="allocation-column">
            <QRScanner 
              onScanSuccess={handleScanSuccess}
              onScanError={handleScanError}
            />
          </div>

          {/* Middle Column: Allocation Form */}
          <div className="allocation-column">
            <AllocationForm
              scannedPerson={scannedPerson}
              availableRooms={rooms}
              allocatedRooms={allocatedRooms}
              isLoadingAllocations={isLoadingAllocations}
              onAllocationSuccess={handleAllocationSuccess}
              onAllocationError={handleAllocationError}
            />
          </div>

          {/* Right Column: Print & Sync */}
          <div className="allocation-column">
            <PrintAllocation
              onSyncSuccess={handleSyncSuccess}
              onSyncError={handleSyncError}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Allocation;