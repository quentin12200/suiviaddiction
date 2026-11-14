import { prisma } from '@/lib/prisma'
import { ensureEntryKindColumn, normalizeKind } from '@/lib/entryKind'
import type { PatternEntry } from '@/lib/smokingPatterns'

/** Toutes les consos de l'historique, depuis la toute première entrée. */
export async function loadAllSmokes(): Promise<(PatternEntry & { id: string })[]> {
  await ensureEntryKindColumn()
  const rows = await prisma.entry.findMany({
    where: { hasSmoked: true },
    orderBy: [{ date: 'asc' }, { time: 'asc' }],
    select: { id: true, date: true, time: true, jointTime: true, jointCount: true, kind: true },
  })
  type Row = (typeof rows)[number]
  return rows
    .map((r: Row) => ({
      id: r.id,
      date: r.date.toISOString().slice(0, 10),
      time: (r.jointTime || r.time || '').slice(0, 5),
      count: r.jointCount || 1,
      kind: normalizeKind(r.kind),
    }))
    .filter((e: { time: string }) => /^\d{1,2}:\d{2}$/.test(e.time))
}
