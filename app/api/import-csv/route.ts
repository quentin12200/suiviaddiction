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

    // Parser le CSV avec point-virgule comme délimiteur
    const records = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      delimiter: ';', // Point-virgule au lieu de virgule
      relax_quotes: true,
      relax_column_count: true, // Tolérer les colonnes manquantes
    })

    let imported = 0
    let errors = 0

    // Fonction pour convertir DD/MM/YYYY en Date
    const parseDate = (dateStr: string) => {
      if (!dateStr) return new Date()
      const parts = dateStr.split('/')
      if (parts.length === 3) {
        // DD/MM/YYYY -> YYYY-MM-DD
        return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
      }
      return new Date(dateStr)
    }

    // Fonction pour convertir O/N en boolean
    const parseBoolean = (value: string) => {
      if (!value) return false
      return value.toUpperCase() === 'O' || value === '1' || value.toLowerCase() === 'true'
    }

    // Importer chaque entrée
    for (const record of records) {
      try {
        // Mapper les colonnes françaises aux champs
        const date = parseDate(record['Date'])
        const time = record['Heure'] || ''
        const hasSmoked = parseBoolean(record['Ai-je fumé ? (O/N)'])
        const jointCount = parseInt(record['Nombre de joints'] || '0', 10)
        const jointTime = record['Heure du joint'] || null
        const minutesSinceLastJoint = record['Intervalle depuis dernier joint (min)']
          ? parseInt(record['Intervalle depuis dernier joint (min)'], 10)
          : null
        const cravingLevel = parseInt(record['Envie de fumer (0-10)'] || '0', 10)
        const emotionalState = record['État émotionnel'] || ''
        const physicalState = record['État physique'] || ''
        const context = record['Contexte / activité'] || ''
        const trigger = record['Déclencheur'] || ''
        const alternativeAction = record['Action alternative (si pas fumé)'] || ''
        const consciousDecision = parseBoolean(record['Décision consciente (O/N)'])
        const comment = record['Commentaire libre (texte intégral)'] || ''

        // Créer l'entrée
        await prisma.entry.create({
          data: {
            date,
            time,
            hasSmoked,
            jointCount,
            jointTime,
            minutesSinceLastJoint,
            cravingLevel,
            emotionalState,
            physicalState,
            context,
            trigger,
            alternativeAction,
            consciousDecision,
            comment,
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
