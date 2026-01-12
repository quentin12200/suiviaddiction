import { NextResponse } from 'next/server'
import { createClient } from '@libsql/client'

/**
 * POST - Appliquer la migration pour les tables Atomic Habits
 * ATTENTION: Cette route ne doit être appelée qu'une seule fois!
 */
export async function POST() {
  try {
    console.log('🔄 Début de la migration Atomic Habits...')

    const dbUrl = process.env.DATABASE_URL
    const authToken = process.env.DATABASE_AUTH_TOKEN

    if (!dbUrl) {
      return NextResponse.json({
        success: false,
        error: 'DATABASE_URL non configuré',
      }, { status: 500 })
    }

    // Créer un client Turso direct
    const client = createClient({
      url: dbUrl,
      authToken: authToken,
    })

    // SQL de migration
    const migrations = [
      // Table AtomicHabit
      `CREATE TABLE IF NOT EXISTS "AtomicHabit" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "trigger" TEXT NOT NULL,
        "identity" TEXT NOT NULL,
        "stackAfter" TEXT,
        "visualCue" TEXT,
        "reward" TEXT,
        "pleasure" TEXT,
        "difficulty" TEXT NOT NULL DEFAULT 'easy',
        "preparation" TEXT,
        "duration" INTEGER NOT NULL DEFAULT 5,
        "trackingMethod" TEXT NOT NULL DEFAULT 'checkbox',
        "category" TEXT NOT NULL DEFAULT 'general',
        "isActive" INTEGER NOT NULL DEFAULT 1,
        "isPositive" INTEGER NOT NULL DEFAULT 1,
        "replacesAddiction" INTEGER NOT NULL DEFAULT 0,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )`,

      // Index pour AtomicHabit
      `CREATE INDEX IF NOT EXISTS "AtomicHabit_isActive_idx" ON "AtomicHabit"("isActive")`,
      `CREATE INDEX IF NOT EXISTS "AtomicHabit_category_idx" ON "AtomicHabit"("category")`,
      `CREATE INDEX IF NOT EXISTS "AtomicHabit_replacesAddiction_idx" ON "AtomicHabit"("replacesAddiction")`,

      // Table HabitCompletion
      `CREATE TABLE IF NOT EXISTS "HabitCompletion" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "habitId" TEXT NOT NULL,
        "date" DATETIME NOT NULL,
        "completed" INTEGER NOT NULL DEFAULT 0,
        "value" INTEGER,
        "duration" INTEGER,
        "note" TEXT NOT NULL DEFAULT '',
        "difficulty" TEXT,
        "mood" TEXT,
        "rewardClaimed" INTEGER NOT NULL DEFAULT 0,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        FOREIGN KEY ("habitId") REFERENCES "AtomicHabit"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )`,

      // Index pour HabitCompletion
      `CREATE UNIQUE INDEX IF NOT EXISTS "HabitCompletion_habitId_date_key" ON "HabitCompletion"("habitId", "date")`,
      `CREATE INDEX IF NOT EXISTS "HabitCompletion_habitId_idx" ON "HabitCompletion"("habitId")`,
      `CREATE INDEX IF NOT EXISTS "HabitCompletion_date_idx" ON "HabitCompletion"("date")`,
      `CREATE INDEX IF NOT EXISTS "HabitCompletion_completed_idx" ON "HabitCompletion"("completed")`,

      // Table Badge
      `CREATE TABLE IF NOT EXISTS "Badge" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "icon" TEXT NOT NULL,
        "category" TEXT NOT NULL,
        "requirement" TEXT NOT NULL,
        "requiredValue" INTEGER NOT NULL,
        "earnedAt" DATETIME,
        "isUnlocked" INTEGER NOT NULL DEFAULT 0,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )`,

      // Index pour Badge
      `CREATE INDEX IF NOT EXISTS "Badge_category_idx" ON "Badge"("category")`,
      `CREATE INDEX IF NOT EXISTS "Badge_isUnlocked_idx" ON "Badge"("isUnlocked")`,
    ]

    // Exécuter chaque migration
    for (let i = 0; i < migrations.length; i++) {
      const sql = migrations[i]
      console.log(`Exécution migration ${i + 1}/${migrations.length}...`)
      await client.execute(sql)
    }

    console.log('✅ Migration terminée avec succès!')

    // Vérifier que les tables existent
    const tables = await client.execute(`
      SELECT name FROM sqlite_master
      WHERE type='table'
      AND name IN ('AtomicHabit', 'HabitCompletion', 'Badge')
      ORDER BY name
    `)

    return NextResponse.json({
      success: true,
      message: 'Migration appliquée avec succès',
      tables: tables.rows.map((row: any) => row.name),
    })

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error)
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la migration',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

/**
 * GET - Vérifier le statut des tables Atomic Habits
 */
export async function GET() {
  try {
    const dbUrl = process.env.DATABASE_URL
    const authToken = process.env.DATABASE_AUTH_TOKEN

    if (!dbUrl) {
      return NextResponse.json({
        success: false,
        error: 'DATABASE_URL non configuré',
      }, { status: 500 })
    }

    const client = createClient({
      url: dbUrl,
      authToken: authToken,
    })

    // Vérifier quelles tables existent
    const tables = await client.execute(`
      SELECT name FROM sqlite_master
      WHERE type='table'
      AND name IN ('AtomicHabit', 'HabitCompletion', 'Badge')
      ORDER BY name
    `)

    const existingTables = tables.rows.map((row: any) => row.name)
    const missingTables = ['AtomicHabit', 'HabitCompletion', 'Badge'].filter(
      t => !existingTables.includes(t)
    )

    return NextResponse.json({
      success: true,
      existingTables,
      missingTables,
      needsMigration: missingTables.length > 0,
    })

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error)
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la vérification',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
