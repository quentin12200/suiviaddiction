import { NextResponse } from 'next/server'
import { loadAllSmokes } from '@/lib/smokeHistory'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/** GET : tout l'historique des consos (date, heure, nombre, type), pour l'analyse des habitudes. */
export async function GET() {
  try {
    const entries = await loadAllSmokes()
    const res = NextResponse.json({ success: true, entries })
    res.headers.set('Cache-Control', 'no-store, max-age=0')
    return res
  } catch (error) {
    console.error('Erreur historique complet:', error)
    return NextResponse.json({ success: false, error: 'Impossible de lire l’historique' }, { status: 500 })
  }
}
