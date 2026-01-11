import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * PATCH - Mettre à jour une lecture (statut, notes, etc.)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { id } = params

    const updateData: any = {}

    if (body.status !== undefined) {
      updateData.status = body.status

      // Si on passe à "en_cours", enregistrer startedAt
      if (body.status === 'en_cours' && !body.startedAt) {
        updateData.startedAt = new Date()
      }

      // Si on passe à "terminé", enregistrer finishedAt
      if (body.status === 'terminé' && !body.finishedAt) {
        updateData.finishedAt = new Date()
      }
    }

    if (body.notes !== undefined) {
      updateData.notes = body.notes
    }

    if (body.priority !== undefined) {
      updateData.priority = body.priority
    }

    const reading = await prisma.reading.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ success: true, reading })
  } catch (error) {
    console.error('Erreur mise à jour lecture:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Supprimer une lecture
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    await prisma.reading.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur suppression lecture:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
