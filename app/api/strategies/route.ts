import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * API pour analyser les patterns de comportement et générer des stratégies personnalisées
 * Utilise ChatGPT pour créer des recommandations adaptées au profil de l'utilisateur
 */
export async function GET() {
  try {
    // Récupérer toutes les entrées pour analyse
    const entries = await prisma.entry.findMany({
      orderBy: { date: 'desc' },
    })

    if (entries.length === 0) {
      return NextResponse.json({
        success: true,
        strategies: [],
        message: 'Pas assez de données pour générer des stratégies',
      })
    }

    // Analyser les patterns
    const analysis = analyzePatterns(entries)

    // Générer des stratégies personnalisées via ChatGPT
    const strategies = await generateStrategies(analysis)

    return NextResponse.json({
      success: true,
      strategies,
      analysis,
    })
  } catch (error) {
    console.error('Erreur génération stratégies:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la génération des stratégies' },
      { status: 500 }
    )
  }
}

/**
 * Analyse les patterns de consommation et identifie les moments à risque
 */
function analyzePatterns(entries: any[]) {
  const analysis = {
    totalEntries: entries.length,
    smokingDays: 0,
    cleanDays: 0,
    averageCraving: 0,
    morningConsumption: 0, // Avant 10h
    afternoonConsumption: 0, // 10h-17h
    eveningConsumption: 0, // Après 17h
    topTriggers: new Map<string, number>(),
    topContexts: new Map<string, number>(),
    emotionalStates: new Map<string, number>(),
    alternativesUsed: [] as string[],
    commentsKeywords: [] as string[],
  }

  // Grouper par jour
  const dayMap = new Map<string, any[]>()
  entries.forEach(entry => {
    const dateKey = entry.date.toISOString().split('T')[0]
    if (!dayMap.has(dateKey)) {
      dayMap.set(dateKey, [])
    }
    dayMap.get(dateKey)!.push(entry)
  })

  // Analyser les jours
  dayMap.forEach(dayEntries => {
    const hasSmokedToday = dayEntries.some(e => e.hasSmoked)
    if (hasSmokedToday) {
      analysis.smokingDays++
    } else {
      analysis.cleanDays++
    }
  })

  // Analyser les entrées
  let totalCraving = 0
  entries.forEach(entry => {
    totalCraving += entry.cravingLevel

    // Analyser l'heure de consommation
    if (entry.hasSmoked && entry.time) {
      const [hours] = entry.time.split(':').map(Number)
      if (hours < 10) {
        analysis.morningConsumption++
      } else if (hours < 17) {
        analysis.afternoonConsumption++
      } else {
        analysis.eveningConsumption++
      }
    }

    // Top déclencheurs
    if (entry.trigger) {
      analysis.topTriggers.set(
        entry.trigger,
        (analysis.topTriggers.get(entry.trigger) || 0) + 1
      )
    }

    // Top contextes
    if (entry.context) {
      analysis.topContexts.set(
        entry.context,
        (analysis.topContexts.get(entry.context) || 0) + 1
      )
    }

    // États émotionnels
    if (entry.emotionalState) {
      analysis.emotionalStates.set(
        entry.emotionalState,
        (analysis.emotionalStates.get(entry.emotionalState) || 0) + 1
      )
    }

    // Alternatives utilisées
    if (!entry.hasSmoked && entry.alternativeAction) {
      analysis.alternativesUsed.push(entry.alternativeAction)
    }

    // Mots-clés des commentaires
    if (entry.comment && entry.comment.length > 20) {
      analysis.commentsKeywords.push(entry.comment)
    }
  })

  analysis.averageCraving = totalCraving / entries.length

  return analysis
}

/**
 * Génère des stratégies personnalisées via ChatGPT
 */
