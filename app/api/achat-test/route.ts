import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
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
