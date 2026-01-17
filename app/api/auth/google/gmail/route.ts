import { NextRequest, NextResponse } from 'next/server'

/**
 * Route pour autoriser l'accès Gmail (lecture seule)
 * Permet de récupérer les emails de notification bancaire
 */
export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/api/auth/google/callback`

  if (!clientId) {
    return NextResponse.json(
      { error: 'Google Client ID non configuré' },
      { status: 500 }
    )
  }

  // Scopes pour Gmail (lecture seule)
  const scopes = [
    'openid',
    'email',
    'profile',
    'https://www.googleapis.com/auth/gmail.readonly', // Accès Gmail en lecture seule
  ]

  // Construire l'URL d'autorisation Google
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authUrl.searchParams.append('client_id', clientId)
  authUrl.searchParams.append('redirect_uri', redirectUri)
  authUrl.searchParams.append('response_type', 'code')
  authUrl.searchParams.append('scope', scopes.join(' '))
  authUrl.searchParams.append('access_type', 'offline')
  authUrl.searchParams.append('prompt', 'consent') // Force le consent pour obtenir le refresh token
  authUrl.searchParams.append('state', 'gmail') // Important: identifie que c'est pour Gmail

  return NextResponse.redirect(authUrl.toString())
}
