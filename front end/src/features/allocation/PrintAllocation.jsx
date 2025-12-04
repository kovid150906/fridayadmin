import { useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getAllocations, clearAllocations, getAllocationStats } from './AllocationStorage';
import '../../css/PrintAllocation.css';

const API_BASE_URL = '/api';

/**
 * Print Allocation Component
 * Generates PDF and syncs data to backend
 */
const PrintAllocation = ({ onSyncSuccess, onSyncError, onSyncStart, onSyncEnd }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const stats = getAllocationStats();

  // Generate PDF
  const generatePDF = () => {
    const allocations = getAllocations();
    
    if (allocations.length === 0) {
      onSyncError?.('No allocations to print');
      return null;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(14, 165, 233);
    doc.text('Mood Indigo - Room Allocations', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 28, { align: 'center' });
    doc.text(`Total Allocations: ${allocations.length}`, pageWidth / 2, 34, { align: 'center' });

    // Group allocations by room
    const groupedByRoom = {};
    allocations.forEach(alloc => {
      const key = `${alloc.hostel} - Room ${alloc.roomNo}`;
      if (!groupedByRoom[key]) {
        groupedByRoom[key] = {
          hostel: alloc.hostel,
          roomNo: alloc.roomNo,
          roomPassword: alloc.roomPassword,
          people: []
        };
      }
      groupedByRoom[key].people.push({
        name: alloc.name,
        miNo: alloc.miNo,
        email: alloc.email,
        timestamp: new Date(alloc.timestamp).toLocaleString()
      });
    });

    let yPosition = 45;

    // Print each room's allocations
    Object.keys(groupedByRoom).sort().forEach(roomKey => {
      const room = groupedByRoom[roomKey];
      
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      // Room header
      doc.setFontSize(14);
      doc.setTextColor(56, 189, 248);
      doc.text(`${room.hostel} - Room ${room.roomNo}`, 14, yPosition);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Password: ${room.roomPassword || 'N/A'}`, 14, yPosition + 6);
      doc.text(`Occupancy: ${room.people.length} person(s)`, 14, yPosition + 12);

      yPosition += 18;

      // Table for people in this room
      autoTable(doc, {
        startY: yPosition,
        head: [['Name', 'MI No.', 'Email', 'Allocated At']],
        body: room.people.map(p => [p.name, p.miNo, p.email, p.timestamp]),
        theme: 'grid',
        headStyles: {
          fillColor: [56, 189, 248],
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 9
        },
        margin: { left: 14, right: 14 },
        columnStyles: {
          0: { cellWidth: 45 },
          1: { cellWidth: 30 },
          2: { cellWidth: 60 },
          3: { cellWidth: 45 }
        }
      });

      yPosition = doc.lastAutoTable.finalY + 15;
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Page ${i} of ${pageCount} | Hospi & PR Team - Mood Indigo`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    return doc;
  };

  // Sync to backend and clear local storage
  const handleSyncAndPrint = async () => {
    const allocations = getAllocations();
    
    if (allocations.length === 0) {
      onSyncError?.('No allocations to sync');
      return;
    }

    setIsSyncing(true);
    onSyncStart?.(); // Notify parent that syncing started

    let retryCount = 0;

    const attemptSync = async () => {
      try {
        // Sync to backend first with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout per attempt
        
        const response = await fetch(`${API_BASE_URL}/allocation/save`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ allocations }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }
        
        const result = await response.json();

        if (result.success) {
          // Generate and print PDF only after successful database sync
          const doc = generatePDF();
          if (doc) {
            // Create iframe for silent printing (no new tab)
            const pdfBlob = doc.output('blob');
            const pdfUrl = URL.createObjectURL(pdfBlob);
            
            // Create hidden iframe
            const iframe = document.createElement('iframe');
            iframe.style.position = 'fixed';
            iframe.style.right = '0';
            iframe.style.bottom = '0';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.border = 'none';
            
            document.body.appendChild(iframe);
            
            iframe.onload = () => {
              iframe.contentWindow.print();
              
              // Clean up after printing
              setTimeout(() => {
                document.body.removeChild(iframe);
                URL.revokeObjectURL(pdfUrl);
              }, 1000);
            };
            
            iframe.src = pdfUrl;
          }

          // Clear local storage only after both sync and PDF generation succeed
          clearAllocations();
          
          onSyncSuccess?.(`✅ Successfully synced ${allocations.length} allocations to database and generated PDF`);
        } else {
          throw new Error(result.error || 'Failed to sync allocations');
        }
      } catch (err) {
        console.error(`Sync attempt ${retryCount + 1} failed:`, err);
        
        retryCount++;
        
        // Provide more specific error messages
        let errorMsg = `⚠️ Sync failed. Retrying... (Attempt ${retryCount})`;
        
        if (err.name === 'AbortError') {
          errorMsg = `⏱️ Request timed out. Retrying... (Attempt ${retryCount})`;
        } else if (err.message.includes('Failed to fetch')) {
          errorMsg = `🔌 Network error. Retrying... (Attempt ${retryCount})`;
        } else if (err.message.includes('Server error')) {
          errorMsg = `❌ Server error (${err.message}). Retrying... (Attempt ${retryCount})`;
        }
        
        onSyncError?.(errorMsg);
        await new Promise(resolve => setTimeout(resolve, 500));
        return attemptSync(); // Recursive retry - continues forever
      } finally {
        setIsSyncing(false);
        onSyncEnd?.();
      }
    };

    await attemptSync();
  };

  return (
    <div className="print-allocation-container">
      <div className="print-header">
        <h3>📄 Print & Sync Allocations</h3>
        <div className="stats-summary">
          <div className="stat-item">
            <span className="stat-label">Total Allocations:</span>
            <span className="stat-value">{stats.totalAllocations}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Rooms Used:</span>
            <span className="stat-value">{stats.rooms.length}</span>
          </div>
        </div>
      </div>

      {stats.totalAllocations > 0 ? (
        <div className="allocations-preview">
          <h4>Current Allocations:</h4>
          <div className="preview-list">
            {stats.rooms.map((room, idx) => (
              <div key={idx} className="room-preview">
                <strong>{room.hostel} - Room {room.roomNo}</strong>
                <span className="count-badge">{room.count} person(s)</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <p>No allocations yet. Scan QR codes and allocate rooms to print.</p>
        </div>
      )}

      <div className="print-actions">
        <button
          onClick={handleSyncAndPrint}
          disabled={stats.totalAllocations === 0 || isSyncing}
          className="print-btn sync"
        >
          {isSyncing ? 'Processing...' : '🖨️ Print & Save'}
        </button>
      </div>

      <div className="info-box">
        <strong>ℹ️ How it works:</strong>
        <p>
          • Prints all allocations from local storage<br />
          • Saves to backend database<br />
          • Clears local storage after successful save
        </p>
      </div>
    </div>
  );
};

export default PrintAllocation;
