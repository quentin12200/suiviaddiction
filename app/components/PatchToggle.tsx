'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import styles from './PatchToggle.module.css'

export interface PatchSession {
  id: string
  startedAt: string
  endedAt: string | null
  doseMg: number
}

const pad = (n: number) => String(n).padStart(2, '0')

export function formatPatchDuration(ms: number): string {
  const totalMin = Math.max(0, Math.floor(ms / 60000))
  const days = Math.floor(totalMin / 1440)
  const hours = Math.floor((totalMin % 1440) / 60)
  const minutes = totalMin % 60
  // Espaces insécables : la durée ne se coupe pas en fin de ligne
  if (days) return `${days}\u00a0j\u00a0${hours}\u00a0h`
  if (hours) return `${hours}\u00a0h\u00a0${pad(minutes)}`
  return `${minutes}\u00a0min`
}

export function formatPatchMoment(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  const hm = `${pad(d.getHours())}:${pad(d.getMinutes())}`
  if (d.toDateString() === today.toDateString()) return `aujourd’hui à ${hm}`
  if (d.toDateString() === yesterday.toDateString()) return `hier à ${hm}`
  return `le ${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} à ${hm}`
}

export default function PatchToggle() {
  const [active, setActive] = useState<PatchSession | null>(null)
  const [last, setLast] = useState<PatchSession | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())

  const apply = (json: { active: PatchSession | null; sessions: PatchSession[] }) => {
    setActive(json.active)
    setLast(json.sessions.find((s) => s.endedAt) ?? null)
  }

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch(`/api/patch?t=${Date.now()}`, { cache: 'no-store' })
      const json = await res.json()
      if (!json.success) throw new Error()
      apply(json)
      setError(null)
    } catch {
      setError('Impossible de lire l’état du patch.')
    } finally {
      setLoaded(true)
    }
  }, [])

  useEffect(() => {
    fetchState()
    const tick = setInterval(() => setNow(Date.now()), 1000)
    const onVisible = () => document.visibilityState === 'visible' && fetchState()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(tick)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [fetchState])

  const toggle = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/patch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: active ? 'off' : 'on' }),
      })
      const json = await res.json()
      if (!json.success) throw new Error()
      apply(json)
      setError(null)
    } catch {
      setError('Le changement n’a pas été enregistré. Réessaie.')
    } finally {
      setSaving(false)
    }
  }

  const isOn = active !== null
  const elapsed = active ? now - new Date(active.startedAt).getTime() : 0
  const hh = Math.floor(elapsed / 3_600_000)
  const mm = Math.floor((elapsed % 3_600_000) / 60_000)
  const ss = Math.floor((elapsed % 60_000) / 1000)

  return (
    <section className={`${styles.patch} ${isOn ? styles.on : ''}`} aria-labelledby="patch-title">
      <div className={styles.main}>
        <div className={styles.text}>
          <h2 id="patch-title" className={styles.title}>
            Patch nicotine 7 mg
          </h2>
          {!loaded ? (
            <p className={styles.status}>Chargement…</p>
          ) : isOn && active ? (
            <>
              <p className={styles.timer} aria-live="off">
                {hh > 0 && (
                  <>
                    <span>{hh}</span>
                    <small>h</small>{' '}
                  </>
                )}
                <span>{pad(mm)}</span>
                <small>min</small> <span className={styles.sec}>{pad(ss)}</span>
                <small>s</small>
              </p>
              <p className={styles.status}>Posé {formatPatchMoment(active.startedAt)}</p>
            </>
          ) : (
            <p className={styles.status}>
              Pas de patch en ce moment.
              {last?.endedAt &&
                ` Dernier retiré ${formatPatchMoment(last.endedAt)}, après ${formatPatchDuration(
                  new Date(last.endedAt).getTime() - new Date(last.startedAt).getTime()
                )}.`}
            </p>
          )}
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={isOn}
          aria-labelledby="patch-title"
          className={styles.switch}
          onClick={toggle}
          disabled={!loaded || saving}
        >
          <span className={styles.knob} aria-hidden="true" />
          <span className={styles.switchLabel}>{isOn ? 'Je le retire' : 'Je le pose'}</span>
        </button>
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <Link href="/history#patchs" className={styles.historyLink}>
        Voir l’historique des patchs
      </Link>
    </section>
  )
}
