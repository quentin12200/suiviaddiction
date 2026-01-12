import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET - Récupérer une habitude spécifique avec ses stats
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const habit = await prisma.atomicHabit.findUnique({
      where: { id: params.id },
      include: {
        completions: {
          orderBy: { date: 'desc' },
          take: 90, // 3 mois d'historique
        },
      },
    })

    if (!habit) {
      return NextResponse.json(
        { success: false, error: 'Habitude non trouvée' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      habit,
    })
  } catch (error) {
    console.error('Erreur récupération habitude:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération' },
      { status: 500 }
    )
  }
}

/**
 * PUT - Mettre à jour une habitude
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    const habit = await prisma.atomicHabit.update({
      where: { id: params.id },
      data: {
        // Step 1: Make it Obvious
        ...(body.name !== undefined && { name: body.name }),
        ...(body.trigger !== undefined && { trigger: body.trigger }),
        ...(body.identity !== undefined && { identity: body.identity }),
        ...(body.stackAfter !== undefined && { stackAfter: body.stackAfter }),
        ...(body.visualCue !== undefined && { visualCue: body.visualCue }),

        // Step 2: Make it Attractive
        ...(body.reward !== undefined && { reward: body.reward }),
        ...(body.pleasure !== undefined && { pleasure: body.pleasure }),

        // Step 3: Make it Easy
        ...(body.difficulty !== undefined && { difficulty: body.difficulty }),
        ...(body.preparation !== undefined && { preparation: body.preparation }),
        ...(body.duration !== undefined && { duration: parseInt(body.duration) }),

        // Step 4: Make it Satisfying
        ...(body.trackingMethod !== undefined && { trackingMethod: body.trackingMethod }),

        // Métadonnées
        ...(body.category !== undefined && { category: body.category }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.isPositive !== undefined && { isPositive: body.isPositive }),
        ...(body.replacesAddiction !== undefined && { replacesAddiction: body.replacesAddiction }),
      },
    })

    console.log('✅ Habitude mise à jour:', habit.id)

    return NextResponse.json({
      success: true,
      habit,
    })
  } catch (error) {
    console.error('Erreur mise à jour habitude:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la mise à jour' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Supprimer une habitude
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.atomicHabit.delete({
      where: { id: params.id },
    })

    console.log('✅ Habitude supprimée:', params.id)

    return NextResponse.json({
      success: true,
      message: 'Habitude supprimée avec succès',
    })
  } catch (error) {
    console.error('Erreur suppression habitude:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la suppression' },
      { status: 500 }
    )
  }
}
