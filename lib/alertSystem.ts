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

export interface Entry {
  id: string
  date: Date
  time: string
  hasSmoked: boolean
  jointCount: number
  jointTime: string | null
  minutesSinceLastJoint: number | null
  cravingLevel: number
  emotionalState: string
  physicalState: string
  context: string
  trigger: string
  alternativeAction: string
  consciousDecision: boolean
  comment: string
  createdAt: Date
  updatedAt: Date
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

  // DÉCLENCHEUR 1: Heure à risque habituelle
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
        reason: `⚠️ Moment critique : Tu fumes habituellement vers ${currentHour.split(':')[0]}h`,
        suggestion: `${getSuggestion(riskPatterns)}`,
        timeWindow: currentHour,
      }
    }

    // Alerte moyenne pour heure à risque
    return {
      type: 'medium',
      reason: `⏰ ${currentHour.split(':')[0]}h est une heure délicate dans ton historique`,
      suggestion: `Reste vigilant. ${getSuggestion(riskPatterns)}`,
      timeWindow: currentHour,
    }
  }

  // DÉCLENCHEUR 2: Fin de journée après une journée propre (moment de tentation)
  const currentHourNum = parseInt(currentHour.split(':')[0])
  if (currentHourNum >= 20 && currentHourNum <= 23 && consecutiveCleanDays === 0) {
    return {
      type: 'medium',
      reason: `🌙 Fin de journée : moment où la volonté faiblit`,
      suggestion: `Tu as presque fini la journée. Tiens bon ! ${getSuggestion(riskPatterns)}`,
      timeWindow: currentHour,
    }
  }

  // DÉCLENCHEUR 3: Début de journée (moment stratégique)
  if (currentHourNum >= 7 && currentHourNum <= 9) {
    return {
      type: 'low',
      reason: `☀️ Nouvelle journée, nouvelle chance`,
      suggestion: `Commence fort ! Définis ton intention pour aujourd'hui`,
      timeWindow: currentHour,
    }
  }

  // DÉCLENCHEUR 4: Heure de déjeuner (changement de rythme)
  if (currentHourNum >= 12 && currentHourNum <= 14) {
    return {
      type: 'medium',
      reason: `🍽️ Pause déjeuner : moment de transition à risque`,
      suggestion: `Profite de cette pause pour une activité saine. ${getSuggestion(riskPatterns)}`,
      timeWindow: currentHour,
    }
  }

  // DÉCLENCHEUR 5: Après le travail (17h-19h - moment très à risque)
  if (currentHourNum >= 17 && currentHourNum <= 19) {
    return {
      type: 'high',
      reason: `🏠 Sortie du travail : pic de tentation`,
      suggestion: `Change ta routine habituelle. ${getSuggestion(riskPatterns)}`,
      timeWindow: currentHour,
    }
  }

  // DÉCLENCHEUR 6: Weekend (samedi/dimanche - patterns différents)
  const dayOfWeek = new Date().getDay()
  if ((dayOfWeek === 6 || dayOfWeek === 0) && currentHourNum >= 14 && currentHourNum <= 18) {
    return {
      type: 'medium',
      reason: `📅 Weekend : attention aux tentations sociales`,
      suggestion: `Planifie une activité engageante. ${getSuggestion(riskPatterns)}`,
      timeWindow: currentHour,
    }
  }

  // DÉCLENCHEUR 7: Encouragement pour séries de jours propres
  if (consecutiveCleanDays >= 1 && currentHourNum === 20) {
    const emoji = consecutiveCleanDays >= 7 ? '🏆' : consecutiveCleanDays >= 3 ? '🎉' : '💪'
    return {
      type: 'low',
      reason: `${emoji} ${consecutiveCleanDays} jour${consecutiveCleanDays > 1 ? 's' : ''} sans consommation !`,
      suggestion: `Tu es en train de changer ! Continue comme ça`,
      timeWindow: currentHour,
    }
  }

  // DÉCLENCHEUR 8: Après une longue période (risque de rechute)
  if (lastConsumptionTime) {
    const daysSinceLastConsumption = (Date.now() - lastConsumptionTime.getTime()) / (1000 * 60 * 60 * 24)

    if (daysSinceLastConsumption >= 7 && daysSinceLastConsumption < 14 && currentHourNum >= 18) {
      return {
        type: 'medium',
        reason: `🎯 1 semaine passée : attention au "juste une fois"`,
        suggestion: `Ne gâche pas ta série ! Tu as déjà fait le plus dur`,
        timeWindow: currentHour,
      }
    }
  }

  // DÉCLENCHEUR 9: Milieu de semaine (mercredi - coup de mou)
  if (dayOfWeek === 3 && currentHourNum >= 15 && currentHourNum <= 17) {
    return {
      type: 'medium',
      reason: `🐪 Milieu de semaine : fatigue et tentation`,
      suggestion: `Le weekend arrive. Fais une pause active plutôt`,
      timeWindow: currentHour,
    }
  }

  // DÉCLENCHEUR 10: Tard le soir (solitude, ennui)
  if (currentHourNum >= 23 || currentHourNum <= 2) {
    return {
      type: 'high',
      reason: `🌃 Tard le soir : solitude et vulnérabilité`,
      suggestion: `Va dormir. Demain sera meilleur. ${getSuggestion(riskPatterns)}`,
      timeWindow: currentHour,
    }
  }

  return null
}

