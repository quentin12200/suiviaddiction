import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

    // Convertir toutes les entrées avec timestamps
    const entriesWithTimestamps = allEntries.map(entry => {
      const dateStr = entry.date.toISOString().split('T')[0]
      const rawTime = entry.jointTime || entry.time
      const timeParts = rawTime.split(':')
      const timeStr = `${timeParts[0]}:${timeParts[1]}`
      const fullDateTime = new Date(`${dateStr}T${timeStr}:00`)
      const timestamp = fullDateTime.getTime()

      return {
        ...entry,
        dateStr,
        timeStr,
        timestamp,
      }
    })

    // Trier par timestamp décroissant (plus récent en premier)
    const sorted = entriesWithTimestamps.sort((a, b) => b.timestamp - a.timestamp)

    // Chercher la PREMIÈRE entrée où hasSmoked=true
    const lastJoint = sorted.find(entry => entry.hasSmoked === true)

    console.log('🔍 First 5 entries:', sorted.slice(0, 5).map(e => ({
      date: e.dateStr,
      time: e.timeStr,
      hasSmoked: e.hasSmoked,
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
      date: lastJoint.dateStr,
      time: lastJoint.timeStr,
      hasSmoked: lastJoint.hasSmoked,
      timestamp: new Date(lastJoint.timestamp).toLocaleString('fr-FR')
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
