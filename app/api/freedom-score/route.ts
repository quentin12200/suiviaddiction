import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateFreedomScore } from '@/lib/freedomScore'

export async function GET() {
  try {
    // Récupérer toutes les entrées
    const entries = await prisma.entry.findMany({
      orderBy: { date: 'desc' },
    })

    // Convertir en format attendu
    const formattedEntries = entries.map(entry => ({
      hasSmoked: entry.hasSmoked,
      jointCount: entry.jointCount,
      cravingLevel: entry.cravingLevel,
      alternativeAction: entry.alternativeAction,
      consciousDecision: entry.consciousDecision,
      comment: entry.comment,
      date: entry.date,
      time: entry.time,
    }))

    // Calculer le score de liberté
    const freedomScore = calculateFreedomScore(formattedEntries)

    return NextResponse.json({
      success: true,
      ...freedomScore,
    })
  } catch (error) {
    console.error('Erreur calcul freedom score:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors du calcul du score' },
      { status: 500 }
    )
  }
}
