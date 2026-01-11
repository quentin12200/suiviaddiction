import { NextRequest, NextResponse } from 'next/server'
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
 * SYSTÈME DE COMPTAGE BASÉ SUR LA DATE LOCALE DU CLIENT
 * Le client envoie sa date locale via ?today=2026-01-10
 * Plus de problèmes de timezone UTC vs local !
 */
export async function GET(request: NextRequest) {
  try {
    console.log('\n========== DASHBOARD API v3 (CLIENT DATE) START ==========')

    // Récupérer la date locale du client depuis les query params
    const searchParams = request.nextUrl.searchParams
    const todayString = searchParams.get('today')

    if (!todayString) {
      return NextResponse.json(
        { error: 'Paramètre "today" manquant' },
        { status: 400 }
      )
    }

    console.log(`📅 Today's date (CLIENT LOCAL): ${todayString}`)

    // Récupérer TOUTES les entrées (on filtre en mémoire avec des strings)
    const allEntries = await prisma.entry.findMany({
      orderBy: { date: 'desc' },
    })

    console.log(`📊 Total entries in database: ${allEntries.length}`)

    // Filtrer les entrées d'aujourd'hui en comparant les strings
    const todayEntries = allEntries.filter(entry => {
      const entryDateString = entry.date.toISOString().split('T')[0]
      return entryDateString === todayString
    })

    // Pour calculer les périodes (7 jours, 30 jours)
    const now = new Date()

    console.log(`\n✅ Entries found for today (${todayString}): ${todayEntries.length}`)

    if (todayEntries.length > 0) {
      console.log('\n📋 Today\'s entries details:')
      todayEntries.forEach((entry, index) => {
        const entryJoints = entry.hasSmoked ? entry.jointCount : 0
        console.log(`  ${index + 1}. ID: ${entry.id}`)
        console.log(`     Date: ${entry.date.toISOString()}`)
        console.log(`     Time: ${entry.time}`)
        console.log(`     Has smoked: ${entry.hasSmoked}`)
        console.log(`     Joint count: ${entryJoints}`)
      })
    } else {
      console.log('  ⚠️ NO ENTRIES for today!')
      const recentEntries = allEntries.slice(0, 5)
      console.log('\n📋 Last 5 entries in database:')
      recentEntries.forEach((entry, index) => {
        console.log(`  ${index + 1}. Date: ${entry.date.toISOString()} | Time: ${entry.time} | Smoked: ${entry.hasSmoked} | Count: ${entry.jointCount}`)
      })
    }

    // Compter les joints aujourd'hui (MÉTHODE SIMPLE)
    const todayJointsCount = todayEntries.reduce((sum, entry) => {
      return sum + (entry.hasSmoked ? entry.jointCount : 0)
    }, 0)

    console.log(`\n🎯 TOTAL JOINTS TODAY: ${todayJointsCount}`)

    // Objectif du jour - utiliser aussi une string pour la recherche
    const todayMidnight = new Date(todayString + 'T00:00:00.000Z')
    const tomorrowMidnight = new Date(todayString + 'T23:59:59.999Z')

    const todayGoal = await prisma.dailyGoal.findFirst({
      where: {
        date: {
          gte: todayMidnight,
          lte: tomorrowMidnight,
        }
      }
    })

    // Discipline du jour
    const todayDiscipline = await prisma.disciplineEntry.findFirst({
      where: {
        date: {
          gte: todayMidnight,
          lte: tomorrowMidnight,
        }
      },
      orderBy: { date: 'desc' },
    })

    // Statistiques 7 derniers jours (avec strings)
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const sevenDaysAgoString = sevenDaysAgo.toISOString().split('T')[0]

    const last7DaysEntries = allEntries.filter(entry => {
      const entryDateString = entry.date.toISOString().split('T')[0]
      return entryDateString >= sevenDaysAgoString && entryDateString <= todayString
    })

    // Statistiques 30 derniers jours (avec strings)
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const thirtyDaysAgoString = thirtyDaysAgo.toISOString().split('T')[0]

    const last30DaysEntries = allEntries.filter(entry => {
      const entryDateString = entry.date.toISOString().split('T')[0]
      return entryDateString >= thirtyDaysAgoString && entryDateString <= todayString
    })

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
      return Object.entries(grouped)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)) // Trier par date
    }

    const last7DaysData = groupByDay(last7DaysEntries)
    const last30DaysData = groupByDay(last30DaysEntries)
    const allDaysData = groupByDay(allEntries)

    // Calculer les moyennes
    const avg7Days =
      last7DaysData.reduce((sum, d) => sum + d.count, 0) /
      Math.max(last7DaysData.length, 1)

    const avgHistorical =
      allDaysData.reduce((sum, d) => sum + d.count, 0) /
      Math.max(allDaysData.length, 1)

    // Calculer le niveau moyen de craving sur 7 jours
    const avg7DaysCraving =
      last7DaysEntries.reduce((sum, e) => sum + e.cravingLevel, 0) /
      Math.max(last7DaysEntries.length, 1)

    const responseData = {
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
    }

    console.log('========== DASHBOARD API v2 END ==========\n')

    const response = NextResponse.json(responseData)

    // Headers anti-cache CRITIQUES
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('Surrogate-Control', 'no-store')

    return response
  } catch (error) {
    console.error('❌ Erreur dashboard stats:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des statistiques' },
      { status: 500 }
    )
  }
}
