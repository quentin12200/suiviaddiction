import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface Entry {
  id: string
  date: Date
  time: string
  hasSmoked: boolean
  jointCount: number
  cravingLevel: number
  emotionalState: string
  physicalState: string
  context: string
  trigger: string
  alternativeAction: string
  comment: string
}

/**
 * Génère des questions de remise en question basées sur les entrées du jour
 */
export async function POST(request: NextRequest) {
  try {
    const { date } = await request.json()

    if (!date) {
      return NextResponse.json(
        { success: false, error: 'Date manquante' },
        { status: 400 }
      )
    }

    // Récupérer toutes les entrées et filtrer par date
    const allEntries = await prisma.entry.findMany({
      orderBy: { date: 'asc' },
    })

    const todayEntries = allEntries.filter(entry => {
      const entryDateString = entry.date.toISOString().split('T')[0]
      return entryDateString === date
    })

    console.log(`Analyzing ${todayEntries.length} entries for ${date}`)

    // Générer des questions provocatrices
    const challenges: any[] = []

    todayEntries.forEach((entry: any) => {
      if (entry.hasSmoked) {
        // NOUVELLE QUESTION : Challenge sur le patch nicotine + tabac
        challenges.push({
          entryId: entry.id,
          question: `Tu portes un patch 14mg de nicotine. Pourquoi as-tu fumé du TABAC alors que ton besoin de nicotine est déjà satisfait ? C'était juste pour le THC, non ? Pourquoi ne pas passer aux joints SANS tabac ?`,
          answered: false,
          answer: '',
        })

        // Question sur le déclencheur
        if (entry.trigger) {
          challenges.push({
            entryId: entry.id,
            question: `Tu as fumé ${entry.jointCount} joint${entry.jointCount > 1 ? 's' : ''} à ${entry.time} avec comme déclencheur "${entry.trigger}". Était-ce vraiment une RAISON VALABLE ou juste une EXCUSE facile ?`,
            answered: false,
            answer: '',
          })
        }

        // Question sur le contexte
        if (entry.context) {
          challenges.push({
            entryId: entry.id,
            question: `Contexte : "${entry.context}". Si tu avais changé d'environnement à ce moment-là (sortir, appeler quelqu'un, faire du sport), aurais-tu quand même fumé ? Sois honnête.`,
            answered: false,
            answer: '',
          })
        }

        // Question sur l'envie
        if (entry.cravingLevel >= 7) {
          challenges.push({
            entryId: entry.id,
            question: `Ton envie était à ${entry.cravingLevel}/10. C'est élevé. Mais as-tu VRAIMENT essayé de résister ? Qu'as-tu fait pendant les 10 minutes avant de craquer ?`,
            answered: false,
            answer: '',
          })
        } else if (entry.cravingLevel <= 4) {
          challenges.push({
            entryId: entry.id,
            question: `Ton envie n'était qu'à ${entry.cravingLevel}/10. Alors pourquoi as-tu fumé ? C'était par HABITUDE, pas par besoin. Admets-le.`,
            answered: false,
            answer: '',
          })
        }

        // Question sur l'état émotionnel
        if (entry.emotionalState && (entry.emotionalState.toLowerCase().includes('stress') || entry.emotionalState.toLowerCase().includes('anxiété'))) {
          challenges.push({
            entryId: entry.id,
            question: `Tu étais "${entry.emotionalState}". Fumer a-t-il VRAIMENT résolu ce problème ? Ou l'as-tu juste enterré temporairement ? Quelle solution RÉELLE aurais-tu pu essayer ?`,
            answered: false,
            answer: '',
          })
        }

        // Question sur l'action alternative
        if (!entry.alternativeAction || entry.alternativeAction.trim() === '') {
          challenges.push({
            entryId: entry.id,
            question: `Tu n'as même pas essayé d'alternative avant de fumer. Pourquoi ? Liste MAINTENANT 3 choses que tu aurais pu faire à la place.`,
            answered: false,
            answer: '',
          })
        }
      }
    })

    // Si peu d'entrées dans la journée, ajouter une question sur le suivi
    if (todayEntries.length < 3) {
      challenges.push({
        entryId: 'tracking',
        question: `Tu n'as enregistré que ${todayEntries.length} entrée${todayEntries.length > 1 ? 's' : ''} aujourd'hui. Combien de moments d'envie as-tu ignorés sans les noter ? Comment peux-tu progresser si tu ne TRACES PAS tout ?`,
        answered: false,
        answer: '',
      })
    }

    // Si aucun joint fumé mais envies élevées non notées
    const smokedEntries = todayEntries.filter((e: any) => e.hasSmoked)
    const highCravingEntries = todayEntries.filter((e: any) => !e.hasSmoked && e.cravingLevel >= 7)

    if (smokedEntries.length === 0 && highCravingEntries.length > 0) {
      challenges.push({
        entryId: 'resistance',
        question: `Tu as résisté à des envies fortes aujourd'hui. COMMENT as-tu fait ? Décris précisément ce qui a marché pour que tu puisses le REPRODUIRE.`,
        answered: false,
        answer: '',
      })
    }

    return NextResponse.json({
      success: true,
      entries: todayEntries,
      challenges: challenges.slice(0, 5), // Max 5 questions par jour
    })
  } catch (error) {
    console.error('Erreur analyse discipline:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
