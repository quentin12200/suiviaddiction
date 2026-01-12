import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const entryId = searchParams.get('id')

    if (!entryId) {
      // Retourner les 5 dernières entrées
      const entries = await prisma.entry.findMany({
        orderBy: [
          { date: 'desc' },
          { time: 'desc' },
        ],
        take: 5,
        select: {
          id: true,
          date: true,
          time: true,
          hasSmoked: true,
          jointCount: true,
        }
      })

      type EntryType = typeof entries[number]

      return NextResponse.json({
        message: 'Dernières 5 entrées',
        count: entries.length,
        entries: entries.map((e: EntryType) => ({
          id: e.id,
          viewUrl: `/entry/${e.id}`,
          apiUrl: `/api/entries/${e.id}`,
          date: e.date.toISOString(),
          time: e.time,
          hasSmoked: e.hasSmoked,
          jointCount: e.jointCount,
        }))
      })
    }

    // Tester si l'entrée existe
    const entry = await prisma.entry.findUnique({
      where: { id: entryId }
    })

    if (!entry) {
      return NextResponse.json({
        error: 'Entrée non trouvée',
        entryId,
        suggestion: 'Vérifiez que l\'ID est correct'
      }, { status: 404 })
    }

    return NextResponse.json({
      message: 'Entrée trouvée',
      entry: {
        id: entry.id,
        date: entry.date.toISOString(),
        time: entry.time,
        hasSmoked: entry.hasSmoked,
        jointCount: entry.jointCount,
      },
      viewUrl: `/entry/${entry.id}`,
      apiUrl: `/api/entries/${entry.id}`,
    })

  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
    }, { status: 500 })
  }
}
