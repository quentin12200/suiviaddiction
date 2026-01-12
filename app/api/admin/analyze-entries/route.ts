import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Analyser quelques entrées pour comprendre leur structure
 */
export async function GET() {
  try {
    const entries = await prisma.entry.findMany({
      orderBy: [
        { date: 'desc' },
        { time: 'desc' },
      ],
      take: 50,
    })

    type EntryType = typeof entries[number]
    const analysis = entries.map((e: EntryType) => ({
      id: e.id,
      date: e.date.toISOString().split('T')[0],
      time: e.time,
      hasSmoked: e.hasSmoked,
      jointCount: e.jointCount,
      jointTime: e.jointTime,
      alternativeAction: e.alternativeAction ? 'OUI' : 'NON',
      consciousDecision: e.consciousDecision,
      trigger: e.trigger || 'vide',
      cravingLevel: e.cravingLevel,
      comment: e.comment ? e.comment.substring(0, 50) : 'vide',
    }))

    return NextResponse.json({
      success: true,
      total: entries.length,
      entries: analysis,
    })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
