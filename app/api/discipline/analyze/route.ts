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
      // QUESTIONS ISOLEMENT (si event isolement)
      if (entry.isolationEvent) {
        // Si isolement SANS plan → Destructif
        if (!entry.isolationPlanned) {
          challenges.push({
            entryId: entry.id,
            question: `Tu t'es isolé SANS PLAN. Qu'est-ce que tu aurais pu faire pendant ce temps qui t'aurait REMPLI au lieu de te laisser tomber dans le vide ?`,
            answered: false,
            answer: '',
          })
        }

        // Si isolement pour FUIR
        if (entry.isolationReason === 'fuite') {
          challenges.push({
            entryId: entry.id,
            question: `Tu t'es isolé pour FUIR quelque chose. Qu'est-ce que tu évitais vraiment ? Et est-ce que ça a résolu le problème ou juste repoussé l'échéance ?`,
            answered: false,
            answer: '',
          })
        }

        // Si résultat = addictions
        if (entry.isolationOutcome === 'addictions') {
          challenges.push({
            entryId: entry.id,
            question: `Ton isolement a mené aux addictions. C'était prévisible ? Qu'est-ce que tu aurais pu mettre en place AVANT de t'isoler pour éviter ça ?`,
            answered: false,
            answer: '',
          })
        }

        // Si résultat = vide
        if (entry.isolationOutcome === 'vide') {
          challenges.push({
            entryId: entry.id,
            question: `Tu as fini avec un sentiment de VIDE. L'isolement sans projet mène toujours là. Qu'est-ce qui pourrait donner du SENS à ton temps seul la prochaine fois ?`,
            answered: false,
            answer: '',
          })
        }

        // Si résultat = rechargé + activité → SUCCÈS
        if (entry.isolationOutcome === 'rechargé' && entry.isolationActivity) {
          challenges.push({
            entryId: entry.id,
            question: `BRAVO ! Tu t'es isolé avec un plan ("${entry.isolationActivity}") et ça t'a rechargé. Décris précisément ce qui a marché pour pouvoir le REPRODUIRE.`,
            answered: false,
            answer: '',
          })
        }
      }

      // QUESTIONS ADRÉNALINE (si event adrénaline)
      if (entry.adrenalineEvent) {
        if (entry.adrenalineType === 'risque') {
          challenges.push({
            entryId: entry.id,
            question: `Tu as cherché l'adrénaline dans quelque chose de RISQUÉ. Qu'est-ce que tu FUYAIS à ce moment-là ? Qu'est-ce qui MANQUE dans ta vie pour que tu aies besoin de franchir cette limite ?`,
            answered: false,
            answer: '',
          })

          // Question sur le déclencheur spécifique
          if (entry.adrenalineTrigger === 'transgression') {
            challenges.push({
              entryId: entry.id,
              question: `Le frisson de la transgression. C'est vraiment ça que tu cherchais ? Liste 3 choses qui pourraient te donner la MÊME intensité sans détruire ce qui compte pour toi.`,
              answered: false,
              answer: '',
            })
          }

          if (entry.adrenalineTrigger === 'vide') {
            challenges.push({
              entryId: entry.id,
              question: `Tu as ressenti un VIDE. Au lieu de le remplir avec du risque, qu'est-ce qui pourrait donner du SENS à ta vie en ce moment ?`,
              answered: false,
              answer: '',
            })
          }

          if (entry.adrenalineTrigger === 'routine') {
            challenges.push({
              entryId: entry.id,
              question: `La routine t'étouffe. Mais prendre des risques qui détruisent ta vie, c'est la solution ? Qu'est-ce que tu pourrais CHANGER dans ta vie pour sortir de cette monotonie ?`,
              answered: false,
              answer: '',
            })
          }
        }

        if (entry.adrenalineType === 'échappatoire') {
          challenges.push({
            entryId: entry.id,
            question: `Tu as choisi l'échappatoire passive. C'est mieux que le risque, mais est-ce que ça RÉSOUT vraiment le problème ? Qu'est-ce que tu évites de faire ou de ressentir ?`,
            answered: false,
            answer: '',
          })
        }

        if (entry.adrenalineType === 'alternative' && entry.adrenalineOutcome === 'réussi') {
          challenges.push({
            entryId: entry.id,
            question: `BRAVO ! Tu as trouvé une alternative qui a MARCHÉ. Décris précisément ce que tu as fait pour pouvoir le REPRODUIRE la prochaine fois.`,
            answered: false,
            answer: '',
          })
        }
      }

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
