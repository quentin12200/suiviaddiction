import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET - Obtenir des recommandations de lecture personnalisées par IA
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🤖 Génération de recommandations de lecture personnalisées...')

    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'OpenAI API key manquante',
      }, { status: 500 })
    }

    // Récupérer les livres déjà lus ou en cours
    const existingReadings = await prisma.reading.findMany({
      select: {
        title: true,
        author: true,
        status: true,
        category: true,
      },
    })

    type ReadingType = typeof existingReadings[number]

    const booksRead = existingReadings
      .filter((r: ReadingType) => r.status === 'terminé')
      .map((r: ReadingType) => `${r.title} (${r.author})`)
      .join(', ')

    const booksInProgress = existingReadings
      .filter((r: ReadingType) => r.status === 'en_cours')
      .map((r: ReadingType) => `${r.title} (${r.author})`)
      .join(', ')

    // Récupérer les stats d'addiction
    const last30Days = new Date()
    last30Days.setDate(last30Days.getDate() - 30)

    const recentEntries = await prisma.entry.findMany({
      where: {
        date: {
          gte: last30Days,
        },
      },
      orderBy: { date: 'desc' },
    })

    type EntryType = typeof recentEntries[number]

    const totalEntries = recentEntries.length
    const daysWithCannabis = recentEntries.filter((e: EntryType) => e.hasSmoked).length
    const sobrietyRate = totalEntries > 0 ? ((totalEntries - daysWithCannabis) / totalEntries * 100).toFixed(0) : 0

    // Analyser les déclencheurs principaux
    const triggers: Record<string, number> = {}
    recentEntries.forEach((e: EntryType) => {
      if (e.trigger && e.hasSmoked) {
        triggers[e.trigger] = (triggers[e.trigger] || 0) + 1
      }
    })

    const topTriggers = Object.entries(triggers)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([trigger]) => trigger)
      .join(', ')

    // Analyser les états émotionnels
    const emotions: Record<string, number> = {}
    recentEntries.forEach((e: EntryType) => {
      if (e.emotionalState && e.hasSmoked) {
        emotions[e.emotionalState] = (emotions[e.emotionalState] || 0) + 1
      }
    })

    const topEmotions = Object.entries(emotions)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([emotion]) => emotion)
      .join(', ')

    // Récupérer les habitudes en cours
    const activeHabits = await prisma.atomicHabit.findMany({
      where: { isActive: true },
      select: {
        name: true,
        category: true,
      },
    })

    type HabitType = typeof activeHabits[number]

    const habitsList = activeHabits
      .map((h: HabitType) => `${h.name} (${h.category})`)
      .join(', ')

    const systemPrompt = `Tu es un bibliothérapeute expert spécialisé dans le sevrage d'addictions et le développement personnel. Tu recommandes des livres transformateurs et pragmatiques.`

    const userPrompt = `Analyse le profil suivant et recommande 3 livres PRÉCIS (titre + auteur) qui seraient les plus utiles maintenant.

**Profil:**
- Taux de sobriété (30 derniers jours): ${sobrietyRate}%
- Déclencheurs principaux: ${topTriggers || 'non identifiés'}
- États émotionnels liés à la consommation: ${topEmotions || 'non identifiés'}
- Livres déjà terminés: ${booksRead || 'aucun'}
- Livres en cours: ${booksInProgress || 'aucun'}
- Habitudes en place: ${habitsList || 'aucune'}

**Critères de recommandation:**
1. Livre doit être DIFFÉRENT de ceux déjà lus
2. Doit adresser les déclencheurs/émotions identifiés
3. Doit être pragmatique et actionnable
4. Bonus: S'il renforce les habitudes en place

**Format de réponse:**

📚 **Recommandations personnalisées pour toi:**

**1. [Titre exact]** par [Auteur exact]
🎯 **Pourquoi maintenant:** [Explication basée sur ton profil - 2-3 lignes]
💡 **Ce que tu vas apprendre:** [1-2 points concrets]
⚡ **Action immédiate:** [1 chose à faire après avoir lu ce message]

**2. [Titre]** ...

**3. [Titre]** ...

---

🔥 **Commence par:** Le livre [numéro] car [raison spécifique à la situation actuelle]`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 1000,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Erreur OpenAI:', errorText)
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de la génération des recommandations',
      }, { status: 500 })
    }

    const data = await response.json()
    const recommendations = data.choices[0]?.message?.content || ''

    console.log('✅ Recommandations générées')

    return NextResponse.json({
      success: true,
      recommendations,
      context: {
        sobrietyRate: `${sobrietyRate}%`,
        topTriggers,
        topEmotions,
        booksRead: booksRead || 'Aucun',
        booksInProgress: booksInProgress || 'Aucun',
      },
    })

  } catch (error) {
    console.error('❌ Erreur génération recommandations:', error)
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la génération des recommandations',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
