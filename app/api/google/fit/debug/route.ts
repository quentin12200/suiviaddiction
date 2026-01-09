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

    // Tester plusieurs périodes
    const periodes = [
      {
        nom: "Aujourd'hui (depuis minuit)",
        start: new Date(new Date().setHours(0, 0, 0, 0)).getTime(),
        end: now,
      },
      {
        nom: "Dernières 24 heures",
        start: now - (24 * 60 * 60 * 1000),
        end: now,
      },
      {
        nom: "Hier (journée complète)",
        start: new Date(new Date().setHours(0, 0, 0, 0)).getTime() - (24 * 60 * 60 * 1000),
        end: new Date(new Date().setHours(0, 0, 0, 0)).getTime(),
      },
      {
        nom: "7 derniers jours",
        start: now - (7 * 24 * 60 * 60 * 1000),
        end: now,
      },
    ]

    const resultats = []

    for (const periode of periodes) {
      const startNanos = periode.start * 1000000
      const endNanos = periode.end * 1000000

      // Tester la source HONOR Health
      const response = await fetch(
        `https://www.googleapis.com/fitness/v1/users/me/dataSources/raw:com.google.step_count.delta:com.hihonor.health:health_platform/datasets/${startNanos}-${endNanos}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      const data = await response.json()

      resultats.push({
        periode: periode.nom,
        start: new Date(periode.start).toISOString(),
        end: new Date(periode.end).toISOString(),
        nombrePoints: data.point?.length || 0,
        totalPas: data.point?.reduce((sum: number, p: any) => sum + (p.value?.[0]?.intVal || 0), 0) || 0,
        donnees: data,
      })
    }

    return NextResponse.json({
      success: true,
      message: "Test de différentes périodes pour trouver où sont les données",
      resultats,
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
    })
  }
}
