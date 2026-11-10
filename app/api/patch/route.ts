import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const PATCH_DOSE_MG = 7

async function ensureTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "PatchSession" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "startedAt" DATETIME NOT NULL,
      "endedAt" DATETIME,
      "doseMg" INTEGER NOT NULL DEFAULT 7,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "PatchSession_startedAt_idx" ON "PatchSession"("startedAt")`
  )
}

async function currentState() {
  const active = await prisma.patchSession.findFirst({
    where: { endedAt: null },
    orderBy: { startedAt: 'desc' },
  })
  const sessions = await prisma.patchSession.findMany({
    orderBy: { startedAt: 'desc' },
    take: 200,
  })
  return { success: true, active, sessions }
}

function noStore(body: unknown, status = 200) {
  const res = NextResponse.json(body, { status })
  res.headers.set('Cache-Control', 'no-store, max-age=0')
  return res
}

/** GET : patch en cours (s'il y en a un) + historique des poses */
export async function GET() {
  try {
    await ensureTable()
    return noStore(await currentState())
  } catch (error) {
    console.error('Erreur patch GET:', error)
    return noStore({ success: false, error: 'Impossible de lire les patchs' }, 500)
  }
}

/** POST { action: 'on' | 'off' } : poser ou retirer le patch */
export async function POST(request: NextRequest) {
  try {
    await ensureTable()
    const { action } = await request.json()
    const now = new Date()

    const active = await prisma.patchSession.findFirst({
      where: { endedAt: null },
      orderBy: { startedAt: 'desc' },
    })

    if (action === 'on') {
      if (!active) {
        await prisma.patchSession.create({ data: { startedAt: now, doseMg: PATCH_DOSE_MG } })
      }
    } else if (action === 'off') {
      // Ferme toute session restée ouverte
      await prisma.patchSession.updateMany({ where: { endedAt: null }, data: { endedAt: now } })
    } else {
      return noStore({ success: false, error: 'Action inconnue : utilise "on" ou "off"' }, 400)
    }

    return noStore(await currentState())
  } catch (error) {
    console.error('Erreur patch POST:', error)
    return noStore({ success: false, error: 'Impossible d’enregistrer le patch' }, 500)
  }
}

/** DELETE ?id=... : supprimer une pose saisie par erreur */
export async function DELETE(request: NextRequest) {
  try {
    await ensureTable()
    const id = request.nextUrl.searchParams.get('id')
    if (!id) return noStore({ success: false, error: 'Paramètre "id" manquant' }, 400)
    await prisma.patchSession.delete({ where: { id } })
    return noStore(await currentState())
  } catch (error) {
    console.error('Erreur patch DELETE:', error)
    return noStore({ success: false, error: 'Impossible de supprimer cette pose' }, 500)
  }
}
