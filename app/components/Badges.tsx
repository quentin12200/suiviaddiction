'use client'

import { useEffect, useState } from 'react'
import styles from './Badges.module.css'

interface Badge {
  id: string
  icon: string
  title: string
  description: string
  category: 'sobriety' | 'discipline' | 'growth' | 'milestone'
  unlocked: boolean
  progress: number
  target: number
}

interface BadgesData {
  badges: Badge[]
  summary: {
    unlocked: number
    total: number
    percentage: number
  }
  stats: {
    currentStreak: number
    bestStreak: number
    totalCleanDays: number
    totalConstructiveAlternatives: number
    totalSuccessfulIsolations: number
    totalDaysLogged: number
  }
}

export default function Badges() {
  const [data, setData] = useState<BadgesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    fetchBadges()
  }, [])

  const fetchBadges = async () => {
    try {
      const response = await fetch('/api/badges')
      const result = await response.json()
      if (result.success) {
        setData(result.data)
        // Debug: afficher les stats dans la console navigateur
        console.log('📊 Stats badges:', result.data.stats)
      }
    } catch (error) {
      console.error('Erreur chargement badges:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <p>Chargement...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className={styles.container}>
        <p>Aucune donnée disponible</p>
      </div>
    )
  }

  const categories = [
    { key: 'all', label: 'Tous', icon: '🏆' },
    { key: 'sobriety', label: 'Sobriété', icon: '🌿' },
    { key: 'growth', label: 'Croissance', icon: '📈' },
    { key: 'discipline', label: 'Discipline', icon: '💪' },
    { key: 'milestone', label: 'Étapes', icon: '🎯' },
  ]

  const filteredBadges =
    selectedCategory === 'all'
      ? data.badges
      : data.badges.filter(b => b.category === selectedCategory)

  const unlockedBadges = filteredBadges.filter(b => b.unlocked)
  const lockedBadges = filteredBadges.filter(b => !b.unlocked)

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>🏆 Badges & Récompenses</h2>
        <div className={styles.summary}>
          <span className={styles.summaryText}>
            {data.summary.unlocked} / {data.summary.total} débloqués
          </span>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${data.summary.percentage}%` }}
            />
          </div>
          <span className={styles.percentage}>{data.summary.percentage}%</span>
        </div>
      </div>

      {/* Filtres */}
      <div className={styles.filters}>
        {categories.map(cat => (
          <button
            key={cat.key}
            className={`${styles.filterButton} ${
              selectedCategory === cat.key ? styles.active : ''
            }`}
            onClick={() => setSelectedCategory(cat.key)}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Badges débloqués */}
      {unlockedBadges.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            ✨ Débloqu\u00e9s ({unlockedBadges.length})
          </h3>
          <div className={styles.badgesGrid}>
            {unlockedBadges.map(badge => (
              <div key={badge.id} className={`${styles.badge} ${styles.unlocked}`}>
                <div className={styles.badgeIcon}>{badge.icon}</div>
                <h4 className={styles.badgeTitle}>{badge.title}</h4>
                <p className={styles.badgeDescription}>{badge.description}</p>
                <div className={styles.badgeStatus}>
                  <span className={styles.checkmark}>✓</span> Débloqué
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Badges verrouillés */}
      {lockedBadges.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            🔒 À débloquer ({lockedBadges.length})
          </h3>
          <div className={styles.badgesGrid}>
            {lockedBadges.map(badge => (
              <div key={badge.id} className={`${styles.badge} ${styles.locked}`}>
                <div className={styles.badgeIconLocked}>{badge.icon}</div>
                <h4 className={styles.badgeTitle}>{badge.title}</h4>
                <p className={styles.badgeDescription}>{badge.description}</p>
                <div className={styles.badgeProgress}>
                  <div className={styles.progressLabel}>
                    {badge.progress} / {badge.target}
                  </div>
                  <div className={styles.progressBarSmall}>
                    <div
                      className={styles.progressFillSmall}
                      style={{
                        width: `${(badge.progress / badge.target) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats clés */}
      <div className={styles.statsSection}>
        <h3 className={styles.sectionTitle}>📊 Tes Statistiques</h3>
        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <div className={styles.statIcon}>🔥</div>
            <div className={styles.statValue}>{data.stats.currentStreak}</div>
            <div className={styles.statLabel}>Streak actuel</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statIcon}>🏆</div>
            <div className={styles.statValue}>{data.stats.bestStreak}</div>
            <div className={styles.statLabel}>Meilleur streak</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statIcon}>✅</div>
            <div className={styles.statValue}>{data.stats.totalCleanDays}</div>
            <div className={styles.statLabel}>Jours propres (total)</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statIcon}>🚀</div>
            <div className={styles.statValue}>
              {data.stats.totalConstructiveAlternatives}
            </div>
            <div className={styles.statLabel}>Alternatives réussies</div>
          </div>
        </div>
      </div>
    </div>
  )
}
