'use client'

import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import SmokeIcon from './SmokeIcon'
import styles from './HabitInsights.module.css'
import { analyzeHabits, formatClock, nextHabit, project, PatternEntry } from '@/lib/smokingPatterns'
import { assignJournees, currentJournee, localDateKey } from '@/lib/smokingDay'

interface Props {
  /** 'alert' : seulement le bandeau « heure habituelle » ; 'panels' : analyse et projections */
  part: 'alert' | 'panels'
  recordMs?: number | null
  lastSmoked?: { date: string; time: string } | null
}

type HistoryEntry = PatternEntry & { id: string }

// Un seul chargement partagé entre le bandeau et les panneaux (valable 10 s)
let shared: { at: number; promise: Promise<HistoryEntry[]> } | null = null
function loadHistory(force = false): Promise<HistoryEntry[]> {
  if (!force && shared && Date.now() - shared.at < 10_000) return shared.promise
  const promise = fetch(`/api/stats/history?t=${Date.now()}`, { cache: 'no-store' })
    .then((r) => r.json())
    .then((json) => {
      if (!json.success) throw new Error()
      return json.entries as HistoryEntry[]
    })
  shared = { at: Date.now(), promise }
  promise.catch(() => (shared = null))
  return promise
}

const fr1 = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const formatDateFr = (date: string) => {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}
const pad = (n: number) => String(n).padStart(2, '0')

