import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Récupérer les statistiques récentes
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentEntries = await prisma.entry.findMany({
      where: {
        date: {
          gte: sevenDaysAgo,
        },
      },
      orderBy: { date: 'desc' },
      take: 20,
    })

    type EntryType = typeof recentEntries[number]

    // Calculer des statistiques
    const totalJoints = recentEntries
      .filter((e: EntryType) => e.hasSmoked)
      .reduce((sum: number, e: EntryType) => sum + e.jointCount, 0)

    const daysWithoutSmoking = recentEntries.filter((e: EntryType) => !e.hasSmoked).length
    const avgCraving = recentEntries.length > 0
      ? recentEntries.reduce((sum: number, e: EntryType) => sum + e.cravingLevel, 0) / recentEntries.length
      : 0

    // Construire le prompt pour ChatGPT
    const prompt = `Tu es un coach bienveillant qui aide les personnes à réduire leur consommation de cannabis.

Voici les statistiques des 7 derniers jours de l'utilisateur :
- Nombre total de joints : ${totalJoints}
- Jours sans fumer : ${daysWithoutSmoking}
- Niveau moyen d'envie : ${avgCraving.toFixed(1)}/10
- Nombre d'entrées enregistrées : ${recentEntries.length}

Génère un message d'encouragement personnalisé et motivant (maximum 3 phrases courtes). Sois positif, reconnaissant des efforts, et donne un conseil pratique basé sur ces statistiques.`

    // Appeler l'API OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Tu es un coach bienveillant et encourageant qui aide les gens dans leur démarche de réduction de consommation de cannabis.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.8,
      }),
    })

    if (!openaiResponse.ok) {
      throw new Error('Erreur API OpenAI')
    }

    const data = await openaiResponse.json()
    const encouragement = data.choices[0]?.message?.content || 'Continue tes efforts, tu es sur la bonne voie ! 💪'

    return NextResponse.json({
      success: true,
      encouragement,
      stats: {
        totalJoints,
        daysWithoutSmoking,
        avgCraving: avgCraving.toFixed(1),
      },
    })
  } catch (error) {
    console.error('Erreur génération encouragement:', error)

    // Message de fallback si l'API échoue
    return NextResponse.json({
      success: true,
      encouragement: 'Continue sur cette voie ! Chaque jour est une victoire. 💪 N\'oublie pas de célébrer tes progrès, même les plus petits.',
      stats: null,
    })
  }
}
