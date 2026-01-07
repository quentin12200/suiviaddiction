import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET - Récupérer tous les objectifs
 */
export async function GET() {
  try {
    const goals = await prisma.dailyGoal.findMany({
      orderBy: { date: 'desc' },
    })

    return NextResponse.json({ goals })
  } catch (error) {
    console.error('Erreur récupération objectifs:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des objectifs' },
      { status: 500 }
    )
  }
}

/**
 * POST - Créer ou mettre à jour un objectif
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Vérifier si un objectif existe déjà pour cette date
    const existingGoal = await prisma.dailyGoal.findUnique({
      where: { date: new Date(body.date) },
    })

    let goal
    if (existingGoal) {
      // Mettre à jour l'objectif existant
      goal = await prisma.dailyGoal.update({
        where: { id: existingGoal.id },
        data: {
          maxJoints: body.maxJoints,
          minIntervalMinutes: body.minIntervalMinutes,
          note: body.note || '',
        },
      })
    } else {
      // Créer un nouvel objectif
      goal = await prisma.dailyGoal.create({
        data: {
          date: new Date(body.date),
          maxJoints: body.maxJoints,
          minIntervalMinutes: body.minIntervalMinutes,
          note: body.note || '',
        },
      })
    }

    return NextResponse.json({ success: true, goal })
  } catch (error) {
    console.error('Erreur création/màj objectif:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création/mise à jour de l\'objectif' },
      { status: 500 }
    )
  }
}
