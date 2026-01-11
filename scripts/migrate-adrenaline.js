const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
const db = new Database(dbPath);

console.log('Applying adrenaline tracking migration...');

try {
  // Add new columns
  db.exec(`
    ALTER TABLE Entry ADD COLUMN adrenalineEvent INTEGER NOT NULL DEFAULT 0;
  `);
  console.log('✓ Added adrenalineEvent column');

  db.exec(`
    ALTER TABLE Entry ADD COLUMN adrenalineType TEXT NOT NULL DEFAULT '';
  `);
  console.log('✓ Added adrenalineType column');

  db.exec(`
    ALTER TABLE Entry ADD COLUMN adrenalineTrigger TEXT NOT NULL DEFAULT '';
  `);
  console.log('✓ Added adrenalineTrigger column');

  db.exec(`
    ALTER TABLE Entry ADD COLUMN adrenalineAlternative TEXT NOT NULL DEFAULT '';
  `);
  console.log('✓ Added adrenalineAlternative column');

  db.exec(`
    ALTER TABLE Entry ADD COLUMN adrenalineOutcome TEXT NOT NULL DEFAULT '';
  `);
  console.log('✓ Added adrenalineOutcome column');

  db.exec(`
    CREATE INDEX IF NOT EXISTS Entry_adrenalineEvent_idx ON Entry(adrenalineEvent);
  `);
  console.log('✓ Created index on adrenalineEvent');

  console.log('\n✅ Migration completed successfully!');
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
