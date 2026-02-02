import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * API pour les statistiques par période
 * NOUVELLE LOGIQUE : Compte les MOMENTS DE RÉSISTANCE (entrées) pas les jours propres
 */
export async function GET() {
  try {
    const now = new Date()

    // Calculer les dates des périodes
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    const twoMonthsAgo = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000)
    const threeMonthsAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000)

    // Récupérer toutes les entrées des 3 derniers mois
    const allEntries = await prisma.entry.findMany({
      where: {
        date: {
          gte: threeMonthsAgo,
        },
      },
      orderBy: {
        date: 'asc',
      },
      select: {
        date: true,
        time: true,
        hasSmoked: true,
        jointCount: true,
        cravingLevel: true,
        adrenalineEvent: true,
        adrenalineOutcome: true,
        isolationEvent: true,
        isolationOutcome: true,
      },
    })

    // Fonction helper pour calculer les stats d'une période
    type EntryType = typeof allEntries[number]

    const calculatePeriodStats = (entries: typeof allEntries) => {
      // NOUVELLE LOGIQUE : Compter les MOMENTS, pas les jours
      const totalEntries = entries.length
      const resistanceMoments = entries.filter((e: EntryType) => !e.hasSmoked).length
      const smokingMoments = entries.filter((e: EntryType) => e.hasSmoked).length

      const totalJoints = entries.reduce((sum: number, e: EntryType) => sum + (e.jointCount || 0), 0)
      const avgCraving = entries.length > 0
        ? entries.reduce((sum: number, e: EntryType) => sum + e.cravingLevel, 0) / entries.length
        : 0

      // Jours uniques (pour calculer moyenne joints/jour)
      const uniqueDays = new Set(entries.map((e: EntryType) => e.date.toISOString().split('T')[0])).size

      // Alternatives constructives
      const constructiveAlternatives = entries.filter(
        (e: EntryType) => e.adrenalineEvent && e.adrenalineOutcome === 'réussi'
      ).length

      // Isolements réussis
      const successfulIsolations = entries.filter(
        (e: EntryType) => e.isolationEvent && e.isolationOutcome === 'rechargé'
      ).length

      return {
        totalEntries,
        resistanceMoments,
        smokingMoments,
        resistancePercentage: totalEntries > 0 ? (resistanceMoments / totalEntries) * 100 : 0,
        totalJoints,
        avgJointsPerDay: uniqueDays > 0 ? totalJoints / uniqueDays : 0,
        avgCraving: Math.round(avgCraving * 10) / 10,
        constructiveAlternatives,
        successfulIsolations,
      }
    }

    // Filtrer par période
    const lastWeekEntries = allEntries.filter((e: EntryType) => e.date >= weekAgo)
    const previousWeekEntries = allEntries.filter(
      (e: EntryType) => e.date >= twoWeeksAgo && e.date < weekAgo
    )
    const lastMonthEntries = allEntries.filter((e: EntryType) => e.date >= monthAgo)
    const previousMonthEntries = allEntries.filter(
      (e: EntryType) => e.date >= twoMonthsAgo && e.date < monthAgo
    )
    const last3MonthsEntries = allEntries

    // Calculer les stats
    const lastWeekStats = calculatePeriodStats(lastWeekEntries)
    const previousWeekStats = calculatePeriodStats(previousWeekEntries)
    const lastMonthStats = calculatePeriodStats(lastMonthEntries)
    const previousMonthStats = calculatePeriodStats(previousMonthEntries)
    const last3MonthsStats = calculatePeriodStats(last3MonthsEntries)

    // Calculer les tendances (% de changement)
    const weekTrend = {
      resistanceMoments: previousWeekStats.resistanceMoments > 0
        ? ((lastWeekStats.resistanceMoments - previousWeekStats.resistanceMoments) / previousWeekStats.resistanceMoments) * 100
        : 0,
      avgJointsPerDay: previousWeekStats.avgJointsPerDay > 0
        ? ((lastWeekStats.avgJointsPerDay - previousWeekStats.avgJointsPerDay) / previousWeekStats.avgJointsPerDay) * 100
        : 0,
      avgCraving: previousWeekStats.avgCraving > 0
        ? ((lastWeekStats.avgCraving - previousWeekStats.avgCraving) / previousWeekStats.avgCraving) * 100
        : 0,
    }

    const monthTrend = {
      resistanceMoments: previousMonthStats.resistanceMoments > 0
        ? ((lastMonthStats.resistanceMoments - previousMonthStats.resistanceMoments) / previousMonthStats.resistanceMoments) * 100
        : 0,
      avgJointsPerDay: previousMonthStats.avgJointsPerDay > 0
        ? ((lastMonthStats.avgJointsPerDay - previousMonthStats.avgJointsPerDay) / previousMonthStats.avgJointsPerDay) * 100
        : 0,
      avgCraving: previousMonthStats.avgCraving > 0
        ? ((lastMonthStats.avgCraving - previousMonthStats.avgCraving) / previousMonthStats.avgCraving) * 100
        : 0,
    }

    // NOUVEAU CALCUL : Streak basé sur les JOURS, pas sur les entrées
    // Trouver le dernier joint (hasSmoked = true)
    const sortedEntries = [...allEntries].sort((a, b) => {
      const dateComp = new Date(b.date).getTime() - new Date(a.date).getTime()
      if (dateComp !== 0) return dateComp
      return b.time.localeCompare(a.time)
    })

    const lastJointEntry = sortedEntries.find(e => e.hasSmoked === true)

    let currentStreak = 0
    let bestStreak = 0

    if (lastJointEntry) {
      // Calculer le nombre de jours depuis le dernier joint
      const lastJointDate = new Date(lastJointEntry.date)
      lastJointDate.setHours(0, 0, 0, 0)

      const todayMidnight = new Date(today)
      todayMidnight.setHours(0, 0, 0, 0)

      const daysSinceLastJoint = Math.floor((todayMidnight.getTime() - lastJointDate.getTime()) / (1000 * 60 * 60 * 24))
      currentStreak = Math.max(0, daysSinceLastJoint)
    } else {
      // Aucun joint trouvé dans les 3 derniers mois
      currentStreak = 90
    }

    // Calculer le meilleur streak historique
    // On parcourt toutes les entrées et on calcule les périodes sans fumer
    const allEntriesByDate = [...allEntries].sort((a, b) => {
      const dateComp = new Date(a.date).getTime() - new Date(b.date).getTime()
      if (dateComp !== 0) return dateComp
      return a.time.localeCompare(b.time)
    })

    let lastSmokingDate: Date | null = null
    let tempStreak = 0

    for (const entry of allEntriesByDate) {
      if (entry.hasSmoked) {
        lastSmokingDate = new Date(entry.date)
        tempStreak = 0
      } else if (lastSmokingDate) {
        const currentDate = new Date(entry.date)
        currentDate.setHours(0, 0, 0, 0)
        lastSmokingDate.setHours(0, 0, 0, 0)

        const daysDiff = Math.floor((currentDate.getTime() - lastSmokingDate.getTime()) / (1000 * 60 * 60 * 24))
        bestStreak = Math.max(bestStreak, daysDiff)
      }
    }

    // Le streak actuel pourrait être le meilleur
    bestStreak = Math.max(bestStreak, currentStreak)

    return NextResponse.json({
      success: true,
      data: {
        periods: {
          lastWeek: lastWeekStats,
          previousWeek: previousWeekStats,
          lastMonth: lastMonthStats,
          previousMonth: previousMonthStats,
          last3Months: last3MonthsStats,
        },
        trends: {
          week: weekTrend,
          month: monthTrend,
        },
        streaks: {
          current: currentStreak,
          best: bestStreak,
        },
      },
    })
  } catch (error) {
    console.error('Erreur stats périodes:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
