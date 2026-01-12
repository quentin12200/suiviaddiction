import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Debug endpoint to see raw sobriety stats calculation
 * Shows step-by-step what the sobriety stats API is doing
 */
export async function GET() {
  try {
    const fetchTime = new Date().toISOString()

    // Same query as sobriety stats
    const allEntries = await prisma.entry.findMany({
      orderBy: [
        { date: 'desc' },
        { time: 'desc' },
      ],
      select: {
        id: true,
        date: true,
        jointTime: true,
        time: true,
        hasSmoked: true,
        jointCount: true,
      },
      take: 100,
    })

    console.log('🔍 Debug Sobriety Raw - Total entries:', allEntries.length)

    type EntryType = typeof allEntries[number]

    // Map with timestamps (same as sobriety stats)
    const entriesWithTimestampsMapped = allEntries.map((entry: EntryType) => {
      try {
        const dateStr = entry.date.toISOString().split('T')[0]
        const rawTime = entry.jointTime || entry.time

        if (!rawTime || typeof rawTime !== 'string') {
          return null
        }

        const timeParts = rawTime.split(':')
        if (timeParts.length < 2) {
          return null
        }

        const timeStr = `${timeParts[0].padStart(2, '0')}:${timeParts[1].padStart(2, '0')}`
        const fullDateTime = new Date(`${dateStr}T${timeStr}:00`)

        if (isNaN(fullDateTime.getTime())) {
          return null
        }

        const timestamp = fullDateTime.getTime()

        return {
          ...entry,
          dateStr,
          timeStr,
          timestamp,
        }
      } catch (error) {
        return null
      }
    })

    type MappedEntry = typeof entriesWithTimestampsMapped[number]
    const entriesWithTimestamps = entriesWithTimestampsMapped.filter((e: MappedEntry): e is NonNullable<typeof e> => e !== null)

    type WithTimestamp = typeof entriesWithTimestamps[number]
    const sorted = entriesWithTimestamps.sort((a: WithTimestamp, b: WithTimestamp) => b.timestamp - a.timestamp)

    // Find first smoked entry
    const lastJoint = sorted.find((entry: WithTimestamp) => entry.hasSmoked === true)

    return NextResponse.json({
      success: true,
      fetchTime,
      debugInfo: {
        totalFetched: allEntries.length,
        validAfterMapping: entriesWithTimestamps.length,
        invalidFiltered: allEntries.length - entriesWithTimestamps.length,
      },
      first10Entries: sorted.slice(0, 10).map((e: WithTimestamp) => ({
        id: e.id.substring(0, 8),
        date: e.dateStr,
        time: e.timeStr,
        hasSmoked: e.hasSmoked ? '🚬 OUI' : '✅ NON',
        jointCount: e.jointCount,
        timestamp: new Date(e.timestamp).toLocaleString('fr-FR'),
      })),
      detectedLastJoint: lastJoint ? {
        id: lastJoint.id,
        date: lastJoint.dateStr,
        time: lastJoint.timeStr,
        fullTimestamp: new Date(lastJoint.timestamp).toLocaleString('fr-FR'),
        message: '👆 This is what should appear in the timer',
      } : null,
      apiWouldReturn: {
        success: true,
        data: {
          lastJointDate: lastJoint?.dateStr || null,
          lastJointTime: lastJoint?.timeStr || null,
        }
      }
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    })
  } catch (error) {
    console.error('Error in debug sobriety raw:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
