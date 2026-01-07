/**
 * Système de Points de Liberté
 * Valorise chaque effort et chaque victoire dans la quête d'autonomie
 */

interface Entry {
  hasSmoked: boolean
  jointCount: number
  cravingLevel: number
  alternativeAction: string
  consciousDecision: boolean
  comment: string
  date: Date
  time: string
}

export interface FreedomScore {
  totalPoints: number
  level: number
  levelName: string
  breakdown: {
    cleanDays: number
    consciousChoices: number
    alternatives: number
    expression: number
    cravingControl: number
  }
  achievements: Achievement[]
  nextMilestone: {
    name: string
    pointsNeeded: number
  }
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlocked: boolean
  unlockedAt?: Date
}

/**
 * Calcule les points de liberté basés sur les entrées
 */
export function calculateFreedomScore(entries: Entry[]): FreedomScore {
  let totalPoints = 0
  const breakdown = {
    cleanDays: 0,
    consciousChoices: 0,
    alternatives: 0,
    expression: 0,
    cravingControl: 0,
  }

  // Grouper par jour pour identifier les jours sans fumer
  const entriesByDay = new Map<string, Entry[]>()
  entries.forEach(entry => {
    const dateKey = entry.date.toISOString().split('T')[0]
    if (!entriesByDay.has(dateKey)) {
      entriesByDay.set(dateKey, [])
    }
    entriesByDay.get(dateKey)!.push(entry)
  })

  // Points pour les jours sans fumer (15 pts par jour)
  entriesByDay.forEach(dayEntries => {
    const hasSmokedToday = dayEntries.some(e => e.hasSmoked)
    if (!hasSmokedToday && dayEntries.length > 0) {
      breakdown.cleanDays += 15
      totalPoints += 15
    }
  })

  // Points pour chaque entrée
  entries.forEach(entry => {
    // Décision consciente : +10 pts
    if (entry.consciousDecision) {
      breakdown.consciousChoices += 10
      totalPoints += 10
    }

    // Action alternative (si pas fumé) : +20 pts
    if (!entry.hasSmoked && entry.alternativeAction && entry.alternativeAction.length > 5) {
      breakdown.alternatives += 20
      totalPoints += 20
    }

    // Commentaire détaillé (expression) : +10 pts si >20 caractères
    if (entry.comment && entry.comment.length > 20) {
      breakdown.expression += 10
      totalPoints += 10
    }

    // Envie maîtrisée (<5/10) : +5 pts
    if (entry.cravingLevel < 5) {
      breakdown.cravingControl += 5
      totalPoints += 5
    }

    // Premier joint repoussé (après 10h) : +5 pts bonus
    if (entry.hasSmoked && entry.time) {
      const [hours] = entry.time.split(':').map(Number)
      if (hours >= 10) {
        breakdown.consciousChoices += 5
        totalPoints += 5
      }
    }
  })

  // Calculer le niveau et le titre
  const level = Math.floor(totalPoints / 100) + 1
  const levelName = getLevelName(level)

  // Générer les achievements
  const achievements = generateAchievements(entries, entriesByDay)

  // Prochain jalon
  const nextMilestone = getNextMilestone(totalPoints)

  return {
    totalPoints,
    level,
    levelName,
    breakdown,
    achievements,
    nextMilestone,
  }
}

/**
 * Retourne le nom du niveau basé sur les points
 */
function getLevelName(level: number): string {
  if (level === 1) return "Éveillé"
  if (level === 2) return "Conscient"
  if (level === 3) return "Déterminé"
  if (level === 4) return "Maître de soi"
  if (level === 5) return "Libéré"
  if (level >= 6) return "Sage"
  return "Apprenti"
}

/**
 * Génère les achievements débloqués
 */
function generateAchievements(entries: Entry[], entriesByDay: Map<string, Entry[]>): Achievement[] {
  const achievements: Achievement[] = [
    {
      id: 'first_entry',
      name: 'Premier Pas',
      description: 'Première entrée enregistrée',
      icon: '🌱',
      unlocked: entries.length >= 1,
      unlockedAt: entries.length >= 1 ? entries[0].date : undefined,
    },
    {
      id: 'clean_day',
      name: 'Jour de Liberté',
      description: 'Un jour complet sans fumer',
      icon: '☀️',
      unlocked: Array.from(entriesByDay.values()).some(
        dayEntries => !dayEntries.some(e => e.hasSmoked)
      ),
    },
    {
      id: 'conscious_10',
      name: 'Conscience Active',
      description: '10 décisions conscientes',
      icon: '🧠',
      unlocked: entries.filter(e => e.consciousDecision).length >= 10,
    },
    {
      id: 'alternative_5',
      name: 'Explorateur d\'Alternatives',
      description: '5 actions alternatives utilisées',
      icon: '🎯',
      unlocked: entries.filter(e => !e.hasSmoked && e.alternativeAction.length > 5).length >= 5,
    },
    {
      id: 'expression_20',
      name: 'Voix Libérée',
      description: '20 commentaires détaillés',
      icon: '✍️',
      unlocked: entries.filter(e => e.comment.length > 20).length >= 20,
    },
    {
      id: 'week_tracking',
      name: 'Observateur Assidu',
      description: '7 jours consécutifs enregistrés',
      icon: '📊',
      unlocked: hasConsecutiveDays(Array.from(entriesByDay.keys()), 7),
    },
    {
      id: 'craving_master',
      name: 'Maître du Désir',
      description: '10 envies maîtrisées (<5/10)',
      icon: '⚡',
      unlocked: entries.filter(e => e.cravingLevel < 5).length >= 10,
    },
  ]

  return achievements
}

/**
 * Vérifie s'il y a X jours consécutifs
 */
function hasConsecutiveDays(dates: string[], required: number): boolean {
  if (dates.length < required) return false

  const sorted = dates.sort()
  let consecutive = 1

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1])
    const curr = new Date(sorted[i])
    const diffDays = Math.floor((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      consecutive++
      if (consecutive >= required) return true
    } else if (diffDays > 1) {
      consecutive = 1
    }
  }

  return consecutive >= required
}

/**
 * Retourne le prochain jalon à atteindre
 */
function getNextMilestone(currentPoints: number): { name: string; pointsNeeded: number } {
  const milestones = [
    { points: 100, name: 'Niveau Conscient' },
    { points: 200, name: 'Niveau Déterminé' },
    { points: 300, name: 'Niveau Maître de soi' },
    { points: 500, name: 'Niveau Libéré' },
    { points: 1000, name: 'Niveau Sage' },
  ]

  for (const milestone of milestones) {
    if (currentPoints < milestone.points) {
      return {
        name: milestone.name,
        pointsNeeded: milestone.points - currentPoints,
      }
    }
  }

  return {
    name: 'Maîtrise Totale',
    pointsNeeded: 0,
  }
}
