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

interface SmokeEntry {
  id: string
  date: string // YYYY-MM-DD (date locale saisie)
  time: string // HH:mm
  count: number
}

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
const localDateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
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
  const [justLogged, setJustLogged] = useState(false)
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
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(tick)
      clearInterval(poll)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [fetchData])

  const entries = useMemo(() => data?.entries ?? [], [data])
  const todayKey = localDateKey(new Date(now))
  const todayEntries = useMemo(() => entries.filter((e) => e.date === todayKey), [entries, todayKey])
  const todayCount = todayEntries.reduce((s, e) => s + e.count, 0)

  const addCigarette = async () => {
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
          jointCount: 1,
          cravingLevel: 5,
        }),
      })
      if (!res.ok) throw new Error()
      await fetchData()
      setJustLogged(true)
      setTimeout(() => setJustLogged(false), 1600)
    } catch {
      setError('La cigarette n’a pas été enregistrée. Réessaie dans un instant.')
    } finally {
      setSaving(false)
    }
  }

  const undoLast = async () => {
    const last = todayEntries[todayEntries.length - 1]
    if (!last || !confirm(`Supprimer la cigarette notée à ${last.time} ?`)) return
    setSaving(true)
    try {
      await fetch(`/api/entries/${last.id}`, { method: 'DELETE' })
      await fetchData()
    } finally {
      setSaving(false)
    }
  }

  const stats = useMemo(() => {
    const byDay = new Map<string, number>()
    entries.forEach((e) => byDay.set(e.date, (byDay.get(e.date) || 0) + e.count))

    const buildDays = (n: number) =>
      Array.from({ length: n }, (_, i) => {
        const d = new Date(now)
        d.setDate(d.getDate() - (n - 1 - i))
        const key = localDateKey(d)
        return {
          key,
          label: n === 7 ? d.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '') : `${d.getDate()}/${d.getMonth() + 1}`,
          cigarettes: byDay.get(key) || 0,
        }
      })
    const days7 = buildDays(7)
    const days30 = buildDays(30)

    // Moyenne calculée à partir du premier jour fumé de la fenêtre, pour ne pas diluer avec la période d'abstinence
    const avgFrom = (days: { cigarettes: number }[]) => {
      const first = days.findIndex((d) => d.cigarettes > 0)
      if (first === -1) return 0
      const slice = days.slice(first)
      return slice.reduce((s, d) => s + d.cigarettes, 0) / slice.length
    }

    const todayTs = todayEntries.map((e) => toTs(e)).sort((a, b) => a - b)
    const gaps = todayTs.slice(1).map((t, i) => t - todayTs[i])
    const avgGapToday = gaps.length ? gaps.reduce((s, g) => s + g, 0) / gaps.length : null

    const byHour = new Array(24).fill(0)
    entries.forEach((e) => {
      const h = parseInt(e.time.slice(0, 2))
      if (!isNaN(h)) byHour[h] += e.count
    })
    const peakHour = byHour.some((v) => v > 0) ? byHour.indexOf(Math.max(...byHour)) : null

    return {
      days7,
      days30,
      avg7: avgFrom(days7),
      avg30: avgFrom(days30),
      avgGapToday,
      peakHour,
      yesterday: days7[5]?.cigarettes ?? 0,
    }
  }, [entries, todayEntries, now])

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
          {sinceLast === null ? 'Aucune cigarette notée' : 'Sans fumer depuis'}
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
            Dernière cigarette le {formatDateFr(data.lastSmoked.date)} à {data.lastSmoked.time.slice(0, 5)}
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

      {/* Mesure de la fréquence */}
      <section className={styles.panel} aria-labelledby="today-title">
        <div className={styles.todayHead}>
          <div>
            <h2 id="today-title" className={styles.panelTitle}>
              Aujourd’hui
            </h2>
            <p className={styles.todayCount}>
              <span className={`${styles.countNumber} ${justLogged ? styles.bump : ''}`}>{todayCount}</span>
              <span className={styles.countUnit}>cigarette{todayCount > 1 ? 's' : ''}</span>
            </p>
          </div>
          <div className={styles.actions}>
            <button className={styles.logButton} onClick={addCigarette} disabled={saving}>
              {saving ? 'Enregistrement…' : justLogged ? 'Notée' : 'Noter une cigarette'}
            </button>
            {todayEntries.length > 0 && (
              <button className={styles.linkButton} onClick={undoLast} disabled={saving}>
                Annuler la dernière
              </button>
            )}
          </div>
        </div>

        <DayRail entries={todayEntries} now={now} />

        <dl className={styles.figures}>
          <Figure label="Écart moyen aujourd’hui" value={stats.avgGapToday !== null ? formatDuration(stats.avgGapToday) : '–'} />
          <Figure label="Hier" value={String(stats.yesterday)} />
          <Figure label="Moyenne sur 7 jours" value={fr1(stats.avg7)} />
          <Figure label="Moyenne sur 30 jours" value={fr1(stats.avg30)} />
          <Figure label="Heure la plus fréquente" value={stats.peakHour !== null ? `${stats.peakHour} h` : '–'} />
        </dl>

        <div className={styles.chartHead}>
          <h3 className={styles.chartTitle}>Cigarettes par jour</h3>
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
                formatter={(v: number) => [v, 'Cigarettes']}
                contentStyle={{ borderRadius: 8, border: '1px solid var(--line)', fontSize: 13 }}
              />
              {stats.avg7 > 0 && <ReferenceLine y={stats.avg7} stroke="var(--brass)" strokeDasharray="4 4" />}
              <Bar dataKey="cigarettes" fill="var(--slate)" radius={[3, 3, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className={styles.footnote}>
          La ligne pointillée marque ta moyenne sur 7 jours. Pour noter l’envie, le déclencheur ou le contexte, utilise{' '}
          <Link href="/new">Nouvelle entrée</Link>.
        </p>
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

/** Frise 0 h–24 h : un trait par cigarette, à son heure. */
function DayRail({ entries, now }: { entries: SmokeEntry[]; now: number }) {
  const n = new Date(now)
  const nowPct = ((n.getHours() * 60 + n.getMinutes()) / 1440) * 100
  return (
    <div className={styles.rail}>
      <div className={styles.railTrack} aria-hidden="true">
        <div className={styles.railElapsed} style={{ width: `${nowPct}%` }} />
        {entries.map((e) => {
          const [h, m] = e.time.split(':').map(Number)
          const pct = ((h * 60 + m) / 1440) * 100
          return (
            <span key={e.id} className={styles.railMark} style={{ left: `${pct}%` }} title={e.time}>
              {e.count > 1 && <span className={styles.railMulti}>×{e.count}</span>}
            </span>
          )
        })}
        <span className={styles.railNow} style={{ left: `${nowPct}%` }} />
      </div>
      <div className={styles.railScale} aria-hidden="true">
        <span>0 h</span>
        <span>6 h</span>
        <span>12 h</span>
        <span>18 h</span>
        <span>24 h</span>
      </div>
      <p className={styles.srOnly}>
        {entries.length
          ? `Cigarettes notées aujourd’hui à ${entries.map((e) => e.time).join(', ')}`
          : 'Aucune cigarette notée aujourd’hui'}
      </p>
    </div>
  )
}
