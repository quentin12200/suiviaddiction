import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const now = new Date()
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0))
    const tomorrow = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0))

    // Récupérer les 10 dernières entrées
    const allEntries = await prisma.entry.findMany({
      orderBy: [
        { date: 'desc' },
        { time: 'desc' },
      ],
      take: 10,
      select: {
        id: true,
        date: true,
        time: true,
        hasSmoked: true,
        jointCount: true,
        createdAt: true,
      }
    })

    // Entrées d'aujourd'hui
    const todayEntries = await prisma.entry.findMany({
      where: {
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
      select: {
        id: true,
        date: true,
        time: true,
        hasSmoked: true,
        jointCount: true,
      }
    })

    type TodayEntryType = typeof todayEntries[number]
    type AllEntryType = typeof allEntries[number]

    const totalJoints = todayEntries.reduce((sum: number, e: TodayEntryType) => sum + (e.hasSmoked ? e.jointCount : 0), 0)

    return NextResponse.json({
      serverInfo: {
        currentTime: now.toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timezoneOffset: now.getTimezoneOffset(),
      },
      searchRange: {
        todayStart: today.toISOString(),
        tomorrowStart: tomorrow.toISOString(),
      },
      results: {
        totalEntriesInDatabase: await prisma.entry.count(),
        todayEntriesFound: todayEntries.length,
        totalJointsToday: totalJoints,
      },
      todayEntries: todayEntries.map((e: TodayEntryType) => ({
        id: e.id,
        date: e.date.toISOString(),
        time: e.time,
        hasSmoked: e.hasSmoked,
        jointCount: e.jointCount,
      })),
      last10Entries: allEntries.map((e: AllEntryType) => ({
        id: e.id,
        date: e.date.toISOString(),
        time: e.time,
        hasSmoked: e.hasSmoked,
        jointCount: e.jointCount,
        createdAt: e.createdAt.toISOString(),
      })),
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
    }, { status: 500 })
  }
}
