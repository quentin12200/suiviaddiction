import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/stats/frequency?days=30
 * Renvoie les cigarettes fumées sur les N derniers jours (une ligne par entrée).
 * Le regroupement par jour et les intervalles sont calculés côté client,
 * avec l'heure locale de l'utilisateur.
 */
export async function GET(request: NextRequest) {
  try {
    const days = Math.min(
      Math.max(parseInt(request.nextUrl.searchParams.get('days') || '30') || 30, 1),
      365
    )

    const since = new Date()
    since.setUTCHours(0, 0, 0, 0)
    since.setUTCDate(since.getUTCDate() - days)

    const entries = await prisma.entry.findMany({
      where: { hasSmoked: true, date: { gte: since } },
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
      select: {
        id: true,
        date: true,
        time: true,
        jointTime: true,
        jointCount: true,
        cravingLevel: true,
        trigger: true,
        context: true,
      },
    })

    type Row = (typeof entries)[number]

    // Record d'abstinence : plus long écart entre deux cigarettes, sur tout l'historique
    const allSmoked = await prisma.entry.findMany({
      where: { hasSmoked: true },
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
      select: { date: true, time: true, jointTime: true },
    })
    type SmokedRow = (typeof allSmoked)[number]
    const points = allSmoked
      .map((e: SmokedRow) => {
        const date = e.date.toISOString().split('T')[0]
        const time = (e.jointTime || e.time || '00:00').slice(0, 5)
        return { date, time, ts: new Date(`${date}T${time}:00Z`).getTime() }
      })
      .filter((p: { ts: number }) => !isNaN(p.ts))
      .sort((a: { ts: number }, b: { ts: number }) => a.ts - b.ts)

    let record: { from: { date: string; time: string }; to: { date: string; time: string }; durationMs: number } | null = null
    for (let i = 1; i < points.length; i++) {
      const gap = points[i].ts - points[i - 1].ts
      if (!record || gap > record.durationMs) {
        record = {
          from: { date: points[i - 1].date, time: points[i - 1].time },
          to: { date: points[i].date, time: points[i].time },
          durationMs: gap,
        }
      }
    }
    const last = points.length > 0 ? points[points.length - 1] : null

    const response = NextResponse.json({
      success: true,
      record,
      lastSmoked: last ? { date: last.date, time: last.time } : null,
      entries: entries.map((e: Row) => ({
        id: e.id,
        date: e.date.toISOString().split('T')[0],
        time: e.jointTime || e.time,
        count: e.jointCount || 1,
        cravingLevel: e.cravingLevel,
        trigger: e.trigger,
        context: e.context,
      })),
    })
    response.headers.set('Cache-Control', 'no-store, max-age=0')
    return response
  } catch (error) {
    console.error('Erreur stats fréquence:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors du calcul de la fréquence' },
      { status: 500 }
    )
  }
}
