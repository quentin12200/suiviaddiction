import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * API pour vérifier si des rappels doivent être envoyés
 * - Pas d'entrée aujourd'hui
 * - Heure habituelle de fumer
 * - Pattern de rechute détecté
 */
export async function GET() {
  try {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const hour = now.getHours()

    const reminders: Array<{
      type: string
      priority: 'high' | 'medium' | 'low'
      message: string
      action?: string
    }> = []

    // Vérifier si une entrée a été faite aujourd'hui
    const todayEntry = await prisma.entry.findFirst({
      where: {
        date: {
          gte: today,
        },
      },
    })

    if (!todayEntry && hour >= 20) {
      reminders.push({
        type: 'missing_entry',
        priority: 'medium',
        message: "Tu n'as pas encore fait d'entrée aujourd'hui. Prends 2 minutes pour noter ta journée.",
        action: '/new',
      })
    }

    // Récupérer les 30 derniers jours pour analyser les patterns
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    const recentEntries = await prisma.entry.findMany({
      where: {
        date: {
          gte: thirtyDaysAgo,
        },
      },
      orderBy: [
        { date: 'desc' },
        { time: 'desc' },
      ],
      select: {
        date: true,
        time: true,
        hasSmoked: true,
        jointCount: true,
        jointTime: true,
        trigger: true,
      },
    })

    type EntryType = typeof recentEntries[number]

    // Analyser les heures où tu fumes habituellement
    const smokingByHour: Record<number, number> = {}
    recentEntries
      .filter((e: EntryType) => e.hasSmoked && e.jointTime)
      .forEach((entry: EntryType) => {
        const entryHour = parseInt(entry.jointTime!.split(':')[0])
        smokingByHour[entryHour] = (smokingByHour[entryHour] || 0) + 1
      })

    // Trouver les heures à risque (>= 3 occurrences dans le mois)
    const riskHours = Object.entries(smokingByHour)
      .filter(([_, count]) => count >= 3)
      .map(([h, _]) => parseInt(h))

    // Rappel 1h avant une heure à risque
    if (riskHours.includes(hour + 1)) {
      const count = smokingByHour[hour + 1]
      reminders.push({
        type: 'risk_hour_approaching',
        priority: 'high',
        message: `Attention ! ${hour + 1}h est une heure à risque pour toi (${count} fois ce mois). Prépare une alternative MAINTENANT.`,
        action: '/strategies',
      })
    }

    // Détecter un pattern de rechute (3+ jours fumés consécutifs récemment)
    const last7Days = recentEntries.slice(0, 7)
    const smokingDays = last7Days.filter((e: EntryType) => e.hasSmoked).length

    if (smokingDays >= 5) {
      reminders.push({
        type: 'relapse_pattern',
        priority: 'high',
        message: `${smokingDays}/7 jours fumés cette semaine. ALERTE RECHUTE ! Retourne voir tes stratégies.`,
        action: '/strategies',
      })
    }

    // Détecter un streak en cours et encourager
    let currentStreak = 0
    const reversedEntries = [...recentEntries].reverse()
    for (const entry of reversedEntries) {
      if (!entry.hasSmoked) {
        currentStreak++
      } else {
        break
      }
    }

    if (currentStreak >= 3 && currentStreak < 7) {
      reminders.push({
        type: 'streak_encouragement',
        priority: 'low',
        message: `🔥 ${currentStreak} jours sans fumer ! Continue, le palier de 7 jours approche.`,
      })
    }

    if (currentStreak === 6) {
      reminders.push({
        type: 'streak_milestone_tomorrow',
        priority: 'high',
        message: `🏆 DEMAIN = 1 SEMAINE PROPRE ! Ne gâche pas ça maintenant. Tu es SI PROCHE.`,
      })
    }

    // Analyser les triggers récurrents
    const triggerCounts: Record<string, number> = {}
    recentEntries
      .filter((e: EntryType) => e.hasSmoked && e.trigger)
      .forEach((entry: EntryType) => {
        if (entry.trigger) {
          triggerCounts[entry.trigger] = (triggerCounts[entry.trigger] || 0) + 1
        }
      })

    const topTrigger = Object.entries(triggerCounts)
      .sort(([, a], [, b]) => b - a)[0]

    if (topTrigger && topTrigger[1] >= 5) {
      const [trigger, count] = topTrigger
      reminders.push({
        type: 'recurring_trigger',
        priority: 'medium',
        message: `Ton trigger principal : "${trigger}" (${count} fois). Tu devrais créer une stratégie spécifique pour ça.`,
        action: '/strategies',
      })
    }

    // Weekend à venir (vendredi soir)
    const dayOfWeek = now.getDay()
    if (dayOfWeek === 5 && hour >= 17) {
      const weekendSmokingCount = recentEntries
        .filter((e: EntryType) => {
          const entryDay = new Date(e.date).getDay()
          return (entryDay === 0 || entryDay === 6) && e.hasSmoked
        }).length

      if (weekendSmokingCount > 4) {
        reminders.push({
          type: 'weekend_warning',
          priority: 'high',
          message: 'Weekend qui commence. Tu fumes souvent le weekend. Prépare-toi MAINTENANT avec un plan d\'action.',
          action: '/strategies',
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        reminders: reminders.sort((a, b) => {
          const priorityOrder = { high: 0, medium: 1, low: 2 }
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        }),
        hasUrgent: reminders.some(r => r.priority === 'high'),
        count: reminders.length,
      },
    })
  } catch (error) {
    console.error('Erreur rappels:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
