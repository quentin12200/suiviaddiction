import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST - Obtenir des insights IA pour un livre
 * Body: { readingId: string, type: 'summary' | 'questions' | 'actions' | 'recommendation' }
 */
export async function POST(request: NextRequest) {
  try {
    const { readingId, type } = await request.json()

    if (!readingId || !type) {
      return NextResponse.json({
        success: false,
        error: 'readingId et type sont requis',
      }, { status: 400 })
    }

    // Récupérer le livre
    const reading = await prisma.reading.findUnique({
      where: { id: readingId },
    })

    if (!reading) {
      return NextResponse.json({
        success: false,
        error: 'Livre non trouvé',
      }, { status: 404 })
    }

    // Récupérer les dernières entrées pour contexte
    const recentEntries = await prisma.entry.findMany({
      orderBy: { date: 'desc' },
      take: 5,
    })

    type EntryType = typeof recentEntries[number]

    const hasSmoked = recentEntries.some((e: EntryType) => e.hasSmoked)
    const triggers = recentEntries
      .map((e: EntryType) => e.trigger)
      .filter(Boolean)
      .join(', ')

    const emotionalStates = recentEntries
      .map((e: EntryType) => e.emotionalState)
      .filter(Boolean)
      .join(', ')

    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'OpenAI API key manquante',
      }, { status: 500 })
    }

    let systemPrompt = ''
    let userPrompt = ''

    switch (type) {
      case 'summary':
        systemPrompt = `Tu es un coach de développement personnel spécialisé dans l'aide aux personnes en sevrage d'addiction au cannabis. Tu résumes les livres de manière claire et actionnable.`
        userPrompt = `Résume les concepts clés du livre "${reading.title}" de ${reading.author} en 3-5 points essentiels.

Contexte: ${reading.description}

Format ta réponse ainsi:
🔑 **Concepts clés:**
- [Point 1]
- [Point 2]
- [Point 3]

💡 **En quoi ce livre peut t'aider dans ton sevrage:**
[Explication courte]`
        break

      case 'questions':
        systemPrompt = `Tu es un thérapeute qui pose des questions de réflexion puissantes pour aider à l'introspection.`
        userPrompt = `Génère 5 questions de réflexion profonde basées sur "${reading.title}" de ${reading.author}.

Contexte du livre: ${reading.description}
Contexte personnel: La personne est en sevrage cannabis. Déclencheurs récents: ${triggers || 'non spécifié'}. États émotionnels: ${emotionalStates || 'non spécifié'}.

Les questions doivent être:
- Personnelles et introspectives
- Liées au sevrage d'addiction
- Inspirées des concepts du livre
- Encourageantes mais honnêtes

Format:
1. [Question 1]
2. [Question 2]
...`
        break

      case 'actions':
        systemPrompt = `Tu es un coach pragmatique qui transforme la théorie en actions concrètes.`
        userPrompt = `Basé sur le livre "${reading.title}" de ${reading.author}, propose 3 actions concrètes que je peux faire AUJOURD'HUI pour avancer dans mon sevrage.

Contexte du livre: ${reading.description}
Situation actuelle: ${hasSmoked ? 'A fumé récemment' : 'N\'a pas fumé récemment'}.
Déclencheurs: ${triggers || 'non spécifié'}.

Les actions doivent être:
- Spécifiques et mesurables
- Réalisables en moins de 30 minutes
- Directement inspirées du livre
- Adaptées au contexte d'addiction

Format:
✅ **Action 1:** [Titre]
📝 [Description détaillée + comment faire]

✅ **Action 2:** ...`
        break

      case 'recommendation':
        systemPrompt = `Tu es un bibliothérapeute expert en développement personnel et sevrage d'addictions.`
        userPrompt = `La personne lit actuellement "${reading.title}" de ${reading.author}.

Contexte: ${reading.description}
Statut: ${reading.status === 'en_cours' ? 'En cours de lecture' : reading.status === 'terminé' ? 'Terminé' : 'Non commencé'}
Notes personnelles: ${reading.notes || 'Aucune note'}

Contexte personnel: En sevrage cannabis. Déclencheurs: ${triggers || 'non spécifié'}. États émotionnels: ${emotionalStates || 'non spécifié'}.

Recommande 2-3 livres complémentaires qui pourraient l'aider, en expliquant pourquoi.

Format:
📚 **Prochaines lectures recommandées:**

**1. [Titre]** par [Auteur]
🎯 Pourquoi: [Explication personnalisée]

**2. [Titre]** ...`
        break

      default:
        return NextResponse.json({
          success: false,
          error: 'Type invalide',
        }, { status: 400 })
    }

    // Appel à l'API OpenAI
    console.log(`🤖 Génération d'insights IA (${type}) pour ${reading.title}...`)

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
        temperature: 0.7,
        max_tokens: 800,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Erreur OpenAI:', errorText)
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de la génération des insights',
      }, { status: 500 })
    }

    const data = await response.json()
    const insight = data.choices[0]?.message?.content || ''

    return NextResponse.json({
      success: true,
      insight,
      type,
      book: {
        title: reading.title,
        author: reading.author,
      },
    })

  } catch (error) {
    console.error('❌ Erreur génération insights:', error)
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la génération des insights',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
