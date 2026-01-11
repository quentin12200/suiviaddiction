import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET - Récupérer toutes les entrées (avec pagination optionnelle)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const entries = await prisma.entry.findMany({
      orderBy: { date: 'desc' },
      take: limit,
      skip: offset,
    })

    const total = await prisma.entry.count()

    return NextResponse.json({ entries, total })
  } catch (error) {
    console.error('Erreur récupération entrées:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des entrées' },
      { status: 500 }
    )
  }
}

/**
 * POST - Créer une nouvelle entrée
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Récupérer la dernière entrée avec consommation pour calculer l'intervalle
    let minutesSinceLastJoint: number | null = null

    if (body.hasSmoked) {
      const lastSmokedEntry = await prisma.entry.findFirst({
        where: { hasSmoked: true },
        orderBy: { date: 'desc' },
      })

      if (lastSmokedEntry) {
        const currentDateTime = new Date(`${body.date}T${body.time}:00`)
        const lastDateTime = new Date(
          `${lastSmokedEntry.date.toISOString().split('T')[0]}T${
            lastSmokedEntry.jointTime || lastSmokedEntry.time
          }:00`
        )
        const diffMs = currentDateTime.getTime() - lastDateTime.getTime()
        minutesSinceLastJoint = Math.floor(diffMs / (1000 * 60))
      }
    }

    // Parser la date en UTC pour éviter les problèmes de fuseau horaire
    // Si body.date est "2026-01-09", on crée une date UTC à minuit
    const entryDate = new Date(body.date + 'T00:00:00.000Z')

    // S'assurer que jointCount est toujours >= 1 quand hasSmoked est true
    const jointCount = body.hasSmoked ? (parseInt(body.jointCount) || 1) : 0

    // Créer l'entrée
    const entry = await prisma.entry.create({
      data: {
        date: entryDate,
        time: body.time,
        hasSmoked: body.hasSmoked,
        jointCount: jointCount,
        jointTime: body.jointTime || body.time,
        minutesSinceLastJoint,
        cravingLevel: body.cravingLevel,
        emotionalState: body.emotionalState || '',
        physicalState: body.physicalState || '',
        context: body.context || '',
        trigger: body.trigger || '',
        alternativeAction: body.alternativeAction || '',
        consciousDecision: body.consciousDecision || false,
        comment: body.comment || '',
        // Gestion Adrénaline
        adrenalineEvent: body.adrenalineEvent || false,
        adrenalineType: body.adrenalineType || '',
        adrenalineTrigger: body.adrenalineTrigger || '',
        adrenalineAlternative: body.adrenalineAlternative || '',
        adrenalineOutcome: body.adrenalineOutcome || '',
        // Gestion Isolement
        isolationEvent: body.isolationEvent || false,
        isolationPlanned: body.isolationPlanned || false,
        isolationActivity: body.isolationActivity || '',
        isolationReason: body.isolationReason || '',
        isolationOutcome: body.isolationOutcome || '',
      },
    })

    console.log('✅ Entry created with ID:', entry.id)

    return NextResponse.json({ success: true, entry })
  } catch (error) {
    console.error('Erreur création entrée:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'entrée' },
      { status: 500 }
    )
  }
}
