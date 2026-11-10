'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
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
import styles from './FrequencyTracker.module.css'

interface SmokeEntry {
  id: string
  date: string // YYYY-MM-DD (date locale saisie)
  time: string // HH:mm
  count: number
  cravingLevel: number
  trigger: string
  context: string
}

interface RecordInfo {
  from: { date: string; time: string }
  to: { date: string; time: string }
  durationMs: number
}

interface FrequencyResponse {
  success: boolean
  entries: SmokeEntry[]
  record: RecordInfo | null
  lastSmoked: { date: string; time: string } | null
}

const pad = (n: number) => String(n).padStart(2, '0')
const localDateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const toTs = (date: string, time: string) => new Date(`${date}T${time.slice(0, 5)}:00`).getTime()

function formatDuration(ms: number): string {
  if (ms <= 0) return '0 min'
  const totalMin = Math.floor(ms / 60000)
  const totalDays = Math.floor(totalMin / 1440)
  const months = Math.floor(totalDays / 30)
  const days = totalDays % 30
  const hours = Math.floor((totalMin % 1440) / 60)
  const minutes = totalMin % 60
  const parts: string[] = []
  if (months) parts.push(`${months} mois`)
  if (days) parts.push(`${days} j`)
  if (!months && hours) parts.push(`${hours} h`)
  if (!months && !days) parts.push(`${minutes} min`)
  return parts.join(' ')
}

