import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * API pour récupérer les stats de sobriété
 * - Date et heure du dernier joint
 * - Nombre total de joints
 */
export async function GET() {
  try {
    // Récupérer TOUTES les entrées avec joint pour trier correctement
    const allJoints = await prisma.entry.findMany({
      where: {
        hasSmoked: true,
        jointCount: {
          gt: 0,
        },
      },
      orderBy: {
        date: 'desc',
      },
      select: {
        date: true,
        jointTime: true,
        time: true,
      },
    })

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

    // Trier par date ET heure pour avoir le plus récent
    const sortedJoints = allJoints.sort((a, b) => {
      const dateA = new Date(`${a.date.toISOString().split('T')[0]}T${a.jointTime || a.time}:00`)
      const dateB = new Date(`${b.date.toISOString().split('T')[0]}T${b.jointTime || b.time}:00`)
      return dateB.getTime() - dateA.getTime()
    })

    const lastJoint = sortedJoints[0]
    const lastJointDate = lastJoint.date.toISOString().split('T')[0]
    const lastJointTime = lastJoint.jointTime || lastJoint.time

    console.log('🚬 Last joint found:', { lastJointDate, lastJointTime })

    return NextResponse.json(
      {
        success: true,
        data: {
          lastJointDate,
          lastJointTime,
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
  } catch (error) {
    console.error('Erreur récupération stats sobriété:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
