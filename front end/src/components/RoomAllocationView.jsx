import { useState, useEffect } from 'react';
import '../css/RoomAllocationView.css';

const API_BASE_URL = 'http://localhost:3001/api';

/**
 * Room Allocation View Component
 * Shows rooms in a grid and displays allocated people in a modal when clicked
 */
const RoomAllocationView = () => {
  const [rooms, setRooms] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [selectedHostel, setSelectedHostel] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoomsAndAllocations();
  }, []);

  const fetchRoomsAndAllocations = async () => {
    try {
      setLoading(true);
      
      // Fetch rooms
      const roomsRes = await fetch(`${API_BASE_URL}/dashboard/data`);
      const roomsData = await roomsRes.json();
      
      // Fetch allocations
      const allocRes = await fetch(`${API_BASE_URL}/allocation/list`);
      const allocData = await allocRes.json();
      
      if (roomsData.success) {
        setRooms(roomsData.data || []);
      }
      
      if (allocData.success) {
        setAllocations(allocData.allocations || []);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get unique hostels
  const hostels = [...new Set(rooms.map(r => r['hostel name']))].sort();

  // Filter rooms by selected hostel
  const filteredRooms = selectedHostel
    ? rooms.filter(r => r['hostel name'] === selectedHostel)
    : [];

  // Get allocations for a specific room
  const getRoomAllocations = (hostelName, roomNo) => {
    return allocations.filter(
      alloc => alloc.hostel === hostelName && alloc.room_no === roomNo
    );
  };

  // Get room occupancy
  const getRoomOccupancy = (hostelName, roomNo) => {
    return getRoomAllocations(hostelName, roomNo).length;
  };

  // Handle room click
  const handleRoomClick = (room) => {
    const roomAllocations = getRoomAllocations(room['hostel name'], room['available room no.']);
    setSelectedRoom({
      hostel: room['hostel name'],
      roomNo: room['available room no.'],
      password: room['room password'],
      capacity: parseInt(room['room capacity']) || 0,
      allocations: roomAllocations
    });
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedRoom(null);
  };

  if (loading) {
    return (
      <div className="room-view-loading">
        <div className="spinner"></div>
        <p>Loading room allocations...</p>
      </div>
    );
  }

  return (
    <div className="room-allocation-view">
      {/* Hostel Dropdown */}
      <div className="hostel-selector">
        <label htmlFor="hostel-dropdown">Select Hostel:</label>
        <select
          id="hostel-dropdown"
          value={selectedHostel}
          onChange={(e) => setSelectedHostel(e.target.value)}
          className="hostel-select"
        >
          <option value="">-- Select a Hostel --</option>
          {hostels.map(hostel => (
            <option key={hostel} value={hostel}>{hostel}</option>
          ))}
        </select>
      </div>

      {/* Room Cells Grid */}
      {selectedHostel && (
        <div className="rooms-grid-container">
          {filteredRooms.length === 0 ? (
            <div className="no-rooms">
              <p>No rooms available in this hostel</p>
            </div>
          ) : (
            <div className="rooms-cell-grid">
              {filteredRooms.map((room, idx) => {
                const capacity = parseInt(room['room capacity']) || 0;
                const occupied = getRoomOccupancy(room['hostel name'], room['available room no.']);
                const isFull = occupied >= capacity;
                
                return (
                  <div
                    key={idx}
                    className={`room-cell ${isFull ? 'full' : occupied > 0 ? 'occupied' : 'empty'}`}
                    onClick={() => handleRoomClick(room)}
                    title={`Room ${room['available room no.']} - ${occupied}/${capacity} occupied`}
                  >
                    <span className="room-cell-number">{room['available room no.']}</span>
                    <span className="room-cell-count">{occupied}/{capacity}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal for room details */}
      {showModal && selectedRoom && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedRoom.hostel} - Room {selectedRoom.roomNo}</h3>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="room-info">
                <div className="info-item">
                  <span className="info-label">Password:</span>
                  <span className="info-value">{selectedRoom.password || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Capacity:</span>
                  <span className="info-value">{selectedRoom.capacity}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Occupied:</span>
                  <span className="info-value">{selectedRoom.allocations.length}</span>
                </div>
              </div>

              <div className="allocated-people">
                <h4>Allocated People ({selectedRoom.allocations.length})</h4>
                
                {selectedRoom.allocations.length === 0 ? (
                  <p className="no-people">No one allocated yet</p>
                ) : (
                  <div className="people-table">
                    <table>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Name</th>
                          <th>MI No.</th>
                          <th>Email</th>
                          <th>Allocated At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedRoom.allocations.map((person, idx) => (
                          <tr key={idx}>
                            <td>{idx + 1}</td>
                            <td>{person.name}</td>
                            <td>{person.mi_no}</td>
                            <td>{person.email}</td>
                            <td>{new Date(person.allocated_at).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomAllocationView;
