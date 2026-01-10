'use client'

import { useEffect, useState } from 'react'
import styles from './HealthWidget.module.css'

interface HealthData {
  steps: number
  activeMinutes: number
  calories: number
  sleepHours: number
  heartRate: number
  distanceKm: string
  lastUpdate: string
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
  const [refreshing, setRefreshing] = useState(false)
  const [fitConnected, setFitConnected] = useState(false)
  const [calendarConnected, setCalendarConnected] = useState(false)

  useEffect(() => {
    fetchHealthData()
    fetchCalendarEvents()

    // Auto-refresh toutes les 5 minutes (300000ms)
    const interval = setInterval(() => {
      fetchHealthData()
      fetchCalendarEvents()
    }, 300000)

    return () => clearInterval(interval)
  }, [])

  const fetchHealthData = async () => {
    try {
      // Cache-busting fort : timestamp + random
      const cacheBuster = `t=${Date.now()}&r=${Math.random()}`
      const response = await fetch(`/api/google/fit?${cacheBuster}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        }
      })
      const data = await response.json()

      if (data.success && data.data) {
        // S'assurer que toutes les valeurs sont des nombres valides
        setHealthData({
          steps: Number(data.data.steps) || 0,
          activeMinutes: Number(data.data.activeMinutes) || 0,
          sleepHours: Number(data.data.sleepHours) || 0,
          heartRate: Number(data.data.heartRate) || 0,
          calories: Number(data.data.calories) || 0,
          distanceKm: data.data.distanceKm || '0.00',
          lastUpdate: data.data.lastUpdate || new Date().toISOString(),
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

  const handleManualRefresh = async () => {
    setRefreshing(true)
    await Promise.all([fetchHealthData(), fetchCalendarEvents()])
    setRefreshing(false)
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ margin: 0 }}>📊 Dernières 24h (temps réel)</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '12px', color: '#666' }}>
                Mis à jour: {new Date(healthData.lastUpdate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <button
                onClick={handleManualRefresh}
                disabled={refreshing}
                style={{
                  padding: '6px 12px',
                  background: refreshing ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: refreshing ? 'not-allowed' : 'pointer',
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={(e) => !refreshing && (e.currentTarget.style.transform = 'translateY(-1px)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                {refreshing ? '🔄 Actualisation...' : '🔄 Actualiser'}
              </button>
            </div>
          </div>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>🚶</div>
              <div className={styles.statValue}>{healthData.steps.toLocaleString()}</div>
              <div className={styles.statLabel}>pas</div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>📏</div>
              <div className={styles.statValue}>{healthData.distanceKm}</div>
              <div className={styles.statLabel}>km</div>
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

            <div className={styles.statCard}>
              <div className={styles.statIcon}>🔥</div>
              <div className={styles.statValue}>{healthData.calories}</div>
              <div className={styles.statLabel}>calories</div>
            </div>
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
