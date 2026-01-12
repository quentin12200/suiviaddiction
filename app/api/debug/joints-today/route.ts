import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * API de debug pour comparer le comptage des joints aujourd'hui
 */
export async function GET(request: NextRequest) {
  try {
    const now = new Date()

    // Méthode 1: UTC (comme le dashboard)
    const todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0))
    const tomorrowUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0))

    const entriesUTC = await prisma.entry.findMany({
      where: {
        date: {
          gte: todayUTC,
          lt: tomorrowUTC,
        },
      },
      orderBy: [
        { date: 'desc' },
        { time: 'desc' },
      ],
    })

    type UTCEntryType = typeof entriesUTC[number]

    const jointsCountUTC = entriesUTC.reduce((sum: number, entry: UTCEntryType) => {
      return sum + (entry.hasSmoked ? entry.jointCount : 0)
    }, 0)

    // Méthode 2: Toutes les entrées pour voir la date
    const allEntries = await prisma.entry.findMany({
      orderBy: [
        { date: 'desc' },
        { time: 'desc' },
      ],
      take: 10,
    })

    type AllEntryType = typeof allEntries[number]

    // Méthode 3: Compter manuellement pour aujourd'hui (date string)
    const todayDateString = now.toISOString().split('T')[0] // "2026-01-10"

    const manualCount = allEntries.reduce((sum: number, entry: AllEntryType) => {
      const entryDateString = entry.date.toISOString().split('T')[0]
      if (entryDateString === todayDateString && entry.hasSmoked) {
        return sum + entry.jointCount
      }
      return sum
    }, 0)

    return NextResponse.json({
      serverTime: {
        now: now.toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timezoneOffset: now.getTimezoneOffset(),
      },
      ranges: {
        todayUTC: todayUTC.toISOString(),
        tomorrowUTC: tomorrowUTC.toISOString(),
        todayDateString,
      },
      method1_UTC: {
        entriesFound: entriesUTC.length,
        jointsCount: jointsCountUTC,
        entries: entriesUTC.map((e: UTCEntryType) => ({
          id: e.id,
          date: e.date.toISOString(),
          time: e.time,
          hasSmoked: e.hasSmoked,
          jointCount: e.jointCount,
        })),
      },
      method2_Manual: {
        entriesChecked: allEntries.length,
        jointsCount: manualCount,
        todayEntries: allEntries
          .filter((e: AllEntryType) => e.date.toISOString().split('T')[0] === todayDateString)
          .map((e: AllEntryType) => ({
            id: e.id,
            date: e.date.toISOString(),
            time: e.time,
            hasSmoked: e.hasSmoked,
            jointCount: e.jointCount,
          })),
      },
      allRecentEntries: allEntries.map((e: AllEntryType) => ({
        id: e.id,
        date: e.date.toISOString(),
        dateString: e.date.toISOString().split('T')[0],
        time: e.time,
        hasSmoked: e.hasSmoked,
        jointCount: e.jointCount,
        createdAt: e.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('❌ Erreur debug joints:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
