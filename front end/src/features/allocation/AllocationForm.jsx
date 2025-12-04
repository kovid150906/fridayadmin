import { useState, useEffect } from 'react';
import {
  addAllocation,
  isPersonAllocated,
  getAllocationByMiNo
} from './AllocationStorage';
import '../../css/AllocationForm.css';

/**
 * Allocation Form Component
 * Handles room selection and person allocation
 * Auto-allocates when QR is scanned (no button needed)
 */
const AllocationForm = ({ 
  scannedPerson, 
  availableRooms,
  allocatedRooms = [],
  isLoadingAllocations = false,
  isSyncing = false,
  onAllocationSuccess,
  onAllocationError 
}) => {
  const [selectedHostel, setSelectedHostel] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isAllocating, setIsAllocating] = useState(false);

  // Auto-allocate when person is scanned and room is selected
  useEffect(() => {
    if (scannedPerson && selectedRoom && !isAllocating && !isLoadingAllocations && !isSyncing) {
      handleAllocate();
    }
  }, [scannedPerson]); // Only trigger when scannedPerson changes

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
        // Keep room selected for next scan (don't reset)
        // setSelectedRoom(null); // REMOVED - keep room selected
      } else {
        onAllocationError?.(result.error);
      }
    } catch (err) {
      console.error('Allocation error:', err);
      const errorMsg = err.message || 'Failed to allocate room. Please try again.';
      onAllocationError?.(errorMsg);
    } finally {
      setIsAllocating(false);
    }
  };

  return (
    <div className="allocation-form-container">
      {/* Syncing Overlay */}
      {isSyncing && (
        <div className="syncing-overlay">
          <div className="syncing-message">
            <div className="spinner"></div>
            <h3>🔄 Syncing to Database...</h3>
            <p>Please wait. New allocations are paused.</p>
          </div>
        </div>
      )}

      {/* Hostel Selector at Top */}
      <div className="hostel-selector-top">
        <label>Select Hostel:</label>
        <select
          value={selectedHostel}
          onChange={(e) => {
            setSelectedHostel(e.target.value);
            setSelectedRoom(null);
          }}
          className="form-select-large"
          disabled={isSyncing}
        >
          <option value="">-- Select Hostel --</option>
          {hostels.map(hostel => (
            <option key={hostel} value={hostel}>{hostel}</option>
          ))}
        </select>
      </div>

      {/* Room Grid - 10x10 Scrollable */}
      {selectedHostel && (
        <div className="room-grid-wrapper">
          {filteredRooms.length === 0 ? (
            <p className="no-rooms">No rooms available in this hostel</p>
          ) : (
            <div className="room-grid">
              {filteredRooms.map((room, idx) => {
                const availableCapacity = getAvailableCapacity(room);
                const occupancyDisplay = getRoomOccupancyDisplay(room);
                const isFull = availableCapacity <= 0;
                const isSelected = selectedRoom === room;
                
                return (
                  <div
                    key={idx}
                    className={`room-grid-cell ${isSelected ? 'selected' : ''} ${isFull ? 'full' : ''} ${isSyncing ? 'disabled' : ''}`}
                    onClick={() => !isFull && !isSyncing && handleRoomSelect(room)}
                    title={`Room ${room['available room no.']} - ${occupancyDisplay} - Password: ${room['room password'] || 'N/A'}`}
                  >
                    <div className="room-number">{room['available room no.']}</div>
                    <div className="room-capacity">{occupancyDisplay}</div>
                    {isFull && <div className="full-badge">FULL</div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {!selectedHostel && (
        <div className="empty-state-grid">
          <p>👆 Select a hostel above to view rooms</p>
        </div>
      )}

      {/* Selected Room Info */}
      {selectedRoom && (
        <div className="selected-room-banner">
          <div className="selected-info">
            <span className="label">Selected:</span>
            <span className="value">{selectedRoom['hostel name']} - Room {selectedRoom['available room no.']}</span>
          </div>
          <div className="selected-info">
            <span className="label">Password:</span>
            <span className="value">{selectedRoom['room password'] || 'N/A'}</span>
          </div>
          <div className="selected-info">
            <span className="label">Occupancy:</span>
            <span className="value">{getRoomOccupancyDisplay(selectedRoom)}</span>
          </div>
          {getAvailableCapacity(selectedRoom) > 0 ? (
            <div className="status-ready">✓ Ready to scan</div>
          ) : (
            <div className="status-full">⚠️ Room FULL</div>
          )}
        </div>
      )}

      {/* Scanned Person Info - Compact */}
      {scannedPerson && (
        <div className="scanned-person-compact">
          <strong>Last Scan:</strong> {scannedPerson.name} ({scannedPerson.miNo})
        </div>
      )}
    </div>
  );
};

export default AllocationForm;
