const { createClient } = require('@libsql/client')

async function migrate() {
  const url = process.env.DATABASE_URL
  const authToken = process.env.DATABASE_AUTH_TOKEN

  if (!url) {
    console.error('DATABASE_URL manquant')
    process.exit(1)
  }

  const client = createClient({ url, authToken })

  await client.execute(`
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
  await client.close()
}

migrate().catch(e => { console.error(e); process.exit(1) })
