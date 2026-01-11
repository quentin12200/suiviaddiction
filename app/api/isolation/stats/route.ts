import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * API pour récupérer les stats d'isolement
 * - Moments constructifs vs destructifs
 * - Activités qui marchent le mieux
 * - Corrélation isolement → addictions
 */
export async function GET() {
  try {
    // Stats sur les derniers 30 jours
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const allIsolationEvents = await prisma.entry.findMany({
      where: {
        isolationEvent: true,
        date: {
          gte: thirtyDaysAgo,
        },
      },
      orderBy: { date: 'desc' },
      select: {
        date: true,
        isolationPlanned: true,
        isolationActivity: true,
        isolationReason: true,
        isolationOutcome: true,
        // Pour voir corrélation avec addictions
        hasSmoked: true,
        adrenalineEvent: true,
        adrenalineType: true,
      },
    })

    // Compter constructifs vs destructifs
    const withPlan = allIsolationEvents.filter(e => e.isolationPlanned).length
    const withoutPlan = allIsolationEvents.filter(e => !e.isolationPlanned).length

    // Compter par résultat
    const outcomes = {
      rechargé: allIsolationEvents.filter(e => e.isolationOutcome === 'rechargé').length,
      neutre: allIsolationEvents.filter(e => e.isolationOutcome === 'neutre').length,
      addictions: allIsolationEvents.filter(e => e.isolationOutcome === 'addictions').length,
      vide: allIsolationEvents.filter(e => e.isolationOutcome === 'vide').length,
    }

    // Compter par raison
    const reasons = {
      choix: allIsolationEvents.filter(e => e.isolationReason === 'choix').length,
      fuite: allIsolationEvents.filter(e => e.isolationReason === 'fuite').length,
      ennui: allIsolationEvents.filter(e => e.isolationReason === 'ennui').length,
      fatigue: allIsolationEvents.filter(e => e.isolationReason === 'fatigue').length,
      concentration: allIsolationEvents.filter(e => e.isolationReason === 'concentration').length,
    }

    // Activités qui ont mené à "rechargé"
    const successfulActivities = allIsolationEvents
      .filter(e => e.isolationOutcome === 'rechargé' && e.isolationActivity)
      .map(e => e.isolationActivity)

    // Corrélation isolement → addictions
    const isolationToAddictions = allIsolationEvents.filter(
      e => e.isolationOutcome === 'addictions' || (e.hasSmoked && e.isolationEvent)
    ).length

    const correlationRate = allIsolationEvents.length > 0
      ? ((isolationToAddictions / allIsolationEvents.length) * 100).toFixed(1)
      : '0'

    return NextResponse.json({
      success: true,
      data: {
        last30Days: {
          total: allIsolationEvents.length,
          withPlan,
          withoutPlan,
          outcomes,
          reasons,
          successfulActivities,
          correlationRate: `${correlationRate}%`,
        },
      },
    })
  } catch (error) {
    console.error('Erreur récupération stats isolement:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
