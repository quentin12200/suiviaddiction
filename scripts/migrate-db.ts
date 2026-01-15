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

    // Créer la table Thought
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Thought" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "content" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)

    console.log('✅ Table Thought créée')

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Thought_createdAt_idx" ON "Thought"("createdAt")
    `)

    console.log('✅ Index Thought créés')

    // Supprimer l'ancienne table TaskItem si elle existe avec le mauvais format
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "TaskItem"`)
    console.log('🗑️ Ancienne table TaskItem supprimée (si existante)')

    // Créer la table TaskItem avec le bon format DATETIME
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "TaskItem" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT NOT NULL DEFAULT '',
        "type" TEXT NOT NULL,
        "priority" TEXT NOT NULL DEFAULT 'normale',
        "category" TEXT NOT NULL DEFAULT 'Personnel',
        "completed" INTEGER NOT NULL DEFAULT 0,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "dueDate" DATETIME,
        "lastCompleted" DATETIME,
        "daysNotCompleted" INTEGER NOT NULL DEFAULT 0,
        "isFromHabit" INTEGER NOT NULL DEFAULT 0,
        "habitId" TEXT,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)

    console.log('✅ Table TaskItem créée')

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "TaskItem_completed_idx" ON "TaskItem"("completed")
    `)

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "TaskItem_type_idx" ON "TaskItem"("type")
    `)

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "TaskItem_category_idx" ON "TaskItem"("category")
    `)

    console.log('✅ Index TaskItem créés')

    // Créer la table RecurringExpense
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "RecurringExpense" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "label" TEXT NOT NULL,
        "amount" REAL NOT NULL,
        "dayOfMonth" INTEGER NOT NULL,
        "frequency" TEXT NOT NULL DEFAULT 'mensuel',
        "category" TEXT NOT NULL DEFAULT 'Autre',
        "startDate" DATETIME,
        "endDate" DATETIME,
        "isVariable" INTEGER NOT NULL DEFAULT 0,
        "variableMonths" TEXT,
        "isActive" INTEGER NOT NULL DEFAULT 1,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)

    console.log('✅ Table RecurringExpense créée')

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "RecurringExpense_dayOfMonth_idx" ON "RecurringExpense"("dayOfMonth")
    `)

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "RecurringExpense_isActive_idx" ON "RecurringExpense"("isActive")
    `)

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "RecurringExpense_category_idx" ON "RecurringExpense"("category")
    `)

    console.log('✅ Index RecurringExpense créés')

    // Pré-remplir les dépenses récurrentes par défaut (si la table est vide)
    const expensesCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM RecurringExpense`
    const count = (expensesCount as any)[0].count

    if (count === 0) {
      console.log('📝 Insertion des dépenses récurrentes par défaut...')

      const expenses = [
        { label: 'Crédit Immo', amount: 460, dayOfMonth: 5, category: 'Crédit' },
        { label: 'Assurance Emprunteur', amount: 14, dayOfMonth: 5, category: 'Assurance' },
        { label: 'Mutuelle', amount: 55.96, dayOfMonth: 5, category: 'Assurance' },
        { label: 'Impôts', amount: 237, dayOfMonth: 15, category: 'Autre' },
        { label: 'EDF', amount: 80, dayOfMonth: 5, category: 'Énergie', isVariable: 1, variableMonths: '{"1":238,"2":150}' },
        { label: 'Eau', amount: 30, dayOfMonth: 16, category: 'Énergie' },
        { label: 'Internet', amount: 29.99, dayOfMonth: 17, category: 'Abonnement' },
        { label: 'Netflix', amount: 17.99, dayOfMonth: 5, category: 'Abonnement' },
        { label: 'Spotify', amount: 10.99, dayOfMonth: 5, category: 'Abonnement' },
        { label: 'Canal+', amount: 24.99, dayOfMonth: 5, category: 'Abonnement' },
        { label: 'Assurance Voiture', amount: 45, dayOfMonth: 5, category: 'Assurance' },
        { label: 'Téléphone Sophie', amount: 9.99, dayOfMonth: 7, category: 'Abonnement' },
        { label: 'Téléphone Quentin', amount: 19.99, dayOfMonth: 12, category: 'Abonnement' },
        { label: 'Piscine', amount: 35, dayOfMonth: 5, category: 'Autre' },
        { label: 'Salle de sport', amount: 29.90, dayOfMonth: 1, category: 'Abonnement' },
        { label: 'Loyer garage', amount: 50, dayOfMonth: 1, category: 'Autre' },
        { label: 'Essence', amount: 150, dayOfMonth: 1, category: 'Autre' },
        { label: 'Courses alimentaires', amount: 400, dayOfMonth: 5, category: 'Autre' },
        { label: 'Courses alimentaires', amount: 200, dayOfMonth: 15, category: 'Autre' },
        { label: 'Courses alimentaires', amount: 200, dayOfMonth: 25, category: 'Autre' },
        { label: 'Prime assurance habitation', amount: 45, dayOfMonth: 20, category: 'Assurance' },
        { label: 'Frais bancaires', amount: 5, dayOfMonth: 1, category: 'Autre' },
        { label: 'Cantine enfants', amount: 80, dayOfMonth: 5, category: 'Autre' },
      ]

      for (const expense of expenses) {
        const id = `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        await prisma.$executeRawUnsafe(`
          INSERT INTO RecurringExpense (
            id, label, amount, dayOfMonth, frequency, category,
            isVariable, variableMonths, isActive, createdAt, updatedAt
          ) VALUES (
            '${id}',
            '${expense.label.replace(/'/g, "''")}',
            ${expense.amount},
            ${expense.dayOfMonth},
            'mensuel',
            '${expense.category}',
            ${expense.isVariable || 0},
            ${expense.variableMonths ? `'${expense.variableMonths}'` : 'NULL'},
            1,
            datetime('now'),
            datetime('now')
          )
        `)
      }

      console.log(`✅ ${expenses.length} dépenses récurrentes insérées`)
    } else {
      console.log(`ℹ️ ${count} dépenses récurrentes déjà présentes, pas d'insertion`)
    }

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
