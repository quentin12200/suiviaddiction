import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

// PrismaClient singleton pour éviter trop de connexions en développement
const globalForPrisma = global as unknown as { prisma: PrismaClient }

function createPrismaClient() {
  // Si on utilise Turso (détecté par la présence du token d'auth)
  if (process.env.DATABASE_AUTH_TOKEN) {
    // S'assurer d'utiliser le protocole HTTPS pour éviter les vérifications de migration
    let url = process.env.DATABASE_URL!
    if (url.startsWith('libsql://')) {
      url = url.replace('libsql://', 'https://')
    }

    // Créer le client avec l'URL HTTPS uniquement (pas de sync/migration)
    const libsql = createClient({
      url,
      authToken: process.env.DATABASE_AUTH_TOKEN,
    })

    const adapter = new PrismaLibSQL(libsql)

    // Type assertion pour compatibilité Turso adapter
    const options: any = {
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    }

    return new PrismaClient(options)
  }

  // Sinon utilisation classique (SQLite local)
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma || createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
