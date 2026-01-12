import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * API pour récupérer les stats d'adrénaline
 * - Dernier comportement à risque
 * - Statistiques sur les déclencheurs
 */
export async function GET() {
  try {
    // Trouver le dernier comportement à risque
    const lastRiskyBehavior = await prisma.entry.findFirst({
      where: {
        adrenalineEvent: true,
        adrenalineType: 'risque',
      },
      orderBy: [
        { date: 'desc' },
        { time: 'desc' },
      ],
      select: { date: true, time: true },
    })

    // Stats sur les derniers 30 jours
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const allAdrenalineEvents = await prisma.entry.findMany({
      where: {
        adrenalineEvent: true,
        date: {
          gte: thirtyDaysAgo,
        },
      },
      orderBy: { date: 'desc' },
      select: {
        date: true,
        adrenalineType: true,
        adrenalineTrigger: true,
        adrenalineOutcome: true,
      },
    })

    type AdrenalineEvent = typeof allAdrenalineEvents[number]

    // Compter par type
    const byType = {
      risque: allAdrenalineEvents.filter((e: AdrenalineEvent) => e.adrenalineType === 'risque').length,
      échappatoire: allAdrenalineEvents.filter((e: AdrenalineEvent) => e.adrenalineType === 'échappatoire').length,
      alternative: allAdrenalineEvents.filter((e: AdrenalineEvent) => e.adrenalineType === 'alternative').length,
    }

    // Compter par déclencheur
    const triggerCounts: Record<string, number> = {}
    allAdrenalineEvents.forEach((event: AdrenalineEvent) => {
      if (event.adrenalineTrigger) {
        triggerCounts[event.adrenalineTrigger] = (triggerCounts[event.adrenalineTrigger] || 0) + 1
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        lastRiskyBehaviorDate: lastRiskyBehavior?.date.toISOString().split('T')[0] || null,
        lastRiskyBehaviorTime: lastRiskyBehavior?.time || null,
        last30Days: {
          total: allAdrenalineEvents.length,
          byType,
          topTriggers: Object.entries(triggerCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([trigger, count]) => ({ trigger, count })),
        },
      },
    })
  } catch (error) {
    console.error('Erreur récupération stats adrénaline:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
