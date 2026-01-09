const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
console.log('📂 Database path:', dbPath);

try {
  const db = new Database(dbPath);

  console.log('🔧 Creating Thought table...');

  // Créer la table Thought
  db.exec(`
    CREATE TABLE IF NOT EXISTS "Thought" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "content" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('✅ Table Thought created!');

  // Créer l'index
  db.exec(`
    CREATE INDEX IF NOT EXISTS "Thought_createdAt_idx" ON "Thought"("createdAt");
  `);

  console.log('✅ Index created!');

  // Vérifier que la table existe
  const tables = db.prepare(`
    SELECT name FROM sqlite_master WHERE type='table' AND name='Thought';
  `).all();

  if (tables.length > 0) {
    console.log('✅ Table Thought exists in database!');
  } else {
    console.log('❌ Table Thought NOT found!');
  }

  db.close();
  console.log('✅ Migration completed successfully!');

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
