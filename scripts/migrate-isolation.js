const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
const db = new Database(dbPath);

console.log('Applying isolation tracking migration...\n');

try {
  // Add new columns for isolation tracking
  db.exec(`
    ALTER TABLE Entry ADD COLUMN isolationEvent INTEGER NOT NULL DEFAULT 0;
  `);
  console.log('✓ Added isolationEvent column');

  db.exec(`
    ALTER TABLE Entry ADD COLUMN isolationPlanned INTEGER NOT NULL DEFAULT 0;
  `);
  console.log('✓ Added isolationPlanned column');

  db.exec(`
    ALTER TABLE Entry ADD COLUMN isolationActivity TEXT NOT NULL DEFAULT '';
  `);
  console.log('✓ Added isolationActivity column');

  db.exec(`
    ALTER TABLE Entry ADD COLUMN isolationReason TEXT NOT NULL DEFAULT '';
  `);
  console.log('✓ Added isolationReason column');

  db.exec(`
    ALTER TABLE Entry ADD COLUMN isolationOutcome TEXT NOT NULL DEFAULT '';
  `);
  console.log('✓ Added isolationOutcome column');

  db.exec(`
    CREATE INDEX IF NOT EXISTS Entry_isolationEvent_idx ON Entry(isolationEvent);
  `);
  console.log('✓ Created index on isolationEvent');

  console.log('\n✅ Isolation tracking migration completed successfully!');
} catch (error) {
  if (error.message.includes('duplicate column name')) {
    console.log('⚠️  Columns already exist, skipping migration');
  } else {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
} finally {
  db.close();
}
