'use client'

import { useEffect, useState } from 'react'
import styles from './AlertMonitor.module.css'

interface Alert {
  type: 'high' | 'medium' | 'low'
  title: string
  message: string
  suggestion: string
  timestamp: string
}

export default function AlertMonitor() {
  const [alert, setAlert] = useState<Alert | null>(null)
  const [showAlert, setShowAlert] = useState(false)
  const [patterns, setPatterns] = useState<any>(null)

  useEffect(() => {
    // Vérifier les alertes au chargement
    checkForAlerts()

    // Vérifier périodiquement (toutes les 30 minutes)
    const interval = setInterval(() => {
      checkForAlerts()
    }, 30 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  const checkForAlerts = async () => {
    try {
      const response = await fetch('/api/alerts/check')
      const data = await response.json()

      if (data.success && data.hasAlert) {
        setAlert(data.alert)
        setShowAlert(true)

        // Envoyer notification push si supporté et autorisé
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(data.alert.title, {
            body: `${data.alert.message}\n\n💡 ${data.alert.suggestion}`,
            icon: '/icon-192.png',
            tag: 'risk-alert',
            requireInteraction: true,
          })
        }
      }

      if (data.patterns) {
        setPatterns(data.patterns)
      }
    } catch (error) {
      console.error('Erreur vérification alertes:', error)
    }
  }

  const dismissAlert = () => {
    setShowAlert(false)
    // Garder l'alerte en mémoire mais la masquer
  }

  if (!showAlert || !alert) {
    // Afficher un badge subtil avec le nombre de jours propres
    if (patterns?.consecutiveCleanDays > 0) {
      return (
        <div className={styles.cleanDaysBadge}>
          🌟 {patterns.consecutiveCleanDays} jour{patterns.consecutiveCleanDays > 1 ? 's' : ''} clean
        </div>
      )
    }
    return null
  }

  const alertColorClass =
    alert.type === 'high'
      ? styles.alertHigh
      : alert.type === 'medium'
      ? styles.alertMedium
      : styles.alertLow

  return (
    <div className={`${styles.alertCard} ${alertColorClass}`}>
      <div className={styles.alertHeader}>
        <h3>{alert.title}</h3>
        <button onClick={dismissAlert} className={styles.closeBtn}>
          ✕
        </button>
      </div>

      <p className={styles.alertMessage}>{alert.message}</p>

      <div className={styles.suggestionBox}>
        <strong>💡 Suggestion :</strong>
        <p>{alert.suggestion}</p>
      </div>

      <div className={styles.alertActions}>
        <a href="/coach" className={styles.actionBtn}>
          Parler au coach
        </a>
        <a href="/strategies" className={styles.actionBtn}>
          Voir stratégies
        </a>
        <button onClick={dismissAlert} className={styles.dismissBtn}>
          J&apos;ai compris
        </button>
      </div>
    </div>
  )
}
