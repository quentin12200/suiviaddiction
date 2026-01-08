import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { subscription } = await request.json()

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { success: false, error: 'Subscription invalide' },
        { status: 400 }
      )
    }

    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Sauvegarder ou mettre à jour la subscription
    await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent,
        updatedAt: new Date(),
      },
      create: {
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent,
      },
    })

    console.log('✅ Subscription push enregistrée:', subscription.endpoint)

    return NextResponse.json({
      success: true,
      message: 'Notifications activées',
    })
  } catch (error) {
    console.error('❌ Erreur subscription push:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
