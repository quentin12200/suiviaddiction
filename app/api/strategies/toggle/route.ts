import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * API pour activer ou désactiver une stratégie
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { strategyId, title, description, category, isActive } = body

    // Chercher si la stratégie existe déjà
    const existing = await prisma.activeStrategy.findFirst({
      where: { strategyId },
    })

    if (existing) {
      // Mettre à jour
      const updated = await prisma.activeStrategy.update({
        where: { id: existing.id },
        data: { isActive },
      })

      return NextResponse.json({
        success: true,
        strategy: updated,
      })
    } else {
      // Créer
      const created = await prisma.activeStrategy.create({
        data: {
          strategyId,
          title,
          description,
          category,
          isActive,
        },
      })

      return NextResponse.json({
        success: true,
        strategy: created,
      })
    }
  } catch (error) {
    console.error('Erreur toggle stratégie:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la modification de la stratégie' },
      { status: 500 }
    )
  }
}

/**
 * GET: Récupérer les stratégies actives
 */
export async function GET() {
  try {
    const activeStrategies = await prisma.activeStrategy.findMany({
      where: { isActive: true },
      orderBy: { activatedAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      strategies: activeStrategies,
    })
  } catch (error) {
    console.error('Erreur récupération stratégies actives:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des stratégies' },
      { status: 500 }
    )
  }
}
