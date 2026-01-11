const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
const db = new Database(dbPath);

console.log('Creating Reading table...\n');

try {
  // Create Reading table
  db.exec(`
    CREATE TABLE IF NOT EXISTS "Reading" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "title" TEXT NOT NULL,
      "author" TEXT NOT NULL,
      "category" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "priority" INTEGER NOT NULL DEFAULT 0,
      "status" TEXT NOT NULL DEFAULT 'non_commencé',
      "notes" TEXT NOT NULL DEFAULT '',
      "startedAt" DATETIME,
      "finishedAt" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    );
  `);
  console.log('✓ Created Reading table');

  db.exec(`
    CREATE INDEX IF NOT EXISTS "Reading_status_idx" ON "Reading"("status");
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS "Reading_category_idx" ON "Reading"("category");
  `);
  console.log('✓ Created Reading indexes');

  console.log('\n✅ Reading table migration completed successfully!');
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
} finally {
  db.close();
}
