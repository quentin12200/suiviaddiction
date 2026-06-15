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

    // Supprimer les anciennes dépenses et réinsérer les nouvelles
    console.log('🗑️ Suppression des anciennes dépenses récurrentes...')
    await prisma.$executeRawUnsafe(`DELETE FROM RecurringExpense`)

    console.log('📝 Insertion des dépenses récurrentes à jour...')

    const expenses = [
        // Jour 5 - Jour critique 1187,45€
        { label: 'Crédit immobilier', amount: 653.95, dayOfMonth: 5, category: 'Crédit' },
        { label: 'CE Midi-Pyrénées (assurances)', amount: 243.68, dayOfMonth: 5, category: 'Assurance' },
        { label: 'BPCE Assurances IARD (1)', amount: 104.24, dayOfMonth: 5, category: 'Assurance' },
        { label: 'BPCE Assurances IARD (2)', amount: 69.13, dayOfMonth: 5, category: 'Assurance' },
        { label: 'BPCE Assurances IARD (3)', amount: 45.56, dayOfMonth: 5, category: 'Assurance' },
        { label: 'Canva', amount: 28.00, dayOfMonth: 5, category: 'Abonnement' },
        { label: 'Tech VIP', amount: 29.90, dayOfMonth: 5, category: 'Abonnement' },
        { label: 'Blizzard', amount: 12.99, dayOfMonth: 5, category: 'Abonnement' },

        // Jour 6
        { label: 'CNP Assurances', amount: 5.00, dayOfMonth: 6, category: 'Assurance' },
        { label: 'PayPal', amount: 75.00, dayOfMonth: 6, category: 'Autre', endDate: '2026-03-31' },

        // Jour 7
        { label: 'Section locale Multipro', amount: 20.00, dayOfMonth: 7, category: 'Autre' },

        // Jour 9
        { label: 'EDF électricité', amount: 150.00, dayOfMonth: 9, category: 'Énergie' },

        // Jour 12
        { label: 'Association financement PCF', amount: 26.00, dayOfMonth: 12, category: 'Autre' },

        // Jour 13
        { label: 'OpenAI ChatGPT', amount: 20.66, dayOfMonth: 13, category: 'Abonnement' },
        { label: 'Adobe', amount: 23.99, dayOfMonth: 13, category: 'Abonnement' },

        // Jour 14
        { label: 'Cofidis', amount: 15.74, dayOfMonth: 14, category: 'Crédit', endDate: '2026-03-31' },

        // Jour 15
        { label: 'DIAC', amount: 341.25, dayOfMonth: 15, category: 'Crédit' },
        { label: 'APF France Handicap', amount: 10.00, dayOfMonth: 15, category: 'Autre' },

        // Jour 16
        { label: 'Orange SA', amount: 28.99, dayOfMonth: 16, category: 'Abonnement' },

        // Jour 22
        { label: 'Remboursement crédit', amount: 97.00, dayOfMonth: 22, category: 'Crédit', endDate: '2027-01-22' },
        { label: 'Électricité (janvier)', amount: 119.00, dayOfMonth: 22, category: 'Énergie', startDate: '2026-01-01', endDate: '2026-01-31' },

        // Jour 23
        { label: 'SFR Internet & téléphonie', amount: 66.98, dayOfMonth: 23, category: 'Abonnement' },

        // Jour 25 - Bimensuel
        { label: 'CGT FAPT', amount: 22.00, dayOfMonth: 25, category: 'Autre', frequency: 'bimensuel' },

        // Jour 29
        { label: 'Anthropic Claude', amount: 21.60, dayOfMonth: 29, category: 'Abonnement' },
        { label: 'Orange Fibre', amount: 30.99, dayOfMonth: 29, category: 'Abonnement' },

        // Jour 9 - Bimensuel (hors janvier)
        { label: 'EDF électricité (bimensuel)', amount: 238.00, dayOfMonth: 9, category: 'Énergie', frequency: 'bimensuel', startDate: '2026-02-01' },
      ]

      for (const expense of expenses) {
        const id = `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const frequency = (expense as any).frequency || 'mensuel'
        const startDate = (expense as any).startDate ? `datetime('${(expense as any).startDate} 00:00:00')` : 'NULL'
        const endDate = (expense as any).endDate ? `datetime('${(expense as any).endDate} 23:59:59')` : 'NULL'
        const isVariable = (expense as any).isVariable || 0
        const variableMonths = (expense as any).variableMonths ? `'${(expense as any).variableMonths}'` : 'NULL'

        await prisma.$executeRawUnsafe(`
          INSERT INTO RecurringExpense (
            id, label, amount, dayOfMonth, frequency, category,
            isVariable, variableMonths, isActive, startDate, endDate, createdAt, updatedAt
          ) VALUES (
            '${id}',
            '${expense.label.replace(/'/g, "''")}',
            ${expense.amount},
            ${expense.dayOfMonth},
            '${frequency}',
            '${expense.category}',
            ${isVariable},
            ${variableMonths},
            1,
            ${startDate},
            ${endDate},
            datetime('now'),
            datetime('now')
          )
        `)
      }

      console.log(`✅ ${expenses.length} dépenses récurrentes insérées`)

    // Créer la table EmailSolde pour le solde automatique Gmail
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "EmailSolde" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "userId" TEXT NOT NULL,
        "solde" REAL NOT NULL,
        "soldeRaw" TEXT NOT NULL,
        "operationLabel" TEXT,
        "operationMontant" REAL,
        "operationDate" TEXT,
        "emailId" TEXT NOT NULL UNIQUE,
        "emailDate" DATETIME NOT NULL,
        "expediteur" TEXT NOT NULL,
        "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)

    console.log('✅ Table EmailSolde créée')

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "EmailSolde_userId_emailDate_idx" ON "EmailSolde"("userId", "emailDate")
    `)

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "EmailSolde_fetchedAt_idx" ON "EmailSolde"("fetchedAt")
    `)

    console.log('✅ Index EmailSolde créés')

    // Créer la table AchatTest
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AchatTest" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "produit" TEXT NOT NULL,
        "prix" TEXT,
        "categorie" TEXT,
        "imageUrl" TEXT,
        "reponses" TEXT NOT NULL,
        "score" INTEGER NOT NULL,
        "decision" TEXT NOT NULL,
        "utilisateur" TEXT NOT NULL DEFAULT 'moi'
      )
    `)

    console.log('✅ Table AchatTest créée')

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