export default function HabitInsights({ part, recordMs = null, lastSmoked = null }: Props) {
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const load = async () => {
      try {
        setEntries(await loadHistory())
        setError(null)
      } catch {
        setError('Impossible de charger ton historique complet.')
      }
    }
    load()
    const tick = setInterval(() => setNow(Date.now()), 60_000)
    const onFocus = () => load()
    window.addEventListener('focus', onFocus)
    return () => {
      clearInterval(tick)
      window.removeEventListener('focus', onFocus)
    }
  }, [])

  const result = useMemo(() => {
    if (!entries) return null
    const d = new Date(now)
    const today = localDateKey(d)
    const analysis = analyzeHabits(entries, today)
    const withDays = assignJournees(entries)
    const journee = currentJournee(now, withDays)
    const dayCounts = new Map<string, number>()
    withDays.forEach((e) => dayCounts.set(e.journee, (dayCounts.get(e.journee) || 0) + e.count))
    const projections = project(entries, dayCounts, journee)
    const next = nextHabit(analysis.habits, { date: today, minutes: d.getHours() * 60 + d.getMinutes() })
    return { analysis, projections, next }
  }, [entries, now])

  if (error) return part === 'panels' ? <p className={styles.error}>{error}</p> : null
  if (!result) return null
  const { analysis, projections, next } = result
  if (analysis.totalSmokes === 0) return null

  const recordDate =
    lastSmoked && recordMs
      ? (() => {
          const t = new Date(`${lastSmoked.date}T${lastSmoked.time.slice(0, 5)}:00`).getTime() + recordMs
          return localDateKey(new Date(t))
        })()
      : null
  const current = projections.months[projections.months.length - 1]
  const soon = next && next.inMinutes >= -30 && next.inMinutes <= 60 ? next : null

  if (part === 'alert') {
    return soon ? (
      <aside className={styles.alert} role="status">
        <SmokeIcon rainbow={soon.habit.kind === 'joint'} size={56} />
        <div>
          <p className={styles.alertTitle}>
            {soon.inMinutes > 0
              ? `Dans ${soon.inMinutes} min, c’est ton heure habituelle (${formatClock(soon.habit.typical)})`
              : `C’est ton heure habituelle (${formatClock(soon.habit.typical)})`}
          </p>
          <p className={styles.alertBody}>
            Tu peux ne pas fumer.{' '}
            {soon.habit.kind === 'joint' ? 'Ce joint, est-il' : 'Cette cigarette, est-elle'} vraiment nécessaire ?
            L’envie retombe en 3 à 5 minutes.
          </p>
        </div>
      </aside>
    ) : null
  }

  return (
    <>
      <section className={styles.panel} aria-labelledby="habits-title">
        <h2 id="habits-title" className={styles.title}>
          Mes heures habituelles
        </h2>
        <p className={styles.lead}>
          Analyse de tout ton historique depuis le {analysis.firstDate ? formatDateFr(analysis.firstDate) : '–'} :{' '}
          {analysis.totalSmokes.toLocaleString('fr-FR')} consos sur {analysis.activeDays} jours de conso. Les mois récents
          comptent un peu plus que les anciens.
        </p>

        {analysis.habits.length > 0 ? (
          <ul className={styles.habits}>
            {analysis.habits.map((h) => {
              const isNext = next?.habit === h
              return (
                <li key={h.start} className={isNext ? styles.nextHabit : ''}>
                  <span className={styles.habitTime}>{formatClock(h.typical)}</span>
                  <SmokeIcon rainbow={h.kind === 'joint'} size={40} />
                  <span className={styles.habitText}>
                    {Math.round(h.probability * 100)} % de tes journées de conso
                    {isNext && next && next.inMinutes > 0 && (
                      <strong> · prochaine dans {next.inMinutes >= 60 ? `${Math.floor(next.inMinutes / 60)} h ${pad(next.inMinutes % 60)}` : `${next.inMinutes} min`}</strong>
                    )}
                  </span>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className={styles.lead}>Pas encore d’heure qui revient assez souvent pour être une habitude.</p>
        )}

        <h3 className={styles.subTitle}>Consos par heure</h3>
        <div className={styles.chart}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analysis.byHour} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" vertical={false} stroke="var(--line)" />
              <XAxis
                dataKey="hour"
                tickFormatter={(h: number) => `${h}h`}
                interval={2}
                tick={{ fontSize: 12, fill: 'var(--ink-soft)' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--ink-soft)' }} tickLine={false} axisLine={false} />
              <Tooltip
                labelFormatter={(h: number) => `${h} h – ${h + 1} h`}
                contentStyle={{ borderRadius: 8, border: '1px solid var(--line)', fontSize: 13 }}
                cursor={{ fill: 'var(--air-deep)' }}
              />
              <Bar dataKey="allTime" name="Tout l’historique" fill="var(--line-strong)" maxBarSize={22} />
              <Bar dataKey="recent" name="30 derniers jours" fill="var(--ember)" maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className={styles.legend}>
          <span>
            <i className={styles.swatchAll} /> Tout l’historique
          </span>
          <span>
            <i className={styles.swatchRecent} /> 30 derniers jours
          </span>
        </p>
      </section>

      <section className={styles.panel} aria-labelledby="projections-title">
        <h2 id="projections-title" className={styles.title}>
          Projections
        </h2>
        <dl className={styles.figures}>
          <div>
            <dt>Moyenne des 14 derniers jours</dt>
            <dd>{fr1(projections.dailyAvg14)} / jour</dd>
            {projections.trendPct !== null && (
              <span className={projections.trendPct <= 0 ? styles.good : styles.bad}>
                {projections.trendPct > 0 ? '+' : ''}
                {Math.round(projections.trendPct)} % vs les 14 jours d’avant
              </span>
            )}
          </div>
          <div>
            <dt>Dans 4 semaines, à ce rythme</dt>
            <dd>{projections.projectedDailyIn4Weeks !== null ? `${fr1(projections.projectedDailyIn4Weeks)} / jour` : '–'}</dd>
            <span className={styles.note}>tendance des 28 derniers jours</span>
          </div>
          <div>
            <dt>Fin du mois en cours</dt>
            <dd>{current ? (current.cigarettes + current.joints).toLocaleString('fr-FR') : '–'}</dd>
            <span className={styles.note}>
              {current ? `${current.jointsSoFar + current.cigarettesSoFar} déjà, projeté au rythme actuel` : ''}
            </span>
          </div>
          <div>
            <dt>Une conso de moins chaque semaine</dt>
            <dd>{projections.zeroDateMinusOnePerWeek ? formatDateFr(projections.zeroDateMinusOnePerWeek) : '–'}</dd>
            <span className={styles.note}>date où tu arrives à zéro</span>
          </div>
          {recordDate && (
            <div>
              <dt>Si tu t’arrêtes maintenant</dt>
              <dd>{formatDateFr(recordDate)}</dd>
              <span className={styles.note}>tu bats ton record ce jour-là</span>
            </div>
          )}
        </dl>

        <h3 className={styles.subTitle}>Par mois, depuis le début</h3>
        <div className={styles.chart}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={projections.months} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" vertical={false} stroke="var(--line)" />
              <XAxis
                dataKey="label"
                interval="preserveStartEnd"
                tick={{ fontSize: 12, fill: 'var(--ink-soft)' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--ink-soft)' }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid var(--line)', fontSize: 13 }}
                cursor={{ fill: 'var(--air-deep)' }}
              />
              <Bar dataKey="cigarettes" name="Cigarettes" stackId="m" fill="var(--slate)" maxBarSize={28}>
                {projections.months.map((m) => (
                  <Cell key={m.month} fillOpacity={m.projected ? 0.4 : 1} />
                ))}
              </Bar>
              <Bar dataKey="joints" name="Joints" stackId="m" fill="#8e5bd8" maxBarSize={28} radius={[3, 3, 0, 0]}>
                {projections.months.map((m) => (
                  <Cell key={m.month} fillOpacity={m.projected ? 0.4 : 1} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className={styles.legend}>
          <span>
            <i className={styles.swatchCig} /> Cigarettes
          </span>
          <span>
            <i className={styles.swatchJoint} /> Joints
          </span>
          <span>Barre pâle : mois en cours, projeté</span>
        </p>

        <HabitNotifications />
      </section>
    </>
  )
}

/** Activer les alertes « heure habituelle » sur cet appareil, et en envoyer une pour tester. */
function HabitNotifications() {
  const [status, setStatus] = useState<'unsupported' | 'off' | 'on' | 'denied' | 'loading'>('loading')
  const [feedback, setFeedback] = useState<string | null>(null)

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setStatus('unsupported')
      return
    }
    if (Notification.permission === 'denied') {
      setStatus('denied')
      return
    }
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setStatus(sub ? 'on' : 'off'))
      .catch(() => setStatus('off'))
  }, [])

  const enable = async () => {
    setFeedback(null)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setStatus(permission === 'denied' ? 'denied' : 'off')
        return
      }
      const reg = await navigator.serviceWorker.ready
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key || undefined }))
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      })
      setStatus('on')
    } catch {
      setFeedback('L’activation a échoué. Vérifie que la clé VAPID est configurée sur le serveur.')
    }
  }

  const test = async () => {
    setFeedback(null)
    const res = await fetch('/api/notifications/habit-check?test=1', { method: 'POST' })
    const json = await res.json()
    setFeedback(json.sent ? 'Notification envoyée : regarde ton téléphone ou ton écran.' : json.reason || 'Rien n’a été envoyé.')
  }

  return (
    <div className={styles.notif}>
      <div>
        <h3 className={styles.subTitle}>Alertes avant tes heures habituelles</h3>
        <p className={styles.note}>
          {status === 'on' && 'Activées sur cet appareil : tu reçois un message environ 20 min avant chaque heure habituelle.'}
          {status === 'off' && 'Reçois un message environ 20 min avant chaque heure habituelle.'}
          {status === 'denied' && 'Les notifications sont bloquées dans les réglages du navigateur pour ce site.'}
          {status === 'unsupported' && 'Ce navigateur ne gère pas les notifications. Installe l’appli sur ton écran d’accueil.'}
        </p>
        {feedback && <p className={styles.feedback}>{feedback}</p>}
      </div>
      <div className={styles.notifActions}>
        {status === 'off' && (
          <button className={styles.primary} onClick={enable}>
            Activer les alertes
          </button>
        )}
        {status === 'on' && (
          <button className={styles.secondary} onClick={test}>
            Envoyer un test
          </button>
        )}
      </div>
    </div>
  )
}
