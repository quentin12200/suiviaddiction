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

    // Créer les dates en UTC pour éviter les problèmes de fuseau horaire
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0))
    const tomorrow = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0))
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    console.log('\n========== DASHBOARD DEBUG START ==========')
    console.log('🔍 Current time info:')
    console.log('  Server time (now):', now.toISOString())
    console.log('  Server timezone offset:', now.getTimezoneOffset(), 'minutes')
    console.log('  Today (UTC 00:00):', today.toISOString())
    console.log('  Tomorrow (UTC 00:00):', tomorrow.toISOString())

    console.log('\n📥 Fetching today entries...')
    console.log('  Query: date >= ', today.toISOString(), 'AND date <', tomorrow.toISOString())

    // Entrées d'aujourd'hui (entre minuit aujourd'hui et minuit demain en UTC)
    const todayEntries = await prisma.entry.findMany({
      where: {
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
      orderBy: { date: 'desc' },
    })

    console.log(`\n📊 Entries found for today: ${todayEntries.length}`)

    if (todayEntries.length > 0) {
      console.log('\n📋 Details of TODAY entries:')
      todayEntries.forEach((entry, index) => {
        console.log(`  Entry ${index + 1}:`)
        console.log(`    ID: ${entry.id}`)
        console.log(`    Date (stored): ${entry.date.toISOString()}`)
        console.log(`    Time: ${entry.time}`)
        console.log(`    hasSmoked: ${entry.hasSmoked}`)
        console.log(`    jointCount: ${entry.jointCount}`)
      })
    } else {
      console.log('  ⚠️ NO ENTRIES FOUND for today range!')

      // Essayons de voir toutes les entrées récentes pour comprendre
      const recentEntries = await prisma.entry.findMany({
        orderBy: { date: 'desc' },
        take: 5,
      })
      console.log(`\n📋 Last 5 entries in database (for debugging):`)
      recentEntries.forEach((entry, index) => {
        console.log(`  Entry ${index + 1}:`)
        console.log(`    Date: ${entry.date.toISOString()}`)
        console.log(`    Time: ${entry.time}`)
        console.log(`    hasSmoked: ${entry.hasSmoked}`)
        console.log(`    jointCount: ${entry.jointCount}`)
        console.log(`    createdAt: ${entry.createdAt.toISOString()}`)
      })
    }
    console.log('========== DASHBOARD DEBUG END ==========\n')

    // Objectif du jour
    const todayGoal = await prisma.dailyGoal.findUnique({
      where: { date: today },
    })

    // Entrée discipline d'aujourd'hui pour les heures de lever/coucher
    const todayDiscipline = await prisma.disciplineEntry.findFirst({
      where: {
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
      orderBy: { date: 'desc' },
    })

    console.log('Discipline entry for today:', todayDiscipline ? 'Found' : 'Not found')

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
      (sum: number, entry: Entry) => {
        const count = entry.hasSmoked ? entry.jointCount : 0
        if (count > 0) {
          console.log(`  Entry ${entry.id}: ${count} joint(s) at ${entry.time}`)
        }
        return sum + count
      },
      0
    )

    console.log(`✅ Total joints today: ${todayJointsCount}`)

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

    const response = NextResponse.json({
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

    // Ajouter des headers pour empêcher tout cache
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')

    return response
  } catch (error) {
    console.error('Erreur dashboard stats:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des statistiques' },
      { status: 500 }
    )
  }
}
