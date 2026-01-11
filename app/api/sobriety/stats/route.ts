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

        // Récupérer l'heure (jointTime en priorité, sinon time)
        let rawTime = joint.jointTime || joint.time

        // Normaliser le format : garder seulement HH:mm
        // Gérer les formats possibles: "HH:mm", "HH:mm:ss", etc.
        const timeParts = rawTime.split(':')
        const timeStr = `${timeParts[0]}:${timeParts[1]}` // Garder seulement HH:mm

        // Construire le datetime complet
        const fullDateTime = new Date(`${dateStr}T${timeStr}:00.000Z`)
        const timestamp = fullDateTime.getTime()

        console.log(`  🕐 Processing: ${dateStr} ${rawTime} → ${timeStr} → timestamp ${timestamp}`)

        return {
          ...joint,
          dateStr,
          timeStr,
          fullDateTime,
          timestamp,
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

    // Retourner aussi les 5 dernières entrées pour debug côté client
    const last5 = sortedJoints.slice(0, 5).map(j => ({
      id: j.id,
      date: j.dateStr,
      time: j.timeStr,
      timestamp: j.timestamp,
    }))

    console.log('📤 [SOBRIETY API] Returning data with', last5.length, 'entries for debug')

    return NextResponse.json(
      {
        success: true,
        data: {
          lastJointDate: lastJoint.dateStr,
          lastJointTime: lastJoint.timeStr,
          totalJointsInDb: allJoints.length,
          last5Joints: last5, // Pour voir dans console navigateur
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
