import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * API temporaire pour debug - Liste toutes les entrées d'aujourd'hui
 */
export async function GET() {
  try {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const todayStr = `${year}-${month}-${day}`

    console.log('🔍 [DEBUG] Fetching all entries for date:', todayStr)

    const todayEntries = await prisma.entry.findMany({
      where: {
        date: {
          gte: new Date(`${todayStr}T00:00:00.000Z`),
          lt: new Date(`${todayStr}T23:59:59.999Z`),
        },
      },
      orderBy: [
        { date: 'desc' },
        { time: 'desc' },
      ],
      select: {
        id: true,
        date: true,
        time: true,
        hasSmoked: true,
        jointCount: true,
        jointTime: true,
        cravingLevel: true,
        emotionalState: true,
        context: true,
      },
    })

    console.log(`📊 [DEBUG] Found ${todayEntries.length} entries for today`)

    todayEntries.forEach((entry, idx) => {
      console.log(`  ${idx + 1}. ${entry.time} - Fumé: ${entry.hasSmoked} - Joints: ${entry.jointCount}`)
    })

    return NextResponse.json({
      success: true,
      todayDate: todayStr,
      totalEntries: todayEntries.length,
      entries: todayEntries.map(e => ({
        id: e.id,
        date: e.date.toISOString().split('T')[0],
        time: e.time,
        jointTime: e.jointTime,
        hasSmoked: e.hasSmoked,
        jointCount: e.jointCount,
        cravingLevel: e.cravingLevel,
        emotionalState: e.emotionalState,
        context: e.context,
      })),
    })
  } catch (error) {
    console.error('❌ [DEBUG] Error:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
