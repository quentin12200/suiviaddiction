import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * API pour récupérer les stats de sobriété
 * - Date et heure du dernier joint
 */
export async function GET() {
  try {
    // Récupérer les entrées avec joint, triées par date décroissante
    const allJoints = await prisma.entry.findMany({
      where: {
        hasSmoked: true,
        jointCount: {
          gt: 0,
        },
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
      take: 50,
    })

    console.log('🔍 Sobriety stats - Total joints found:', allJoints.length)
    if (allJoints.length > 0) {
      console.log('🔍 First 3 joints:', allJoints.slice(0, 3).map(j => ({
        date: j.date,
        jointTime: j.jointTime,
        time: j.time,
        hasSmoked: j.hasSmoked,
        jointCount: j.jointCount
      })))
    }

    if (allJoints.length === 0) {
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

    // Trier par date + heure combinées pour avoir le plus récent
    const sortedJoints = allJoints
      .map(joint => {
        const dateStr = joint.date.toISOString().split('T')[0]
        const rawTime = joint.jointTime || joint.time
        const timeParts = rawTime.split(':')
        const timeStr = `${timeParts[0]}:${timeParts[1]}`
        const fullDateTime = new Date(`${dateStr}T${timeStr}:00.000Z`)
        const timestamp = fullDateTime.getTime()

        return {
          ...joint,
          dateStr,
          timeStr,
          timestamp,
        }
      })
      .sort((a, b) => b.timestamp - a.timestamp)

    const lastJoint = sortedJoints[0]

    console.log('✅ Last joint selected:', {
      date: lastJoint.dateStr,
      time: lastJoint.timeStr,
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
