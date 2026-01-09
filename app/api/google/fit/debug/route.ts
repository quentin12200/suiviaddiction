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

    const now = Date.now()
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const startTime = startOfDay.getTime()

    // Récupérer les données d'activité
    const activityResponse = await fetch(
      `https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aggregateBy: [
            {
              dataTypeName: 'com.google.step_count.delta',
            },
            {
              dataTypeName: 'com.google.active_minutes',
            },
            {
              dataTypeName: 'com.google.calories.expended',
            },
          ],
          bucketByTime: { durationMillis: now - startTime },
          startTimeMillis: startTime,
          endTimeMillis: now,
        }),
      }
    )

    const activityData = await activityResponse.json()

    // Renvoyer les données brutes pour debug
    return NextResponse.json({
      success: true,
      debug: {
        periode: {
          start: new Date(startTime).toISOString(),
          end: new Date(now).toISOString(),
          dureeMinutes: (now - startTime) / 1000 / 60,
        },
        donneesbrutesGoogleFit: activityData,
        structure: {
          nombreBuckets: activityData.bucket?.length || 0,
          buckets: activityData.bucket?.map((b: any, i: number) => ({
            index: i,
            nombreDatasets: b.dataset?.length || 0,
            datasets: b.dataset?.map((d: any, j: number) => ({
              index: j,
              sourceId: d.dataSourceId,
              nombrePoints: d.point?.length || 0,
              points: d.point?.map((p: any) => ({
                value: p.value,
                startTime: p.startTimeNanos ? new Date(parseInt(p.startTimeNanos) / 1000000).toISOString() : null,
                endTime: p.endTimeNanos ? new Date(parseInt(p.endTimeNanos) / 1000000).toISOString() : null,
              })) || [],
            })) || [],
          })) || [],
        },
      },
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
    })
  }
}
