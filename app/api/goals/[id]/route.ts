import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * DELETE - Supprimer un objectif
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.dailyGoal.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur suppression objectif:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'objectif' },
      { status: 500 }
    )
  }
}
