import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parse } from 'csv-parse/sync'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Aucun fichier fourni' },
        { status: 400 }
      )
    }

    // Lire le contenu du fichier
    const text = await file.text()

    // Parser le CSV
    const records = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    })

    let imported = 0
    let errors = 0

    // Importer chaque entrée
    for (const record of records) {
      try {
        // Convertir les valeurs
        const hasSmoked = record.hasSmoked === 'true' || record.hasSmoked === '1'
        const jointCount = parseInt(record.jointCount || '0', 10)
        const cravingLevel = parseInt(record.cravingLevel || '0', 10)
        const consciousDecision = record.consciousDecision === 'true' || record.consciousDecision === '1'

        // Créer l'entrée
        await prisma.entry.create({
          data: {
            date: new Date(record.date),
            time: record.time,
            hasSmoked,
            jointCount,
            jointTime: record.jointTime || null,
            minutesSinceLastJoint: record.minutesSinceLastJoint ? parseInt(record.minutesSinceLastJoint, 10) : null,
            cravingLevel,
            emotionalState: record.emotionalState || '',
            physicalState: record.physicalState || '',
            context: record.context || '',
            trigger: record.trigger || '',
            alternativeAction: record.alternativeAction || '',
            consciousDecision,
            comment: record.comment || '',
          },
        })

        imported++
      } catch (error) {
        console.error('Erreur import ligne:', error)
        errors++
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      errors,
    })
  } catch (error) {
    console.error('Erreur import CSV:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de l\'import du CSV' },
      { status: 500 }
    )
  }
}
