'use client'

import { FilterType } from '../hooks/useTaskFilters'
import styles from '../taches.module.css'

interface TaskFiltersProps {
  filter: FilterType
  setFilter: (filter: FilterType) => void
}

export function TaskFilters({ filter, setFilter }: TaskFiltersProps) {
  return (
    <div className={styles.filters}>
      <button
        className={filter === 'today' ? styles.filterActive : styles.filterButton}
        onClick={() => setFilter('today')}
      >
        🌅 Aujourd'hui
      </button>
      <button
        className={filter === 'pending' ? styles.filterActive : styles.filterButton}
        onClick={() => setFilter('pending')}
      >
        📌 En attente
      </button>
      <button
        className={filter === 'completed' ? styles.filterActive : styles.filterButton}
        onClick={() => setFilter('completed')}
      >
        ✅ Complétées
      </button>
      <button
        className={filter === 'all' ? styles.filterActive : styles.filterButton}
        onClick={() => setFilter('all')}
      >
        📚 Toutes
      </button>
    </div>
  )
}
