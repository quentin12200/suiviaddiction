import { NextRequest, NextResponse } from 'next/server'

/**
 * Route pour initier l'authentification avec Google (Sign in with Google)
 * Différent de l'auth pour les services (Fit, Calendar, Drive)
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

  // Scopes pour l'authentification utilisateur (pas pour les services)
  const scopes = [
    'openid',
    'email',
    'profile',
  ]

  // Construire l'URL d'autorisation Google
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authUrl.searchParams.append('client_id', clientId)
  authUrl.searchParams.append('redirect_uri', redirectUri)
  authUrl.searchParams.append('response_type', 'code')
  authUrl.searchParams.append('scope', scopes.join(' '))
  authUrl.searchParams.append('access_type', 'offline')
  authUrl.searchParams.append('prompt', 'select_account')
  authUrl.searchParams.append('state', 'login') // Important: pour différencier du auth pour services

  return NextResponse.redirect(authUrl.toString())
}
