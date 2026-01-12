import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET - Récupérer toutes les habitudes actives
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const includeInactive = searchParams.get('includeInactive') === 'true'
    const category = searchParams.get('category')

    const habits = await prisma.atomicHabit.findMany({
      where: {
        ...(includeInactive ? {} : { isActive: true }),
        ...(category ? { category } : {}),
      },
      include: {
        completions: {
          take: 30,
          orderBy: { date: 'desc' },
        },
      },
      orderBy: [
        { createdAt: 'desc' },
      ],
    })

    // Calculer les streaks pour chaque habitude
    type HabitType = typeof habits[number]
    type CompletionType = typeof habits[number]['completions'][number]

    const habitsWithStats = habits.map((habit: HabitType) => {
      const completions = habit.completions.filter((c: CompletionType) => c.completed)
      const currentStreak = calculateCurrentStreak(habit.completions)
      const longestStreak = calculateLongestStreak(habit.completions)
      const completionRate = calculateCompletionRate(habit.completions)

      return {
        ...habit,
        stats: {
          totalCompletions: completions.length,
          currentStreak,
          longestStreak,
          completionRate,
        },
      }
    })

    return NextResponse.json({
      success: true,
      habits: habitsWithStats,
    })
  } catch (error) {
    console.error('Erreur récupération habitudes:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des habitudes' },
      { status: 500 }
    )
  }
}

/**
 * POST - Créer une nouvelle habitude atomique
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log('🎯 Création nouvelle habitude atomique:', body.name)

    const habit = await prisma.atomicHabit.create({
      data: {
        // Step 1: Make it Obvious
        name: body.name,
        trigger: body.trigger,
        identity: body.identity,
        stackAfter: body.stackAfter || null,
        visualCue: body.visualCue || null,

        // Step 2: Make it Attractive
        reward: body.reward || null,
        pleasure: body.pleasure || null,

        // Step 3: Make it Easy
        difficulty: body.difficulty || 'easy',
        preparation: body.preparation || null,
        duration: parseInt(body.duration) || 5,

        // Step 4: Make it Satisfying
        trackingMethod: body.trackingMethod || 'checkbox',

        // Métadonnées
        category: body.category || 'general',
        isActive: body.isActive !== undefined ? body.isActive : true,
        isPositive: body.isPositive !== undefined ? body.isPositive : true,
        replacesAddiction: body.replacesAddiction || false,
      },
    })

    console.log('✅ Habitude créée avec ID:', habit.id)

    return NextResponse.json({
      success: true,
      habit,
    })
  } catch (error) {
    console.error('Erreur création habitude:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la création de l\'habitude' },
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

// Calculer le plus long streak
function calculateLongestStreak(completions: Array<{ date: Date; completed: boolean }>): number {
  if (completions.length === 0) return 0

  const sorted = [...completions].sort((a, b) => a.date.getTime() - b.date.getTime())
  let currentStreak = 0
  let longestStreak = 0

  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].completed) {
      currentStreak++
      longestStreak = Math.max(longestStreak, currentStreak)
    } else {
      currentStreak = 0
    }
  }

  return longestStreak
}

// Calculer le taux de complétion
function calculateCompletionRate(completions: Array<{ completed: boolean }>): number {
  if (completions.length === 0) return 0

  const completed = completions.filter((c) => c.completed).length
  return Math.round((completed / completions.length) * 100)
}
