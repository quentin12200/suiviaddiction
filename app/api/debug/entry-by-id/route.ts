import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Récupérer une entrée par son ID exact
 * Usage: /api/debug/entry-by-id?id=cmkba5vwc0000c6m9ehamkhbt
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'ID manquant. Usage: /api/debug/entry-by-id?id=YOUR_ENTRY_ID',
      }, { status: 400 })
    }

    const entry = await prisma.entry.findUnique({
      where: { id },
    })

    if (!entry) {
      return NextResponse.json({
        success: false,
        found: false,
        message: `Aucune entrée trouvée avec l'ID: ${id}`,
        searchedId: id,
      })
    }

    const dateStr = entry.date.toISOString().split('T')[0]
    const usedTime = entry.jointTime || entry.time
    const fullDateTime = new Date(`${dateStr}T${usedTime}:00`)

    return NextResponse.json({
      success: true,
      found: true,
      message: '✅ Entrée trouvée dans la base de données',
      entry: {
        id: entry.id,
        date: dateStr,
        time: entry.time,
        jointTime: entry.jointTime,
        usedTime: usedTime,
        hasSmoked: entry.hasSmoked,
        jointCount: entry.jointCount,
        cravingLevel: entry.cravingLevel,
        createdAt: entry.createdAt.toISOString(),
        updatedAt: entry.updatedAt.toISOString(),
        fullDateTime: fullDateTime.toLocaleString('fr-FR'),
        timestamp: fullDateTime.getTime(),
      },
      analysis: {
        isSmoked: entry.hasSmoked ? '🚬 OUI - Cette entrée DEVRAIT être prise en compte pour le timer' : '✅ NON - Cette entrée ne devrait PAS affecter le timer',
        shouldAppearInTimer: entry.hasSmoked,
        dateFormatted: new Date(entry.date).toLocaleDateString('fr-FR'),
        timeFormatted: usedTime,
      },
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 })
  }
}
