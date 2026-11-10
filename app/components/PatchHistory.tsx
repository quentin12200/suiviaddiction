'use client'

import { useEffect, useState } from 'react'
import { PatchSession, formatPatchDuration } from './PatchToggle'
import styles from './PatchHistory.module.css'

const pad = (n: number) => String(n).padStart(2, '0')
const fmt = (iso: string) => {
  const d = new Date(iso)
  return `${d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} à ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`
}

export default function PatchHistory() {
  const [sessions, setSessions] = useState<PatchSession[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())

  const load = async () => {
    try {
      const res = await fetch(`/api/patch?t=${Date.now()}`, { cache: 'no-store' })
      const json = await res.json()
      if (!json.success) throw new Error()
      setSessions(json.sessions)
    } catch {
      setError('Impossible de charger l’historique des patchs.')
    }
  }

  useEffect(() => {
    load()
    const tick = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(tick)
  }, [])

  const remove = async (s: PatchSession) => {
    if (!confirm(`Supprimer la pose du ${fmt(s.startedAt)} ?`)) return
    const res = await fetch(`/api/patch?id=${s.id}`, { method: 'DELETE' })
    const json = await res.json()
    if (json.success) setSessions(json.sessions)
  }

  const closed = (sessions ?? []).filter((s) => s.endedAt)
  const avg =
    closed.length > 0
      ? closed.reduce((sum, s) => sum + (new Date(s.endedAt!).getTime() - new Date(s.startedAt).getTime()), 0) /
        closed.length
      : null

  return (
    <section id="patchs" className={styles.section} aria-labelledby="patchs-title">
      <div className={styles.head}>
        <h2 id="patchs-title" className={styles.title}>
          Patchs nicotine 7 mg
        </h2>
        {sessions && sessions.length > 0 && (
          <p className={styles.summary}>
            {sessions.length} pose{sessions.length > 1 ? 's' : ''}
            {avg !== null && `, durée moyenne ${formatPatchDuration(avg)}`}
          </p>
        )}
      </div>

      {error && <p className={styles.error}>{error}</p>}
      {!sessions && !error && <p className={styles.empty}>Chargement…</p>}
      {sessions && sessions.length === 0 && (
        <p className={styles.empty}>Aucun patch enregistré. Active l’interrupteur sur le dashboard quand tu en poses un.</p>
      )}

      {sessions && sessions.length > 0 && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Posé</th>
                <th scope="col">Retiré</th>
                <th scope="col">Durée</th>
                <th scope="col">
                  <span className={styles.srOnly}>Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => {
                const end = s.endedAt ? new Date(s.endedAt).getTime() : now
                return (
                  <tr key={s.id}>
                    <td>{fmt(s.startedAt)}</td>
                    <td>{s.endedAt ? fmt(s.endedAt) : <span className={styles.live}>En cours</span>}</td>
                    <td className={styles.num}>{formatPatchDuration(end - new Date(s.startedAt).getTime())}</td>
                    <td className={styles.actions}>
                      <button className={styles.delete} onClick={() => remove(s)}>
                        Supprimer
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
