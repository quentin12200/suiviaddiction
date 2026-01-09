'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navigation from './components/Navigation'
import FreedomScore from './components/FreedomScore'
import AIEncouragement from './components/AIEncouragement'
import ActiveStrategies from './components/ActiveStrategies'
import AlertMonitor from './components/AlertMonitor'
import NotificationSettings from './components/NotificationSettings'
import HealthWidget from './components/HealthWidget'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import styles from './page.module.css'

interface DashboardStats {
  today: {
    jointsCount: number
    entriesCount: number
    goal: {
      maxJoints: number
      minIntervalMinutes: number
      note: string
    } | null
    discipline: {
      wakeUpTime: string | null
      sleepTime: string | null
      exerciseDone: boolean
      selfRating: number
    } | null
  }
  last7Days: {
    data: { date: string; count: number }[]
    average: number
    averageCraving: number
  }
  last30Days: {
    data: { date: string; count: number }[]
  }
  historical: {
    average: number
  }
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    // Vérifier au chargement si on a changé de jour depuis la dernière visite
    const lastVisitDate = localStorage.getItem('lastDashboardVisit')
    const today = new Date().toDateString()

    if (lastVisitDate && lastVisitDate !== today) {
      console.log('🔄 Nouveau jour détecté au chargement, rafraîchissement...')
    }

    localStorage.setItem('lastDashboardVisit', today)
    fetchStats()

    // Vérifier toutes les minutes si on a changé de jour
    const interval = setInterval(() => {
      const currentDay = new Date().toDateString()
      const storedDay = localStorage.getItem('lastDashboardVisit')

      if (storedDay && storedDay !== currentDay) {
        console.log('🔄 Nouveau jour détecté, rafraîchissement automatique...')
        localStorage.setItem('lastDashboardVisit', currentDay)
        fetchStats()
      }
    }, 60000) // Toutes les 60 secondes

