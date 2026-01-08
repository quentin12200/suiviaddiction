import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendNotificationToAll, NotificationPayload } from '@/lib/push-notifications'

export async function POST(request: NextRequest) {
  try {
    const { title, body, icon, data } = await request.json()

    if (!title || !body) {
      return NextResponse.json(
        { success: false, error: 'Title et body requis' },
        { status: 400 }
      )
    }

    // Récupérer toutes les souscriptions actives
    const subscriptions = await prisma.pushSubscription.findMany()

    type SubType = typeof subscriptions[number]

    if (subscriptions.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Aucune souscription active',
        sent: 0,
      })
    }

    // Convertir en format PushSubscriptionData
    const pushSubscriptions = subscriptions.map((sub: SubType) => ({
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
    }))

    // Préparer le payload
    const payload: NotificationPayload = {
      title,
      body,
      icon: icon || '/icon-192.png',
      badge: '/icon-192.png',
      data,
    }

    // Envoyer les notifications
    await sendNotificationToAll(pushSubscriptions, payload)

    return NextResponse.json({
      success: true,
      message: `Notifications envoyées à ${subscriptions.length} appareil(s)`,
      sent: subscriptions.length,
    })
  } catch (error) {
    console.error('❌ Erreur envoi notifications:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
