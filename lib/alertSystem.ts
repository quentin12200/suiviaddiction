import { Entry } from '@prisma/client'

export interface RiskAlert {
  type: 'high' | 'medium' | 'low'
  reason: string
  suggestion: string
  timeWindow: string
}

export interface PatternAnalysis {
  riskPatterns: {
    highRiskTimes: string[]
    highRiskContexts: string[]
    highRiskEmotions: string[]
    highRiskTriggers: string[]
  }
  averageInterval: number
  lastConsumptionTime: Date | null
  consecutiveCleanDays: number
}

/**
 * Analyse les patterns de consommation pour détecter les moments à risque
 */
export function analyzePatterns(entries: Entry[]): PatternAnalysis {
  if (entries.length === 0) {
    return {
      riskPatterns: {
        highRiskTimes: [],
        highRiskContexts: [],
        highRiskEmotions: [],
        highRiskTriggers: [],
      },
      averageInterval: 0,
      lastConsumptionTime: null,
      consecutiveCleanDays: 0,
    }
  }

  // Filtrer uniquement les entrées avec consommation
  const smokingEntries = entries.filter(e => e.hasSmoked)

  // Analyser les heures à risque
  const timeMap = new Map<string, number>()
  smokingEntries.forEach(entry => {
    const hour = entry.jointTime?.split(':')[0] || entry.time.split(':')[0]
    timeMap.set(hour, (timeMap.get(hour) || 0) + 1)
  })

  const highRiskTimes = Array.from(timeMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([time]) => `${time}:00`)

  // Analyser les contextes à risque
  const contextMap = new Map<string, number>()
  smokingEntries.forEach(entry => {
    if (entry.context) {
      contextMap.set(entry.context, (contextMap.get(entry.context) || 0) + 1)
    }
  })

  const highRiskContexts = Array.from(contextMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([context]) => context)

  // Analyser les émotions à risque
  const emotionMap = new Map<string, number>()
  smokingEntries.forEach(entry => {
    const emotions = entry.emotionalState.split(',').map(e => e.trim())
    emotions.forEach(emotion => {
      if (emotion) {
        emotionMap.set(emotion, (emotionMap.get(emotion) || 0) + 1)
      }
    })
  })

  const highRiskEmotions = Array.from(emotionMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([emotion]) => emotion)

  // Analyser les déclencheurs
  const triggerMap = new Map<string, number>()
  smokingEntries.forEach(entry => {
    if (entry.trigger) {
      triggerMap.set(entry.trigger, (triggerMap.get(entry.trigger) || 0) + 1)
    }
  })

  const highRiskTriggers = Array.from(triggerMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([trigger]) => trigger)

  // Calculer l'intervalle moyen entre consommations
  let totalIntervals = 0
  let intervalCount = 0
  for (let i = 1; i < smokingEntries.length; i++) {
    const current = new Date(smokingEntries[i].date)
    const previous = new Date(smokingEntries[i - 1].date)
    const diff = (current.getTime() - previous.getTime()) / (1000 * 60 * 60) // heures
    totalIntervals += diff
    intervalCount++
  }
  const averageInterval = intervalCount > 0 ? totalIntervals / intervalCount : 0

  // Trouver la dernière consommation
  const lastConsumptionTime = smokingEntries.length > 0
    ? new Date(smokingEntries[0].date)
    : null

  // Calculer les jours consécutifs sans consommation
  let consecutiveCleanDays = 0
  const sortedEntries = [...entries].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  for (const entry of sortedEntries) {
    if (entry.hasSmoked) break
    const entryDate = new Date(entry.date).toDateString()
    const today = new Date().toDateString()
    if (entryDate === today || consecutiveCleanDays > 0) {
      consecutiveCleanDays++
    }
  }

  return {
    riskPatterns: {
      highRiskTimes,
      highRiskContexts,
      highRiskEmotions,
      highRiskTriggers,
    },
    averageInterval,
    lastConsumptionTime,
    consecutiveCleanDays,
  }
}

/**
 * Détermine si un moment est à risque et génère une alerte appropriée
 */
export function checkRiskAlert(
  patterns: PatternAnalysis,
  currentHour: string
): RiskAlert | null {
  const { riskPatterns, averageInterval, lastConsumptionTime, consecutiveCleanDays } = patterns

  // Vérifier si on est dans une heure à risque
  const isHighRiskTime = riskPatterns.highRiskTimes.some(time =>
    time.startsWith(currentHour.split(':')[0])
  )

  if (isHighRiskTime && lastConsumptionTime) {
    const hoursSinceLastConsumption =
      (Date.now() - lastConsumptionTime.getTime()) / (1000 * 60 * 60)

    // Alerte haute si proche de l'intervalle moyen habituel
    if (averageInterval > 0 && hoursSinceLastConsumption >= averageInterval * 0.8) {
      return {
        type: 'high',
        reason: `Tu es dans une période à risque. D'habitude, tu consommes vers ${currentHour.split(':')[0]}h.`,
        suggestion: `Utilise une stratégie alternative : ${getSuggestion(riskPatterns)}`,
        timeWindow: currentHour,
      }
    }

    // Alerte moyenne pour heure à risque
    return {
      type: 'medium',
      reason: `Attention, ${currentHour.split(':')[0]}h est souvent un moment délicat pour toi.`,
      suggestion: `Reste vigilant. ${getSuggestion(riskPatterns)}`,
      timeWindow: currentHour,
    }
  }

  // Encouragement pour séries de jours propres
  if (consecutiveCleanDays >= 3 && currentHour.startsWith('20')) {
    return {
      type: 'low',
      reason: `Bravo ! ${consecutiveCleanDays} jours sans consommation 🎉`,
      suggestion: 'Continue comme ça, tu es sur la bonne voie !',
      timeWindow: currentHour,
    }
  }

  return null
}

function getSuggestion(patterns: { highRiskEmotions: string[], highRiskTriggers: string[] }): string {
  const suggestions = [
    'Parle au coach IA',
    'Consulte tes stratégies actives',
    'Fais une pause respiratoire de 5 minutes',
    'Appelle un ami de confiance',
    'Sors prendre l\'air',
    'Bois un grand verre d\'eau',
  ]

  // Suggestion contextualisée selon les émotions à risque
  if (patterns.highRiskEmotions.includes('Stressé')) {
    return 'Fais une pause respiratoire ou parle au coach IA'
  }
  if (patterns.highRiskEmotions.includes('Anxieux')) {
    return 'Appelle quelqu\'un de confiance ou sors prendre l\'air'
  }
  if (patterns.highRiskEmotions.includes('Ennui')) {
    return 'Lance une activité alternative ou consulte tes stratégies'
  }

  return suggestions[Math.floor(Math.random() * suggestions.length)]
}
