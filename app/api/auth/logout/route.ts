import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'

/**
 * API route pour la déconnexion
 */
export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({ success: true })
    const session = await getSessionFromRequest(request, response)
    session.destroy()

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la déconnexion' },
      { status: 500 }
    )
  }
}
