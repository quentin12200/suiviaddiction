'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import styles from './QuitDashboard.module.css'
import PatchToggle from './PatchToggle'
import SmokeIcon from './SmokeIcon'
import {
  assignJournees,
  computeNights,
  currentJournee,
  localDateKey,
  previousDateKey,
  NIGHT_END_HOUR,
} from '@/lib/smokingDay'

interface SmokeEntry {
  id: string
  date: string // YYYY-MM-DD (date locale saisie)
  time: string // HH:mm
  count: number
  kind: Kind
}

type Kind = 'cigarette' | 'joint'
const KIND_LABEL: Record<Kind, { one: string; many: string }> = {
  cigarette: { one: 'cigarette', many: 'cigarettes' },
  joint: { one: 'joint', many: 'joints' },
}
const plural = (kind: Kind, n: number) => (n > 1 ? KIND_LABEL[kind].many : KIND_LABEL[kind].one)

interface Moment {
  date: string
  time: string
}

interface FrequencyResponse {
  success: boolean
  entries: SmokeEntry[]
  record: { from: Moment; to: Moment; durationMs: number } | null
  lastSmoked: Moment | null
}

const DAY = 86_400_000
const pad = (n: number) => String(n).padStart(2, '0')
const fr1 = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const toTs = (m: Moment) => new Date(`${m.date}T${m.time.slice(0, 5)}:00`).getTime()

function splitDuration(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000))
  const totalDays = Math.floor(s / 86400)
  return {
    months: Math.floor(totalDays / 30),
    days: totalDays % 30,
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    totalDays,
  }
}

function formatDuration(ms: number): string {
  const d = splitDuration(ms)
  if (d.months) return `${d.months} mois${d.days ? ` ${d.days} j` : ''}`
  if (d.totalDays) return `${d.totalDays} j${d.hours ? ` ${d.hours} h` : ''}`
  if (d.hours) return `${d.hours} h ${pad(d.minutes)}`
  return `${d.minutes} min`
}

function formatDateFr(date: string, withYear = true): string {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    ...(withYear ? { year: 'numeric' } : {}),
  })
}

const MILESTONES = [
  { ms: 20 * 60_000, label: 'Pouls et tension redescendent' },
  { ms: 8 * 3_600_000, label: 'Le monoxyde de carbone dans le sang diminue de moitié' },
  { ms: DAY, label: 'Le THC commence à quitter l’organisme' },
  { ms: 2 * DAY, label: 'Le goût et l’odorat reviennent' },
  { ms: 3 * DAY, label: 'La respiration devient plus facile' },
  { ms: 7 * DAY, label: 'Le sommeil se normalise, la toux diminue' },
  { ms: 14 * DAY, label: 'La motivation naturelle revient' },
  { ms: 30 * DAY, label: 'Récepteurs CB1 régénérés, poumons +30 %' },
  { ms: 90 * DAY, label: 'Circulation et capacité pulmonaire nettement meilleures' },
  { ms: 365 * DAY, label: 'Risque cardiaque divisé par deux' },
]

