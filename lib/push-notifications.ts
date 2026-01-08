import webpush from 'web-push'

// Configuration des clés VAPID
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || ''
const vapidEmail = process.env.VAPID_EMAIL || 'mailto:your-email@example.com'

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey)
}

export interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  data?: any
}

export interface PushSubscriptionData {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export async function sendPushNotification(
  subscription: PushSubscriptionData,
  payload: NotificationPayload
): Promise<void> {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn('Clés VAPID non configurées, notifications désactivées')
    return
  }

  try {
    await webpush.sendNotification(
      subscription as any,
      JSON.stringify(payload)
    )
    console.log('✅ Notification envoyée')
  } catch (error) {
    console.error('Erreur envoi notification:', error)
    throw error
  }
}

export async function sendNotificationToAll(
  subscriptions: PushSubscriptionData[],
  payload: NotificationPayload
): Promise<void> {
  const promises = subscriptions.map((sub) =>
    sendPushNotification(sub, payload).catch((err) => {
      console.error('Erreur envoi notification individuelle:', err)
    })
  )

  await Promise.all(promises)
}
