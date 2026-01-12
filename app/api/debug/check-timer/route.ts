import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Prendre les 10 dernières entrées
    const last10 = await prisma.entry.findMany({
      orderBy: [
        { date: 'desc' },
        { time: 'desc' },
      ],
      select: {
        id: true,
        date: true,
        time: true,
        jointTime: true,
        hasSmoked: true,
        jointCount: true,
      },
      take: 10,
    })

    // Convertir avec timestamps
    const withTimestamps = last10.map(entry => {
      const dateStr = entry.date.toISOString().split('T')[0]
      const rawTime = entry.jointTime || entry.time
      const fullDateTime = new Date(`${dateStr}T${rawTime}:00`)

      return {
        id: entry.id,
        date: dateStr,
        time: entry.time,
        jointTime: entry.jointTime,
        hasSmoked: entry.hasSmoked,
        jointCount: entry.jointCount,
        timestamp: fullDateTime.toLocaleString('fr-FR'),
        timestampRaw: fullDateTime.getTime(),
      }
    })

    // Trier par timestamp
    const sorted = withTimestamps.sort((a, b) => b.timestampRaw - a.timestampRaw)

    // Trouver la première entrée fumée
    const lastSmoked = sorted.find(e => e.hasSmoked === true)

    return NextResponse.json({
      success: true,
      message: 'Voici les 10 dernières entrées et la détection',
      totalChecked: sorted.length,
      entries: sorted.map(e => ({
        date: e.date,
        time: e.time,
        hasSmoked: e.hasSmoked ? '🚬 OUI' : '✅ NON',
        jointCount: e.jointCount,
        timestamp: e.timestamp,
      })),
      detectedLastSmoked: lastSmoked ? {
        date: lastSmoked.date,
        time: lastSmoked.jointTime || lastSmoked.time,
        timestamp: lastSmoked.timestamp,
        message: '👆 CETTE ENTRÉE devrait être affichée dans le compteur',
      } : 'AUCUNE ENTRÉE FUMÉE TROUVÉE',
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
