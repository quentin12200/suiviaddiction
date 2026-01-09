import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface Entry {
  id: string
  date: Date
  time: string
  hasSmoked: boolean
  jointCount: number
  jointTime: string | null
  minutesSinceLastJoint: number | null
  cravingLevel: number
  emotionalState: string
  physicalState: string
  context: string
  trigger: string
  alternativeAction: string
  consciousDecision: boolean
  comment: string
  createdAt: Date
  updatedAt: Date
}

/**
 * API route pour récupérer les statistiques du tableau de bord
 */
export async function GET() {
  try {
    console.log('Dashboard API called - Starting...')
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    console.log('Fetching today entries...')
    // Entrées d'aujourd'hui
    const todayEntries = await prisma.entry.findMany({
      where: {
        date: {
          gte: today,
        },
      },
      orderBy: { date: 'desc' },
    })

    // Objectif du jour
    const todayGoal = await prisma.dailyGoal.findUnique({
      where: { date: today },
    })

    // Entrée discipline d'aujourd'hui pour les heures de lever/coucher
    const todayDiscipline = await prisma.disciplineEntry.findFirst({
      where: {
        date: {
          gte: today,
        },
      },
      orderBy: { date: 'desc' },
    })

    // Statistiques sur 7 jours
    const last7DaysEntries = await prisma.entry.findMany({
      where: {
        date: {
          gte: sevenDaysAgo,
        },
      },
      orderBy: { date: 'asc' },
    })

    // Statistiques sur 30 jours
    const last30DaysEntries = await prisma.entry.findMany({
      where: {
        date: {
          gte: thirtyDaysAgo,
        },
      },
      orderBy: { date: 'asc' },
    })

    // Toutes les entrées pour la moyenne historique
    const allEntries = await prisma.entry.findMany()

    // Calculer le nombre de joints aujourd'hui
    const todayJointsCount = todayEntries.reduce(
      (sum: number, entry: Entry) => sum + (entry.hasSmoked ? entry.jointCount : 0),
      0
    )

    // Grouper par jour pour les graphiques
    const groupByDay = (entries: Entry[]) => {
      const grouped: { [key: string]: number } = {}
      entries.forEach((entry) => {
        const dateKey = entry.date.toISOString().split('T')[0]
        if (!grouped[dateKey]) {
          grouped[dateKey] = 0
        }
        if (entry.hasSmoked) {
          grouped[dateKey] += entry.jointCount
        }
      })
      return Object.entries(grouped).map(([date, count]) => ({ date, count }))
    }

    const last7DaysData = groupByDay(last7DaysEntries)
    const last30DaysData = groupByDay(last30DaysEntries)

    // Calculer les moyennes
    const avg7Days =
      last7DaysData.reduce((sum: number, d) => sum + d.count, 0) /
      Math.max(last7DaysData.length, 1)

    const allDaysData = groupByDay(allEntries)
    const avgHistorical =
      allDaysData.reduce((sum: number, d) => sum + d.count, 0) /
      Math.max(allDaysData.length, 1)

    // Calculer le niveau moyen de craving sur 7 jours
    const avg7DaysCraving =
      last7DaysEntries.reduce((sum: number, e: Entry) => sum + e.cravingLevel, 0) /
      Math.max(last7DaysEntries.length, 1)

    return NextResponse.json({
      today: {
        jointsCount: todayJointsCount,
        entriesCount: todayEntries.length,
        goal: todayGoal,
        discipline: todayDiscipline ? {
          wakeUpTime: todayDiscipline.wakeUpTime,
          sleepTime: todayDiscipline.sleepTime,
          exerciseDone: todayDiscipline.exerciseDone,
          selfRating: todayDiscipline.selfRating,
        } : null,
      },
      last7Days: {
        data: last7DaysData,
        average: avg7Days,
        averageCraving: avg7DaysCraving,
      },
      last30Days: {
        data: last30DaysData,
      },
      historical: {
        average: avgHistorical,
      },
    })
  } catch (error) {
    console.error('Erreur dashboard stats:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des statistiques' },
      { status: 500 }
    )
  }
}
