// Form elements
const form = document.getElementById('qrForm');
const nameInput = document.getElementById('name');
const miNoInput = document.getElementById('miNo');
const emailInput = document.getElementById('email');

// Output elements
const qrOutput = document.getElementById('qrOutput');
const qrcodeDiv = document.getElementById('qrcode');
const jsonDataPre = document.getElementById('jsonData');

// Buttons
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');
const printBtn = document.getElementById('printBtn');

let currentQRData = null;

// Generate QR Code
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Get form values
  const name = nameInput.value.trim();
  const miNo = miNoInput.value.trim();
  const email = emailInput.value.trim();
  
  // Validate MI Number format
  const miPattern = /^MI[a-z]{3}[0-9]{4}$/;
  if (!miPattern.test(miNo)) {
    alert('Invalid MI Number format. Expected: MIxyz1234 (MI + 3 lowercase letters + 4 digits)');
    miNoInput.focus();
    return;
  }
  
  // Create JSON data
  const qrData = {
    name: name,
    miNo: miNo,
    email: email
  };
  
  currentQRData = qrData;
  const jsonString = JSON.stringify(qrData);
  
  // Display JSON data
  jsonDataPre.textContent = JSON.stringify(qrData, null, 2);
  
  // Clear previous QR code
  qrcodeDiv.innerHTML = '';
  
  // Generate QR code
  try {
    new QRCode(qrcodeDiv, {
      text: jsonString,
      width: 300,
      height: 300,
      colorDark: '#0f172a',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H
    });
    
    // Show output section
    qrOutput.style.display = 'block';
    qrOutput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (err) {
    console.error('QR Code generation error:', err);
    alert('Failed to generate QR code. Please try again.');
  }
});

// Download QR Code
downloadBtn.addEventListener('click', () => {
  const img = qrcodeDiv.querySelector('img');
  if (!img) return;
  
  const link = document.createElement('a');
  link.href = img.src;
  link.download = `MI_${currentQRData.miNo}_${currentQRData.name.replace(/\s+/g, '_')}.png`;
  link.click();
});

// Reset form
resetBtn.addEventListener('click', () => {
  form.reset();
  qrOutput.style.display = 'none';
  currentQRData = null;
  nameInput.focus();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Print QR Code
printBtn.addEventListener('click', () => {
  window.print();
});

// Auto-format MI Number input
miNoInput.addEventListener('input', (e) => {
  let value = e.target.value;
  
  // Remove any characters that aren't letters, numbers, or 'MI'
  value = value.replace(/[^a-zA-Z0-9]/g, '');
  
  // Ensure it starts with MI
  if (!value.startsWith('MI') && !value.startsWith('mi')) {
    if (value.length > 0) {
      value = 'MI' + value;
    }
  }
  
  // Convert MI to uppercase, rest to lowercase for letters
  if (value.length >= 2) {
    value = 'MI' + value.slice(2).toLowerCase();
  }
  
  // Limit length to 9 characters (MI + 3 letters + 4 digits)
  value = value.slice(0, 9);
  
  e.target.value = value;
});

// Focus on first input when page loads
window.addEventListener('load', () => {
  nameInput.focus();
});

// Add visual feedback for valid MI Number
miNoInput.addEventListener('blur', () => {
  const miPattern = /^MI[a-z]{3}[0-9]{4}$/;
  if (miNoInput.value && !miPattern.test(miNoInput.value)) {
    miNoInput.style.borderColor = '#ef4444';
  } else if (miNoInput.value) {
    miNoInput.style.borderColor = '#22c55e';
  }
});

miNoInput.addEventListener('focus', () => {
  miNoInput.style.borderColor = 'rgba(56, 189, 248, 0.3)';
});

// Prevent form submission on Enter in MI Number field (to allow formatting)
miNoInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    emailInput.focus();
  }
});

console.log('🎭 Mood Indigo QR Generator loaded successfully!');
console.log('Expected QR format:', {
  name: "Full Name",
  miNo: "MIxyz1234",
  email: "email@example.com"
});
