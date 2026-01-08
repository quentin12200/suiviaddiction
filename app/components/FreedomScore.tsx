'use client'

import { useState, useEffect } from 'react'
import styles from './FreedomScore.module.css'

interface FreedomScoreData {
  totalPoints: number
  level: number
  levelName: string
  breakdown: {
    cleanDays: number
    consciousChoices: number
    alternatives: number
    expression: number
    cravingControl: number
  }
  achievements: Array<{
    id: string
    name: string
    description: string
    icon: string
    unlocked: boolean
  }>
  nextMilestone: {
    name: string
    pointsNeeded: number
  }
}

export default function FreedomScore() {
  const [data, setData] = useState<FreedomScoreData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    loadScore()
  }, [])

  const loadScore = async () => {
    try {
      const response = await fetch('/api/freedom-score')
      const result = await response.json()
      if (result.success) {
        setData(result)
      }
    } catch (error) {
      console.error('Erreur chargement score:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Calcul de vos Points de Liberté...</div>
      </div>
    )
  }

  if (!data) return null

  const progressToNext = data.totalPoints % 100
  const progressPercent = (progressToNext / 100) * 100

  const unlockedAchievements = data.achievements.filter(a => a.unlocked)

  return (
    <div className={styles.container}>
      {/* En-tête principal */}
      <div className={styles.header}>
        <div className={styles.mainScore}>
          <div className={styles.icon}>🗝️</div>
          <div className={styles.scoreInfo}>
            <div className={styles.pointsLabel}>Points de Liberté</div>
            <div className={styles.pointsValue}>{data.totalPoints}</div>
          </div>
        </div>

        <div className={styles.levelInfo}>
          <div className={styles.levelBadge}>
            <span className={styles.levelNumber}>Niveau {data.level}</span>
            <span className={styles.levelName}>{data.levelName}</span>
          </div>
        </div>
      </div>

      {/* Barre de progression vers le prochain niveau */}
      {data.nextMilestone.pointsNeeded > 0 && (
        <div className={styles.progressSection}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className={styles.progressLabel}>
            {data.nextMilestone.pointsNeeded} pts pour {data.nextMilestone.name}
          </div>
        </div>
      )}

      {/* Achievements débloqués */}
      {unlockedAchievements.length > 0 && (
        <div className={styles.achievementsPreview}>
          <div className={styles.achievementsTitle}>
            🏆 {unlockedAchievements.length} Victoires Débloquées
          </div>
          <div className={styles.achievementsList}>
            {unlockedAchievements.slice(0, 3).map(achievement => (
              <div key={achievement.id} className={styles.achievementBadge} title={achievement.description}>
                <span className={styles.achievementIcon}>{achievement.icon}</span>
                <span className={styles.achievementName}>{achievement.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bouton pour voir les détails */}
      <button
        className={styles.detailsButton}
        onClick={() => setShowDetails(!showDetails)}
      >
        {showDetails ? 'Masquer les détails' : 'Voir les détails'}
      </button>

      {/* Détails du score */}
      {showDetails && (
        <div className={styles.breakdown}>
          <h4>Répartition des Points</h4>
          <div className={styles.breakdownGrid}>
            <div className={styles.breakdownItem}>
              <span className={styles.breakdownIcon}>☀️</span>
              <span className={styles.breakdownLabel}>Jours Libres</span>
              <span className={styles.breakdownValue}>{data.breakdown.cleanDays}</span>
            </div>
            <div className={styles.breakdownItem}>
              <span className={styles.breakdownIcon}>🧠</span>
              <span className={styles.breakdownLabel}>Choix Conscients</span>
              <span className={styles.breakdownValue}>{data.breakdown.consciousChoices}</span>
            </div>
            <div className={styles.breakdownItem}>
              <span className={styles.breakdownIcon}>🎯</span>
              <span className={styles.breakdownLabel}>Alternatives</span>
              <span className={styles.breakdownValue}>{data.breakdown.alternatives}</span>
            </div>
            <div className={styles.breakdownItem}>
              <span className={styles.breakdownIcon}>✍️</span>
              <span className={styles.breakdownLabel}>Expression</span>
              <span className={styles.breakdownValue}>{data.breakdown.expression}</span>
            </div>
            <div className={styles.breakdownItem}>
              <span className={styles.breakdownIcon}>⚡</span>
              <span className={styles.breakdownLabel}>Envies Maîtrisées</span>
              <span className={styles.breakdownValue}>{data.breakdown.cravingControl}</span>
            </div>
          </div>

          {/* Tous les achievements */}
          <h4>Toutes les Victoires</h4>
          <div className={styles.allAchievements}>
            {data.achievements.map(achievement => (
              <div
                key={achievement.id}
                className={`${styles.achievementCard} ${!achievement.unlocked ? styles.locked : ''}`}
              >
                <div className={styles.achievementCardIcon}>
                  {achievement.unlocked ? achievement.icon : '🔒'}
                </div>
                <div className={styles.achievementCardInfo}>
                  <div className={styles.achievementCardName}>{achievement.name}</div>
                  <div className={styles.achievementCardDesc}>{achievement.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
