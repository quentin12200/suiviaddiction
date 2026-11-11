/**
 * Journée de consommation = du réveil au coucher, pas de minuit à minuit.
 *
 * Règles :
 * 1. Une cigarette fumée entre 0 h et NIGHT_END_HOUR (5 h) appartient à la journée précédente :
 *    c'est une cigarette « d'avant de se coucher ».
 * 2. Entre 5 h et MORNING_LIMIT_HOUR (12 h), si la cigarette précédente date de moins de
 *    SLEEP_GAP_HOURS (3 h) et appartenait déjà à la journée précédente, on considère que tu ne
 *    t'es pas encore couché : elle reste sur la journée précédente.
 * 3. Sinon, la cigarette ouvre (ou continue) la journée de sa date calendaire : tu es réveillé.
 *
 * La nuit = l'écart entre la dernière cigarette d'une journée et la première de la suivante.
 */

export const NIGHT_END_HOUR = 5
export const MORNING_LIMIT_HOUR = 12
export const SLEEP_GAP_HOURS = 3

const HOUR = 3_600_000
const pad = (n: number) => String(n).padStart(2, '0')

export const localDateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export function previousDateKey(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  return localDateKey(new Date(y, m - 1, d - 1))
}

export function nextDateKey(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  return localDateKey(new Date(y, m - 1, d + 1))
}

export interface Smoke {
  id: string
  date: string // date calendaire saisie, YYYY-MM-DD
  time: string // HH:mm
  count: number
}

export interface DaySmoke extends Smoke {
  ts: number
  journee: string // journée (réveil → coucher) à laquelle la cigarette est rattachée
}

export const smokeTs = (s: { date: string; time: string }) =>
  new Date(`${s.date}T${s.time.slice(0, 5)}:00`).getTime()

/** Journée à laquelle rattacher un instant, connaissant la cigarette précédente. */
function journeeFor(ts: number, prev: DaySmoke | null): string {
  const d = new Date(ts)
  const calendar = localDateKey(d)
  const hour = d.getHours()
  if (hour < NIGHT_END_HOUR) return previousDateKey(calendar)
  if (
    hour < MORNING_LIMIT_HOUR &&
    prev &&
    ts - prev.ts < SLEEP_GAP_HOURS * HOUR &&
    prev.journee === previousDateKey(calendar)
  ) {
    return prev.journee
  }
  return calendar
}

/** Rattache chaque cigarette à sa journée (triées chronologiquement). */
export function assignJournees(smokes: Smoke[]): DaySmoke[] {
  const sorted = smokes
    .map((s) => ({ ...s, ts: smokeTs(s), journee: '' }))
    .filter((s) => !isNaN(s.ts))
    .sort((a, b) => a.ts - b.ts)
  let prev: DaySmoke | null = null
  for (const s of sorted) {
    s.journee = journeeFor(s.ts, prev)
    prev = s
  }
  return sorted
}

/** Journée en cours à l'instant `now` : celle où tomberait une cigarette fumée maintenant. */
export function currentJournee(now: number, smokes: DaySmoke[]): string {
  const prev = smokes.length ? smokes[smokes.length - 1] : null
  return journeeFor(now, prev && prev.ts <= now ? prev : null)
}

export interface Night {
  journee: string // la journée qui se termine par cette nuit
  lastBefore: DaySmoke // dernière cigarette avant de dormir
  firstAfter: DaySmoke // première cigarette après le réveil
  durationMs: number
}

/**
 * Nuits d'abstinence : entre la dernière cigarette d'une journée et la première de la journée
 * suivante. Seules les journées consécutives qui ont toutes deux une cigarette sont comptées.
 */
export function computeNights(smokes: DaySmoke[]): Night[] {
  const lastOf = new Map<string, DaySmoke>()
  const firstOf = new Map<string, DaySmoke>()
  for (const s of smokes) {
    if (!firstOf.has(s.journee)) firstOf.set(s.journee, s)
    lastOf.set(s.journee, s)
  }
  const nights: Night[] = []
  lastOf.forEach((lastBefore, journee) => {
    const firstAfter = firstOf.get(nextDateKey(journee))
    if (firstAfter) {
      nights.push({ journee, lastBefore, firstAfter, durationMs: firstAfter.ts - lastBefore.ts })
    }
  })
  return nights.sort((a, b) => a.journee.localeCompare(b.journee))
}
