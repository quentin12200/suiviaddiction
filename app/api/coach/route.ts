import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Message requis' },
        { status: 400 }
      )
    }

    // Récupérer les données récentes de l'utilisateur pour contextualiser
    const recentEntries = await prisma.entry.findMany({
      orderBy: { date: 'desc' },
      take: 10,
    })

    const activeStrategies = await prisma.activeStrategy.findMany({
      where: { isActive: true },
    })

    // Calculer quelques stats pour le contexte
    const last7Days = recentEntries.slice(0, 7)
    const smokingDays = last7Days.filter(e => e.hasSmoked).length
    const averageCraving = last7Days.reduce((sum, e) => sum + e.cravingLevel, 0) / last7Days.length

    // Préparer le contexte pour l'IA
    const systemContext = `Tu es un coach personnel spécialisé dans l'accompagnement des personnes souffrant d'addiction (cannabis, jeux vidéo, sexuelle). Tu parles avec Quentin, 34 ans, syndiqué CGT.

Contexte actuel de Quentin :
- Sur les 7 derniers jours : ${smokingDays} jours avec consommation de cannabis
- Niveau d'envie moyen : ${averageCraving.toFixed(1)}/10
- ${activeStrategies.length} stratégies actives en cours

Approche :
- Empathique et bienveillant, sans jugement
- Utilise le tutoiement
- Encourage et valorise chaque petit progrès
- Propose des actions concrètes et réalistes
- Rappelle que la rechute fait partie du processus
- Adapte tes conseils au contexte syndical/militant si pertinent
- Reste concis (3-5 phrases maximum par réponse)

Ta mission : Soutenir Quentin dans son chemin vers la liberté, avec compassion et pragmatisme.`

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
          { role: 'system', content: systemContext },
          ...(conversationHistory || []),
          { role: 'user', content: message },
        ],
        temperature: 0.8,
        max_tokens: 300,
      }),
    })

    if (!response.ok) {
      console.error('Erreur OpenAI:', await response.text())
      return NextResponse.json(
        { success: false, error: 'Erreur de communication avec l\'IA' },
        { status: 500 }
      )
    }

    const data = await response.json()
    const aiMessage = data.choices[0]?.message?.content

    if (!aiMessage) {
      return NextResponse.json(
        { success: false, error: 'Pas de réponse de l\'IA' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: aiMessage,
    })
  } catch (error) {
    console.error('Erreur coach IA:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
