import { parse } from 'csv-parse/sync'
import * as fs from 'fs'
import * as path from 'path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Script d'import des données CSV dans la base de données
 *
 * Format CSV attendu :
 * - Date (format: YYYY-MM-DD ou DD/MM/YYYY)
 * - Heure (format: HH:mm)
 * - Ai-je fumé ? (O/N)
 * - Nombre de joints
 * - Heure du joint (format: HH:mm)
 * - Intervalle depuis dernier joint (min)
 * - Envie de fumer (0-10)
 * - État émotionnel
 * - État physique
 * - Contexte / activité
 * - Déclencheur
 * - Action alternative (si pas fumé)
 * - Décision consciente (O/N)
 * - Commentaire libre (texte intégral)
 */

interface CsvRow {
  Date: string
  Heure: string
  'Ai-je fumé ? (O/N)': string
  'Nombre de joints': string
  'Heure du joint': string
  'Intervalle depuis dernier joint (min)': string
  'Envie de fumer (0-10)': string
  'État émotionnel': string
  'État physique': string
  'Contexte / activité': string
  'Déclencheur': string
  'Action alternative (si pas fumé)': string
  'Décision consciente (O/N)': string
  'Commentaire libre (texte intégral)': string
}

/**
 * Convertir une date du format DD/MM/YYYY au format YYYY-MM-DD
 */
function parseDate(dateStr: string): Date {
  // Si format YYYY-MM-DD
  if (dateStr.includes('-')) {
    return new Date(dateStr)
  }

  // Si format DD/MM/YYYY
  if (dateStr.includes('/')) {
    const [day, month, year] = dateStr.split('/')
    return new Date(`${year}-${month}-${day}`)
  }

  throw new Error(`Format de date invalide: ${dateStr}`)
}

/**
 * Convertir O/N en boolean
 */
function parseBoolean(value: string): boolean {
  const normalized = value.trim().toUpperCase()
  return normalized === 'O' || normalized === 'OUI' || normalized === 'Y' || normalized === 'YES'
}

/**
 * Parse un nombre, retourne 0 si invalide
 */
function parseNumber(value: string, defaultValue: number = 0): number {
  const num = parseInt(value.trim(), 10)
  return isNaN(num) ? defaultValue : num
}

async function importCsv() {
  const csvFilePath = path.join(__dirname, '..', 'data', 'journal_addiction.csv')

  console.log('🔍 Recherche du fichier CSV...')
  console.log(`📁 Chemin: ${csvFilePath}`)

  if (!fs.existsSync(csvFilePath)) {
    console.error('❌ Fichier CSV non trouvé !')
    console.log(`Veuillez placer votre fichier CSV à : ${csvFilePath}`)
    process.exit(1)
  }

  console.log('✅ Fichier CSV trouvé')
  console.log('📖 Lecture du fichier...')

  const fileContent = fs.readFileSync(csvFilePath, 'utf-8')

  // Parser le CSV
  const records: CsvRow[] = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    delimiter: ',',
    trim: true,
  })

  console.log(`📊 ${records.length} lignes à importer`)

  let importedCount = 0
  let errorCount = 0

  for (let index = 0; index < records.length; index++) {
    const row = records[index]
    try {
      const date = parseDate(row.Date)
      const hasSmoked = parseBoolean(row['Ai-je fumé ? (O/N)'])
      const jointCount = hasSmoked ? parseNumber(row['Nombre de joints'], 1) : 0
      const cravingLevel = parseNumber(row['Envie de fumer (0-10)'], 5)
      const consciousDecision = parseBoolean(row['Décision consciente (O/N)'])

      // Intervalle depuis dernier joint (peut être vide)
      let minutesSinceLastJoint: number | null = null
      if (row['Intervalle depuis dernier joint (min)']) {
        const interval = parseNumber(row['Intervalle depuis dernier joint (min)'])
        minutesSinceLastJoint = interval > 0 ? interval : null
      }

      // Créer l'entrée
      await prisma.entry.create({
        data: {
          date,
          time: row.Heure || '00:00',
          hasSmoked,
          jointCount,
          jointTime: row['Heure du joint'] || row.Heure || '00:00',
          minutesSinceLastJoint,
          cravingLevel,
          emotionalState: row['État émotionnel'] || '',
          physicalState: row['État physique'] || '',
          context: row['Contexte / activité'] || '',
          trigger: row['Déclencheur'] || '',
          alternativeAction: row['Action alternative (si pas fumé)'] || '',
          consciousDecision,
          comment: row['Commentaire libre (texte intégral)'] || '',
        },
      })

      importedCount++
      if ((index + 1) % 10 === 0) {
        console.log(`⏳ ${index + 1}/${records.length} lignes traitées...`)
      }
    } catch (error) {
      errorCount++
      console.error(`❌ Erreur ligne ${index + 1}:`, error)
      console.error('Données:', row)
    }
  }

  console.log('\n✨ Import terminé !')
  console.log(`✅ ${importedCount} entrées importées`)
  if (errorCount > 0) {
    console.log(`⚠️  ${errorCount} erreurs`)
  }

  await prisma.$disconnect()
}

// Exécuter l'import
importCsv()
  .then(() => {
    console.log('✅ Script terminé avec succès')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  })
