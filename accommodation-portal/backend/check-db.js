const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./accommodation.db');

db.all('SELECT email, name, image_path, image_uploaded FROM accommodation', [], (err, rows) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  console.log('Database records:');
  console.log(JSON.stringify(rows, null, 2));
  db.close();
});
