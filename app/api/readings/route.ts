import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET - Récupérer toutes les lectures
 */
export async function GET() {
  try {
    const readings = await prisma.reading.findMany({
      orderBy: [
        { priority: 'desc' }, // Top priority first
        { status: 'asc' }, // en_cours avant non_commencé avant terminé
        { createdAt: 'asc' },
      ],
    })

    return NextResponse.json({ success: true, readings })
  } catch (error) {
    console.error('Erreur récupération lectures:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

/**
 * POST - Créer une nouvelle lecture (si l'utilisateur veut ajouter ses propres livres)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const reading = await prisma.reading.create({
      data: {
        title: body.title,
        author: body.author,
        category: body.category || 'autre',
        description: body.description || '',
        priority: body.priority || 0,
        status: body.status || 'non_commencé',
        notes: body.notes || '',
      },
    })

    return NextResponse.json({ success: true, reading })
  } catch (error) {
    console.error('Erreur création lecture:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
