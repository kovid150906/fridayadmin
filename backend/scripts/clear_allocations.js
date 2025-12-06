const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'friday_hospi.db');
console.log('DB Path:', dbPath);

try {
  const db = new Database(dbPath);
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(r => r.name);
  console.log('Tables:', tables);
  if (!tables.includes('allocations')) {
    console.log('No allocations table found — nothing to delete');
    db.close();
    process.exit(0);
  }

  const before = db.prepare('SELECT COUNT(*) as cnt FROM allocations').get().cnt || 0;
  console.log('Rows before:', before);

  const res = db.prepare('DELETE FROM allocations').run();
  console.log('Deleted rows (run.changes):', res.changes);

  const after = db.prepare('SELECT COUNT(*) as cnt FROM allocations').get().cnt || 0;
  console.log('Rows after :', after);

  db.close();
  process.exit(0);
} catch (err) {
  console.error('Error:', err && err.message ? err.message : err);
  process.exit(2);
}
