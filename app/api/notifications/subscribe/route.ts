import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { subscription, userId } = await request.json()

    if (!subscription) {
      return NextResponse.json(
        { success: false, error: 'Subscription requise' },
        { status: 400 }
      )
    }

    // Sauvegarder la subscription dans la base de données
    // Note: Il faudra créer un modèle PushSubscription dans Prisma
    // Pour l'instant, on stocke dans localStorage côté client

    console.log('Nouvelle subscription push:', subscription)

    return NextResponse.json({
      success: true,
      message: 'Notifications activées',
    })
  } catch (error) {
    console.error('Erreur subscription push:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
