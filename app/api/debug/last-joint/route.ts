import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Endpoint de debug pour voir ce que l'API sobriety/stats retourne
 */
export async function GET() {
  try {
    // Récupérer TOUTES les entrées où hasSmoked=true
    const allJoints = await prisma.entry.findMany({
      where: {
        hasSmoked: true,
      },
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
    })

    console.log('📊 DEBUG - Total entries with hasSmoked=true:', allJoints.length)

    // Calculer le timestamp pour chaque entrée
    const withTimestamps = allJoints.map(joint => {
      const dateStr = joint.date.toISOString().split('T')[0]
      const rawTime = joint.jointTime || joint.time
      const timeParts = rawTime.split(':')
      const timeStr = `${timeParts[0]}:${timeParts[1]}`

      // Sans .000Z pour heure locale
      const fullDateTime = new Date(`${dateStr}T${timeStr}:00`)
      const timestamp = fullDateTime.getTime()

      return {
        id: joint.id,
        date: dateStr,
        time: timeStr,
        jointTime: joint.jointTime,
        rawTime: joint.time,
        jointCount: joint.jointCount,
        timestamp: timestamp,
        dateReadable: fullDateTime.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }),
      }
    })

    // Trier par timestamp
    const sorted = withTimestamps.sort((a, b) => b.timestamp - a.timestamp)

    const lastJoint = sorted[0]

    return NextResponse.json({
      success: true,
      totalFound: allJoints.length,
      lastJoint: lastJoint ? {
        id: lastJoint.id,
        date: lastJoint.date,
        time: lastJoint.time,
        jointTime: lastJoint.jointTime,
        rawTime: lastJoint.rawTime,
        jointCount: lastJoint.jointCount,
        timestamp: lastJoint.timestamp,
        dateReadable: lastJoint.dateReadable,
      } : null,
      first10: sorted.slice(0, 10).map(j => ({
        id: j.id,
        date: j.date,
        time: j.time,
        jointCount: j.jointCount,
        dateReadable: j.dateReadable,
      })),
    })
  } catch (error) {
    console.error('Erreur debug:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
