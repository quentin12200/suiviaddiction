import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET - Récupérer une entrée spécifique
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const entry = await prisma.entry.findUnique({
      where: { id: params.id },
    })

    if (!entry) {
      return NextResponse.json(
        { error: 'Entrée non trouvée' },
        { status: 404 }
      )
    }

    return NextResponse.json({ entry })
  } catch (error) {
    console.error('Erreur récupération entrée:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'entrée' },
      { status: 500 }
    )
  }
}

/**
 * PUT - Mettre à jour une entrée
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()

    // Mise à jour de l'entrée
    const entry = await prisma.entry.update({
      where: { id: params.id },
      data: {
        date: data.date ? new Date(data.date) : undefined,
        time: data.time,
        hasSmoked: data.hasSmoked,
        jointCount: data.jointCount,
        jointTime: data.jointTime,
        minutesSinceLastJoint: data.minutesSinceLastJoint,
        cravingLevel: data.cravingLevel,
        emotionalState: data.emotionalState,
        physicalState: data.physicalState,
        context: data.context,
        trigger: data.trigger,
        alternativeAction: data.alternativeAction,
        consciousDecision: data.consciousDecision,
        comment: data.comment,
      },
    })

    return NextResponse.json({ success: true, entry })
  } catch (error) {
    console.error('Erreur mise à jour entrée:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la mise à jour de l\'entrée' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Supprimer une entrée
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.entry.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur suppression entrée:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'entrée' },
      { status: 500 }
    )
  }
}