function formatDateFr(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function FrequencyTracker({ onChange }: { onChange?: () => void }) {
  const [data, setData] = useState<FrequencyResponse | null>(null)
  const [saving, setSaving] = useState(false)
  const [now, setNow] = useState(Date.now())
  const [range, setRange] = useState<7 | 30>(7)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/stats/frequency?days=30&t=${Date.now()}`, { cache: 'no-store' })
      const json = await res.json()
      if (json.success) setData(json)
    } catch (e) {
      console.error('Erreur chargement fréquence:', e)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const tick = setInterval(() => setNow(Date.now()), 30000)
    const onVisible = () => document.visibilityState === 'visible' && fetchData()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(tick)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [fetchData])

  const addCigarette = async () => {
    setSaving(true)
    try {
      const d = new Date()
      await fetch('/api/entries', {
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
      await fetchData()
      onChange?.()
    } finally {
      setSaving(false)
    }
  }

  const todayKey = localDateKey(new Date(now))
  const entries = useMemo(() => data?.entries ?? [], [data])
  const todayEntries = entries.filter((e) => e.date === todayKey)
  const todayCount = todayEntries.reduce((s, e) => s + e.count, 0)

  const undoLast = async () => {
    const last = todayEntries[todayEntries.length - 1]
    if (!last || !confirm(`Supprimer la cigarette de ${last.time} ?`)) return
    setSaving(true)
    try {
      await fetch(`/api/entries/${last.id}`, { method: 'DELETE' })
      await fetchData()
      onChange?.()
    } finally {
      setSaving(false)
    }
  }

  const stats = useMemo(() => {
    // Comptes par jour (jours sans cigarette inclus, à 0)
    const byDay = new Map<string, number>()
    entries.forEach((e) => byDay.set(e.date, (byDay.get(e.date) || 0) + e.count))

    const buildDays = (n: number) => {
      const out: { key: string; label: string; cigarettes: number }[] = []
      for (let i = n - 1; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(d.getDate() - i)
        const key = localDateKey(d)
        out.push({ key, label: `${d.getDate()}/${d.getMonth() + 1}`, cigarettes: byDay.get(key) || 0 })
      }
      return out
    }
    const days7 = buildDays(7)
    const days30 = buildDays(30)

    // Moyennes depuis la reprise (premier jour avec cigarette dans la fenêtre) pour ne pas diluer
    const avgFrom = (days: { cigarettes: number }[]) => {
      const first = days.findIndex((d) => d.cigarettes > 0)
      if (first === -1) return 0
      const slice = days.slice(first)
      return slice.reduce((s, d) => s + d.cigarettes, 0) / slice.length
    }

    // Intervalles entre cigarettes d'aujourd'hui
    const todayTs = todayEntries.map((e) => toTs(e.date, e.time)).sort((a, b) => a - b)
    const gaps: number[] = []
    for (let i = 1; i < todayTs.length; i++) gaps.push(todayTs[i] - todayTs[i - 1])
    const avgGapToday = gaps.length ? gaps.reduce((s, g) => s + g, 0) / gaps.length : null

    // Heures les plus fréquentes (30 j)
    const byHour = new Array(24).fill(0)
    entries.forEach((e) => {
      const h = parseInt(e.time.slice(0, 2))
      if (!isNaN(h)) byHour[h] += e.count
    })
    const peakHour = byHour.some((v) => v > 0) ? byHour.indexOf(Math.max(...byHour)) : null

    const yesterday = days7[days7.length - 2]?.cigarettes ?? 0

    return {
      days7,
      days30,
      avg7: avgFrom(days7),
      avg30: avgFrom(days30),
      avgGapToday,
      peakHour,
      yesterday,
    }
  }, [entries, todayEntries, now])

  const lastTs = data?.lastSmoked ? toTs(data.lastSmoked.date, data.lastSmoked.time) : null
  const sinceLast = lastTs ? now - lastTs : null
  const record = data?.record ?? null
  const currentIsRecord = record && sinceLast !== null && sinceLast > record.durationMs

  const chartData = range === 7 ? stats.days7 : stats.days30

  return (
    <div className={styles.wrapper}>
      {/* Record d'abstinence */}
      {record && (
        <div className={styles.recordCard}>
          <div className={styles.recordIcon}>🏆</div>
          <div className={styles.recordBody}>
            <div className={styles.recordLabel}>Mon record sans fumer</div>
            <div className={styles.recordValue}>
              {formatDuration(currentIsRecord && sinceLast ? sinceLast : record.durationMs)}
            </div>
            <div className={styles.recordDates}>
              {currentIsRecord
                ? 'En cours : tu bats ton record en ce moment !'
                : `du ${formatDateFr(record.from.date)} au ${formatDateFr(record.to.date)}`}
            </div>
            {!currentIsRecord && (
              <div className={styles.recordNote}>
                Tu l&apos;as fait une fois, tu peux le refaire.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Outil de mesure de fréquence */}
      <div className={styles.card}>
        <h2 className={styles.title}>📏 Mesure de ma consommation</h2>

        <div className={styles.todayRow}>
          <div className={styles.todayCount}>
            <span className={styles.bigNumber}>{todayCount}</span>
            <span className={styles.bigLabel}>
              cigarette{todayCount > 1 ? 's' : ''} aujourd&apos;hui
            </span>
          </div>
          <div className={styles.buttons}>
            <button className={styles.addButton} onClick={addCigarette} disabled={saving}>
              ＋1 cigarette
            </button>
            {todayEntries.length > 0 && (
              <button className={styles.undoButton} onClick={undoLast} disabled={saving}>
                Annuler la dernière
              </button>
            )}
          </div>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Depuis la dernière</span>
            <span className={styles.statValue}>{sinceLast !== null ? formatDuration(sinceLast) : '-'}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Intervalle moyen (aujourd&apos;hui)</span>
            <span className={styles.statValue}>
              {stats.avgGapToday !== null ? formatDuration(stats.avgGapToday) : '-'}
            </span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Hier</span>
            <span className={styles.statValue}>{stats.yesterday}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Moyenne / jour (7 j)</span>
            <span className={styles.statValue}>{stats.avg7.toFixed(1)}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Moyenne / jour (30 j)</span>
            <span className={styles.statValue}>{stats.avg30.toFixed(1)}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Heure la plus fréquente</span>
            <span className={styles.statValue}>
              {stats.peakHour !== null ? `${pad(stats.peakHour)}h` : '-'}
            </span>
          </div>
        </div>

        {todayEntries.length > 0 && (
          <div className={styles.timeline}>
            <span className={styles.timelineLabel}>Aujourd&apos;hui :</span>
            {todayEntries.map((e) => (
              <span key={e.id} className={styles.timeChip}>
                {e.time}
                {e.count > 1 ? ` ×${e.count}` : ''}
              </span>
            ))}
          </div>
        )}

        <div className={styles.chartHeader}>
          <h3>Cigarettes par jour</h3>
          <div className={styles.rangeToggle}>
            <button className={range === 7 ? styles.rangeActive : ''} onClick={() => setRange(7)}>
              7 j
            </button>
            <button className={range === 30 ? styles.rangeActive : ''} onClick={() => setRange(30)}>
              30 j
            </button>
          </div>
        </div>
        <div className={styles.chart}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} interval={range === 30 ? 4 : 0} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => [`${v}`, 'Cigarettes']} />
              {stats.avg7 > 0 && (
                <ReferenceLine y={stats.avg7} stroke="#f59e0b" strokeDasharray="4 4" />
              )}
              <Bar dataKey="cigarettes" fill="#667eea" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className={styles.hint}>
          Pour noter l&apos;envie, le déclencheur ou le contexte, passe par « Nouvelle entrée ».
        </p>
      </div>
    </div>
  )
}
