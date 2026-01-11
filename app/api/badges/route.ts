import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface Badge {
  id: string
  icon: string
  title: string
  description: string
  category: 'sobriety' | 'discipline' | 'growth' | 'milestone'
  unlocked: boolean
  unlockedAt?: Date
  progress: number
  target: number
}

/**
 * API pour le système de badges/récompenses
 */
export async function GET() {
  try {
    // Récupérer toutes les entrées
    const allEntries = await prisma.entry.findMany({
      orderBy: { date: 'asc' },
      select: {
        date: true,
        hasSmoked: true,
        jointCount: true,
        adrenalineEvent: true,
        adrenalineOutcome: true,
        isolationEvent: true,
        isolationOutcome: true,
      },
    })

    // Debug - vérifier les données
    console.log('📊 Badge stats debug:')
    console.log('  Total entries:', allEntries.length)
    console.log('  Clean entries (hasSmoked === false):', allEntries.filter(e => e.hasSmoked === false).length)
    console.log('  Smoking entries (hasSmoked === true):', allEntries.filter(e => e.hasSmoked === true).length)
    console.log('  Null/undefined hasSmoked:', allEntries.filter(e => e.hasSmoked == null).length)

    // Calculer les streaks
    let currentStreak = 0
    let bestStreak = 0
    let tempStreak = 0
    const sortedEntries = [...allEntries].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    for (const entry of sortedEntries) {
      // Vérification stricte : doit être explicitement false
      if (entry.hasSmoked === false) {
        tempStreak++
        bestStreak = Math.max(bestStreak, tempStreak)
      } else {
        tempStreak = 0
      }
    }

    // Streak actuel (du plus récent vers le passé)
    const reversedEntries = [...sortedEntries].reverse()
    for (const entry of reversedEntries) {
      // Vérification stricte : doit être explicitement false
      if (entry.hasSmoked === false) {
        currentStreak++
      } else {
        break
      }
    }

    // Compter les alternatives constructives
    const totalConstructiveAlternatives = allEntries.filter(
      e => e.adrenalineEvent && e.adrenalineOutcome === 'réussi'
    ).length

    // Compter les isolements réussis
    const totalSuccessfulIsolations = allEntries.filter(
      e => e.isolationEvent && e.isolationOutcome === 'rechargé'
    ).length

    // Compter les jours propres totaux (vérification stricte)
    const totalCleanDays = allEntries.filter(e => e.hasSmoked === false).length

    // Compter les jours d'entrées
    const totalDaysLogged = allEntries.length

    // Debug streaks
    console.log('  Current streak:', currentStreak)
    console.log('  Best streak:', bestStreak)
    console.log('  Total clean days:', totalCleanDays)
    console.log('  Total days logged:', totalDaysLogged)

    // Définir tous les badges
    const badges: Badge[] = [
      // SOBRIÉTÉ
      {
        id: 'clean_1_day',
        icon: '🌱',
        title: 'Premier Jour',
        description: 'Un premier jour sans fumer',
        category: 'sobriety',
        unlocked: currentStreak >= 1 || bestStreak >= 1,
        progress: Math.min(currentStreak, 1),
        target: 1,
      },
      {
        id: 'clean_3_days',
        icon: '🌿',
        title: '3 Jours Clean',
        description: '3 jours consécutifs sans fumer',
        category: 'sobriety',
        unlocked: currentStreak >= 3 || bestStreak >= 3,
        progress: Math.min(currentStreak, 3),
        target: 3,
      },
      {
        id: 'clean_7_days',
        icon: '🌳',
        title: 'Une Semaine Propre',
        description: '7 jours consécutifs sans fumer',
        category: 'sobriety',
        unlocked: currentStreak >= 7 || bestStreak >= 7,
        progress: Math.min(currentStreak, 7),
        target: 7,
      },
      {
        id: 'clean_14_days',
        icon: '🏔️',
        title: '2 Semaines Victorieuses',
        description: '14 jours consécutifs sans fumer',
        category: 'sobriety',
        unlocked: currentStreak >= 14 || bestStreak >= 14,
        progress: Math.min(currentStreak, 14),
        target: 14,
      },
      {
        id: 'clean_30_days',
        icon: '👑',
        title: 'Un Mois de Liberté',
        description: '30 jours consécutifs sans fumer',
        category: 'sobriety',
        unlocked: currentStreak >= 30 || bestStreak >= 30,
        progress: Math.min(currentStreak, 30),
        target: 30,
      },
      {
        id: 'clean_90_days',
        icon: '💎',
        title: 'Trimestre Diamant',
        description: '90 jours consécutifs sans fumer',
        category: 'sobriety',
        unlocked: currentStreak >= 90 || bestStreak >= 90,
        progress: Math.min(currentStreak, 90),
        target: 90,
      },

      // ALTERNATIVES CONSTRUCTIVES
      {
        id: 'alternatives_10',
        icon: '🎯',
        title: 'Redirection x10',
        description: '10 alternatives constructives réussies',
        category: 'growth',
        unlocked: totalConstructiveAlternatives >= 10,
        progress: Math.min(totalConstructiveAlternatives, 10),
        target: 10,
      },
      {
        id: 'alternatives_30',
        icon: '🚀',
        title: 'Maître du Choix',
        description: '30 alternatives constructives réussies',
        category: 'growth',
        unlocked: totalConstructiveAlternatives >= 30,
        progress: Math.min(totalConstructiveAlternatives, 30),
        target: 30,
      },
      {
        id: 'alternatives_50',
        icon: '⚡',
        title: 'Force de Volonté',
        description: '50 alternatives constructives réussies',
        category: 'growth',
        unlocked: totalConstructiveAlternatives >= 50,
        progress: Math.min(totalConstructiveAlternatives, 50),
        target: 50,
      },

      // ISOLEMENTS RÉUSSIS
      {
        id: 'isolation_5',
        icon: '🧘',
        title: 'Solitude Maîtrisée',
        description: '5 moments d\'isolement ressourçants',
        category: 'growth',
        unlocked: totalSuccessfulIsolations >= 5,
        progress: Math.min(totalSuccessfulIsolations, 5),
        target: 5,
      },
      {
        id: 'isolation_20',
        icon: '🌌',
        title: 'Zen Master',
        description: '20 moments d\'isolement ressourçants',
        category: 'growth',
        unlocked: totalSuccessfulIsolations >= 20,
        progress: Math.min(totalSuccessfulIsolations, 20),
        target: 20,
      },

      // DISCIPLINE
      {
        id: 'tracking_7',
        icon: '📝',
        title: 'Chronicler',
        description: '7 jours de suivi consécutif',
        category: 'discipline',
        unlocked: totalDaysLogged >= 7,
        progress: Math.min(totalDaysLogged, 7),
        target: 7,
      },
      {
        id: 'tracking_30',
        icon: '📚',
        title: 'Journal Assidu',
        description: '30 jours de suivi',
        category: 'discipline',
        unlocked: totalDaysLogged >= 30,
        progress: Math.min(totalDaysLogged, 30),
        target: 30,
      },
      {
        id: 'tracking_100',
        icon: '📖',
        title: 'Archiviste',
        description: '100 jours de suivi',
        category: 'discipline',
        unlocked: totalDaysLogged >= 100,
        progress: Math.min(totalDaysLogged, 100),
        target: 100,
      },

      // MILESTONES
      {
        id: 'clean_total_30',
        icon: '🎖️',
        title: '30 Jours Propres (Total)',
        description: '30 jours sans fumer au total',
        category: 'milestone',
        unlocked: totalCleanDays >= 30,
        progress: Math.min(totalCleanDays, 30),
        target: 30,
      },
      {
        id: 'clean_total_100',
        icon: '🏅',
        title: '100 Jours Propres (Total)',
        description: '100 jours sans fumer au total',
        category: 'milestone',
        unlocked: totalCleanDays >= 100,
        progress: Math.min(totalCleanDays, 100),
        target: 100,
      },
    ]

    // Compter les badges débloqués
    const unlockedCount = badges.filter(b => b.unlocked).length
    const totalCount = badges.length

    return NextResponse.json({
      success: true,
      data: {
        badges,
        summary: {
          unlocked: unlockedCount,
          total: totalCount,
          percentage: Math.round((unlockedCount / totalCount) * 100),
        },
        stats: {
          currentStreak,
          bestStreak,
          totalCleanDays,
          totalConstructiveAlternatives,
          totalSuccessfulIsolations,
          totalDaysLogged,
        },
      },
    })
  } catch (error) {
    console.error('Erreur badges:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
