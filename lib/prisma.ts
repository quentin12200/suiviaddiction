import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

// PrismaClient singleton pour éviter trop de connexions en développement
const globalForPrisma = global as unknown as { prisma: PrismaClient }

function createPrismaClient() {
  // Si on utilise Turso (URL libsql://)
  if (process.env.DATABASE_URL?.startsWith('libsql://')) {
    const libsql = createClient({
      url: process.env.DATABASE_URL,
      authToken: process.env.DATABASE_AUTH_TOKEN,
      syncInterval: 0, // Désactiver la synchronisation automatique
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
