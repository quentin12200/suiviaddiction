import { NextRequest, NextResponse } from 'next/server'
import { getValidAccessToken } from '@/lib/google-refresh'

export async function GET(request: NextRequest) {
  try {
    const accessToken = await getValidAccessToken('fit')

    if (!accessToken) {
      return NextResponse.json({
        error: 'Google Fit non connecté ou session expirée',
      })
    }

    // Lister toutes les sources de données disponibles
    const sourcesResponse = await fetch(
      'https://www.googleapis.com/fitness/v1/users/me/dataSources',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    )

    if (!sourcesResponse.ok) {
      const errorText = await sourcesResponse.text()
      return NextResponse.json({
        error: `Erreur ${sourcesResponse.status}: ${errorText}`,
      })
    }

    const sourcesData = await sourcesResponse.json()

    // Filtrer pour ne montrer que les sources pertinentes
    const relevantSources = {
      steps: sourcesData.dataSource?.filter((s: any) =>
        s.dataStreamId?.includes('step_count') || s.dataType?.name?.includes('step_count')
      ) || [],
      activeMinutes: sourcesData.dataSource?.filter((s: any) =>
        s.dataStreamId?.includes('active_minutes') || s.dataType?.name?.includes('active_minutes')
      ) || [],
      calories: sourcesData.dataSource?.filter((s: any) =>
        s.dataStreamId?.includes('calories') || s.dataType?.name?.includes('calories')
      ) || [],
      heartRate: sourcesData.dataSource?.filter((s: any) =>
        s.dataStreamId?.includes('heart_rate') || s.dataType?.name?.includes('heart_rate')
      ) || [],
    }

    return NextResponse.json({
      success: true,
      allSources: sourcesData.dataSource || [],
      relevantSources,
      totalSources: sourcesData.dataSource?.length || 0,
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
    })
  }
}
