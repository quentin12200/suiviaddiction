'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from './ActiveStrategies.module.css'

interface ActiveStrategy {
  id: string
  strategyId: string
  title: string
  description: string
  category: string
}

export default function ActiveStrategies() {
  const [strategies, setStrategies] = useState<ActiveStrategy[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadActiveStrategies()
  }, [])

  const loadActiveStrategies = async () => {
    try {
      const response = await fetch('/api/strategies/toggle')
      const data = await response.json()

      if (data.success && data.strategies) {
        setStrategies(data.strategies)
      }
    } catch (error) {
      console.error('Erreur chargement stratégies actives:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || strategies.length === 0) {
    return null
  }

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      morning: '🌅',
      afternoon: '☀️',
      evening: '🌙',
      stress: '⚡',
      emotional: '💭',
      social: '👥',
    }
    return icons[category] || '🎯'
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>🎯 Tes Stratégies Actives</h3>
        <Link href="/strategies" className={styles.manageLink}>
          Gérer
        </Link>
      </div>

      <div className={styles.strategiesList}>
        {strategies.map(strategy => (
          <div key={strategy.id} className={styles.strategyItem}>
            <div className={styles.icon}>{getCategoryIcon(strategy.category)}</div>
            <div className={styles.content}>
              <div className={styles.strategyTitle}>{strategy.title}</div>
              <div className={styles.strategyDesc}>{strategy.description}</div>
            </div>
          </div>
        ))}
      </div>

      <Link href="/strategies" className={styles.addButton}>
        + Ajouter une stratégie
      </Link>
    </div>
  )
}
