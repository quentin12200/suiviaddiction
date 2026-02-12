import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      mood,
      energy,
      thought,
      gratitude,
      challenge,
      victory,
      tomorrow,
      context,
      timestamp,
    } = body

    // Créer une entrée Thought avec toutes les informations formatées
    const content = `
📅 ${new Date(timestamp).toLocaleString('fr-FR')}
📍 ${context || 'Non spécifié'}

🎭 Humeur: ${mood || 'Non spécifiée'}
⚡ Énergie: ${energy}/10

💭 Pensées:
${thought || 'Aucune note'}

🙏 Gratitude:
${gratitude || 'Aucune'}

🏔️ Défi:
${challenge || 'Aucun'}

🏆 Victoire:
${victory || 'Aucune'}

🎯 Intention pour demain:
${tomorrow || 'Aucune'}
`.trim()

    await prisma.thought.create({
      data: {
        content,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Journal entry saved successfully',
    })
  } catch (error) {
    console.error('Error saving journal entry:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save journal entry' },
      { status: 500 }
    )
  }
}
