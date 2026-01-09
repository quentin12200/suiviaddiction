import { NextRequest, NextResponse } from 'next/server'
import { getValidAccessToken } from '@/lib/google-refresh'

export async function GET(request: NextRequest) {
  try {
    const accessToken = await getValidAccessToken('fit')

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'Google Fit non connecté ou session expirée' },
        { status: 401 }
      )
    }

    const now = Date.now()

    // Calculer le début de la journée AUJOURD'HUI
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const startTime = startOfDay.getTime()

    console.log('🔍 Récupération données Google Fit')
    console.log('📅 Période: Depuis minuit aujourd\'hui')
    console.log('📅 Start:', new Date(startTime).toISOString())
    console.log('📅 End:', new Date(now).toISOString())
    console.log('📅 Durée:', (now - startTime) / 1000 / 60, 'minutes')

    // NOUVELLE APPROCHE : Utiliser l'API dataset directe au lieu de aggregate
    // Cela permet d'avoir les données même si l'agrégation échoue
    // Essayer plusieurs dataSources car chaque appareil peut utiliser une source différente
    const dataSourcesSteps = [
      'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps',
      'derived:com.google.step_count.delta:com.google.android.gms:merge_step_deltas',
      'derived:com.google.step_count.delta:com.google.android.gms:aggregated',
    ]

    let steps = 0
    let stepsFound = false

    // Convertir en nanosecondes (multiplier par 1000000, pas concaténer)
    const startTimeNanos = startTime * 1000000
    const nowNanos = now * 1000000

    console.log('🔍 Timestamps (nanosecondes):', startTimeNanos, '-', nowNanos)

    // Essayer chaque source jusqu'à trouver des données
    for (const dataSourceSteps of dataSourcesSteps) {
      console.log(`🔍 Essai dataSource: ${dataSourceSteps}`)

      const stepsResponse = await fetch(
        `https://www.googleapis.com/fitness/v1/users/me/dataSources/${dataSourceSteps}/datasets/${startTimeNanos}-${nowNanos}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (stepsResponse.ok) {
        const stepsData = await stepsResponse.json()
        console.log('📦 Données pas:', JSON.stringify(stepsData, null, 2))

        if (stepsData.point && stepsData.point.length > 0) {
          stepsData.point.forEach((point: any) => {
            const stepValue = point.value?.[0]?.intVal || 0
            console.log(`  🚶 Pas trouvés: ${stepValue}`)
            steps += stepValue
          })
          stepsFound = true
          console.log(`✅ Source utilisée: ${dataSourceSteps}`)
          break // On a trouvé des données, pas besoin d'essayer les autres sources
        } else {
          console.log(`  ⚠️ Aucune donnée dans cette source`)
        }
      } else {
        console.log(`  ❌ Erreur ${stepsResponse.status}:`, await stepsResponse.text())
      }
    }

    if (!stepsFound) {
      console.log('⚠️ Aucune source de pas n\'a retourné de données')
    }

    // Récupérer les données d'activité avec aggregate (pour calories et minutes)
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

    if (!activityResponse.ok) {
      const errorText = await activityResponse.text()
      console.error('❌ Erreur API Google Fit:', activityResponse.status, errorText)
      throw new Error(`API Google Fit erreur ${activityResponse.status}`)
    }

    const activityData = await activityResponse.json()
    console.log('📦 Données brutes activité:', JSON.stringify(activityData, null, 2))

    // Récupérer les données de sommeil
    const sleepResponse = await fetch(
      `https://www.googleapis.com/fitness/v1/users/me/sessions?startTime=${new Date(startTime - 86400000).toISOString()}&endTime=${new Date(now).toISOString()}&activityType=72`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
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
          'Authorization': `Bearer ${accessToken}`,
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

    console.log('📦 Données brutes fréquence cardiaque:', JSON.stringify(heartRateData, null, 2))

    // Parser les données aggregate pour calories et minutes actives
    let activeMinutes = 0
    let calories = 0

    // Les pas sont déjà calculés avec l'API dataset directe ci-dessus

    // Pour les pas, parcourir tous les datasets et tous les points
    if (activityData.bucket && activityData.bucket.length > 0) {
      activityData.bucket.forEach((bucket: any) => {
        if (bucket.dataset && bucket.dataset.length > 0) {
          bucket.dataset.forEach((dataset: any) => {
            const sourceId = dataset.dataSourceId || ''
            console.log(`📊 Dataset trouvé:`, sourceId)

            if (dataset.point && dataset.point.length > 0) {
              dataset.point.forEach((point: any) => {
                // Minutes actives
                if (sourceId.toLowerCase().includes('active') || sourceId.toLowerCase().includes('minute')) {
                  const minutesValue = point.value?.[0]?.intVal || 0
                  if (minutesValue > 0) {
                    console.log(`  ⏱️ Minutes actives trouvées: ${minutesValue}`)
                    activeMinutes += minutesValue
                  }
                }
                // Calories
                else if (sourceId.toLowerCase().includes('calorie')) {
                  const caloriesValue = point.value?.[0]?.fpVal || point.value?.[0]?.intVal || 0
                  if (caloriesValue > 0) {
                    console.log(`  🔥 Calories trouvées: ${caloriesValue}`)
                    calories += caloriesValue
                  }
                }
              })
            } else {
              console.log(`  ⚠️ Aucun point de données dans ce dataset`)
            }
          })
        }
      })
    } else {
      console.log('⚠️ Aucun bucket de données trouvé dans la réponse')
    }

    console.log('✅ Totaux calculés:')
    console.log(`  🚶 Pas (API dataset directe): ${steps}`)
    console.log(`  ⏱️ Minutes actives: ${activeMinutes}`)
    console.log(`  🔥 Calories: ${calories}`)

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

    const result = {
      steps,
      activeMinutes,
      calories: Math.round(calories),
      sleepHours: sleepHours.toFixed(1),
      heartRate: avgHeartRate,
    }

    console.log('📤 Données renvoyées:', result)

    return NextResponse.json({
      success: true,
      data: result,
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