async function generateStrategies(analysis: any) {
  if (!process.env.OPENAI_API_KEY) {
    // Stratégies par défaut si pas d'API key
    return getDefaultStrategies(analysis)
  }

  const topTriggers = (Array.from(analysis.topTriggers.entries()) as Array<[string, number]>)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([trigger]) => trigger)

  const topEmotions = (Array.from(analysis.emotionalStates.entries()) as Array<[string, number]>)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([emotion]) => emotion)

  const prompt = `Tu es un coach spécialisé dans l'accompagnement au changement et la gestion des addictions. Analyse ce profil et génère 5 stratégies personnalisées et concrètes.

PROFIL:
- Total d'entrées: ${analysis.totalEntries}
- Jours avec consommation: ${analysis.smokingDays}
- Jours sans consommation: ${analysis.cleanDays}
- Niveau moyen d'envie: ${analysis.averageCraving.toFixed(1)}/10
- Consommation matinale (avant 10h): ${analysis.morningConsumption}
- Consommation après-midi: ${analysis.afternoonConsumption}
- Consommation soirée: ${analysis.eveningConsumption}
- Principaux déclencheurs: ${topTriggers.join(', ')}
- États émotionnels fréquents: ${topEmotions.join(', ')}

GÉNÈRE EXACTEMENT 5 STRATÉGIES au format JSON suivant:
[
  {
    "id": "unique_id",
    "category": "morning" | "afternoon" | "evening" | "stress" | "emotional" | "social",
    "title": "Titre court et motivant",
    "description": "Description concrète et actionnable (2-3 phrases)",
    "alternatives": ["Alternative 1", "Alternative 2", "Alternative 3"],
    "trigger": "Déclencheur ciblé",
    "difficulty": "easy" | "medium" | "hard"
  }
]

IMPORTANT:
- Sois concret et actionnable
- Adapte les stratégies aux moments identifiés comme à risque
- Propose des alternatives variées (activités physiques, respiratoires, sociales, créatives)
- Valorise les efforts et la progression
- Utilise un ton bienveillant et encourageant`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Tu es un expert en psychologie comportementale et accompagnement au changement. Tu réponds UNIQUEMENT en JSON valide.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.8,
      }),
    })

    if (!response.ok) {
      console.error('Erreur API OpenAI')
      return getDefaultStrategies(analysis)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content || '[]'

    // Parser le JSON retourné par ChatGPT
    try {
      const strategies = JSON.parse(content)
      return Array.isArray(strategies) ? strategies : getDefaultStrategies(analysis)
    } catch {
      return getDefaultStrategies(analysis)
    }
  } catch (error) {
    console.error('Erreur génération stratégies IA:', error)
    return getDefaultStrategies(analysis)
  }
}

/**
 * Stratégies par défaut adaptées au profil
 */
function getDefaultStrategies(analysis: any) {
  const strategies = []

  // Stratégie matinale si consommation matinale élevée
  if (analysis.morningConsumption > 0) {
    strategies.push({
      id: 'morning_routine',
      category: 'morning',
      title: 'Rituel du Matin Conscient',
      description: 'Remplace le joint du matin par un rituel qui te reconnecte à toi-même. Commence par 5 minutes de respiration, puis un café en pleine conscience, et note une intention pour la journée.',
      alternatives: ['Respiration profonde 5 min', 'Étirements au réveil', 'Douche froide', 'Écriture matinale'],
      trigger: 'Réveil / Routine matinale',
      difficulty: 'medium',
    })
  }

  // Stratégie de soirée
  if (analysis.eveningConsumption > 0) {
    strategies.push({
      id: 'evening_wind_down',
      category: 'evening',
      title: 'Apaisement du Soir',
      description: 'Le soir, ton corps cherche à se détendre. Au lieu du joint, crée un rituel de décompression : lumière tamisée, tisane, lecture ou série sans écran avant de dormir.',
      alternatives: ['Tisane relaxante', 'Lecture 20 min', 'Méditation guidée', 'Musique douce'],
      trigger: 'Fin de journée / Fatigue',
      difficulty: 'easy',
    })
  }

  // Stratégie gestion du stress
  if (analysis.topTriggers.has('Stress') || analysis.topTriggers.has('Tension')) {
    strategies.push({
      id: 'stress_management',
      category: 'stress',
      title: 'Kit Anti-Stress d\'Urgence',
      description: 'Quand le stress monte, ton corps a besoin de se décharger. Utilise la cohérence cardiaque (respiration 5-5), bouge ton corps (marche rapide 10 min), ou verbalise à voix haute ce qui te stresse.',
      alternatives: ['Cohérence cardiaque 5 min', 'Marche rapide', 'Appel à un ami', 'Écriture libre'],
      trigger: 'Stress / Tension',
      difficulty: 'medium',
    })
  }

  // Stratégie émotionnelle
  if (analysis.emotionalStates.size > 0) {
    strategies.push({
      id: 'emotional_regulation',
      category: 'emotional',
      title: 'Accueillir tes Émotions',
      description: 'Au lieu de fuir l\'émotion avec le cannabis, prends 2 minutes pour la nommer, la ressentir dans ton corps, et noter ce qu\'elle te dit. L\'émotion passera, ta conscience reste.',
      alternatives: ['Journaling émotionnel', 'Scan corporel', 'Nommer l\'émotion', 'Partager avec quelqu\'un'],
      trigger: 'Émotions intenses',
      difficulty: 'hard',
    })
  }

  // Stratégie sociale
  strategies.push({
    id: 'social_connection',
    category: 'social',
    title: 'Connexion Authentique',
    description: 'Remplace l\'isolement ou la consommation sociale par une vraie connexion : appelle quelqu\'un qui te fait du bien, rejoins un ami pour une activité, ou participe à un groupe de soutien.',
    alternatives: ['Appel vidéo ami/famille', 'Sortie active', 'Groupe de parole', 'Bénévolat CGT'],
    trigger: 'Solitude / Ennui / Social',
    difficulty: 'easy',
  })

  return strategies.slice(0, 5)
}
