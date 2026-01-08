import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const accessToken = cookieStore.get('google_fit_access_token')

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'Google Fit non connecté' },
        { status: 401 }
      )
    }

    const now = Date.now()
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const startTime = startOfDay.getTime()

    // Récupérer les données d'activité (pas, calories)
    const activityResponse = await fetch(
      `https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken.value}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aggregateBy: [
            {
              dataTypeName: 'com.google.step_count.delta',
              dataSourceId: 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps',
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

    // Récupérer les données de sommeil
    const sleepResponse = await fetch(
      `https://www.googleapis.com/fitness/v1/users/me/sessions?startTime=${new Date(startTime - 86400000).toISOString()}&endTime=${new Date(now).toISOString()}&activityType=72`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken.value}`,
        },
      }
    )

    const sleepData = await sleepResponse.json()

    // Récupérer la fréquence cardiaque
    const heartRateResponse = await fetch(
      `https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken.value}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aggregateBy: [
            {
              dataTypeName: 'com.google.heart_rate.bpm',
            },
          ],
          bucketByTime: { durationMillis: now - startTime },
          startTimeMillis: startTime,
          endTimeMillis: now,
        }),
      }
    )

    const heartRateData = await heartRateResponse.json()

    // Parser les données
    const steps = activityData.bucket?.[0]?.dataset?.[0]?.point?.[0]?.value?.[0]?.intVal || 0
    const activeMinutes = activityData.bucket?.[0]?.dataset?.[1]?.point?.[0]?.value?.[0]?.intVal || 0
    const calories = activityData.bucket?.[0]?.dataset?.[2]?.point?.[0]?.value?.[0]?.fpVal || 0

    // Calculer les heures de sommeil
    let sleepHours = 0
    if (sleepData.session && sleepData.session.length > 0) {
      const lastSleep = sleepData.session[sleepData.session.length - 1]
      const sleepStart = parseInt(lastSleep.startTimeMillis)
      const sleepEnd = parseInt(lastSleep.endTimeMillis)
      sleepHours = (sleepEnd - sleepStart) / (1000 * 60 * 60)
    }

    // Fréquence cardiaque moyenne
    const heartRatePoints = heartRateData.bucket?.[0]?.dataset?.[0]?.point || []
    let avgHeartRate = 0
    if (heartRatePoints.length > 0) {
      const sum = heartRatePoints.reduce((acc: number, point: any) =>
        acc + (point.value?.[0]?.fpVal || 0), 0
      )
      avgHeartRate = Math.round(sum / heartRatePoints.length)
    }

    return NextResponse.json({
      success: true,
      data: {
        steps,
        activeMinutes,
        calories: Math.round(calories),
        sleepHours: sleepHours.toFixed(1),
        heartRate: avgHeartRate,
      },
    })
  } catch (error: any) {
    console.error('Erreur Google Fit:', error)

    // Si erreur d'authentification, token peut-être expiré
    if (error.message?.includes('401') || error.message?.includes('403')) {
      return NextResponse.json(
        { success: false, error: 'Token expiré, reconnecte Google Fit' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Erreur récupération données' },
      { status: 500 }
    )
  }
}
