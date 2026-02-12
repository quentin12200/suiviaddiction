import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * API pour vérifier si des rappels doivent être envoyés
 * - Encouragements pour l'arrêt du tabac
 * - Alertes sur les moments critiques du sevrage
 * - Rappels des bénéfices
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

    // Récupérer toutes les entrées récentes pour analyse
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

    // CALCUL CORRECT DU STREAK - basé sur les JOURS RÉELS
    const sortedEntries = [...recentEntries].sort((a, b) => {
      const dateComp = new Date(b.date).getTime() - new Date(a.date).getTime()
      if (dateComp !== 0) return dateComp
      return b.time.localeCompare(a.time)
    })

    const lastJointEntry = sortedEntries.find(e => e.hasSmoked === true)

    let currentStreak = 0
    if (lastJointEntry) {
      const lastJointDate = new Date(lastJointEntry.date)
      lastJointDate.setHours(0, 0, 0, 0)

      const todayMidnight = new Date(today)
      todayMidnight.setHours(0, 0, 0, 0)

      const daysSinceLastJoint = Math.floor((todayMidnight.getTime() - lastJointDate.getTime()) / (1000 * 60 * 60 * 24))
      currentStreak = Math.max(0, daysSinceLastJoint)
    } else {
      // Aucun joint dans les 30 derniers jours
      currentStreak = 30
    }

    // ENCOURAGEMENTS BASÉS SUR LE STREAK RÉEL
    if (currentStreak === 0) {
      // Tu as fumé aujourd'hui
      reminders.push({
        type: 'relapse_today',
        priority: 'high',
        message: '⚠️ Tu as fumé aujourd\'hui. Ce n\'est pas une fin, mais un nouveau départ. Recommence dès maintenant !',
        action: '/new',
      })
    }

    if (currentStreak === 1) {
      reminders.push({
        type: 'day_1',
        priority: 'high',
        message: '💪 Premier jour sans fumer ! Le plus dur est fait. Ton corps commence déjà à éliminer le CO2.',
      })
    }

    if (currentStreak === 2) {
      reminders.push({
        type: 'day_2',
        priority: 'high',
        message: '🔥 2 jours ! Ton odorat et ton goût commencent à revenir. La nicotine quitte ton corps.',
      })
    }

    if (currentStreak === 3) {
      reminders.push({
        type: 'day_3_critical',
        priority: 'high',
        message: '🚨 JOUR 3 - CRITIQUE ! Pic des envies. Ton cerveau réclame la nicotine mais tu as ton PATCH. Résiste, c\'est le THC qui te manque, pas la nicotine !',
      })
    }

    if (currentStreak >= 3 && currentStreak < 7) {
      reminders.push({
        type: 'week_approaching',
        priority: 'medium',
        message: `🔥 ${currentStreak} jours sans fumer ! Plus que ${7 - currentStreak} jours avant une semaine complète. Continue !`,
      })
    }

    if (currentStreak === 7) {
      reminders.push({
        type: 'week_milestone',
        priority: 'high',
        message: '🏆 UNE SEMAINE SANS FUMER ! Ton taux de CO dans le sang est redevenu normal. Tu respires mieux. ÉNORME victoire !',
      })
    }

    if (currentStreak > 7 && currentStreak < 14) {
      reminders.push({
        type: 'week_plus',
        priority: 'low',
        message: `🌟 ${currentStreak} jours ! Ta circulation sanguine s'améliore chaque jour. Tes poumons se nettoient progressivement.`,
      })
    }

    if (currentStreak === 14) {
      reminders.push({
        type: 'two_weeks',
        priority: 'high',
        message: '💎 DEUX SEMAINES ! Tes fonctions pulmonaires s\'améliorent significativement. L\'envie physique disparaît presque totalement.',
      })
    }

    if (currentStreak === 21) {
      reminders.push({
        type: 'three_weeks',
        priority: 'high',
        message: '👑 TROIS SEMAINES ! Les nouvelles connexions neuronales sont en train de se former. Tu es en train de devenir quelqu\'un de nouveau.',
      })
    }

    if (currentStreak === 30) {
      reminders.push({
        type: 'one_month',
        priority: 'high',
        message: '🎉 UN MOIS SANS FUMER ! Ton système immunitaire se renforce. Risque de cancer diminué. Tu as GAGNÉ ce combat !',
      })
    }

    // RAPPEL PATCH DE NICOTINE
    if (currentStreak >= 1 && currentStreak <= 7) {
      reminders.push({
        type: 'nicotine_patch_reminder',
        priority: 'medium',
        message: '💊 RAPPEL : Tu as ton patch. Ton corps a déjà sa dose de nicotine. Si tu fumes avec du tabac = SURDOSAGE = anxiété.',
      })
    }

    // MOMENTS CRITIQUES DE LA JOURNÉE
    // Matin (7h-10h) - moment à risque
    if (hour >= 7 && hour < 10 && currentStreak >= 1) {
      reminders.push({
        type: 'morning_critical',
        priority: 'high',
        message: '☕ Le matin est critique. Remplace le rituel : café + respiration profonde au lieu de café + joint.',
      })
    }

    // Fin de journée (17h-20h) - moment à risque
    if (hour >= 17 && hour < 20 && currentStreak >= 1) {
      reminders.push({
        type: 'evening_critical',
        priority: 'high',
        message: '🌆 Fin de journée = heure à risque. Va marcher, fais du sport, appelle quelqu\'un. Évite la routine joint.',
      })
    }

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
        message: "📝 N'oublie pas de noter ta journée. Chaque jour sans fumer mérite d'être célébré !",
        action: '/new',
      })
    }

    // Analyser les heures où tu fumais habituellement
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

    // Rappel 1h avant une heure à risque (seulement si en période d'abstinence)
    if (currentStreak >= 1 && riskHours.includes(hour + 1)) {
      const count = smokingByHour[hour + 1]
      reminders.push({
        type: 'risk_hour_approaching',
        priority: 'high',
        message: `⚠️ ${hour + 1}h = heure où tu fumais souvent (${count} fois ce mois). Prépare une alternative MAINTENANT !`,
        action: '/strategies',
      })
    }

    // Détecter un pattern de rechute (fumé récemment après période d'abstinence)
    const last7Days = recentEntries.slice(0, 7)
    const smokingInLast7 = last7Days.filter((e: EntryType) => e.hasSmoked).length

    if (smokingInLast7 >= 1 && smokingInLast7 <= 2 && currentStreak >= 1) {
      reminders.push({
        type: 'relapse_warning',
        priority: 'high',
        message: `⚠️ Tu as fumé ${smokingInLast7} fois cette semaine. ATTENTION ! Ne laisse pas ça devenir une habitude. Tu es en sevrage !`,
        action: '/strategies',
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

    if (topTrigger && topTrigger[1] >= 5 && currentStreak >= 1) {
      const [trigger, count] = topTrigger
      reminders.push({
        type: 'recurring_trigger',
        priority: 'medium',
        message: `Ton trigger principal : "${trigger}" (${count} fois). Crée une stratégie spécifique pour gérer ce moment.`,
        action: '/strategies',
      })
    }

    // Weekend à venir (vendredi soir)
    const dayOfWeek = now.getDay()
    if (dayOfWeek === 5 && hour >= 17 && currentStreak >= 1) {
      const weekendSmokingCount = recentEntries
        .filter((e: EntryType) => {
          const entryDay = new Date(e.date).getDay()
          return (entryDay === 0 || entryDay === 6) && e.hasSmoked
        }).length

      if (weekendSmokingCount > 2) {
        reminders.push({
          type: 'weekend_warning',
          priority: 'high',
          message: '🎯 Weekend = haut risque pour toi. Prévois des activités. Ne reste pas seul sans plan.',
          action: '/strategies',
        })
      }
    }

    // BÉNÉFICES DU SEVRAGE (afficher aléatoirement)
    if (currentStreak >= 3 && Math.random() > 0.7) {
      const benefits = [
        '💰 Économies : Chaque jour sans fumer = ~10-15€ économisés !',
        '🫁 Poumons : Ils se régénèrent progressivement. Dans 3 mois, tu respireras 30% mieux.',
        '❤️ Cœur : Ton risque cardiaque diminue de 50% après 1 an d\'arrêt.',
        '🧠 Cerveau : Ta concentration s\'améliore. Le brouillard mental disparaît.',
        '😴 Sommeil : Qualité de sommeil améliorée = plus d\'énergie le matin.',
        '💪 Énergie : Plus d\'essoufflement, plus de fatigue chronique.',
      ]
      const randomBenefit = benefits[Math.floor(Math.random() * benefits.length)]
      reminders.push({
        type: 'benefit_reminder',
        priority: 'low',
        message: randomBenefit,
      })
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
        currentStreak,
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
