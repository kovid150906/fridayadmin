const fs = require('fs');
const path = require('path');
const { bulkInsertAccommodations, db } = require('./database');

// CSV file path (place your CSV file in backend folder)
const csvFilePath = path.join(__dirname, 'accommodations.csv');

if (!fs.existsSync(csvFilePath)) {
  console.error('❌ Error: accommodations.csv not found!');
  console.log('\nCreate a CSV file with this format:');
  console.log('email,name,miNo');
  console.log('student1@example.com,Alice Johnson,MI-ali-0201');
  console.log('student2@example.com,Bob Smith,MI-bob-0202');
  process.exit(1);
}

try {
  // Read and parse CSV
  const csvData = fs.readFileSync(csvFilePath, 'utf8');
  const lines = csvData.split('\n');
  
  // Remove header and empty lines
  const dataLines = lines.slice(1).filter(line => line.trim());
  
  const accommodations = dataLines.map((line, index) => {
    const [email, name, miNo] = line.split(',').map(s => s.trim());
    
    if (!email || !name || !miNo) {
      console.warn(`⚠️  Skipping line ${index + 2}: Invalid data`);
      return null;
    }
    
    return { email, name, miNo };
  }).filter(Boolean);

  if (accommodations.length === 0) {
    console.error('❌ No valid data found in CSV file');
    process.exit(1);
  }

  console.log(`📊 Found ${accommodations.length} accommodation entries`);
  console.log('🔄 Importing to database...\n');

  bulkInsertAccommodations(accommodations, (err) => {
    if (err) {
      console.error('❌ Import failed:', err);
      process.exit(1);
    } else {
      console.log(`✅ Successfully imported ${accommodations.length} accommodations!`);
      console.log('\n📝 Summary:');
      accommodations.slice(0, 5).forEach(acc => {
        console.log(`   - ${acc.name} (${acc.email}) - ${acc.miNo}`);
      });
      if (accommodations.length > 5) {
        console.log(`   ... and ${accommodations.length - 5} more`);
      }
    }
    db.close();
  });

} catch (error) {
  console.error('❌ Error reading CSV file:', error.message);
  process.exit(1);
}