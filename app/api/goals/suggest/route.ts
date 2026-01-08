import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { analyzePatterns } from '@/lib/alertSystem'

export async function GET(request: NextRequest) {
  try {
    // Récupérer les données récentes pour l'analyse
    const entries = await prisma.entry.findMany({
      orderBy: { date: 'desc' },
      take: 60, // 2 mois de données
    })

    const goals = await prisma.dailyGoal.findMany({
      orderBy: { date: 'desc' },
      take: 10,
    })

    if (entries.length < 7) {
      return NextResponse.json({
        success: false,
        message: 'Pas assez de données pour générer des objectifs (minimum 7 jours)',
      })
    }

    // Analyser les patterns
    const patterns = analyzePatterns(entries)

    // Calculer les stats des 7 et 30 derniers jours
    const last7Days = entries.slice(0, 7)
    const last30Days = entries.slice(0, Math.min(30, entries.length))

    const avg7Days = last7Days.filter(e => e.hasSmoked).length
    const avg30Days = last30Days.filter(e => e.hasSmoked).length / Math.min(30, last30Days.length) * 7

    const avgCraving7Days = last7Days.reduce((sum, e) => sum + e.cravingLevel, 0) / last7Days.length

    // Analyser la progression des objectifs précédents
    const recentGoals = goals.slice(0, 5)
    const goalsAchieved = recentGoals.filter(g => {
      const goalDate = new Date(g.date).toDateString()
      const entry = entries.find(e => new Date(e.date).toDateString() === goalDate)
      return entry && entry.jointCount <= g.maxJoints
    }).length

    const successRate = recentGoals.length > 0 ? goalsAchieved / recentGoals.length : 0

    // Préparer le contexte pour l'IA
    const contextForAI = `
Analyse du profil de Quentin (34 ans, syndiqué CGT) :

Statistiques actuelles :
- ${patterns.consecutiveCleanDays} jours consécutifs sans consommation
- Moyenne 7 derniers jours : ${avg7Days} jours avec consommation
- Moyenne 30 derniers jours : ${avg30Days.toFixed(1)} jours avec consommation par semaine
- Niveau d'envie moyen (7j) : ${avgCraving7Days.toFixed(1)}/10
- Taux de réussite objectifs précédents : ${(successRate * 100).toFixed(0)}%

Patterns identifiés :
- Heures à risque : ${patterns.riskPatterns.highRiskTimes.join(', ')}
- Contextes à risque : ${patterns.riskPatterns.highRiskContexts.join(', ')}
- Émotions déclenchantes : ${patterns.riskPatterns.highRiskEmotions.join(', ')}
- Déclencheurs principaux : ${patterns.riskPatterns.highRiskTriggers.join(', ')}

Consignes :
1. Propose 3 objectifs SMART (Spécifiques, Mesurables, Atteignables, Réalistes, Temporels)
2. Les objectifs doivent être progressifs : un facile, un moyen, un ambitieux
3. Chaque objectif doit avoir :
   - maxJoints : nombre max de consommations sur 24h
   - minIntervalMinutes : intervalle minimum entre deux consommations
   - note : une phrase courte (max 100 chars) d'encouragement personnalisé
4. Adapte les objectifs au contexte syndical/militant si pertinent
5. Sois réaliste : ne propose pas 0 joints si la moyenne est élevée
6. Encourage la réduction progressive plutôt que l'arrêt brutal
7. Retourne UNIQUEMENT un JSON valide, sans texte avant/après

Format JSON attendu :
{
  "goals": [
    {
      "level": "easy",
      "maxJoints": 4,
      "minIntervalMinutes": 120,
      "note": "Petit pas vers plus de liberté !"
    },
    {
      "level": "medium",
      "maxJoints": 3,
      "minIntervalMinutes": 180,
      "note": "Challenge progressif, tu peux le faire"
    },
    {
      "level": "hard",
      "maxJoints": 2,
      "minIntervalMinutes": 240,
      "note": "Objectif ambitieux pour aller encore plus loin"
    }
  ],
  "analysis": "Brève analyse de ta progression (1-2 phrases)"
}
`

    // Appel à l'API OpenAI
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
            content: 'Tu es un expert en addiction et réduction des risques. Tu proposes des objectifs progressifs et bienveillants.',
          },
          {
            role: 'user',
            content: contextForAI,
          },
        ],
        temperature: 0.7,
        max_tokens: 600,
      }),
    })

    if (!response.ok) {
      console.error('Erreur OpenAI:', await response.text())
      return NextResponse.json(
        { success: false, error: 'Erreur génération suggestions' },
        { status: 500 }
      )
    }

    const data = await response.json()
    const aiResponse = data.choices[0]?.message?.content

    if (!aiResponse) {
      return NextResponse.json(
        { success: false, error: 'Pas de réponse de l\'IA' },
        { status: 500 }
      )
    }

    try {
      // Parser la réponse JSON de l'IA
      const suggestions = JSON.parse(aiResponse)

      return NextResponse.json({
        success: true,
        suggestions: suggestions.goals,
        analysis: suggestions.analysis,
        currentStats: {
          consecutiveCleanDays: patterns.consecutiveCleanDays,
          avg7Days,
          avgCraving: avgCraving7Days,
          successRate,
        },
      })
    } catch (parseError) {
      console.error('Erreur parsing JSON:', parseError)
      console.error('Réponse IA:', aiResponse)
      return NextResponse.json(
        { success: false, error: 'Format de réponse invalide' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Erreur suggestions objectifs:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
