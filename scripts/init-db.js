const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
const db = new Database(dbPath);

console.log('Initializing database with all tables...\n');

try {
  // Create Entry table with adrenaline fields
  db.exec(`
    CREATE TABLE IF NOT EXISTS "Entry" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "date" DATETIME NOT NULL,
      "time" TEXT NOT NULL,
      "hasSmoked" INTEGER NOT NULL,
      "jointCount" INTEGER NOT NULL DEFAULT 0,
      "jointTime" TEXT,
      "minutesSinceLastJoint" INTEGER,
      "cravingLevel" INTEGER NOT NULL,
      "emotionalState" TEXT NOT NULL DEFAULT '',
      "physicalState" TEXT NOT NULL DEFAULT '',
      "context" TEXT NOT NULL DEFAULT '',
      "trigger" TEXT NOT NULL DEFAULT '',
      "alternativeAction" TEXT NOT NULL DEFAULT '',
      "consciousDecision" INTEGER NOT NULL DEFAULT 0,
      "comment" TEXT NOT NULL DEFAULT '',
      "adrenalineEvent" INTEGER NOT NULL DEFAULT 0,
      "adrenalineType" TEXT NOT NULL DEFAULT '',
      "adrenalineTrigger" TEXT NOT NULL DEFAULT '',
      "adrenalineAlternative" TEXT NOT NULL DEFAULT '',
      "adrenalineOutcome" TEXT NOT NULL DEFAULT '',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    );
  `);
  console.log('✓ Created Entry table');

  db.exec(`
    CREATE INDEX IF NOT EXISTS "Entry_date_idx" ON "Entry"("date");
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS "Entry_adrenalineEvent_idx" ON "Entry"("adrenalineEvent");
  `);
  console.log('✓ Created Entry indexes');

  // Create DailyGoal table
  db.exec(`
    CREATE TABLE IF NOT EXISTS "DailyGoal" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "date" DATETIME NOT NULL UNIQUE,
      "maxJoints" INTEGER NOT NULL,
      "minIntervalMinutes" INTEGER NOT NULL,
      "note" TEXT NOT NULL DEFAULT '',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    );
  `);
  console.log('✓ Created DailyGoal table');

  db.exec(`
    CREATE INDEX IF NOT EXISTS "DailyGoal_date_idx" ON "DailyGoal"("date");
  `);

  // Create ActiveStrategy table
  db.exec(`
    CREATE TABLE IF NOT EXISTS "ActiveStrategy" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "strategyId" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "category" TEXT NOT NULL,
      "isActive" INTEGER NOT NULL DEFAULT 1,
      "activatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    );
  `);
  console.log('✓ Created ActiveStrategy table');

  db.exec(`
    CREATE INDEX IF NOT EXISTS "ActiveStrategy_strategyId_idx" ON "ActiveStrategy"("strategyId");
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS "ActiveStrategy_isActive_idx" ON "ActiveStrategy"("isActive");
  `);

  // Create DisciplineEntry table
  db.exec(`
    CREATE TABLE IF NOT EXISTS "DisciplineEntry" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "date" DATETIME NOT NULL UNIQUE,
      "wakeUpTime" TEXT,
      "sleepTime" TEXT,
      "exerciseDone" INTEGER NOT NULL DEFAULT 0,
      "exerciseDuration" INTEGER NOT NULL DEFAULT 0,
      "productiveHours" INTEGER NOT NULL DEFAULT 0,
      "distractionsResisted" INTEGER NOT NULL DEFAULT 0,
      "promisesKept" INTEGER NOT NULL DEFAULT 0,
      "selfRating" INTEGER NOT NULL DEFAULT 5,
      "worstMoment" TEXT NOT NULL DEFAULT '',
      "bestMoment" TEXT NOT NULL DEFAULT '',
      "tomorrowCommitment" TEXT NOT NULL DEFAULT '',
      "excuses" TEXT NOT NULL DEFAULT '',
      "truthfulReflection" TEXT NOT NULL DEFAULT '',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    );
  `);
  console.log('✓ Created DisciplineEntry table');

  db.exec(`
    CREATE INDEX IF NOT EXISTS "DisciplineEntry_date_idx" ON "DisciplineEntry"("date");
  `);

  // Create PushSubscription table
  db.exec(`
    CREATE TABLE IF NOT EXISTS "PushSubscription" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "endpoint" TEXT NOT NULL UNIQUE,
      "p256dh" TEXT NOT NULL,
      "auth" TEXT NOT NULL,
      "userAgent" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    );
  `);
  console.log('✓ Created PushSubscription table');

  db.exec(`
    CREATE INDEX IF NOT EXISTS "PushSubscription_endpoint_idx" ON "PushSubscription"("endpoint");
  `);

  // Thought table should already exist
  db.exec(`
    CREATE INDEX IF NOT EXISTS "Thought_createdAt_idx" ON "Thought"("createdAt");
  `);

  console.log('\n✅ Database initialization completed successfully!');
} catch (error) {
  console.error('❌ Initialization failed:', error.message);
  process.exit(1);
} finally {
  db.close();
}
