import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * API pour réparer les données corrompues
 */
export async function POST() {
  try {
    const fixes = []

    // 1. Trouver toutes les entrées avec hasSmoked = false
    const falseEntries = await prisma.entry.findMany({
      where: { hasSmoked: false },
      select: { id: true, date: true, hasSmoked: true, jointCount: true },
    })

    fixes.push(`Trouvé ${falseEntries.length} entrées avec hasSmoked=false`)

    // 2. Les marquer comme hasSmoked = true (car l'utilisateur fume tous les jours)
    const updated = await prisma.entry.updateMany({
      where: { hasSmoked: false },
      data: {
        hasSmoked: true,
        jointCount: 1, // Au minimum 1 joint si a fumé
      },
    })

    fixes.push(`Corrigé ${updated.count} entrées (hasSmoked = false → true)`)

    // 3. Corriger les entrées avec hasSmoked=true mais jointCount=0
    const zeroJointCount = await prisma.entry.updateMany({
      where: {
        hasSmoked: true,
        jointCount: 0,
      },
      data: { jointCount: 1 },
    })

    fixes.push(`Corrigé ${zeroJointCount.count} entrées (jointCount = 0 → 1)`)

    // 4. Corriger les jointTime manquants
    const missingJointTime = await prisma.entry.findMany({
      where: {
        hasSmoked: true,
        OR: [
          { jointTime: null },
          { jointTime: '' },
        ],
      },
      select: { id: true, time: true },
    })

    for (const entry of missingJointTime) {
      await prisma.entry.update({
        where: { id: entry.id },
        data: { jointTime: entry.time },
      })
    }

    fixes.push(`Corrigé ${missingJointTime.length} entrées (jointTime manquant)`)

    return NextResponse.json({
      success: true,
      message: 'Données réparées',
      fixes,
    })
  } catch (error) {
    console.error('Erreur réparation données:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
