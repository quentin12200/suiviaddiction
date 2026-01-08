import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const accessToken = cookieStore.get('google_drive_access_token')

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'Google Drive non connecté' },
        { status: 401 }
      )
    }

    // Récupérer toutes les données d'addiction
    const entries = await prisma.addictionEntry.findMany({
      orderBy: { timestamp: 'desc' },
    })

    const goals = await prisma.goal.findMany({
      orderBy: { date: 'desc' },
    })

    const strategies = await prisma.copingStrategy.findMany({
      orderBy: { createdAt: 'desc' },
    })

    const disciplineEntries = await prisma.disciplineEntry.findMany({
      orderBy: { date: 'desc' },
    })

    // Générer le CSV des entrées d'addiction
    const csvHeaders = [
      'Date',
      'Heure',
      'Type',
      'Quantité',
      'Contexte',
      'Déclencheur',
      'Humeur avant',
      'Humeur après',
      'Craving',
      'Note',
    ].join(',')

    const csvRows = entries.map((entry) => {
      const date = new Date(entry.timestamp)
      return [
        date.toLocaleDateString('fr-FR'),
        date.toLocaleTimeString('fr-FR'),
        entry.type,
        entry.quantity,
        `"${entry.context || ''}"`,
        `"${entry.trigger || ''}"`,
        entry.moodBefore,
        entry.moodAfter,
        entry.craving,
        `"${entry.note || ''}"`,
      ].join(',')
    })

    const csvContent = [csvHeaders, ...csvRows].join('\n')

    // Générer le CSV des objectifs
    const goalsHeaders = ['Date', 'Max joints', 'Intervalle min (min)', 'Note'].join(',')
    const goalsRows = goals.map((goal) => {
      return [
        new Date(goal.date).toLocaleDateString('fr-FR'),
        goal.maxJoints,
        goal.minIntervalMinutes,
        `"${goal.note || ''}"`,
      ].join(',')
    })
    const goalsCsvContent = [goalsHeaders, ...goalsRows].join('\n')

    // Générer le CSV des stratégies
    const strategiesHeaders = ['Nom', 'Description', 'Catégorie', 'Utilisations', 'Efficacité'].join(',')
    const strategiesRows = strategies.map((strategy) => {
      return [
        `"${strategy.name}"`,
        `"${strategy.description}"`,
        strategy.category,
        strategy.usageCount,
        strategy.effectiveness.toFixed(1),
      ].join(',')
    })
    const strategiesCsvContent = [strategiesHeaders, ...strategiesRows].join('\n')

    // Générer le CSV de discipline
    const disciplineHeaders = [
      'Date',
      'Réveil',
      'Coucher',
      'Exercice',
      'Durée exercice (min)',
      'Heures productives',
      'Distractions résistées',
      'Promesses tenues',
      'Auto-évaluation',
      'Pire moment',
      'Meilleur moment',
    ].join(',')
    const disciplineRows = disciplineEntries.map((entry) => {
      return [
        new Date(entry.date).toLocaleDateString('fr-FR'),
        entry.wakeUpTime || '',
        entry.sleepTime || '',
        entry.exerciseDone ? 'Oui' : 'Non',
        entry.exerciseDuration,
        entry.productiveHours,
        entry.distractionsResisted,
        entry.promisesKept,
        entry.selfRating,
        `"${entry.worstMoment}"`,
        `"${entry.bestMoment}"`,
      ].join(',')
    })
    const disciplineCsvContent = [disciplineHeaders, ...disciplineRows].join('\n')

    // Créer un fichier ZIP ou plusieurs fichiers CSV
    const timestamp = new Date().toISOString().split('T')[0]
    const fileName = `suivi_addiction_${timestamp}.csv`
    const goalsFileName = `objectifs_${timestamp}.csv`
    const strategiesFileName = `strategies_${timestamp}.csv`
    const disciplineFileName = `discipline_${timestamp}.csv`

    // Créer ou récupérer le dossier "Suivi Addiction Backups" dans Drive
    const folderName = 'Suivi Addiction Backups'

    // Rechercher le dossier existant
    let folderId = null
    const searchFolderResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?` +
      `q=name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      {
        headers: {
          Authorization: `Bearer ${accessToken.value}`,
        },
      }
    )

    const searchData = await searchFolderResponse.json()

    if (searchData.files && searchData.files.length > 0) {
      folderId = searchData.files[0].id
    } else {
      // Créer le dossier s'il n'existe pas
      const createFolderResponse = await fetch(
        'https://www.googleapis.com/drive/v3/files',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken.value}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
          }),
        }
      )
      const folderData = await createFolderResponse.json()
      folderId = folderData.id
    }

    // Fonction pour uploader un fichier CSV
    const uploadFile = async (content: string, fileName: string) => {
      const metadata = {
        name: fileName,
        mimeType: 'text/csv',
        parents: [folderId],
      }

      const boundary = '-------314159265358979323846'
      const delimiter = `\r\n--${boundary}\r\n`
      const closeDelimiter = `\r\n--${boundary}--`

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: text/csv\r\n\r\n' +
        content +
        closeDelimiter

      const uploadResponse = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken.value}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartRequestBody,
        }
      )

      return uploadResponse.json()
    }

    // Uploader tous les fichiers
    const uploadResults = await Promise.all([
      uploadFile(csvContent, fileName),
      uploadFile(goalsCsvContent, goalsFileName),
      uploadFile(strategiesCsvContent, strategiesFileName),
      uploadFile(disciplineCsvContent, disciplineFileName),
    ])

    // Vérifier si tous les uploads ont réussi
    const allSuccessful = uploadResults.every((result) => result.id)

    if (!allSuccessful) {
      return NextResponse.json(
        { success: false, error: 'Échec de l\'upload de certains fichiers' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Export réussi vers Google Drive',
      files: uploadResults.map((r) => ({
        id: r.id,
        name: r.name,
      })),
      folderName,
      entriesCount: entries.length,
      goalsCount: goals.length,
      strategiesCount: strategies.length,
      disciplineCount: disciplineEntries.length,
    })
  } catch (error) {
    console.error('Erreur export Google Drive:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de l\'export' },
      { status: 500 }
    )
  }
}
