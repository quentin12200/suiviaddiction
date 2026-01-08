import { NextRequest, NextResponse } from 'next/server'
import { getValidAccessToken } from '@/lib/google-refresh'

export async function GET(request: NextRequest) {
  try {
    const accessToken = await getValidAccessToken('drive')

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'Google Drive non connecté ou session expirée' },
        { status: 401 }
      )
    }

    const folderName = 'Suivi Addiction Backups'

    // Rechercher le dossier
    const searchFolderResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?` +
      `q=name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    const searchData = await searchFolderResponse.json()

    if (!searchData.files || searchData.files.length === 0) {
      return NextResponse.json({
        success: true,
        backups: [],
        message: 'Aucun dossier de sauvegarde trouvé',
      })
    }

    const folderId = searchData.files[0].id

    // Récupérer les fichiers dans le dossier
    const filesResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?` +
      `q='${folderId}' in parents and trashed=false&` +
      `fields=files(id,name,createdTime,modifiedTime,size,webViewLink)&` +
      `orderBy=createdTime desc`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    const filesData = await filesResponse.json()

    // Grouper les fichiers par date
    const backupsByDate: Record<string, any[]> = {}

    filesData.files.forEach((file: any) => {
      const date = file.name.match(/\d{4}-\d{2}-\d{2}/)?.[0] || 'unknown'
      if (!backupsByDate[date]) {
        backupsByDate[date] = []
      }
      backupsByDate[date].push({
        id: file.id,
        name: file.name,
        createdTime: file.createdTime,
        size: file.size,
        webViewLink: file.webViewLink,
      })
    })

    return NextResponse.json({
      success: true,
      backups: backupsByDate,
      totalFiles: filesData.files.length,
    })
  } catch (error) {
    console.error('Erreur récupération backups:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des backups' },
      { status: 500 }
    )
  }
}
