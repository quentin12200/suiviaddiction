import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * API pour les statistiques par période
 * - Comparaison semaine/mois/trimestre
 * - Tendances (amélioration/détérioration)
 * - Meilleur streak historique
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
    const calculatePeriodStats = (entries: typeof allEntries) => {
      // Grouper les entrées par jour unique
      const entriesByDay = new Map<string, typeof allEntries>()

      for (const entry of entries) {
        const dateKey = entry.date.toISOString().split('T')[0]
        if (!entriesByDay.has(dateKey)) {
          entriesByDay.set(dateKey, [])
        }
        entriesByDay.get(dateKey)!.push(entry)
      }

      // Compter les jours uniques (pas les entrées)
      const totalDays = entriesByDay.size

      // Un jour est "smoking day" si AU MOINS UNE entrée a hasSmoked = true
      let smokingDays = 0
      for (const [_, dayEntries] of entriesByDay) {
        if (dayEntries.some(e => e.hasSmoked)) {
          smokingDays++
        }
      }

      const cleanDays = totalDays - smokingDays
      const totalJoints = entries.reduce((sum, e) => sum + (e.jointCount || 0), 0)
      const avgCraving = entries.length > 0
        ? entries.reduce((sum, e) => sum + e.cravingLevel, 0) / entries.length
        : 0

      // Alternatives constructives
      const constructiveAlternatives = entries.filter(
        e => e.adrenalineEvent && e.adrenalineOutcome === 'réussi'
      ).length

      // Isolements réussis
      const successfulIsolations = entries.filter(
        e => e.isolationEvent && e.isolationOutcome === 'rechargé'
      ).length

      return {
        totalDays,
        smokingDays,
        cleanDays,
        cleanPercentage: totalDays > 0 ? (cleanDays / totalDays) * 100 : 0,
        totalJoints,
        avgJointsPerDay: totalDays > 0 ? totalJoints / totalDays : 0,
        avgCraving: Math.round(avgCraving * 10) / 10,
        constructiveAlternatives,
        successfulIsolations,
      }
    }

    // Filtrer par période
    const lastWeekEntries = allEntries.filter(e => e.date >= weekAgo)
    const previousWeekEntries = allEntries.filter(
      e => e.date >= twoWeeksAgo && e.date < weekAgo
    )
    const lastMonthEntries = allEntries.filter(e => e.date >= monthAgo)
    const previousMonthEntries = allEntries.filter(
      e => e.date >= twoMonthsAgo && e.date < monthAgo
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
      cleanDays: previousWeekStats.cleanDays > 0
        ? ((lastWeekStats.cleanDays - previousWeekStats.cleanDays) / previousWeekStats.cleanDays) * 100
        : 0,
      avgJointsPerDay: previousWeekStats.avgJointsPerDay > 0
        ? ((lastWeekStats.avgJointsPerDay - previousWeekStats.avgJointsPerDay) / previousWeekStats.avgJointsPerDay) * 100
        : 0,
      avgCraving: previousWeekStats.avgCraving > 0
        ? ((lastWeekStats.avgCraving - previousWeekStats.avgCraving) / previousWeekStats.avgCraving) * 100
        : 0,
    }

    const monthTrend = {
      cleanDays: previousMonthStats.cleanDays > 0
        ? ((lastMonthStats.cleanDays - previousMonthStats.cleanDays) / previousMonthStats.cleanDays) * 100
        : 0,
      avgJointsPerDay: previousMonthStats.avgJointsPerDay > 0
        ? ((lastMonthStats.avgJointsPerDay - previousMonthStats.avgJointsPerDay) / previousMonthStats.avgJointsPerDay) * 100
        : 0,
      avgCraving: previousMonthStats.avgCraving > 0
        ? ((lastMonthStats.avgCraving - previousMonthStats.avgCraving) / previousMonthStats.avgCraving) * 100
        : 0,
    }

    // Calculer le meilleur streak (série de jours sans fumer)
    // Grouper par jour unique d'abord
    const entriesByDay = new Map<string, typeof allEntries>()
    for (const entry of allEntries) {
      const dateKey = entry.date.toISOString().split('T')[0]
      if (!entriesByDay.has(dateKey)) {
        entriesByDay.set(dateKey, [])
      }
      entriesByDay.get(dateKey)!.push(entry)
    }

    // Trier les jours par date
    const sortedDays = Array.from(entriesByDay.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))

    let currentStreak = 0
    let bestStreak = 0
    let tempStreak = 0

    // Calculer le meilleur streak (série consécutive de jours propres)
    for (let i = 0; i < sortedDays.length; i++) {
      const [_, dayEntries] = sortedDays[i]
      const dayHadSmoking = dayEntries.some(e => e.hasSmoked)

      if (!dayHadSmoking) {
        tempStreak++
        bestStreak = Math.max(bestStreak, tempStreak)
      } else {
        tempStreak = 0
      }
    }

    // Calculer le streak actuel (du plus récent vers le passé)
    const reversedDays = [...sortedDays].reverse()
    for (const [_, dayEntries] of reversedDays) {
      const dayHadSmoking = dayEntries.some(e => e.hasSmoked)

      if (!dayHadSmoking) {
        currentStreak++
      } else {
        break
      }
    }

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
