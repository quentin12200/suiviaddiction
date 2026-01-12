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
    console.log('🔍 GET /api/entries/[id] - Recherche entrée')
    console.log('  ID reçu:', params.id)
    console.log('  Type ID:', typeof params.id)
    console.log('  Longueur ID:', params.id?.length)

    const entry = await prisma.entry.findUnique({
      where: { id: params.id },
    })

    console.log('  Entrée trouvée?', entry ? 'OUI' : 'NON')

    if (!entry) {
      // Cherchons dans toutes les entrées pour voir si l'ID existe
      const allIds = await prisma.entry.findMany({
        select: { id: true },
        take: 10,
      })
      type IdEntry = typeof allIds[number]
      console.log('  IDs existants (10 premiers):', allIds.map((e: IdEntry) => e.id))

      return NextResponse.json(
        { success: false, error: 'Entrée non trouvée', searchedId: params.id },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, entry })
  } catch (error) {
    console.error('❌ Erreur récupération entrée:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération de l\'entrée' },
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

    console.log('🔄 PUT /api/entries/[id] - Mise à jour')
    console.log('  ID:', params.id)
    console.log('  Données reçues:', data)

    // Construire l'objet de mise à jour en n'incluant que les champs fournis
    const updateData: any = {}

    if (data.date !== undefined) {
      updateData.date = new Date(data.date)
    }
    if (data.time !== undefined) updateData.time = data.time
    if (data.hasSmoked !== undefined) updateData.hasSmoked = data.hasSmoked
    if (data.jointCount !== undefined) updateData.jointCount = parseInt(data.jointCount) || 0
    if (data.jointTime !== undefined) updateData.jointTime = data.jointTime
    if (data.minutesSinceLastJoint !== undefined) updateData.minutesSinceLastJoint = parseInt(data.minutesSinceLastJoint) || null
    if (data.cravingLevel !== undefined) updateData.cravingLevel = parseInt(data.cravingLevel) || 0
    if (data.emotionalState !== undefined) updateData.emotionalState = data.emotionalState
    if (data.physicalState !== undefined) updateData.physicalState = data.physicalState
    if (data.context !== undefined) updateData.context = data.context
    if (data.trigger !== undefined) updateData.trigger = data.trigger
    if (data.alternativeAction !== undefined) updateData.alternativeAction = data.alternativeAction
    if (data.consciousDecision !== undefined) updateData.consciousDecision = data.consciousDecision
    if (data.comment !== undefined) updateData.comment = data.comment

    console.log('  Données à mettre à jour:', updateData)

    // Mise à jour de l'entrée
    const entry = await prisma.entry.update({
      where: { id: params.id },
      data: updateData,
    })

    console.log('  ✅ Mise à jour réussie')

    return NextResponse.json({ success: true, entry })
  } catch (error) {
    console.error('❌ Erreur mise à jour entrée:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la mise à jour de l\'entrée' },
      { status: 500 }
    )
  }
}

/**
 * PATCH - Modifier partiellement une entrée (pour fix-entries page)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    console.log(`🔧 PATCH entry ${params.id}:`, body)

    const entry = await prisma.entry.update({
      where: { id: params.id },
      data: {
        hasSmoked: body.hasSmoked,
        jointCount: body.jointCount ?? 0,
        jointTime: body.hasSmoked ? (body.jointTime || null) : null,
      },
    })

    console.log(`✅ Entry ${params.id} updated successfully`)

    return NextResponse.json({ success: true, entry })
  } catch (error) {
    console.error('Erreur mise à jour entrée:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de l\'entrée' },
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
    console.log('🗑️ DELETE /api/entries/[id] - Suppression entrée')
    console.log('  ID à supprimer:', params.id)

    // First, verify the entry exists
    const existingEntry = await prisma.entry.findUnique({
      where: { id: params.id },
    })

    if (!existingEntry) {
      console.log('  ⚠️ Entrée non trouvée, déjà supprimée?')
      return NextResponse.json({
        success: false,
        error: 'Entrée non trouvée'
      }, { status: 404 })
    }

    console.log('  📋 Entrée trouvée:', {
      id: existingEntry.id.substring(0, 8),
      date: existingEntry.date.toISOString().split('T')[0],
      time: existingEntry.time,
      hasSmoked: existingEntry.hasSmoked,
    })

    // Delete the entry
    await prisma.entry.delete({
      where: { id: params.id },
    })

    console.log('  ✅ Entrée supprimée avec succès')

    // Verify deletion
    const checkDeleted = await prisma.entry.findUnique({
      where: { id: params.id },
    })

    if (checkDeleted) {
      console.error('  ❌ ERREUR: Entrée toujours présente après suppression!')
    } else {
      console.log('  ✅ Vérification: entrée bien supprimée de la base')
    }

    return NextResponse.json({
      success: true,
      message: 'Entrée supprimée avec succès'
    })
  } catch (error) {
    console.error('❌ Erreur suppression entrée:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'entrée' },
      { status: 500 }
    )
  }
}
