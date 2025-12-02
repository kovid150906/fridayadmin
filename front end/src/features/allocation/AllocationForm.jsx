import { useState } from 'react';
import {
  addAllocation,
  isPersonAllocated,
  getAllocationByMiNo
} from './AllocationStorage';
import './AllocationForm.css';

/**
 * Allocation Form Component
 * Handles room selection and person allocation
 */
const AllocationForm = ({ 
  scannedPerson, 
  availableRooms,
  allocatedRooms = [],
  isLoadingAllocations = false,
  onAllocationSuccess,
  onAllocationError 
}) => {
  const [selectedHostel, setSelectedHostel] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isAllocating, setIsAllocating] = useState(false);

  // Get unique hostels from available rooms
  const hostels = [...new Set(availableRooms.map(r => r['hostel name']))].sort();

  // Filter rooms by selected hostel
  const filteredRooms = selectedHostel
    ? availableRooms.filter(r => r['hostel name'] === selectedHostel)
    : [];

  // Handle room selection
  const handleRoomSelect = (room) => {
    setSelectedRoom(room);
  };

  // Calculate room occupancy from database
  const getRoomOccupancy = (hostelName, roomNo) => {
    return allocatedRooms.filter(
      alloc => alloc.hostel === hostelName && alloc.room_no === roomNo
    ).length;
  };

  // Calculate available capacity using database data
  const getAvailableCapacity = (room) => {
    const totalCapacity = parseInt(room['room capacity']) || 0;
    const occupied = getRoomOccupancy(room['hostel name'], room['available room no.']);
    return totalCapacity - occupied;
  };

  // Get room occupancy display
  const getRoomOccupancyDisplay = (room) => {
    const totalCapacity = parseInt(room['room capacity']) || 0;
    const occupied = getRoomOccupancy(room['hostel name'], room['available room no.']);
    return `${occupied}/${totalCapacity}`;
  };

  // Check if person already allocated in database
  const isPersonAllocatedInDB = (miNo) => {
    return allocatedRooms.some(alloc => alloc.mi_no === miNo);
  };

  // Get person's allocation from database
  const getPersonAllocationFromDB = (miNo) => {
    return allocatedRooms.find(alloc => alloc.mi_no === miNo);
  };

  // Handle allocation
  const handleAllocate = async () => {
    if (!scannedPerson || !selectedRoom) {
      onAllocationError?.('Please scan a QR code and select a room');
      return;
    }

    // Check if person already allocated in database
    if (isPersonAllocatedInDB(scannedPerson.miNo)) {
      const existingAlloc = getPersonAllocationFromDB(scannedPerson.miNo);
      onAllocationError?.(
        `Person already allocated to ${existingAlloc.hostel} - Room ${existingAlloc.room_no}`
      );
      return;
    }

    // Check if person already allocated in localStorage (pending sync)
    if (isPersonAllocated(scannedPerson.miNo)) {
      const existingAlloc = getAllocationByMiNo(scannedPerson.miNo);
      onAllocationError?.(
        `Person already allocated to ${existingAlloc.hostel} - Room ${existingAlloc.roomNo} (pending sync)`
      );
      return;
    }

    // Check room capacity
    const availableCapacity = getAvailableCapacity(selectedRoom);
    if (availableCapacity <= 0) {
      onAllocationError?.('Room is full! Cannot allocate more people.');
      return;
    }

    setIsAllocating(true);

    try {
      // Add to localStorage
      const result = addAllocation({
        name: scannedPerson.name,
        miNo: scannedPerson.miNo,
        email: scannedPerson.email,
        hostel: selectedRoom['hostel name'],
        roomNo: selectedRoom['available room no.'],
        roomPassword: selectedRoom['room password']
      });

      if (result.success) {
        onAllocationSuccess?.(result.allocation);
        // Reset selection
        setSelectedRoom(null);
      } else {
        onAllocationError?.(result.error);
      }
    } catch (err) {
      onAllocationError?.('Failed to allocate room');
    } finally {
      setIsAllocating(false);
    }
  };

  return (
    <div className="allocation-form-container">
      <div className="form-section">
        <h3>Person Details</h3>
        {scannedPerson ? (
          <div className="person-card">
            <div className="person-detail">
              <span className="label">Name:</span>
              <span className="value">{scannedPerson.name}</span>
            </div>
            <div className="person-detail">
              <span className="label">MI No:</span>
              <span className="value">{scannedPerson.miNo}</span>
            </div>
            <div className="person-detail">
              <span className="label">Email:</span>
              <span className="value">{scannedPerson.email}</span>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <p>Scan a QR code to view person details</p>
          </div>
        )}
      </div>

      <div className="form-section">
        <h3>Select Room</h3>
        
        <div className="hostel-selector">
          <label>Hostel:</label>
          <select
            value={selectedHostel}
            onChange={(e) => {
              setSelectedHostel(e.target.value);
              setSelectedRoom(null);
            }}
            className="form-select"
          >
            <option value="">-- Select Hostel --</option>
            {hostels.map(hostel => (
              <option key={hostel} value={hostel}>{hostel}</option>
            ))}
          </select>
        </div>

        {selectedHostel && (
          <div className="rooms-list">
            {filteredRooms.length === 0 ? (
              <p className="no-rooms">No rooms available in this hostel</p>
            ) : (
              filteredRooms.map((room, idx) => {
                const availableCapacity = getAvailableCapacity(room);
                const occupancyDisplay = getRoomOccupancyDisplay(room);
                const isFull = availableCapacity <= 0;
                
                return (
                  <div
                    key={idx}
                    className={`room-card ${selectedRoom === room ? 'selected' : ''} ${isFull ? 'full' : ''}`}
                    onClick={() => !isFull && handleRoomSelect(room)}
                  >
                    <div className="room-header">
                      <span className="room-no">Room {room['available room no.']}</span>
                      <span className={`capacity-badge ${isFull ? 'full' : ''}`}>
                        {occupancyDisplay} occupied
                      </span>
                    </div>
                    <div className="room-password">
                      Password: {room['room password'] || 'N/A'}
                    </div>
                    {isFull && <div className="full-label">FULL</div>}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      <div className="form-actions">
        {isLoadingAllocations && (
          <div style={{ textAlign: 'center', color: '#f59e0b', marginBottom: '10px' }}>
            ⏳ Loading allocation data...
          </div>
        )}
        <button
          onClick={handleAllocate}
          disabled={!scannedPerson || !selectedRoom || isAllocating || isLoadingAllocations}
          className="allocate-btn"
          title={isLoadingAllocations ? 'Please wait for allocation data to load' : ''}
        >
          {isAllocating ? 'Allocating...' : isLoadingAllocations ? 'Loading...' : '✓ Allocate Room'}
        </button>
      </div>
    </div>
  );
};

export default AllocationForm;
