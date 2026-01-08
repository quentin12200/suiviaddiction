import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { analyzePatterns, checkRiskAlert } from '@/lib/alertSystem'
import { sendNotificationToAll } from '@/lib/push-notifications'

export async function GET(request: NextRequest) {
  try {
    // Récupérer les entrées récentes pour l'analyse
    const entries = await prisma.entry.findMany({
      orderBy: { date: 'desc' },
      take: 100, // Analyser les 100 dernières entrées
    })

    if (entries.length === 0) {
      return NextResponse.json({
        success: true,
        hasAlert: false,
        message: 'Pas assez de données pour analyse',
      })
    }

    // Analyser les patterns
    const patterns = analyzePatterns(entries)

    // Vérifier s'il y a une alerte pour l'heure actuelle
    const now = new Date()
    const currentHour = `${now.getHours().toString().padStart(2, '0')}:00`
    const alert = checkRiskAlert(patterns, currentHour)

    if (alert) {
      // Envoyer une notification push automatiquement
      try {
        const subscriptions = await prisma.pushSubscription.findMany()

        if (subscriptions.length > 0) {
          const pushSubscriptions = subscriptions.map((sub) => ({
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          }))

          await sendNotificationToAll(pushSubscriptions, {
            title: getAlertTitle(alert.type),
            body: alert.reason,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            data: {
              type: alert.type,
              suggestion: alert.suggestion,
              url: '/',
            },
          })

          console.log(`📬 Notification envoyée à ${subscriptions.length} appareil(s)`)
        }
      } catch (notifError) {
        console.error('Erreur envoi notification:', notifError)
        // Continue sans bloquer si l'envoi échoue
      }

      return NextResponse.json({
        success: true,
        hasAlert: true,
        alert: {
          type: alert.type,
          title: getAlertTitle(alert.type),
          message: alert.reason,
          suggestion: alert.suggestion,
          timestamp: now.toISOString(),
        },
        patterns: {
          highRiskTimes: patterns.riskPatterns.highRiskTimes,
          consecutiveCleanDays: patterns.consecutiveCleanDays,
        },
      })
    }

    return NextResponse.json({
      success: true,
      hasAlert: false,
      message: 'Aucune alerte pour le moment',
      patterns: {
        consecutiveCleanDays: patterns.consecutiveCleanDays,
      },
    })
  } catch (error) {
    console.error('Erreur vérification alertes:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

function getAlertTitle(type: string): string {
  switch (type) {
    case 'high':
      return '⚠️ Moment à risque détecté'
    case 'medium':
      return '⚡ Reste vigilant'
    case 'low':
      return '🎉 Continue comme ça !'
    default:
      return 'Notification'
  }
}
