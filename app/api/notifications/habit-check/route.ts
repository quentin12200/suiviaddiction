import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/session'
import { sendNotificationToAll } from '@/lib/push-notifications'
import { loadAllSmokes } from '@/lib/smokeHistory'
import { analyzeHabits, habitMessage, nextHabit, LocalNow } from '@/lib/smokingPatterns'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/** Fuseau de l'utilisateur : les heures saisies sont des heures locales. */
const TIMEZONE = process.env.USER_TIMEZONE || 'Europe/Paris'
/** On prévient quand l'heure habituelle arrive dans moins de LEAD_MINUTES. */
const LEAD_MINUTES = 20
/** Pas de notification la nuit (heure locale). */
const QUIET_FROM = 3
const QUIET_TO = 8

function localNow(): LocalNow {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(new Date())
      .map((p) => [p.type, p.value])
  )
  return { date: `${parts.year}-${parts.month}-${parts.day}`, minutes: Number(parts.hour) * 60 + Number(parts.minute) }
}

const absMinutes = (date: string, minutes: number) => {
  const [y, m, d] = date.split('-').map(Number)
  return Math.floor(Date.UTC(y, m - 1, d) / 60_000) + minutes
}

async function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const header = request.headers.get('authorization')
    if (header === `Bearer ${secret}` || request.nextUrl.searchParams.get('key') === secret) return true
  }
  const session = await getSessionFromRequest(request, new NextResponse())
  return session.isLoggedIn === true
}

async function ensureLogTable() {
  await prisma.$executeRawUnsafe(
    `CREATE TABLE IF NOT EXISTS "NotificationLog" ("key" TEXT NOT NULL PRIMARY KEY, "sentAt" TEXT NOT NULL)`
  )
}

/**
 * Appelé toutes les 15 min par un planificateur (GitHub Actions, voir .github/workflows/habit-notifications.yml).
 * Si une de tes heures habituelles arrive dans moins de 20 min, envoie une notification de prévention.
 *   ?dry=1  : ne rien envoyer, renvoyer la décision
 *   ?test=1 : envoyer tout de suite le message de la prochaine heure habituelle (bouton « Tester »)
 */
async function handle(request: NextRequest) {
  if (!(await authorized(request))) {
    return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 })
  }
  const dry = request.nextUrl.searchParams.get('dry') === '1'
  const test = request.nextUrl.searchParams.get('test') === '1'

  const now = localNow()
  const smokes = await loadAllSmokes()
  const analysis = analyzeHabits(smokes, now.date)
  const next = nextHabit(analysis.habits, now)

  const last = smokes.length ? smokes[smokes.length - 1] : null
  const nowAbs = absMinutes(now.date, now.minutes)
  const sinceLastMin = last
    ? nowAbs - absMinutes(last.date, Number(last.time.slice(0, 2)) * 60 + Number(last.time.slice(3, 5)))
    : null

  const decision = (() => {
    if (!next) return { send: false, reason: 'Pas encore assez d’historique pour trouver une heure habituelle' }
    if (test) return { send: true, reason: 'test' }
    const hour = Math.floor(now.minutes / 60)
    if (hour >= QUIET_FROM && hour < QUIET_TO) return { send: false, reason: 'Heures calmes (nuit)' }
    if (next.inMinutes < 0 || next.inMinutes > LEAD_MINUTES)
      return { send: false, reason: `Prochaine heure habituelle dans ${next.inMinutes} min` }
    if (sinceLastMin !== null && sinceLastMin >= 0 && sinceLastMin < 30)
      return { send: false, reason: 'Conso notée il y a moins de 30 min' }
    return { send: true, reason: 'Heure habituelle imminente' }
  })()

  const message = next
    ? habitMessage(next.habit, sinceLastMin !== null ? sinceLastMin * 60_000 : null, `${now.date}-${next.habit.start}`)
    : null

  if (!decision.send || dry || !message || !next) {
    return NextResponse.json({ success: true, sent: false, ...decision, now, next, message })
  }

  // Une seule notification par heure habituelle et par jour
  if (!test) {
    await ensureLogTable()
    const inserted = await prisma.$executeRawUnsafe(
      `INSERT OR IGNORE INTO "NotificationLog" ("key", "sentAt") VALUES (?, ?)`,
      `habit-${now.date}-${next.habit.start}`,
      new Date().toISOString()
    )
    if (!inserted) {
      return NextResponse.json({ success: true, sent: false, reason: 'Déjà envoyée pour cette heure aujourd’hui' })
    }
  }

  const subscriptions = await prisma.pushSubscription.findMany()
  type Sub = (typeof subscriptions)[number]
  if (subscriptions.length === 0) {
    return NextResponse.json({
      success: false,
      sent: false,
      reason: 'Aucun appareil abonné : active les notifications sur le dashboard',
      message,
    })
  }
  await sendNotificationToAll(
    subscriptions.map((s: Sub) => ({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } })),
    { title: message.title, body: message.body, icon: '/icon-192.png', badge: '/icon-192.png', data: { url: '/' } }
  )
  return NextResponse.json({ success: true, sent: true, devices: subscriptions.length, message, next })
}

export const GET = handle
export const POST = handle
