import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

/**
 * API route pour l'authentification
 * Vérifie les identifiants contre les variables d'environnement
 */
export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    // Récupération des identifiants depuis les variables d'environnement
    const validUsername = process.env.APP_USERNAME
    const validPassword = process.env.APP_PASSWORD

    // Vérification des identifiants
    if (username === validUsername && password === validPassword) {
      const session = await getSession()
      session.isLoggedIn = true
      session.username = username
      await session.save()

      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { success: false, error: 'Identifiants invalides' },
      { status: 401 }
    )
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
