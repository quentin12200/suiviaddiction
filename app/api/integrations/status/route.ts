import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()

    // Vérifier la présence des tokens dans les cookies
    const fitToken = cookieStore.get('google_fit_access_token')
    const calendarToken = cookieStore.get('google_calendar_access_token')
    const driveToken = cookieStore.get('google_drive_access_token')

    return NextResponse.json({
      success: true,
      fit: !!fitToken,
      calendar: !!calendarToken,
      drive: !!driveToken,
    })
  } catch (error) {
    console.error('Erreur vérification status:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
