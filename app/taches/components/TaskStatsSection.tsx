'use client'

import { TaskStats } from '../../data/taskTypes'
import styles from '../taches.module.css'

interface TaskStatsSectionProps {
  stats: TaskStats
}

export function TaskStatsSection({ stats }: TaskStatsSectionProps) {
  return (
    <div className={styles.statsGrid}>
      <div className={styles.statCard}>
        <div className={styles.statNumber}>{stats.pending}</div>
        <div className={styles.statLabel}>À faire</div>
      </div>
      <div className={styles.statCard}>
        <div className={styles.statNumber}>{stats.completed}</div>
        <div className={styles.statLabel}>Complétées</div>
      </div>
      {stats.needsAttention > 0 && (
        <div className={`${styles.statCard} ${styles.alert}`}>
          <div className={styles.statNumber}>⚠️ {stats.needsAttention}</div>
          <div className={styles.statLabel}>Nécessitent attention</div>
        </div>
      )}
    </div>
  )
}
