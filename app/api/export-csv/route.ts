import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * API pour exporter l'historique en CSV
 */
export async function GET() {
  try {
    const entries = await prisma.entry.findMany({
      orderBy: { date: 'desc' },
    })

    // Créer le contenu CSV
    const headers = [
      'Date',
      'Heure',
      'A fumé ?',
      'Nombre de joints',
      'Heure du joint',
      'Intervalle (min)',
      'Envie (0-10)',
      'État émotionnel',
      'État physique',
      'Contexte',
      'Déclencheur',
      'Action alternative',
      'Décision consciente',
      'Commentaire',
    ]

    const csvRows = [headers.join(';')]

    entries.forEach(entry => {
      const row = [
        entry.date.toISOString().split('T')[0].split('-').reverse().join('/'), // DD/MM/YYYY
        entry.time,
        entry.hasSmoked ? 'O' : 'N',
        entry.jointCount.toString(),
        entry.jointTime || '',
        entry.minutesSinceLastJoint?.toString() || '',
        entry.cravingLevel.toString(),
        entry.emotionalState,
        entry.physicalState,
        entry.context,
        entry.trigger,
        entry.alternativeAction,
        entry.consciousDecision ? 'O' : 'N',
        entry.comment.replace(/"/g, '""'), // Échapper les guillemets
      ]

      // Entourer chaque champ de guillemets et joindre avec des points-virgules
      csvRows.push(row.map(field => `"${field}"`).join(';'))
    })

    const csvContent = csvRows.join('\n')

    // Retourner le CSV avec les bons en-têtes
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="historique-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error('Erreur export CSV:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de l\'export CSV' },
      { status: 500 }
    )
  }
}
