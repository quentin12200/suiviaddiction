import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * API pour récupérer les stats de sobriété
 * - Date et heure du dernier joint
 * - Nombre total de joints
 */
export async function GET() {
  try {
    // Récupérer la dernière entrée avec un joint
    const lastJoint = await prisma.entry.findFirst({
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

    // Compter le nombre total de joints
    const allJoints = await prisma.entry.findMany({
      where: {
        hasSmoked: true,
      },
      select: {
        jointCount: true,
      },
    })

    const totalJoints = allJoints.reduce((sum, entry) => sum + entry.jointCount, 0)

    if (!lastJoint) {
      return NextResponse.json({
        success: true,
        data: {
          lastJointDate: null,
          lastJointTime: null,
          totalJoints: 0,
        },
      })
    }

    const lastJointDate = lastJoint.date.toISOString().split('T')[0]
    const lastJointTime = lastJoint.jointTime || lastJoint.time

    return NextResponse.json({
      success: true,
      data: {
        lastJointDate,
        lastJointTime,
        totalJoints,
      },
    })
  } catch (error) {
    console.error('Erreur récupération stats sobriété:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
