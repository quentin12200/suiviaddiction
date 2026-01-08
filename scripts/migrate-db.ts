import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

/**
 * Script de migration pour créer les tables ActiveStrategy et DisciplineEntry
 * Exécuté automatiquement au déploiement
 */
async function migrate() {
  console.log('🔄 Début de la migration...')

  let prisma: PrismaClient

  // Créer le client Prisma avec Turso
  if (process.env.DATABASE_URL?.startsWith('libsql://') || process.env.DATABASE_URL?.includes('turso.io')) {
    let url = process.env.DATABASE_URL!
    if (url.startsWith('libsql://')) {
      url = url.replace('libsql://', 'https://')
    }

    const libsql = createClient({
      url,
      authToken: process.env.DATABASE_AUTH_TOKEN,
    })

    const adapter = new PrismaLibSQL(libsql)

    const options: any = {
      adapter,
      log: ['error', 'warn'],
    }

    prisma = new PrismaClient(options)
  } else {
    prisma = new PrismaClient()
  }

  try {
    // Exécuter le SQL brut pour créer la table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ActiveStrategy" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "strategyId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "category" TEXT NOT NULL,
        "isActive" INTEGER NOT NULL DEFAULT 1,
        "activatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )
    `)

    console.log('✅ Table ActiveStrategy créée')

    // Créer les index
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "ActiveStrategy_strategyId_idx" ON "ActiveStrategy"("strategyId")
    `)

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "ActiveStrategy_isActive_idx" ON "ActiveStrategy"("isActive")
    `)

    console.log('✅ Index ActiveStrategy créés')

    // Créer la table DisciplineEntry
    await prisma.$executeRawUnsafe(`
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
      )
    `)

    console.log('✅ Table DisciplineEntry créée')

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "DisciplineEntry_date_idx" ON "DisciplineEntry"("date")
    `)

    console.log('✅ Index DisciplineEntry créés')

    // Créer la table PushSubscription
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "PushSubscription" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "endpoint" TEXT NOT NULL UNIQUE,
        "p256dh" TEXT NOT NULL,
        "auth" TEXT NOT NULL,
        "userAgent" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )
    `)

    console.log('✅ Table PushSubscription créée')

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "PushSubscription_endpoint_idx" ON "PushSubscription"("endpoint")
    `)

    console.log('✅ Index PushSubscription créés')
    console.log('🎉 Migration terminée avec succès !')
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

migrate()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
