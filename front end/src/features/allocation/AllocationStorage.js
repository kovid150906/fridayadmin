/**
 * Local Storage Manager for Allocations
 * Temporarily stores room allocations before syncing to backend
 */

const STORAGE_KEY = 'friday_allocations';

/**
 * Get all allocations from localStorage
 */
export const getAllocations = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    return [];
  }
};

/**
 * Add a new allocation to localStorage
 * @param {Object} allocation - { name, miNo, email, hostel, roomNo, timestamp }
 */
export const addAllocation = (allocation) => {
  try {
    const allocations = getAllocations();
    const newAllocation = {
      ...allocation,
      id: `alloc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };
    allocations.push(newAllocation);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allocations));
    return { success: true, allocation: newAllocation };
  } catch (err) {
    return { success: false, error: 'Failed to save allocation' };
  }
};

/**
 * Get allocations for a specific room
 * @param {string} hostel - Hostel name
 * @param {string} roomNo - Room number
 */
export const getRoomAllocations = (hostel, roomNo) => {
  const allocations = getAllocations();
  return allocations.filter(
    alloc => alloc.hostel === hostel && alloc.roomNo === roomNo
  );
};

/**
 * Get count of allocations for a specific room
 */
export const getRoomAllocationCount = (hostel, roomNo) => {
  return getRoomAllocations(hostel, roomNo).length;
};

/**
 * Check if a person is already allocated
 * @param {string} miNo - MI number to check
 */
export const isPersonAllocated = (miNo) => {
  const allocations = getAllocations();
  return allocations.some(alloc => alloc.miNo === miNo);
};

/**
 * Get allocation by MI number
 */
export const getAllocationByMiNo = (miNo) => {
  const allocations = getAllocations();
  return allocations.find(alloc => alloc.miNo === miNo);
};

/**
 * Clear all allocations (only call after successful API sync)
 */
export const clearAllocations = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return { success: true };
  } catch (err) {
    return { success: false, error: 'Failed to clear allocations' };
  }
};

/**
 * Remove a specific allocation by ID
 */
export const removeAllocation = (id) => {
  try {
    const allocations = getAllocations();
    const filtered = allocations.filter(alloc => alloc.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return { success: true };
  } catch (err) {
    return { success: false, error: 'Failed to remove allocation' };
  }
};

/**
 * Get statistics about allocations
 */
export const getAllocationStats = () => {
  const allocations = getAllocations();
  const roomStats = {};

  allocations.forEach(alloc => {
    const key = `${alloc.hostel}|${alloc.roomNo}`;
    if (!roomStats[key]) {
      roomStats[key] = {
        hostel: alloc.hostel,
        roomNo: alloc.roomNo,
        count: 0,
        allocations: []
      };
    }
    roomStats[key].count++;
    roomStats[key].allocations.push(alloc);
  });

  return {
    totalAllocations: allocations.length,
    rooms: Object.values(roomStats),
    allocations
  };
};
