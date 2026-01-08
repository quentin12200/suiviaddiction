import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function refreshGoogleToken(service: string): Promise<string | null> {
  const cookieStore = cookies()
  const refreshToken = cookieStore.get(`google_${service}_refresh_token`)

  if (!refreshToken) {
    console.error(`Pas de refresh token pour ${service}`)
    return null
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    console.error('Variables d\'environnement Google manquantes')
    return null
  }

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken.value,
        grant_type: 'refresh_token',
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('Erreur refresh token:', errorData)
      return null
    }

    const tokens = await tokenResponse.json()
    const { access_token, expires_in } = tokens

    // Mettre à jour le cookie avec le nouveau access token
    const expiresAt = new Date(Date.now() + expires_in * 1000)

    cookieStore.set(`google_${service}_access_token`, access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    })

    console.log(`✅ Token rafraîchi pour ${service}`)
    return access_token
  } catch (error) {
    console.error('Erreur lors du refresh du token:', error)
    return null
  }
}

export async function getValidAccessToken(service: string): Promise<string | null> {
  const cookieStore = cookies()
  const accessToken = cookieStore.get(`google_${service}_access_token`)

  if (accessToken) {
    // Le token existe, le retourner
    return accessToken.value
  }

  // Le token a expiré ou n'existe pas, essayer de le rafraîchir
  console.log(`Token expiré pour ${service}, tentative de rafraîchissement...`)
  return await refreshGoogleToken(service)
}
