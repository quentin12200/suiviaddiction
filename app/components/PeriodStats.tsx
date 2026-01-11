'use client'

import { useEffect, useState } from 'react'
import styles from './PeriodStats.module.css'

interface PeriodData {
  totalDays: number
  smokingDays: number
  cleanDays: number
  cleanPercentage: number
  totalJoints: number
  avgJointsPerDay: number
  avgCraving: number
  constructiveAlternatives: number
  successfulIsolations: number
}

interface StatsData {
  periods: {
    lastWeek: PeriodData
    previousWeek: PeriodData
    lastMonth: PeriodData
    previousMonth: PeriodData
    last3Months: PeriodData
  }
  trends: {
    week: {
      cleanDays: number
      avgJointsPerDay: number
      avgCraving: number
    }
    month: {
      cleanDays: number
      avgJointsPerDay: number
      avgCraving: number
    }
  }
  streaks: {
    current: number
    best: number
  }
}

export default function PeriodStats() {
  const [data, setData] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | '3months'>('week')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const response = await fetch('/api/stats/periods')
      const result = await response.json()
      if (result.success) {
        setData(result.data)
      }
    } catch (error) {
      console.error('Erreur chargement stats périodes:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTrendIcon = (value: number) => {
    if (value > 5) return '📈'
    if (value < -5) return '📉'
    return '➡️'
  }

  const getTrendColor = (value: number, inverse = false) => {
    const isPositive = inverse ? value < 0 : value > 0
    if (Math.abs(value) < 5) return styles.neutral
    return isPositive ? styles.positive : styles.negative
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

  const currentPeriod = selectedPeriod === 'week'
    ? data.periods.lastWeek
    : selectedPeriod === 'month'
    ? data.periods.lastMonth
    : data.periods.last3Months

  const previousPeriod = selectedPeriod === 'week'
    ? data.periods.previousWeek
    : data.periods.previousMonth

  const currentTrend = selectedPeriod === 'week' ? data.trends.week : data.trends.month

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>📊 Statistiques & Tendances</h2>

        <div className={styles.periodSelector}>
          <button
            className={`${styles.periodButton} ${selectedPeriod === 'week' ? styles.active : ''}`}
            onClick={() => setSelectedPeriod('week')}
          >
            7 jours
          </button>
          <button
            className={`${styles.periodButton} ${selectedPeriod === 'month' ? styles.active : ''}`}
            onClick={() => setSelectedPeriod('month')}
          >
            30 jours
          </button>
          <button
            className={`${styles.periodButton} ${selectedPeriod === '3months' ? styles.active : ''}`}
            onClick={() => setSelectedPeriod('3months')}
          >
            3 mois
          </button>
        </div>
      </div>

      {/* Streaks */}
      <div className={styles.streaksCard}>
        <div className={styles.streak}>
          <div className={styles.streakIcon}>🔥</div>
          <div className={styles.streakContent}>
            <div className={styles.streakValue}>{data.streaks.current}</div>
            <div className={styles.streakLabel}>Jours actuels sans fumer</div>
          </div>
        </div>
        <div className={styles.streak}>
          <div className={styles.streakIcon}>🏆</div>
          <div className={styles.streakContent}>
            <div className={styles.streakValue}>{data.streaks.best}</div>
            <div className={styles.streakLabel}>Meilleur record</div>
          </div>
        </div>
      </div>

      {/* Stats principales */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Jours propres</span>
            {selectedPeriod !== '3months' && (
              <span className={getTrendColor(currentTrend.cleanDays)}>
                {getTrendIcon(currentTrend.cleanDays)}
                {Math.abs(Math.round(currentTrend.cleanDays))}%
              </span>
            )}
          </div>
          <div className={styles.statValue}>
            {currentPeriod.cleanDays} / {currentPeriod.totalDays}
          </div>
          <div className={styles.statSubtext}>
            {Math.round(currentPeriod.cleanPercentage)}% de réussite
          </div>
          {selectedPeriod !== '3months' && (
            <div className={styles.comparison}>
              vs {previousPeriod.cleanDays} période précédente
            </div>
          )}
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Joints / jour</span>
            {selectedPeriod !== '3months' && (
              <span className={getTrendColor(currentTrend.avgJointsPerDay, true)}>
                {getTrendIcon(-currentTrend.avgJointsPerDay)}
                {Math.abs(Math.round(currentTrend.avgJointsPerDay))}%
              </span>
            )}
          </div>
          <div className={styles.statValue}>
            {currentPeriod.avgJointsPerDay.toFixed(1)}
          </div>
          <div className={styles.statSubtext}>
            {currentPeriod.totalJoints} joints au total
          </div>
          {selectedPeriod !== '3months' && (
            <div className={styles.comparison}>
              vs {previousPeriod.avgJointsPerDay.toFixed(1)} période précédente
            </div>
          )}
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Envie moyenne</span>
            {selectedPeriod !== '3months' && (
              <span className={getTrendColor(currentTrend.avgCraving, true)}>
                {getTrendIcon(-currentTrend.avgCraving)}
                {Math.abs(Math.round(currentTrend.avgCraving))}%
              </span>
            )}
          </div>
          <div className={styles.statValue}>
            {currentPeriod.avgCraving} / 10
          </div>
          <div className={styles.statSubtext}>
            Niveau de craving
          </div>
          {selectedPeriod !== '3months' && (
            <div className={styles.comparison}>
              vs {previousPeriod.avgCraving} période précédente
            </div>
          )}
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Alternatives</span>
          </div>
          <div className={styles.statValue}>
            {currentPeriod.constructiveAlternatives}
          </div>
          <div className={styles.statSubtext}>
            Actions constructives réussies
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Isolements</span>
          </div>
          <div className={styles.statValue}>
            {currentPeriod.successfulIsolations}
          </div>
          <div className={styles.statSubtext}>
            Moments de ressourcement
          </div>
        </div>
      </div>

      {/* Interprétation */}
      {selectedPeriod !== '3months' && (
        <div className={styles.interpretation}>
          <h3>💡 Analyse</h3>
          {currentTrend.cleanDays > 10 && (
            <p className={styles.positiveNote}>
              ✅ Excellente progression ! Tu as augmenté tes jours propres de {Math.round(currentTrend.cleanDays)}%
            </p>
          )}
          {currentTrend.avgJointsPerDay < -10 && (
            <p className={styles.positiveNote}>
              ✅ Consommation en baisse de {Math.abs(Math.round(currentTrend.avgJointsPerDay))}% !
            </p>
          )}
          {currentTrend.avgCraving < -10 && (
            <p className={styles.positiveNote}>
              ✅ Tes envies diminuent ({Math.abs(Math.round(currentTrend.avgCraving))}% de moins)
            </p>
          )}
          {currentTrend.cleanDays < -10 && (
            <p className={styles.warningNote}>
              ⚠️ Attention : recul de {Math.abs(Math.round(currentTrend.cleanDays))}% sur les jours propres
            </p>
          )}
          {currentTrend.avgJointsPerDay > 10 && (
            <p className={styles.warningNote}>
              ⚠️ Consommation en hausse de {Math.round(currentTrend.avgJointsPerDay)}%
            </p>
          )}
          {Math.abs(currentTrend.cleanDays) < 5 && Math.abs(currentTrend.avgJointsPerDay) < 5 && (
            <p className={styles.neutralNote}>
              ➡️ Situation stable par rapport à la période précédente
            </p>
          )}
        </div>
      )}
    </div>
  )
}
