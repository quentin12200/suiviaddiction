const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
const db = new Database(dbPath);

console.log('Checking database tables...');

try {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('Tables found:', tables.map(t => t.name));

  if (tables.find(t => t.name === 'Entry')) {
    const columns = db.prepare("PRAGMA table_info(Entry)").all();
    console.log('\nEntry table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.name}: ${col.type}`);
    });
  }
} finally {
  db.close();
}
