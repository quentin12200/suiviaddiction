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

    // NOUVELLE LOGIQUE : Compter les MOMENTS, pas les jours
    const totalEntries = recentEntries.length
    const smokingMoments = recentEntries.filter((e: EntryType) => e.hasSmoked).length
    const resistanceMoments = recentEntries.filter((e: EntryType) => !e.hasSmoked).length
    const totalJoints = recentEntries
      .filter((e: EntryType) => e.hasSmoked)
      .reduce((sum: number, e: EntryType) => sum + e.jointCount, 0)

    const avgCraving = recentEntries.length > 0
      ? recentEntries.reduce((sum: number, e: EntryType) => sum + e.cravingLevel, 0) / recentEntries.length
      : 0

    // Construire le prompt pour ChatGPT
    const prompt = `Tu es un coach bienveillant qui aide les personnes à réduir leur consommation de cannabis.

Voici les statistiques RÉELLES des 7 derniers jours de l'utilisateur :
- Nombre total d'ENTRÉES enregistrées : ${totalEntries}
- Nombre de MOMENTS où il a fumé : ${smokingMoments}
- Nombre de MOMENTS DE RÉSISTANCE (où il n'a pas fumé) : ${resistanceMoments}
- Nombre total de joints consommés : ${totalJoints}
- Niveau moyen d'envie : ${avgCraving.toFixed(1)}/10

IMPORTANT :
- L'utilisateur fait PLUSIEURS entrées PAR JOUR (pas une par jour)
- Il fume TOUS LES JOURS mais il ESPACE ses consommations
- Son progrès = AUGMENTER le nombre de moments de résistance
- NE parle PAS de "jours sans fumer" car ça n'existe pas pour lui
- Parle de ses MOMENTS DE RÉSISTANCE et de l'ESPACEMENT entre joints

Génère un message d'encouragement personnalisé (maximum 3 phrases courtes). Valorise ses moments de résistance et encourage-le à continuer d'espacer ses consommations.`

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
        resistanceMoments,
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
