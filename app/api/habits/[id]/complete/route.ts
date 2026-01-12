import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST - Marquer une habitude comme complétée pour une date
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const date = body.date ? new Date(body.date) : new Date()

    // Normaliser la date à minuit UTC
    date.setUTCHours(0, 0, 0, 0)

    console.log('✅ Marquage habitude complétée:', {
      habitId: params.id,
      date: date.toISOString(),
    })

    // Vérifier si une complétion existe déjà pour cette date
    const existing = await prisma.habitCompletion.findUnique({
      where: {
        habitId_date: {
          habitId: params.id,
          date: date,
        },
      },
    })

    let completion

    if (existing) {
      // Mettre à jour la complétion existante
      completion = await prisma.habitCompletion.update({
        where: { id: existing.id },
        data: {
          completed: body.completed !== undefined ? body.completed : true,
          value: body.value !== undefined ? parseInt(body.value) : null,
          duration: body.duration !== undefined ? parseInt(body.duration) : null,
          note: body.note || '',
          difficulty: body.difficulty || null,
          mood: body.mood || null,
          rewardClaimed: body.rewardClaimed || false,
        },
      })
    } else {
      // Créer une nouvelle complétion
      completion = await prisma.habitCompletion.create({
        data: {
          habitId: params.id,
          date: date,
          completed: body.completed !== undefined ? body.completed : true,
          value: body.value !== undefined ? parseInt(body.value) : null,
          duration: body.duration !== undefined ? parseInt(body.duration) : null,
          note: body.note || '',
          difficulty: body.difficulty || null,
          mood: body.mood || null,
          rewardClaimed: body.rewardClaimed || false,
        },
      })
    }

    // Récupérer l'habitude avec toutes ses complétions pour calculer les stats
    const habit = await prisma.atomicHabit.findUnique({
      where: { id: params.id },
      include: {
        completions: {
          orderBy: { date: 'desc' },
          take: 30,
        },
      },
    })

    if (!habit) {
      return NextResponse.json(
        { success: false, error: 'Habitude non trouvée' },
        { status: 404 }
      )
    }

    type CompletionType = typeof habit.completions[number]

    // Calculer les stats
    const stats = {
      currentStreak: calculateCurrentStreak(habit.completions),
      totalCompletions: habit.completions.filter((c: CompletionType) => c.completed).length,
    }

    return NextResponse.json({
      success: true,
      completion,
      stats,
      message: completion.completed ? '✅ Habitude complétée !' : '❌ Habitude marquée comme non complétée',
    })
  } catch (error) {
    console.error('Erreur marquage habitude:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors du marquage' },
      { status: 500 }
    )
  }
}

/**
 * GET - Récupérer les complétions d'une habitude
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const completions = await prisma.habitCompletion.findMany({
      where: {
        habitId: params.id,
        ...(startDate && { date: { gte: new Date(startDate) } }),
        ...(endDate && { date: { lte: new Date(endDate) } }),
      },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json({
      success: true,
      completions,
    })
  } catch (error) {
    console.error('Erreur récupération complétions:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération' },
      { status: 500 }
    )
  }
}

// Calculer le streak actuel
function calculateCurrentStreak(completions: Array<{ date: Date; completed: boolean }>): number {
  if (completions.length === 0) return 0

  // Trier par date desc
  const sorted = [...completions].sort((a, b) => b.date.getTime() - a.date.getTime())

  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < sorted.length; i++) {
    const completionDate = new Date(sorted[i].date)
    completionDate.setHours(0, 0, 0, 0)

    const daysDiff = Math.floor((today.getTime() - completionDate.getTime()) / (1000 * 60 * 60 * 24))

    if (daysDiff === i && sorted[i].completed) {
      streak++
    } else {
      break
    }
  }

  return streak
}
