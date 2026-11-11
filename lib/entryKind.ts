import { prisma } from '@/lib/prisma'

export type SmokeKind = 'cigarette' | 'joint'

/** Les anciennes entrées (sans type) datent de l'époque où l'appli suivait les joints. */
export const normalizeKind = (kind: string | null | undefined): SmokeKind =>
  kind === 'cigarette' ? 'cigarette' : 'joint'

let checked = false

/** Ajoute la colonne Entry.kind si la base ne l'a pas encore (Turso / SQLite). */
export async function ensureEntryKindColumn() {
  if (checked) return
  const cols = (await prisma.$queryRawUnsafe('PRAGMA table_info("Entry")')) as { name: string }[]
  if (!cols.some((c) => c.name === 'kind')) {
    await prisma.$executeRawUnsafe('ALTER TABLE "Entry" ADD COLUMN "kind" TEXT')
  }
  checked = true
}
