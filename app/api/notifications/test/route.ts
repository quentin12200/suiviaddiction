import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendNotificationToAll } from '@/lib/push-notifications'

/**
 * Endpoint de test pour envoyer une notification push à tous les utilisateurs soumis
 * Usage: POST /api/notifications/test
 */
export async function POST() {
  try {
    // Récupérer toutes les souscriptions actives
    const subscriptions = await prisma.pushSubscription.findMany()

    if (subscriptions.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Aucune souscription active trouvée',
        hint: 'Activez les notifications dans les paramètres',
      })
    }

    console.log(`📤 Envoi de notification de test à ${subscriptions.length} souscription(s)`)

    // Préparer le payload
    const payload = {
      title: '🧪 Notification de test',
      body: 'Les notifications push fonctionnent correctement ! 🎉',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: {
        url: '/',
        timestamp: Date.now(),
      },
    }

    // Convertir les souscriptions au format attendu
    const formattedSubscriptions = subscriptions.map(sub => ({
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
    }))

    // Envoyer la notification à tous
    await sendNotificationToAll(formattedSubscriptions, payload)

    console.log('✅ Notifications de test envoyées')

    return NextResponse.json({
      success: true,
      message: `Notification envoyée à ${subscriptions.length} appareil(s)`,
      subscriptions: subscriptions.map(sub => ({
        endpoint: sub.endpoint.substring(0, 50) + '...',
        userAgent: sub.userAgent,
        createdAt: sub.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('❌ Erreur envoi notification de test:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de l\'envoi de la notification',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

/**
 * GET - Vérifier la configuration des notifications
 */
export async function GET() {
  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      orderBy: { createdAt: 'desc' },
    })

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
    const vapidEmail = process.env.VAPID_EMAIL

    type SubscriptionType = typeof subscriptions[number]

    return NextResponse.json({
      success: true,
      configuration: {
        vapidPublicKeyConfigured: !!vapidPublicKey,
        vapidPrivateKeyConfigured: !!vapidPrivateKey,
        vapidEmailConfigured: !!vapidEmail,
        vapidPublicKeyPreview: vapidPublicKey ? vapidPublicKey.substring(0, 20) + '...' : null,
      },
      subscriptions: {
        total: subscriptions.length,
        active: subscriptions.map((sub: SubscriptionType) => ({
          id: sub.id,
          endpoint: sub.endpoint.substring(0, 50) + '...',
          userAgent: sub.userAgent,
          createdAt: sub.createdAt.toISOString(),
          updatedAt: sub.updatedAt.toISOString(),
        })),
      },
      instructions: {
        sendTestNotification: 'POST /api/notifications/test',
        subscribe: 'Activez les notifications dans les paramètres de l\'application',
      },
    })
  } catch (error) {
    console.error('❌ Erreur vérification configuration:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la vérification',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