export default function QuitDashboard() {
  const [data, setData] = useState<FrequencyResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [justLogged, setJustLogged] = useState<Kind | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [range, setRange] = useState<7 | 30>(7)
  const [showShare, setShowShare] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/stats/frequency?days=30&t=${Date.now()}`, { cache: 'no-store' })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setData(json)
      setError(null)
    } catch {
      setError('Impossible de charger tes données. Vérifie ta connexion puis recharge la page.')
    }
  }, [])

  useEffect(() => {
    fetchData()
    const tick = setInterval(() => setNow(Date.now()), 1000)
    const poll = setInterval(fetchData, 60_000)
    const onVisible = () => document.visibilityState === 'visible' && fetchData()
    // Retour sur l'onglet ou la fenêtre (ex. après une modification dans l'historique) : on recharge
    const onFocus = () => fetchData()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onFocus)
    window.addEventListener('pageshow', onFocus)
    return () => {
      clearInterval(tick)
      clearInterval(poll)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('pageshow', onFocus)
    }
  }, [fetchData])

  // Chaque cigarette est rattachée à sa journée réveil → coucher (voir lib/smokingDay.ts)
  const entries = useMemo(() => assignJournees(data?.entries ?? []), [data])
  const todayKey = currentJournee(now, entries)
  const todayEntries = useMemo(() => entries.filter((e) => e.journee === todayKey), [entries, todayKey])
  const countOf = (kind: Kind) => todayEntries.filter((e) => e.kind === kind).reduce((s, e) => s + e.count, 0)

  const addSmoke = async (kind: Kind) => {
    setSaving(true)
    try {
      const d = new Date()
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: localDateKey(d),
          time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
          hasSmoked: true,
          kind,
          jointCount: 1,
          cravingLevel: 5,
        }),
      })
      if (!res.ok) throw new Error()
      await fetchData()
      setJustLogged(kind)
      setTimeout(() => setJustLogged(null), 1600)
    } catch {
      setError(
        kind === 'joint'
          ? 'Le joint n’a pas été enregistré. Réessaie dans un instant.'
          : 'La cigarette n’a pas été enregistrée. Réessaie dans un instant.'
      )
    } finally {
      setSaving(false)
    }
  }

  const undoLast = async () => {
    const last = todayEntries[todayEntries.length - 1]
    if (!last || !confirm(`Supprimer ${last.kind === 'joint' ? 'le joint' : 'la cigarette'} noté${last.kind === 'joint' ? '' : 'e'} à ${last.time} ?`)) return
    setSaving(true)
    try {
      await fetch(`/api/entries/${last.id}`, { method: 'DELETE' })
      await fetchData()
    } finally {
      setSaving(false)
    }
  }

  const stats = useMemo(() => {
    const byDay: Record<Kind, Map<string, number>> = { cigarette: new Map(), joint: new Map() }
    entries.forEach((e) => byDay[e.kind].set(e.journee, (byDay[e.kind].get(e.journee) || 0) + e.count))

    // Les n dernières journées, de la plus ancienne à la journée en cours
    const buildDays = (n: number) => {
      const keys: string[] = [todayKey]
      while (keys.length < n) keys.unshift(previousDateKey(keys[0]))
      return keys.map((key) => {
        const [y, m, d] = key.split('-').map(Number)
        const date = new Date(y, m - 1, d)
        return {
          key,
          label: n === 7 ? date.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '') : `${d}/${m}`,
          cigarettes: byDay.cigarette.get(key) || 0,
          joints: byDay.joint.get(key) || 0,
        }
      })
    }
    const days7 = buildDays(7)
    const days30 = buildDays(30)

    // Moyenne calculée à partir du premier jour fumé de la fenêtre, pour ne pas diluer avec la période d'abstinence
    const avgFrom = (days: Record<'cigarettes' | 'joints', number>[], field: 'cigarettes' | 'joints') => {
      const first = days.findIndex((d) => d[field] > 0)
      if (first === -1) return 0
      const slice = days.slice(first)
      return slice.reduce((s, d) => s + d[field], 0) / slice.length
    }

    const perKind = (kind: Kind) => {
      const field = kind === 'cigarette' ? 'cigarettes' : 'joints'
      const ts = todayEntries.filter((e) => e.kind === kind).map((e) => e.ts)
      const gaps = ts.slice(1).map((t, i) => t - ts[i])
      const byHour = new Array(24).fill(0)
      entries.forEach((e) => {
        const h = parseInt(e.time.slice(0, 2))
        if (e.kind === kind && !isNaN(h)) byHour[h] += e.count
      })
      return {
        yesterday: days7[5]?.[field] ?? 0,
        avg7: avgFrom(days7, field),
        avg30: avgFrom(days30, field),
        avgGap: gaps.length ? gaps.reduce((s, g) => s + g, 0) / gaps.length : null,
        peakHour: byHour.some((v) => v > 0) ? byHour.indexOf(Math.max(...byHour)) : null,
      }
    }

    // Nuits : de la dernière cigarette avant de dormir à la première après le réveil
    const nights = computeNights(entries)
    const week = new Set(days7.map((d) => d.key))
    const nights7 = nights.filter((n) => week.has(n.journee))
    const avgNight7 = nights7.length ? nights7.reduce((s, n) => s + n.durationMs, 0) / nights7.length : null
    const longestNight = nights.reduce<(typeof nights)[number] | null>(
      (best, n) => (!best || n.durationMs > best.durationMs ? n : best),
      null
    )
    const lastNight = nights.length ? nights[nights.length - 1] : null
    // Heure moyenne de la dernière cigarette du soir (sur 7 journées), comptée après minuit si besoin
    const lastPerDay = new Map<string, number>()
    entries.forEach((e) => week.has(e.journee) && e.journee !== todayKey && lastPerDay.set(e.journee, e.ts))
    const bedtimeMinutes = Array.from(lastPerDay.values()).map((ts) => {
      const d = new Date(ts)
      const m = d.getHours() * 60 + d.getMinutes()
      return d.getHours() < NIGHT_END_HOUR ? m + 1440 : m
    })
    const avgBedtime = bedtimeMinutes.length
      ? Math.round(bedtimeMinutes.reduce((s, m) => s + m, 0) / bedtimeMinutes.length) % 1440
      : null

    return {
      days7,
      days30,
      cigarette: perKind('cigarette'),
      joint: perKind('joint'),
      lastNight,
      avgNight7,
      longestNight,
      nightsCount: nights7.length,
      avgBedtime,
    }
  }, [entries, todayEntries, todayKey])

  const lastTs = data?.lastSmoked ? toTs(data.lastSmoked) : null
  const sinceLast = lastTs !== null ? Math.max(0, now - lastTs) : null
  const record = data?.record ?? null
  const recordMs = record?.durationMs ?? 0
  const beatingRecord = record !== null && sinceLast !== null && sinceLast > recordMs
  const progress = recordMs > 0 && sinceLast !== null ? Math.min(1, sinceLast / recordMs) : 0
  const t = splitDuration(sinceLast ?? 0)
  const nextMilestone = sinceLast !== null ? MILESTONES.find((m) => m.ms > sinceLast) : MILESTONES[0]
  const reached = sinceLast !== null ? MILESTONES.filter((m) => m.ms <= sinceLast) : []

  if (!data && !error) {
    return <div className={styles.loading}>Chargement de ton suivi…</div>
  }

  const chartData = range === 7 ? stats.days7 : stats.days30

  return (
    <div className={styles.root}>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      {/* Chrono + chemin vers le record */}
      <section className={styles.hero} aria-labelledby="streak-title">
        <h1 id="streak-title" className={styles.heroTitle}>
          {sinceLast === null ? 'Rien de noté pour l’instant' : 'Sans fumer depuis'}
        </h1>

        {sinceLast !== null && (
          <div className={styles.clock} aria-live="off">
            {t.months > 0 && <ClockUnit value={t.months} unit="mois" />}
            {(t.months > 0 || t.days > 0) && <ClockUnit value={t.days} unit={t.days > 1 ? 'jours' : 'jour'} />}
            <ClockUnit value={t.hours} unit="h" pad />
            <ClockUnit value={t.minutes} unit="min" pad />
            {t.months === 0 && <ClockUnit value={t.seconds} unit="s" pad muted />}
          </div>
        )}

        {data?.lastSmoked && (
          <p className={styles.heroMeta}>
            Dernière consommation le {formatDateFr(data.lastSmoked.date)} à {data.lastSmoked.time.slice(0, 5)}
          </p>
        )}

        {record && (
          <div className={styles.path}>
            <div
              className={styles.track}
              role="progressbar"
              aria-label="Progression vers ton record"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress * 100)}
            >
              <div className={styles.trackFill} style={{ width: `${progress * 100}%` }} />
              <div className={styles.trackFlag} aria-hidden="true" />
            </div>
            <div className={styles.pathLegend}>
              <span>
                {beatingRecord
                  ? 'Tu bats ton record en ce moment.'
                  : progress < 0.01
                    ? 'Le chemin vers ton record recommence ici.'
                    : `${Math.floor(progress * 100)} % du chemin vers ton record`}
              </span>
              <span className={styles.recordFigure}>
                Record : <strong>{formatDuration(beatingRecord && sinceLast ? sinceLast : recordMs)}</strong>
              </span>
            </div>
            {!beatingRecord && (
              <p className={styles.recordNote}>
                Du {formatDateFr(record.from.date)} au {formatDateFr(record.to.date)}. Tu l’as déjà fait une
                fois, et cette période reste acquise : une rechute ne l’efface pas.
              </p>
            )}
          </div>
        )}

        {nextMilestone && sinceLast !== null && (
          <p className={styles.nextStep}>
            Prochain palier dans {formatDuration(nextMilestone.ms - sinceLast)} : {nextMilestone.label.toLowerCase()}.
          </p>
        )}

        {sinceLast !== null && sinceLast > DAY && (
          <button className={styles.ghostButton} onClick={() => setShowShare(true)}>
            Partager ma fierté
          </button>
        )}
      </section>

      {/* Patch nicotine */}
      <PatchToggle />

      {/* Mesure de la fréquence : deux compteurs */}
      <section className={styles.panel} aria-labelledby="today-title">
        <h2 id="today-title" className={styles.panelTitle}>
          {todayKey === localDateKey(new Date(now)) ? 'Aujourd’hui' : `Journée du ${formatDateFr(todayKey, false)}`}
        </h2>
        <p className={styles.dayHint}>
          {todayKey === localDateKey(new Date(now))
            ? 'Depuis ton réveil'
            : 'Tu n’es pas encore couché : ce que tu fumes compte pour la veille'}
        </p>

        <div className={styles.counters}>
          {(['cigarette', 'joint'] as Kind[]).map((kind) => {
            const n = countOf(kind)
            return (
              <div key={kind} className={`${styles.counter} ${kind === 'joint' ? styles.counterJoint : ''}`}>
                <div className={styles.counterHead}>
                  <SmokeIcon rainbow={kind === 'joint'} size={72} />
                  <span className={styles.counterName}>{KIND_LABEL[kind].many}</span>
                </div>
                <p className={styles.todayCount}>
                  <span className={`${styles.countNumber} ${justLogged === kind ? styles.bump : ''}`}>{n}</span>
                  <span className={styles.countUnit}>{plural(kind, n)}</span>
                </p>
                <button
                  className={`${styles.logButton} ${kind === 'joint' ? styles.logJoint : ''}`}
                  onClick={() => addSmoke(kind)}
                  disabled={saving}
                >
                  {justLogged === kind ? (kind === 'joint' ? 'Noté' : 'Notée') : kind === 'joint' ? 'Noter un joint' : 'Noter une cigarette'}
                </button>
              </div>
            )
          })}
        </div>
        {todayEntries.length > 0 && (
          <button className={styles.linkButton} onClick={undoLast} disabled={saving}>
            Annuler la dernière saisie ({todayEntries[todayEntries.length - 1].kind}{' '}
            de {todayEntries[todayEntries.length - 1].time})
          </button>
        )}

        <DayRail entries={todayEntries} now={now} journee={todayKey} />

        <div className={styles.tableWrap}>
          <table className={styles.kindTable}>
            <thead>
              <tr>
                <th scope="col">
                  <span className={styles.srOnly}>Type</span>
                </th>
                <th scope="col">Hier</th>
                <th scope="col">Moyenne 7 j</th>
                <th scope="col">Moyenne 30 j</th>
                <th scope="col">Écart moyen sur la journée</th>
                <th scope="col">Heure la plus fréquente</th>
              </tr>
            </thead>
            <tbody>
              {(['cigarette', 'joint'] as Kind[]).map((kind) => {
                const k = stats[kind]
                return (
                  <tr key={kind}>
                    <th scope="row">
                      <span className={styles.rowKind}>
                        <SmokeIcon rainbow={kind === 'joint'} size={36} />
                        {KIND_LABEL[kind].many}
                      </span>
                    </th>
                    <td data-label="Hier">{k.yesterday}</td>
                    <td data-label="Moyenne 7 j">{fr1(k.avg7)}</td>
                    <td data-label="Moyenne 30 j">{fr1(k.avg30)}</td>
                    <td data-label="Écart moyen">{k.avgGap !== null ? formatDuration(k.avgGap) : '–'}</td>
                    <td data-label="Heure fréquente">{k.peakHour !== null ? `${k.peakHour} h` : '–'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className={styles.chartHead}>
          <h3 className={styles.chartTitle}>Par jour</h3>
          <div className={styles.segmented} role="group" aria-label="Période du graphique">
            <button aria-pressed={range === 7} onClick={() => setRange(7)}>
              7 jours
            </button>
            <button aria-pressed={range === 30} onClick={() => setRange(30)}>
              30 jours
            </button>
          </div>
        </div>
        <div className={styles.chart}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="jointBar" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor="#e63946" />
                  <stop offset="20%" stopColor="#f4a261" />
                  <stop offset="40%" stopColor="#f6d84a" />
                  <stop offset="60%" stopColor="#52b788" />
                  <stop offset="80%" stopColor="#4895ef" />
                  <stop offset="100%" stopColor="#8e5bd8" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" vertical={false} stroke="var(--line)" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: 'var(--ink-soft)' }}
                tickLine={false}
                axisLine={false}
                interval={range === 30 ? 4 : 0}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--ink-soft)' }} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: 'var(--air-deep)' }}
                contentStyle={{ borderRadius: 8, border: '1px solid var(--line)', fontSize: 13 }}
              />
              <Bar dataKey="cigarettes" name="Cigarettes" stackId="a" fill="var(--slate)" maxBarSize={36} />
              <Bar dataKey="joints" name="Joints" stackId="a" fill="url(#jointBar)" radius={[3, 3, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className={styles.legend}>
          <span className={styles.legendItem}>
            <span className={styles.swatch} /> Cigarettes
          </span>
          <span className={styles.legendItem}>
            <span className={`${styles.swatch} ${styles.swatchJoint}`} /> Joints
          </span>
        </p>
        <p className={styles.footnote}>
          Une journée va de ton réveil à ton coucher : ce que tu fumes entre minuit et {NIGHT_END_HOUR} h compte pour
          la veille. Pour noter l’envie, le déclencheur ou le contexte, utilise <Link href="/new">Nouvelle entrée</Link>.
        </p>
      </section>

      {/* Nuits d'abstinence */}
      <section className={styles.panel} aria-labelledby="nights-title">
        <h2 id="nights-title" className={styles.panelTitle}>
          Mes nuits sans fumer
        </h2>
        {stats.lastNight ? (
          <>
            <p className={styles.nightLead}>
              <span className={styles.nightFigure}>{formatDuration(stats.lastNight.durationMs)}</span>
              <span>
                la nuit dernière, de ta dernière cigarette à {stats.lastNight.lastBefore.time.slice(0, 5)} jusqu’à la
                première à {stats.lastNight.firstAfter.time.slice(0, 5)}.
              </span>
            </p>
            <dl className={`${styles.figures} ${styles.nightFigures}`}>
              <Figure
                label={`Nuit moyenne (${stats.nightsCount} nuit${stats.nightsCount > 1 ? 's' : ''}, 7 jours)`}
                value={stats.avgNight7 !== null ? formatDuration(stats.avgNight7) : '–'}
              />
              <Figure
                label="Plus longue nuit (30 jours)"
                value={stats.longestNight ? formatDuration(stats.longestNight.durationMs) : '–'}
              />
              <Figure
                label="Dernière cigarette du soir, en moyenne"
                value={stats.avgBedtime !== null ? `${pad(Math.floor(stats.avgBedtime / 60))}:${pad(stats.avgBedtime % 60)}` : '–'}
              />
            </dl>
          </>
        ) : (
          <p className={styles.resetNote}>
            Pas encore de nuit mesurée : il faut une cigarette notée avant de dormir et une après le réveil.
          </p>
        )}
      </section>

      {/* Récupération : repart de 0 à chaque cigarette */}
      {sinceLast !== null && data?.lastSmoked && (
        <section className={styles.panel} aria-labelledby="recovery-title">
          <h2 id="recovery-title" className={styles.panelTitle}>
            Ma récupération
          </h2>
          <p className={styles.resetNote}>
            Repartie de 0 % le {formatDateFr(data.lastSmoked.date)}, jour de ma dernière cigarette.
            {record ? ' Mon record, lui, reste enregistré.' : ''}
          </p>
          <div className={styles.recoveryList}>
            <RecoveryBar label="Régénération des récepteurs CB1 (cannabis)" value={sinceLast / (30 * DAY)} target="30 jours" />
            <RecoveryBar label="Récupération pulmonaire (tabac)" value={sinceLast / (365 * DAY)} target="1 an" />
          </div>
        </section>
      )}

      {/* Paliers santé */}
      {sinceLast !== null && (
        <details className={styles.panel}>
          <summary className={styles.summary}>
            Ce que ton corps récupère ({reached.length}/{MILESTONES.length} paliers)
          </summary>
          <ol className={styles.milestones}>
            {MILESTONES.map((m) => {
              const done = sinceLast >= m.ms
              return (
                <li key={m.ms} className={done ? styles.done : ''}>
                  <span className={styles.msWhen}>{formatDuration(m.ms)}</span>
                  <span>{m.label}</span>
                </li>
              )
            })}
          </ol>
        </details>
      )}

      <div className={styles.journalRow}>
        <Link href="/journal" className={styles.journalLink}>
          Ouvrir mon journal
        </Link>
      </div>

      {showShare && sinceLast !== null && data?.lastSmoked && (
        <div className={styles.modalBackdrop} onClick={() => setShowShare(false)}>
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-label="Partager"
            onClick={(e) => e.stopPropagation()}
          >
            <p className={styles.modalKicker}>Sans cigarette depuis</p>
            <p className={styles.modalFigure}>{formatDuration(sinceLast)}</p>
            <p className={styles.modalMeta}>Depuis le {formatDateFr(data.lastSmoked.date)}</p>
            <p className={styles.modalHint}>Fais une capture d’écran pour partager.</p>
            <button className={styles.ghostButtonDark} onClick={() => setShowShare(false)} autoFocus>
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ClockUnit({ value, unit, pad: doPad, muted }: { value: number; unit: string; pad?: boolean; muted?: boolean }) {
  return (
    <span className={`${styles.clockUnit} ${muted ? styles.clockMuted : ''}`}>
      <span className={styles.clockValue}>{doPad ? String(value).padStart(2, '0') : value}</span>
      <span className={styles.clockLabel}>{unit}</span>
    </span>
  )
}

function RecoveryBar({ label, value, target }: { label: string; value: number; target: string }) {
  const pct = Math.min(1, Math.max(0, value)) * 100
  const shown = pct.toLocaleString('fr-FR', { maximumFractionDigits: pct < 10 ? 1 : 0 })
  return (
    <div className={styles.recovery}>
      <div className={styles.recoveryHead}>
        <span>{label}</span>
        <strong>{shown} %</strong>
      </div>
      <div
        className={styles.recoveryTrack}
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
      >
        <div className={styles.recoveryFill} style={{ width: `${pct}%` }} />
      </div>
      <span className={styles.recoveryTarget}>100 % au bout de {target} sans fumer</span>
    </div>
  )
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.figure}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

/** Frise de la journée, de 5 h à 5 h le lendemain : un trait par cigarette, à son heure. */
function DayRail({
  entries,
  now,
  journee,
}: {
  entries: { id: string; ts: number; time: string; count: number; kind: Kind }[]
  now: number
  journee: string
}) {
  const [y, m, d] = journee.split('-').map(Number)
  const start = new Date(y, m - 1, d, NIGHT_END_HOUR).getTime()
  const pos = (ts: number) => Math.min(100, Math.max(0, ((ts - start) / DAY) * 100))
  const nowPct = pos(now)
  const hours = [0, 6, 12, 18, 24].map((h) => (NIGHT_END_HOUR + h) % 24)
  return (
    <div className={styles.rail}>
      <div className={styles.railTrack} aria-hidden="true">
        <div className={styles.railElapsed} style={{ width: `${nowPct}%` }} />
        {entries.map((e) => (
          <span
            key={e.id}
            className={`${styles.railMark} ${e.kind === 'joint' ? styles.railJoint : ''}`}
            style={{ left: `${pos(e.ts)}%` }}
            title={`${e.kind} à ${e.time}`}
          >
            {e.count > 1 && <span className={styles.railMulti}>×{e.count}</span>}
          </span>
        ))}
        <span className={styles.railNow} style={{ left: `${nowPct}%` }} />
      </div>
      <div className={styles.railScale} aria-hidden="true">
        {hours.map((h, i) => (
          <span key={i}>{h} h</span>
        ))}
      </div>
      <p className={styles.srOnly}>
        {entries.length
          ? `Sur la journée : ${entries.map((e) => `${e.kind} à ${e.time}`).join(', ')}`
          : 'Rien de noté sur cette journée'}
      </p>
    </div>
  )
}
