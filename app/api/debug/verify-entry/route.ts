import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Vérifier si une entrée spécifique existe dans la base de données
 * Usage: /api/debug/verify-entry?time=15:49&date=2026-01-12
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const time = searchParams.get('time')
    const date = searchParams.get('date')

    if (!time && !date) {
      // Si aucun paramètre, retourner toutes les entrées d'aujourd'hui
      const today = new Date()
      const todayStr = today.toISOString().split('T')[0]

      const allEntries = await prisma.entry.findMany({
        orderBy: [
          { date: 'desc' },
          { time: 'desc' },
        ],
        take: 50,
      })

      const todayEntries = allEntries.filter(e => {
        const entryDateStr = e.date.toISOString().split('T')[0]
        return entryDateStr === todayStr
      })

      return NextResponse.json({
        success: true,
        message: 'Toutes les entrées d\'aujourd\'hui',
        todayDate: todayStr,
        totalFound: todayEntries.length,
        entries: todayEntries.map(e => ({
          id: e.id,
          date: e.date.toISOString().split('T')[0],
          time: e.time,
          jointTime: e.jointTime,
          hasSmoked: e.hasSmoked,
          jointCount: e.jointCount,
          createdAt: e.createdAt.toISOString(),
        })),
      })
    }

    // Rechercher une entrée spécifique par heure et date
    const allEntries = await prisma.entry.findMany({
      orderBy: [
        { date: 'desc' },
        { time: 'desc' },
      ],
      take: 100,
    })

    const matchingEntries = allEntries.filter(e => {
      const entryDateStr = e.date.toISOString().split('T')[0]
      const entryTime = e.jointTime || e.time

      const dateMatch = date ? entryDateStr === date : true
      const timeMatch = time ? entryTime === time : true

      return dateMatch && timeMatch
    })

    return NextResponse.json({
      success: true,
      searchCriteria: { time, date },
      totalFound: matchingEntries.length,
      found: matchingEntries.length > 0,
      entries: matchingEntries.map(e => ({
        id: e.id,
        date: e.date.toISOString().split('T')[0],
        time: e.time,
        jointTime: e.jointTime,
        hasSmoked: e.hasSmoked,
        jointCount: e.jointCount,
        createdAt: e.createdAt.toISOString(),
        message: matchingEntries.length > 0 ? 'TROUVÉE dans la base de données' : 'NON TROUVÉE',
      })),
      allEntriesChecked: allEntries.length,
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 })
  }
}
