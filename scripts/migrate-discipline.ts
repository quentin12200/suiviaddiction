import { PrismaClient } from '@prisma/client'
import { createClient } from '@libsql/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'

async function migrate() {
  console.log('🔄 Migration DisciplineEntry...')

  let prisma: PrismaClient

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
    const options: any = { adapter, log: ['error', 'warn'] }
    prisma = new PrismaClient(options)
  } else {
    prisma = new PrismaClient()
  }

  try {
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

    console.log('✅ Index créés')
    console.log('🎉 Migration terminée avec succès !')
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

migrate().catch(console.error)
