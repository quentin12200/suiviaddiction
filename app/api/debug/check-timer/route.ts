import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Prendre les 20 dernières entrées pour avoir plus de contexte
    const last20 = await prisma.entry.findMany({
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
        createdAt: true,
      },
      take: 20,
    })

    // Convertir avec timestamps
    const withTimestamps = last20.map(entry => {
      const dateStr = entry.date.toISOString().split('T')[0]
      const rawTime = entry.jointTime || entry.time
      const fullDateTime = new Date(`${dateStr}T${rawTime}:00`)

      return {
        id: entry.id.substring(0, 12),
        date: dateStr,
        time: entry.time,
        jointTime: entry.jointTime,
        usedTime: rawTime,
        hasSmoked: entry.hasSmoked,
        jointCount: entry.jointCount,
        createdAt: entry.createdAt.toLocaleString('fr-FR'),
        timestamp: fullDateTime.toLocaleString('fr-FR'),
        timestampRaw: fullDateTime.getTime(),
      }
    })

    // Trier par timestamp
    const sorted = withTimestamps.sort((a, b) => b.timestampRaw - a.timestampRaw)

    // Trouver la première entrée fumée
    const lastSmoked = sorted.find(e => e.hasSmoked === true)

    // Compter combien ont fumé vs résisté
    const smokedCount = sorted.filter(e => e.hasSmoked).length
    const resistedCount = sorted.filter(e => !e.hasSmoked).length

    return NextResponse.json({
      success: true,
      message: `Voici les ${sorted.length} dernières entrées triées par timestamp`,
      totalChecked: sorted.length,
      smokedCount,
      resistedCount,
      allEntries: sorted,
      entriesSummary: sorted.map(e => ({
        id: e.id,
        date: e.date,
        time: e.time,
        usedTime: e.usedTime,
        hasSmoked: e.hasSmoked ? '🚬 OUI' : '✅ NON',
        jointCount: e.jointCount,
        createdAt: e.createdAt,
        timestamp: e.timestamp,
      })),
      detectedLastSmoked: lastSmoked ? {
        id: lastSmoked.id,
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
