import { NextRequest, NextResponse } from 'next/server'
import { getValidAccessToken } from '@/lib/google-refresh'

export async function GET(request: NextRequest) {
  try {
    const accessToken = await getValidAccessToken('calendar')

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'Google Calendar non connecté ou session expirée' },
        { status: 401 }
      )
    }

    // Récupérer les événements du jour
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date()
    endOfDay.setHours(23, 59, 59, 999)

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
      `timeMin=${startOfDay.toISOString()}&` +
      `timeMax=${endOfDay.toISOString()}&` +
      `singleEvents=true&` +
      `orderBy=startTime&` +
      `maxResults=10`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Erreur Google Calendar API: ${response.status}`)
    }

    const data = await response.json()

    const events = (data.items || []).map((event: any) => ({
      id: event.id,
      title: event.summary || 'Sans titre',
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      location: event.location,
      description: event.description,
    }))

    return NextResponse.json({
      success: true,
      events,
    })
  } catch (error: any) {
    console.error('Erreur Google Calendar:', error)

    if (error.message?.includes('401') || error.message?.includes('403')) {
      return NextResponse.json(
        { success: false, error: 'Token expiré, reconnecte Google Calendar' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Erreur récupération événements' },
      { status: 500 }
    )
  }
}
