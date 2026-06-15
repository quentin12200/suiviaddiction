import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

async function ensureTable() {
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
}

export async function GET() {
  try {
    await ensureTable()
    const tests = await prisma.achatTest.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(tests)
  } catch (error) {
    console.error('Erreur récupération achat-test:', error)
    return NextResponse.json({ error: 'Erreur lors de la récupération' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureTable()
    const body = await request.json()
    const { produit, prix, categorie, imageUrl, reponses, score, decision, utilisateur } = body

    const test = await prisma.achatTest.create({
      data: {
        produit,
        prix: prix || null,
        categorie: categorie || null,
        imageUrl: imageUrl || null,
        reponses: typeof reponses === 'string' ? reponses : JSON.stringify(reponses),
        score,
        decision,
        utilisateur: utilisateur || 'moi',
      },
    })

    return NextResponse.json(test)
  } catch (error) {
    console.error('Erreur création achat-test:', error)
    return NextResponse.json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 })
  }
}