function getSuggestion(patterns: { highRiskEmotions: string[], highRiskTriggers: string[] }): string {
  const currentHour = new Date().getHours()

  // Suggestions selon l'heure de la journée
  if (currentHour >= 6 && currentHour <= 9) {
    return 'Commence ta journée par 10 min de sport ou une douche froide'
  }
  if (currentHour >= 12 && currentHour <= 14) {
    return 'Sors manger dehors ou appelle quelqu\'un pendant la pause'
  }
  if (currentHour >= 17 && currentHour <= 19) {
    return 'Va direct à la salle de sport ou lance une activité prévue'
  }
  if (currentHour >= 20 && currentHour <= 23) {
    return 'Occupe tes mains : jeu vidéo, dessin, série, cuisine...'
  }
  if (currentHour >= 23 || currentHour <= 2) {
    return 'Éteins les écrans et va dormir. La fatigue amplifie les envies'
  }

  // Suggestions contextualisées selon les émotions à risque
  const emotions = patterns.highRiskEmotions.join(' ').toLowerCase()

  if (emotions.includes('stress') || emotions.includes('anxie')) {
    return 'Respiration : 4 secondes inspire, 7 retiens, 8 expire. Répète 5 fois'
  }
  if (emotions.includes('ennui')) {
    return 'Appelle un ami, sors te promener, lance un projet manuel'
  }
  if (emotions.includes('trist') || emotions.includes('déprim')) {
    return 'Parle au coach IA ou appelle quelqu\'un qui te fait du bien'
  }
  if (emotions.includes('colère') || emotions.includes('frustré')) {
    return 'Défoulement physique : pompes, course, boxe, musique à fond'
  }
  if (emotions.includes('fatigu')) {
    return 'Sieste de 20 min OU café + marche. Pas de fumette "pour te réveiller"'
  }
  if (emotions.includes('seul') || emotions.includes('isol')) {
    return 'Appelle immédiatement quelqu\'un ou va dans un lieu public'
  }

  // Suggestions selon les déclencheurs fréquents
  const triggers = patterns.highRiskTriggers.join(' ').toLowerCase()

  if (triggers.includes('ami') || triggers.includes('social')) {
    return 'Propose une activité alternative : sport, ciné, resto, balade'
  }
  if (triggers.includes('maison') || triggers.includes('chez')) {
    return 'Sors de chez toi immédiatement. N\'importe où sauf là'
  }
  if (triggers.includes('travail') || triggers.includes('boulot')) {
    return 'Décompresse autrement : sport, jeu, musique, pas fumette'
  }
  if (triggers.includes('pause') || triggers.includes('rien')) {
    return 'Remplis tes pauses : podcast, marche, étirements, appels'
  }

  // Suggestions générales variées
  const generalSuggestions = [
    'Parle au coach IA maintenant',
    'Consulte tes stratégies actives',
    'Respiration profonde 5 minutes',
    'Appelle ton contact de confiance',
    'Sors marcher 15 minutes minimum',
    'Bois 2 grands verres d\'eau d\'affilée',
    'Fais 20 pompes ou 50 squats',
    'Lance une série/vidéo/jeu engageant',
    'Va dans un lieu public (café, bibliothèque)',
    'Cuisine un vrai repas',
    'Prends une douche froide',
    'Écris ce que tu ressens dans ton journal',
    'Regarde tes progrès dans l\'historique',
    'Mets la musique à fond et bouge',
    'Nettoie/range quelque chose',
  ]

  return generalSuggestions[Math.floor(Math.random() * generalSuggestions.length)]
}
