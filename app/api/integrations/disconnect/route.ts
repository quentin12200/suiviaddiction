import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const service = searchParams.get('service')

    if (!service || !['fit', 'calendar', 'drive'].includes(service)) {
      return NextResponse.json(
        { success: false, error: 'Service invalide' },
        { status: 400 }
      )
    }

    // Supprimer les cookies du service
    const response = NextResponse.json({ success: true })

    response.cookies.delete(`google_${service}_access_token`)
    response.cookies.delete(`google_${service}_refresh_token`)

    return response
  } catch (error) {
    console.error('Erreur déconnexion:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
