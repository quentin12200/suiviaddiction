'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navigation from '../components/Navigation'
import styles from './history.module.css'

interface Entry {
  id: string
  date: string
  time: string
  hasSmoked: boolean
  jointCount: number
  jointTime: string | null
  minutesSinceLastJoint: number | null
  cravingLevel: number
  emotionalState: string
  physicalState: string
  context: string
  trigger: string
  alternativeAction: string
  consciousDecision: boolean
  comment: string
}

export default function HistoryPage() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [filteredEntries, setFilteredEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    hasSmoked: 'all',
    dateFrom: '',
    dateTo: '',
    minCraving: '',
    maxCraving: '',
  })

  useEffect(() => {
    fetchEntries()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [entries, filters])

  const fetchEntries = async () => {
    try {
      const response = await fetch('/api/entries?limit=1000')
      const data = await response.json()
      setEntries(data.entries || [])
    } catch (error) {
      console.error('Erreur chargement historique:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...entries]

    // Filtre hasSmoked
    if (filters.hasSmoked === 'yes') {
      filtered = filtered.filter((e) => e.hasSmoked)
    } else if (filters.hasSmoked === 'no') {
      filtered = filtered.filter((e) => !e.hasSmoked)
    }

    // Filtre dateFrom
    if (filters.dateFrom) {
      filtered = filtered.filter(
        (e) => new Date(e.date) >= new Date(filters.dateFrom)
      )
    }

    // Filtre date To
    if (filters.dateTo) {
      filtered = filtered.filter(
        (e) => new Date(e.date) <= new Date(filters.dateTo)
      )
    }

    // Filtre craving min
    if (filters.minCraving) {
      filtered = filtered.filter(
        (e) => e.cravingLevel >= parseInt(filters.minCraving)
      )
    }

    // Filtre craving max
    if (filters.maxCraving) {
      filtered = filtered.filter(
        (e) => e.cravingLevel <= parseInt(filters.maxCraving)
      )
    }

    setFilteredEntries(filtered)
  }

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  const resetFilters = () => {
    setFilters({
      hasSmoked: 'all',
      dateFrom: '',
      dateTo: '',
      minCraving: '',
      maxCraving: '',
    })
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR')
  }

  if (loading) {
    return (
      <div>
        <Navigation />
        <div className={styles.container}>
          <p>Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Navigation />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Historique des entrées</h1>
          <a
            href="/api/export-csv"
            download
            className={styles.exportButton}
          >
            📥 Télécharger CSV
          </a>
        </div>

        {/* Filtres */}
        <div className={styles.filters}>
          <h2>Filtres</h2>
          <div className={styles.filterGrid}>
            <div className={styles.filterGroup}>
              <label>Consommation</label>
              <select
                name="hasSmoked"
                value={filters.hasSmoked}
                onChange={handleFilterChange}
                className={styles.select}
              >
                <option value="all">Toutes</option>
                <option value="yes">Avec consommation</option>
                <option value="no">Sans consommation</option>
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label>Date début</label>
              <input
                type="date"
                name="dateFrom"
                value={filters.dateFrom}
                onChange={handleFilterChange}
                className={styles.input}
              />
            </div>

            <div className={styles.filterGroup}>
              <label>Date fin</label>
              <input
                type="date"
                name="dateTo"
                value={filters.dateTo}
                onChange={handleFilterChange}
                className={styles.input}
              />
            </div>

            <div className={styles.filterGroup}>
              <label>Envie min</label>
              <input
                type="number"
                name="minCraving"
                value={filters.minCraving}
                onChange={handleFilterChange}
                className={styles.input}
                min="0"
                max="10"
                placeholder="0-10"
              />
            </div>

            <div className={styles.filterGroup}>
              <label>Envie max</label>
              <input
                type="number"
                name="maxCraving"
                value={filters.maxCraving}
                onChange={handleFilterChange}
                className={styles.input}
                min="0"
                max="10"
                placeholder="0-10"
              />
            </div>

            <div className={styles.filterGroup}>
              <button onClick={resetFilters} className={styles.resetButton}>
                Réinitialiser
              </button>
            </div>
          </div>

          <p className={styles.resultCount}>
            {filteredEntries.length} résultat(s)
          </p>
        </div>

        {/* Tableau des entrées */}
        <div className={styles.tableContainer}>
          {filteredEntries.length === 0 ? (
            <p className={styles.noData}>Aucune entrée trouvée</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Heure</th>
                  <th>Fumé</th>
                  <th>Joints</th>
                  <th>Envie</th>
                  <th>État émotionnel</th>
                  <th>Contexte</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td>{formatDate(entry.date)}</td>
                    <td>{entry.time}</td>
                    <td>
                      <span
                        className={
                          entry.hasSmoked ? styles.badgeYes : styles.badgeNo
                        }
                      >
                        {entry.hasSmoked ? 'Oui' : 'Non'}
                      </span>
                    </td>
                    <td>{entry.hasSmoked ? entry.jointCount : '-'}</td>
                    <td>
                      <span className={styles.cravingBadge}>
                        {entry.cravingLevel}/10
                      </span>
                    </td>
                    <td>{entry.emotionalState || '-'}</td>
                    <td>{entry.context || '-'}</td>
                    <td>
                      <Link
                        href={`/entry/${entry.id}`}
                        className={styles.viewButton}
                      >
                        Voir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
