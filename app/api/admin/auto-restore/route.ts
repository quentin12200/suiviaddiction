import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Script de récupération automatique des entrées corrompues
 * Restaure les entrées qui étaient probablement hasSmoked=false
 * basé sur des heuristiques
 */
export async function POST() {
  try {
    console.log('🔍 Démarrage de la récupération automatique...')

    // Récupérer TOUTES les entrées
    const allEntries = await prisma.entry.findMany({
      orderBy: { date: 'desc' },
    })

    console.log(`📊 Total d'entrées à analyser: ${allEntries.length}`)

    const restoredEntries: any[] = []
    const uncertainEntries: any[] = []

    for (const entry of allEntries) {
      // Indicateurs qu'une entrée était probablement hasSmoked=false
      let confidenceScore = 0
      const reasons: string[] = []

      // 1. jointCount = 0 ou 1 (fort indice)
      if (entry.jointCount === 0) {
        confidenceScore += 50
        reasons.push('jointCount=0')
      } else if (entry.jointCount === 1 && !entry.jointTime) {
        confidenceScore += 30
        reasons.push('jointCount=1 sans jointTime')
      }

      // 2. jointTime vide/null (fort indice)
      if (!entry.jointTime || entry.jointTime === '') {
        confidenceScore += 40
        reasons.push('pas de jointTime')
      }

      // 3. alternativeAction renseignée (moyen indice)
      if (entry.alternativeAction && entry.alternativeAction.length > 5) {
        confidenceScore += 20
        reasons.push('alternative action renseignée')
      }

      // 4. consciousDecision = true (faible indice, peut être les deux)
      if (entry.consciousDecision) {
        confidenceScore += 10
        reasons.push('décision consciente')
      }

      // 5. Pas de trigger (moyen indice - si pas fumé, pas de déclencheur)
      if (!entry.trigger || entry.trigger === '') {
        confidenceScore += 15
        reasons.push('pas de trigger')
      }

      // 6. cravingLevel très bas (faible indice)
      if (entry.cravingLevel <= 3) {
        confidenceScore += 5
        reasons.push('envie faible')
      }

      // DÉCISION : Si score >= 50, on restaure automatiquement
      if (confidenceScore >= 50 && entry.hasSmoked === true) {
        restoredEntries.push({
          id: entry.id,
          date: entry.date,
          time: entry.time,
          confidenceScore,
          reasons,
        })
      } else if (confidenceScore >= 30 && confidenceScore < 50 && entry.hasSmoked === true) {
        // Score moyen : on garde pour revue manuelle
        uncertainEntries.push({
          id: entry.id,
          date: entry.date,
          time: entry.time,
          confidenceScore,
          reasons,
        })
      }
    }

    console.log(`✅ ${restoredEntries.length} entrées à restaurer automatiquement`)
    console.log(`❓ ${uncertainEntries.length} entrées incertaines à vérifier manuellement`)

    // Restauration automatique
    let restored = 0
    for (const entry of restoredEntries) {
      await prisma.entry.update({
        where: { id: entry.id },
        data: {
          hasSmoked: false,
          jointCount: 0,
          jointTime: null,
        },
      })
      restored++
      console.log(`  ✓ Restauré: ${entry.date.toISOString().split('T')[0]} ${entry.time} (score: ${entry.confidenceScore})`)
    }

    return NextResponse.json({
      success: true,
      restored: restored,
      uncertain: uncertainEntries.length,
      details: {
        restoredEntries: restoredEntries.map(e => ({
          date: e.date.toISOString().split('T')[0],
          time: e.time,
          score: e.confidenceScore,
          reasons: e.reasons,
        })),
        uncertainEntries: uncertainEntries.map(e => ({
          id: e.id,
          date: e.date.toISOString().split('T')[0],
          time: e.time,
          score: e.confidenceScore,
          reasons: e.reasons,
        })),
      },
    })
  } catch (error) {
    console.error('❌ Erreur récupération:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
