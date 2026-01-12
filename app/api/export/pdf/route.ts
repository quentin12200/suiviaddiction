import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * API pour générer les données du rapport PDF
 * Le PDF sera généré côté client avec jsPDF
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    const now = new Date()
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

    // Récupérer toutes les entrées de la période
    const entries = await prisma.entry.findMany({
      where: {
        date: {
          gte: startDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
    })

    // NOUVELLE LOGIQUE : Compter les MOMENTS, pas les jours
    const totalEntries = entries.length
    const resistanceMoments = entries.filter(e => !e.hasSmoked).length
    const smokingMoments = entries.filter(e => e.hasSmoked).length

    const totalJoints = entries.reduce((sum, e) => sum + (e.jointCount || 0), 0)

    // Jours uniques pour moyenne joints/jour
    const uniqueDays = new Set(entries.map(e => e.date.toISOString().split('T')[0])).size
    const avgJointsPerDay = uniqueDays > 0 ? totalJoints / uniqueDays : 0

    const avgCraving = entries.length > 0
      ? entries.reduce((sum, e) => sum + e.cravingLevel, 0) / entries.length
      : 0

    // Calculer la plus longue série de MOMENTS DE RÉSISTANCE consécutifs
    let bestStreak = 0
    let tempStreak = 0
    let currentStreak = 0

    // Trier par date + heure pour avoir l'ordre chronologique
    const sortedEntries = [...entries].sort((a, b) => {
      const dateComp = new Date(a.date).getTime() - new Date(b.date).getTime()
      if (dateComp !== 0) return dateComp
      return a.time.localeCompare(b.time)
    })

    // Meilleur streak de moments de résistance
    for (const entry of sortedEntries) {
      if (!entry.hasSmoked) {
        tempStreak++
        bestStreak = Math.max(bestStreak, tempStreak)
      } else {
        tempStreak = 0
      }
    }

    // Streak actuel (du plus récent vers le passé)
    const reversedEntries = [...sortedEntries].reverse()
    for (const entry of reversedEntries) {
      if (!entry.hasSmoked) {
        currentStreak++
      } else {
        break
      }
    }

    // Grouper par semaine pour les graphiques
    const weeklyData: Record<string, { joints: number; craving: number; count: number }> = {}
    entries.forEach(entry => {
      const week = getWeekNumber(new Date(entry.date))
      if (!weeklyData[week]) {
        weeklyData[week] = { joints: 0, craving: 0, count: 0 }
      }
      weeklyData[week].joints += entry.jointCount || 0
      weeklyData[week].craving += entry.cravingLevel
      weeklyData[week].count++
    })

    const weeklyStats = Object.entries(weeklyData).map(([week, data]) => ({
      week,
      avgJoints: data.count > 0 ? data.joints / data.count : 0,
      avgCraving: data.count > 0 ? data.craving / data.count : 0,
    }))

    // Alternatives constructives
    const constructiveAlternatives = entries.filter(
      e => e.adrenalineEvent && e.adrenalineOutcome === 'réussi'
    ).length

    // Isolements réussis
    const successfulIsolations = entries.filter(
      e => e.isolationEvent && e.isolationOutcome === 'rechargé'
    ).length

    // Triggers les plus fréquents
    const triggerCounts: Record<string, number> = {}
    entries
      .filter(e => e.hasSmoked && e.trigger)
      .forEach(entry => {
        if (entry.trigger) {
          triggerCounts[entry.trigger] = (triggerCounts[entry.trigger] || 0) + 1
        }
      })

    const topTriggers = Object.entries(triggerCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([trigger, count]) => ({ trigger, count }))

    // États émotionnels les plus fréquents
    const emotionalCounts: Record<string, number> = {}
    entries
      .filter(e => e.emotionalState && e.emotionalState.trim() !== '')
      .forEach(entry => {
        if (entry.emotionalState) {
          const states = entry.emotionalState.split(',').map(s => s.trim())
          states.forEach(state => {
            if (state) {
              emotionalCounts[state] = (emotionalCounts[state] || 0) + 1
            }
          })
        }
      })

    const topEmotions = Object.entries(emotionalCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([emotion, count]) => ({ emotion, count }))

    return NextResponse.json({
      success: true,
      data: {
        period: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: now.toISOString().split('T')[0],
          days,
        },
        summary: {
          totalEntries,
          resistanceMoments,
          smokingMoments,
          resistancePercentage: totalEntries > 0 ? (resistanceMoments / totalEntries) * 100 : 0,
          totalJoints,
          avgJointsPerDay: Math.round(avgJointsPerDay * 10) / 10,
          avgCraving: Math.round(avgCraving * 10) / 10,
          currentStreak,
          bestStreak,
          constructiveAlternatives,
          successfulIsolations,
        },
        weekly: weeklyStats,
        triggers: topTriggers,
        emotions: topEmotions,
      },
    })
  } catch (error) {
    console.error('Erreur export PDF:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

function getWeekNumber(date: Date): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  const yearStart = new Date(d.getFullYear(), 0, 1)
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `S${weekNo} ${d.getFullYear()}`
}
