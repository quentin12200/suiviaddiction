'use client'

import { useState, useEffect } from 'react'
import Navigation from '../components/Navigation'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import styles from './health.module.css'

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

interface HistoricalData {
  date: string
  steps: number
  activeMinutes: number
  sleepHours: number
  heartRate: number
  calories: number
}

export default function HealthPage() {
  const [healthData, setHealthData] = useState<HealthData | null>(null)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7' | '30'>('7')
  const [connected, setConnected] = useState({
    fit: false,
    calendar: false,
  })

  useEffect(() => {
    checkStatus()
    fetchHealthData()
    fetchCalendarEvents()
    fetchHistoricalData()
  }, [])

  useEffect(() => {
    fetchHistoricalData()
  }, [timeRange])

  const checkStatus = async () => {
    try {
      const response = await fetch('/api/integrations/status')
      const data = await response.json()
      if (data.success) {
        setConnected({
          fit: data.fit || false,
          calendar: data.calendar || false,
        })
      }
    } catch (error) {
      console.error('Erreur vérification status:', error)
    }
  }

  const fetchHealthData = async () => {
    try {
      // Ajouter timestamp pour éviter le cache du navigateur
      const response = await fetch(`/api/google/fit?t=${Date.now()}`)
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
      }
    } catch (error) {
      console.error('Erreur récupération données santé:', error)
    }
  }

  const fetchCalendarEvents = async () => {
    try {
      // Ajouter timestamp pour éviter le cache du navigateur
      const response = await fetch(`/api/google/calendar?t=${Date.now()}`)
      const data = await response.json()
      if (data.success) {
        setEvents(data.events)
      }
    } catch (error) {
      console.error('Erreur récupération agenda:', error)
    }
  }

  const fetchHistoricalData = async () => {
    try {
      setLoading(true)
      // Pour l'instant, générer des données factices
      // TODO: Créer un endpoint API pour récupérer les données historiques
      const days = parseInt(timeRange)
      const mockData: HistoricalData[] = []

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        mockData.push({
          date: date.toISOString().split('T')[0],
          steps: Math.floor(Math.random() * 5000) + 5000,
          activeMinutes: Math.floor(Math.random() * 40) + 20,
          sleepHours: Math.random() * 2 + 6,
          heartRate: Math.floor(Math.random() * 20) + 60,
          calories: Math.floor(Math.random() * 1000) + 1500,
        })
      }

      setHistoricalData(mockData)
    } catch (error) {
      console.error('Erreur récupération historique:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getDate()}/${date.getMonth() + 1}`
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (!connected.fit && !connected.calendar) {
    return (
      <div>
        <Navigation />
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>🏃 Santé & Bien-être</h1>
            <p className={styles.subtitle}>
              Suivi de tes données de santé et corrélations avec tes comportements
            </p>
          </div>

          <div className={styles.notConnected}>
            <div className={styles.notConnectedIcon}>🔌</div>
            <h2>Aucun service connecté</h2>
            <p>
              Connecte Google Fit et Google Agenda pour accéder à ton suivi de santé
              détaillé et voir les corrélations avec tes comportements addictifs.
            </p>
            <a href="/integrations" className={styles.connectButton}>
              Connecter mes services Google
            </a>
          </div>
        </div>
      </div>
    )
  }

  const chartData = historicalData.map((d) => ({
    date: formatDate(d.date),
    steps: d.steps,
    activeMinutes: d.activeMinutes,
    sleepHours: d.sleepHours.toFixed(1),
    heartRate: d.heartRate,
    calories: d.calories,
  }))

  const calculateAverages = () => {
    if (historicalData.length === 0) return null

    const totals = historicalData.reduce(
      (acc, d) => ({
        steps: acc.steps + d.steps,
        activeMinutes: acc.activeMinutes + d.activeMinutes,
        sleepHours: acc.sleepHours + d.sleepHours,
        heartRate: acc.heartRate + d.heartRate,
        calories: acc.calories + d.calories,
      }),
      { steps: 0, activeMinutes: 0, sleepHours: 0, heartRate: 0, calories: 0 }
    )

    const count = historicalData.length
    return {
      steps: Math.round(totals.steps / count),
      activeMinutes: Math.round(totals.activeMinutes / count),
      sleepHours: (totals.sleepHours / count).toFixed(1),
      heartRate: Math.round(totals.heartRate / count),
      calories: Math.round(totals.calories / count),
    }
  }

  const averages = calculateAverages()

  return (
    <div>
      <Navigation />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>🏃 Santé & Bien-être</h1>
          <p className={styles.subtitle}>
            Suivi de tes données de santé et corrélations avec tes comportements
          </p>
        </div>

        {/* Résumé aujourd'hui */}
        {connected.fit && healthData && (
          <div className={styles.todaySection}>
            <div className={styles.todayHeader}>
              <h2>Aujourd&apos;hui</h2>
              <button
                onClick={fetchHealthData}
                className={styles.refreshButton}
                title="Actualiser les données"
              >
                🔄 Rafraîchir
              </button>
            </div>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>🚶</div>
                <div className={styles.statValue}>
                  {healthData.steps.toLocaleString()}
                </div>
                <div className={styles.statLabel}>pas</div>
                <div className={styles.statGoal}>Objectif: 10 000</div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>⏱️</div>
                <div className={styles.statValue}>{healthData.activeMinutes}</div>
                <div className={styles.statLabel}>minutes actives</div>
                <div className={styles.statGoal}>Objectif: 60 min</div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>😴</div>
                <div className={styles.statValue}>
                  {healthData.sleepHours.toFixed(1)}h
                </div>
                <div className={styles.statLabel}>sommeil</div>
                <div className={styles.statGoal}>Objectif: 8h</div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>❤️</div>
                <div className={styles.statValue}>{healthData.heartRate}</div>
                <div className={styles.statLabel}>bpm moyen</div>
                <div className={styles.statGoal}>Repos: 60-100</div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>🔥</div>
                <div className={styles.statValue}>
                  {healthData.calories.toLocaleString()}
                </div>
                <div className={styles.statLabel}>calories</div>
                <div className={styles.statGoal}>Brûlées aujourd&apos;hui</div>
              </div>
            </div>
          </div>
        )}

        {/* Période de temps */}
        <div className={styles.timeRangeSelector}>
          <button
            className={timeRange === '7' ? styles.activeRange : ''}
            onClick={() => setTimeRange('7')}
          >
            7 jours
          </button>
          <button
            className={timeRange === '30' ? styles.activeRange : ''}
            onClick={() => setTimeRange('30')}
          >
            30 jours
          </button>
        </div>

        {/* Moyennes sur la période */}
        {averages && (
          <div className={styles.averagesSection}>
            <h2>Moyennes sur {timeRange} jours</h2>
            <div className={styles.averagesGrid}>
              <div className={styles.averageCard}>
                <span className={styles.averageLabel}>Pas quotidiens</span>
                <span className={styles.averageValue}>
                  {averages.steps.toLocaleString()}
                </span>
              </div>
              <div className={styles.averageCard}>
                <span className={styles.averageLabel}>Minutes actives</span>
                <span className={styles.averageValue}>
                  {averages.activeMinutes} min
                </span>
              </div>
              <div className={styles.averageCard}>
                <span className={styles.averageLabel}>Heures de sommeil</span>
                <span className={styles.averageValue}>{averages.sleepHours}h</span>
              </div>
              <div className={styles.averageCard}>
                <span className={styles.averageLabel}>Fréquence cardiaque</span>
                <span className={styles.averageValue}>{averages.heartRate} bpm</span>
              </div>
            </div>
          </div>
        )}

        {/* Graphiques détaillés */}
        {!loading && historicalData.length > 0 && (
          <>
            {/* Activité physique */}
            <div className={styles.chartSection}>
              <h2>📊 Activité physique</h2>
              <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="stepsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#667eea" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#667eea" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="steps"
                      stroke="#667eea"
                      fill="url(#stepsGradient)"
                      name="Pas"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Minutes actives */}
            <div className={styles.chartSection}>
              <h2>⏱️ Minutes actives</h2>
              <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="activeMinutes" fill="#4caf50" name="Minutes" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sommeil */}
            <div className={styles.chartSection}>
              <h2>😴 Qualité du sommeil</h2>
              <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 12]} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="sleepHours"
                      stroke="#764ba2"
                      strokeWidth={3}
                      name="Heures de sommeil"
                      dot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className={styles.sleepInsights}>
                <p>
                  💡 <strong>Conseil:</strong> Un sommeil de qualité (7-9h) améliore
                  ta capacité à résister aux addictions.
                </p>
              </div>
            </div>

            {/* Fréquence cardiaque */}
            <div className={styles.chartSection}>
              <h2>❤️ Fréquence cardiaque moyenne</h2>
              <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[50, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="heartRate"
                      stroke="#ff5722"
                      strokeWidth={3}
                      name="BPM"
                      dot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Calories */}
            <div className={styles.chartSection}>
              <h2>🔥 Calories brûlées</h2>
              <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="calories" fill="#ff9800" name="Calories" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {/* Agenda du jour */}
        {connected.calendar && events.length > 0 && (
          <div className={styles.calendarSection}>
            <h2>📅 Agenda du jour</h2>
            <div className={styles.eventsList}>
              {events.map((event) => (
                <div key={event.id} className={styles.eventCard}>
                  <div className={styles.eventTime}>{formatTime(event.start)}</div>
                  <div className={styles.eventTitle}>{event.title}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Insights et corrélations */}
        <div className={styles.insightsSection}>
          <h2>💡 Insights santé & addiction</h2>
          <div className={styles.insightsList}>
            <div className={styles.insightCard}>
              <div className={styles.insightIcon}>🏃</div>
              <div className={styles.insightContent}>
                <h3>Activité physique</h3>
                <p>
                  L&apos;exercice régulier libère des endorphines qui réduisent le stress
                  et les envies de consommer. Vise 30-60 minutes d&apos;activité par jour.
                </p>
              </div>
            </div>

            <div className={styles.insightCard}>
              <div className={styles.insightIcon}>😴</div>
              <div className={styles.insightContent}>
                <h3>Sommeil réparateur</h3>
                <p>
                  Un manque de sommeil affaiblit ta volonté et augmente les risques de
                  rechute. Maintiens un horaire régulier et vise 7-9 heures par nuit.
                </p>
              </div>
            </div>

            <div className={styles.insightCard}>
              <div className={styles.insightIcon}>❤️</div>
              <div className={styles.insightContent}>
                <h3>Gestion du stress</h3>
                <p>
                  Une fréquence cardiaque élevée au repos peut indiquer du stress chronique.
                  Pratique la respiration profonde et la méditation pour réduire ton stress.
                </p>
              </div>
            </div>

            <div className={styles.insightCard}>
              <div className={styles.insightIcon}>🎯</div>
              <div className={styles.insightContent}>
                <h3>Routine saine</h3>
                <p>
                  Établis des routines quotidiennes : lever à heure fixe, exercice matinal,
                  repas réguliers. La structure aide à prévenir les rechutes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
