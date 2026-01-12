import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic - never cached
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * API pour récupérer les stats de sobriété
 * - Date et heure du dernier joint
 */
export async function GET() {
  try {
    // NOUVELLE APPROCHE SIMPLE : Récupérer TOUTES les entrées récentes
    // Puis chercher la première où hasSmoked=true
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
      take: 100, // Prendre les 100 dernières entrées pour être sûr
    })

    console.log('🔍 Sobriety stats - Total entries checked:', allEntries.length)

    type EntryType = typeof allEntries[number]

    // Convertir toutes les entrées avec timestamps
    const entriesWithTimestampsMapped = allEntries.map((entry: EntryType) => {
      try {
        const dateStr = entry.date.toISOString().split('T')[0]
        const rawTime = entry.jointTime || entry.time

        // Validation: s'assurer que rawTime est bien au format HH:MM
        if (!rawTime || typeof rawTime !== 'string') {
          console.error('❌ Invalid time format for entry:', entry.id, rawTime)
          return null
        }

        const timeParts = rawTime.split(':')
        if (timeParts.length < 2) {
          console.error('❌ Time missing parts for entry:', entry.id, rawTime)
          return null
        }

        const timeStr = `${timeParts[0].padStart(2, '0')}:${timeParts[1].padStart(2, '0')}`
        const fullDateTime = new Date(`${dateStr}T${timeStr}:00`)

        // Vérifier que la date est valide
        if (isNaN(fullDateTime.getTime())) {
          console.error('❌ Invalid datetime for entry:', entry.id, dateStr, timeStr)
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
        console.error('❌ Error processing entry:', entry.id, error)
        return null
      }
    })

    type MappedEntry = typeof entriesWithTimestampsMapped[number]

    // Filter out null values
    const entriesWithTimestamps = entriesWithTimestampsMapped.filter((e: MappedEntry): e is NonNullable<typeof e> => e !== null)

    type WithTimestamp = typeof entriesWithTimestamps[number]

    // Trier par timestamp décroissant (plus récent en premier)
    const sorted = entriesWithTimestamps.sort((a: WithTimestamp, b: WithTimestamp) => b.timestamp - a.timestamp)

    // Chercher la PREMIÈRE entrée où hasSmoked=true
    const lastJoint = sorted.find((entry: WithTimestamp) => entry.hasSmoked === true)

    console.log('🔍 First 10 entries (sorted by timestamp):', sorted.slice(0, 10).map((e: WithTimestamp) => ({
      id: e.id.substring(0, 8),
      date: e.dateStr,
      time: e.timeStr,
      hasSmoked: e.hasSmoked,
      jointCount: e.jointCount,
      timestamp: new Date(e.timestamp).toLocaleString('fr-FR'),
    })))

    if (!lastJoint) {
      console.log('⚠️ No entry with hasSmoked=true found')
      return NextResponse.json(
        {
          success: true,
          data: {
            lastJointDate: null,
            lastJointTime: null,
          },
        },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        }
      )
    }

    console.log('✅ Last joint found:', {
      id: lastJoint.id.substring(0, 8),
      date: lastJoint.dateStr,
      time: lastJoint.timeStr,
      hasSmoked: lastJoint.hasSmoked,
      jointCount: lastJoint.jointCount,
      timestamp: new Date(lastJoint.timestamp).toLocaleString('fr-FR'),
      rawEntry: {
        jointTime: lastJoint.jointTime,
        time: lastJoint.time,
      }
    })

    console.log('📤 Returning to client:', {
      lastJointDate: lastJoint.dateStr,
      lastJointTime: lastJoint.timeStr,
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          lastJointDate: lastJoint.dateStr,
          lastJointTime: lastJoint.timeStr,
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store',
        },
      }
    )
  } catch (error) {
    console.error('Erreur récupération stats sobriété:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
