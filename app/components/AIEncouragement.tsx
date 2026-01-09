'use client'

import { useState, useEffect } from 'react'
import styles from './AIEncouragement.module.css'

export default function AIEncouragement() {
  const [encouragement, setEncouragement] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    loadEncouragement()
  }, [])

  const loadEncouragement = async () => {
    try {
      setLoading(true)
      // Ajouter un timestamp pour éviter le cache du navigateur
      const response = await fetch(`/api/ai-encouragement?t=${Date.now()}`)
      const data = await response.json()

      if (data.success) {
        setEncouragement(data.encouragement)
      } else {
        setError(true)
      }
    } catch (err) {
      console.error('Erreur chargement encouragement:', err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    loadEncouragement()
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.icon}>🤖</span>
          <h3 className={styles.title}>Coach IA</h3>
        </div>
        <div className={styles.loading}>Génération d'un message personnalisé...</div>
      </div>
    )
  }

  if (error || !encouragement) {
    return null
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <span className={styles.icon}>🤖</span>
          <h3 className={styles.title}>Message de motivation</h3>
        </div>
        <button onClick={handleRefresh} className={styles.refreshBtn} title="Nouveau message">
          🔄
        </button>
      </div>
      <p className={styles.message}>{encouragement}</p>
    </div>
  )
}
