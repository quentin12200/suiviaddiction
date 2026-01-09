import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET - Récupérer toutes les pensées
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    const thoughts = await prisma.thought.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })

    const total = await prisma.thought.count()

    return NextResponse.json({ success: true, thoughts, total })
  } catch (error) {
    console.error('Erreur récupération pensées:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des pensées' },
      { status: 500 }
    )
  }
}

/**
 * POST - Créer une nouvelle pensée
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.content || body.content.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Le contenu ne peut pas être vide' },
        { status: 400 }
      )
    }

    const thought = await prisma.thought.create({
      data: {
        content: body.content.trim(),
      },
    })

    console.log('💭 Pensée créée:', thought.id)

    return NextResponse.json({ success: true, thought })
  } catch (error) {
    console.error('Erreur création pensée:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la création de la pensée' },
      { status: 500 }
    )
  }
}
