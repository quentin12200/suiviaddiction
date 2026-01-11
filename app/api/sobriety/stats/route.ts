import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * API pour récupérer les stats de sobriété
 * - Date et heure du dernier joint
 */
export async function GET() {
  try {
    console.log('🔍 [SOBRIETY API] Starting query...')

    // Récupérer TOUTES les entrées avec joint, triées par date décroissante
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
      },
      take: 50, // Prendre les 50 derniers pour être sûr
    })

    console.log(`📊 [SOBRIETY API] Found ${allJoints.length} joints in database`)

    // Log les 5 premiers pour debug
    if (allJoints.length > 0) {
      console.log('🔝 [SOBRIETY API] Top 5 entries from DB (before sorting):')
      allJoints.slice(0, 5).forEach((joint, idx) => {
        console.log(`  ${idx + 1}. ID: ${joint.id}`)
        console.log(`     Date: ${joint.date.toISOString()}`)
        console.log(`     Time: ${joint.time}`)
        console.log(`     JointTime: ${joint.jointTime}`)
      })
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

    // Trier par date + heure combinées pour avoir LE PLUS RÉCENT
    const sortedJoints = allJoints
      .map(joint => {
        const dateStr = joint.date.toISOString().split('T')[0]
        const timeStr = (joint.jointTime || joint.time).replace(':00', '') // Enlever les secondes si présentes
        const fullDateTime = new Date(`${dateStr}T${timeStr}:00.000Z`)

        return {
          ...joint,
          dateStr,
          timeStr,
          fullDateTime,
          timestamp: fullDateTime.getTime(),
        }
      })
      .sort((a, b) => b.timestamp - a.timestamp)

    console.log('📋 [SOBRIETY API] After sorting, top 5:')
    sortedJoints.slice(0, 5).forEach((joint, idx) => {
      console.log(`  ${idx + 1}. ${joint.dateStr} ${joint.timeStr} (timestamp: ${joint.timestamp})`)
    })

    const lastJoint = sortedJoints[0]

    console.log('🚬 [SOBRIETY API] SELECTED as last joint:', {
      id: lastJoint.id,
      date: lastJoint.dateStr,
      time: lastJoint.timeStr,
      timestamp: lastJoint.timestamp,
      fullDateTime: lastJoint.fullDateTime.toISOString(),
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
    console.error('❌ Erreur récupération stats sobriété:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