    return () => clearInterval(interval)
  }, []) // Seulement au montage

  const fetchStats = async () => {
    try {
      setLoading(true)
      // Ajouter un timestamp pour éviter le cache du navigateur
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/stats/dashboard?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      })
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Erreur chargement stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
    fetchStats()
  }

  if (loading) {
    return (
      <div>
        <Navigation />
        <div className={styles.container}>
          <p>Chargement...</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div>
        <Navigation />
        <div className={styles.container}>
          <p>Erreur de chargement des données</p>
        </div>
      </div>
    )
  }

  const { today, last7Days, last30Days, historical } = stats

  // Calculer l'écart à l'objectif
  let goalProgress = ''
  if (today.goal) {
    const remaining = today.goal.maxJoints - today.jointsCount
    if (remaining >= 0) {
      goalProgress = `${today.jointsCount}/${today.goal.maxJoints} joints (${remaining} restants)`
    } else {
      goalProgress = `${today.jointsCount}/${today.goal.maxJoints} joints (objectif dépassé de ${Math.abs(remaining)})`
    }
  }

  // Formatter les dates pour l'affichage
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getDate()}/${date.getMonth() + 1}`
  }

  const chartData7Days = last7Days.data.map((d) => ({
    date: formatDate(d.date),
    joints: d.count,
  }))

  const chartData30Days = last30Days.data.map((d) => ({
    date: formatDate(d.date),
    joints: d.count,
  }))

  return (
    <div>
      <Navigation />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Tableau de bord</h1>
          <button onClick={handleRefresh} className={styles.refreshButton} disabled={loading}>
            {loading ? '🔄 Rafraîchissement...' : '🔄 Rafraîchir'}
          </button>
        </div>

        {/* Alertes Préventives */}
        <AlertMonitor key={`alert-${refreshKey}`} />

        {/* Notifications */}
        <NotificationSettings />

        {/* Score de Liberté */}
        <FreedomScore key={`freedom-${refreshKey}`} />

        {/* Encouragement IA */}
        <AIEncouragement key={`ai-${refreshKey}`} />

        {/* Stratégies Actives */}
        <ActiveStrategies key={`strategies-${refreshKey}`} />

        {/* Santé & Agenda */}
        <HealthWidget key={`health-${refreshKey}`} />

        {/* Résumé du jour */}
        <div className={styles.grid}>
          <div className={styles.card}>
            <h2>Aujourd&apos;hui</h2>
            <div className={styles.stat}>
              <span className={styles.statValue}>{today.jointsCount}</span>
              <span className={styles.statLabel}>joints</span>
            </div>
            {today.goal && (
              <div className={styles.goalInfo}>
                <p>
                  <strong>Objectif :</strong> {goalProgress}
                </p>
                <p>
                  <strong>Intervalle min :</strong> {today.goal.minIntervalMinutes} min
                </p>
                {today.goal.note && (
                  <p>
                    <strong>Note :</strong> {today.goal.note}
                  </p>
                )}
              </div>
            )}
            {!today.goal && (
              <p className={styles.noGoal}>
                Aucun objectif défini pour aujourd&apos;hui
              </p>
            )}
          </div>

          {today.discipline && (
            <div className={styles.card}>
              <h2>⚔️ Discipline du jour</h2>
              <div className={styles.disciplineInfo}>
                {today.discipline.wakeUpTime && (
                  <div className={styles.disciplineItem}>
                    <span className={styles.disciplineLabel}>⏰ Réveil :</span>
                    <span className={styles.disciplineValue}>
                      {today.discipline.wakeUpTime}
                    </span>
                  </div>
                )}
                {today.discipline.sleepTime && (
                  <div className={styles.disciplineItem}>
                    <span className={styles.disciplineLabel}>😴 Coucher :</span>
                    <span className={styles.disciplineValue}>
                      {today.discipline.sleepTime}
                    </span>
                  </div>
                )}
                <div className={styles.disciplineItem}>
                  <span className={styles.disciplineLabel}>💪 Sport :</span>
                  <span className={styles.disciplineValue}>
                    {today.discipline.exerciseDone ? '✅ Fait' : '❌ Pas fait'}
                  </span>
                </div>
                <div className={styles.disciplineItem}>
                  <span className={styles.disciplineLabel}>🎯 Auto-éval :</span>
                  <span className={styles.disciplineValue}>
                    {today.discipline.selfRating}/10
                  </span>
                </div>
              </div>
              <Link href="/discipline" className={styles.disciplineLink}>
                → Voir la page Discipline
              </Link>
            </div>
          )}

          <div className={styles.card}>
            <h2>Progression</h2>
            <div className={styles.progressInfo}>
              <div className={styles.progressItem}>
                <span className={styles.progressLabel}>Moyenne 7 jours</span>
                <span className={styles.progressValue}>
                  {last7Days.average.toFixed(1)} joints/jour
                </span>
              </div>
              <div className={styles.progressItem}>
                <span className={styles.progressLabel}>Moyenne historique</span>
                <span className={styles.progressValue}>
                  {historical.average.toFixed(1)} joints/jour
                </span>
              </div>
              <div className={styles.progressItem}>
                <span className={styles.progressLabel}>
                  Craving moyen (7j)
                </span>
                <span className={styles.progressValue}>
                  {last7Days.averageCraving.toFixed(1)}/10
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Graphiques */}
        <div className={styles.chartSection}>
          <h2>Consommation - 7 derniers jours</h2>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData7Days}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="joints" fill="#667eea" name="Joints" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.chartSection}>
          <h2>Consommation - 30 derniers jours</h2>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData30Days}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="joints"
                  stroke="#764ba2"
                  name="Joints"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Actions rapides */}
        <div className={styles.actions}>
          <h2>Actions rapides</h2>
          <div className={styles.actionButtons}>
            <Link href="/new" className={styles.actionButton}>
              Ajouter une entrée
            </Link>
            <Link href="/history" className={styles.actionButton}>
              Voir l&apos;historique
            </Link>
            <Link href="/goals" className={styles.actionButton}>
              Gérer les objectifs
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
