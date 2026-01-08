'use client'

import { useEffect, useState } from 'react'
import styles from './HealthWidget.module.css'

interface HealthData {
  steps: number
  activeMinutes: number
  calories: number
  sleepHours: number
  heartRate: number
}

interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
}

export default function HealthWidget() {
  const [healthData, setHealthData] = useState<HealthData | null>(null)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [fitConnected, setFitConnected] = useState(false)
  const [calendarConnected, setCalendarConnected] = useState(false)

  useEffect(() => {
    fetchHealthData()
    fetchCalendarEvents()
  }, [])

  const fetchHealthData = async () => {
    try {
      const response = await fetch('/api/google/fit')
      const data = await response.json()

      if (data.success && data.data) {
        // S'assurer que toutes les valeurs sont des nombres valides
        setHealthData({
          steps: Number(data.data.steps) || 0,
          activeMinutes: Number(data.data.activeMinutes) || 0,
          sleepHours: Number(data.data.sleepHours) || 0,
          heartRate: Number(data.data.heartRate) || 0,
          calories: Number(data.data.calories) || 0,
        })
        setFitConnected(true)
      } else {
        setFitConnected(false)
      }
    } catch (error) {
      console.error('Erreur récupération Google Fit:', error)
      setFitConnected(false)
    } finally {
      setLoading(false)
    }
  }

  const fetchCalendarEvents = async () => {
    try {
      const response = await fetch('/api/google/calendar')
      const data = await response.json()

      if (data.success) {
        setEvents(data.events || [])
        setCalendarConnected(true)
      } else {
        setCalendarConnected(false)
      }
    } catch (error) {
      console.error('Erreur récupération Calendar:', error)
      setCalendarConnected(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  if (!fitConnected && !calendarConnected) {
    return (
      <div className={styles.widget}>
        <div className={styles.header}>
          <h2>📊 Données Google</h2>
        </div>
        <div className={styles.notConnected}>
          <p>Connecte Google Fit et Calendar pour voir tes données ici</p>
          <a href="/integrations" className={styles.connectButton}>
            Configurer les intégrations
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.widget}>
      <div className={styles.header}>
        <h2>📊 Santé & Agenda</h2>
        <a href="/health" className={styles.detailsLink}>
          Voir détails →
        </a>
      </div>

      {/* Google Fit */}
      {fitConnected && healthData && (
        <div className={styles.healthSection}>
          <h3>😴 Données du jour</h3>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>🚶</div>
              <div className={styles.statValue}>{healthData.steps.toLocaleString()}</div>
              <div className={styles.statLabel}>pas</div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>⏱️</div>
              <div className={styles.statValue}>{healthData.activeMinutes}</div>
              <div className={styles.statLabel}>min actif</div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>😴</div>
              <div className={styles.statValue}>{healthData.sleepHours}h</div>
              <div className={styles.statLabel}>sommeil</div>
            </div>

            {healthData.heartRate > 0 && (
              <div className={styles.statCard}>
                <div className={styles.statIcon}>❤️</div>
                <div className={styles.statValue}>{healthData.heartRate}</div>
                <div className={styles.statLabel}>bpm</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Google Calendar */}
      {calendarConnected && events.length > 0 && (
        <div className={styles.calendarSection}>
          <h3>📅 Événements du jour</h3>
          <div className={styles.eventsList}>
            {events.slice(0, 3).map((event) => (
              <div key={event.id} className={styles.eventCard}>
                <div className={styles.eventTime}>{formatTime(event.start)}</div>
                <div className={styles.eventTitle}>{event.title}</div>
              </div>
            ))}
            {events.length > 3 && (
              <div className={styles.moreEvents}>
                +{events.length - 3} autres événements
              </div>
            )}
          </div>
        </div>
      )}

      {loading && (
        <div className={styles.loading}>
          <p>Chargement des données...</p>
        </div>
      )}
    </div>
  )
}
