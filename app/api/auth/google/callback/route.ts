import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state') // Le service (fit, calendar, drive)
  const error = searchParams.get('error')

  // Si l'utilisateur a refusé
  if (error) {
    return NextResponse.redirect(
      `${request.nextUrl.origin}/integrations?error=${encodeURIComponent(error)}`
    )
  }

  if (!code) {
    return NextResponse.redirect(
      `${request.nextUrl.origin}/integrations?error=no_code`
    )
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/api/auth/google/callback`

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      `${request.nextUrl.origin}/integrations?error=config_missing`
    )
  }

  try {
    // Échanger le code contre des tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('Erreur échange token:', errorData)
      return NextResponse.redirect(
        `${request.nextUrl.origin}/integrations?error=token_exchange_failed`
      )
    }

    const tokens = await tokenResponse.json()
    const { access_token, refresh_token, expires_in } = tokens

    // Stocker les tokens (pour l'instant en tant que cookie sécurisé)
    // Dans une vraie implémentation, il faudrait les stocker en base de données
    const response = NextResponse.redirect(
      `${request.nextUrl.origin}/integrations?success=${state || 'google'}`
    )

    // Stocker les tokens dans des cookies httpOnly sécurisés
    const expiresAt = new Date(Date.now() + expires_in * 1000)

    response.cookies.set(`google_${state}_access_token`, access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    })

    if (refresh_token) {
      response.cookies.set(`google_${state}_refresh_token`, refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365, // 1 an
        path: '/',
      })
    }

    return response
  } catch (error) {
    console.error('Erreur callback Google:', error)
    return NextResponse.redirect(
      `${request.nextUrl.origin}/integrations?error=server_error`
    )
  }
}
