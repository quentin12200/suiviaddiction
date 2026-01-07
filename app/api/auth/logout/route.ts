import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

/**
 * API route pour la déconnexion
 */
export async function POST() {
  try {
    const session = await getSession()
    session.destroy()

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la déconnexion' },
      { status: 500 }
    )
  }
}
