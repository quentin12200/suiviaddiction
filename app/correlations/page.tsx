'use client'

import { useEffect, useState } from 'react'
import Navigation from '../components/Navigation'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import styles from './correlations.module.css'

interface CorrelationsData {
  time: Array<{ hour: string; percentage: number; count: number }>
  craving: Array<{ level: number; percentage: number; total: number }>
  emotions: Array<{ emotion: string; percentage: number; count: number; occurrences: number }>
  contexts: Array<{ context: string; percentage: number; count: number; occurrences: number }>
  weekday: Array<{ day: string; percentage: number; count: number }>
  consciousness: { conscious: number; unconscious: number }
}

export default function CorrelationsPage() {
  const [correlations, setCorrelations] = useState<CorrelationsData | null>(null)
  const [insights, setInsights] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [dataPoints, setDataPoints] = useState(0)

  useEffect(() => {
    fetchCorrelations()
  }, [])

  const fetchCorrelations = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/correlations')
      const data = await response.json()

      if (data.success) {
        setCorrelations(data.correlations)
        setInsights(data.insights || [])
        setDataPoints(data.dataPoints || 0)
      }
    } catch (error) {
      console.error('Erreur chargement corrélations:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div>
        <Navigation />
        <div className={styles.container}>
          <p className={styles.loading}>Analyse des corrélations en cours...</p>
        </div>
      </div>
    )
  }

  if (!correlations) {
    return (
      <div>
        <Navigation />
        <div className={styles.container}>
          <p className={styles.error}>Pas assez de données pour l&apos;analyse</p>
        </div>
      </div>
    )
  }

  const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#fee140', '#30cfd0']

  // Données pour le graphique de conscience
  const consciousnessData = [
    { type: 'Décision consciente', success: correlations.consciousness.conscious },
    { type: 'Décision automatique', success: correlations.consciousness.unconscious },
  ]

  return (
    <div>
      <Navigation />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>📊 Corrélations Avancées</h1>
          <p className={styles.subtitle}>
            Analyse intelligente de {dataPoints} entrées pour identifier les patterns
          </p>
        </div>

        {/* Insights IA */}
        {insights.length > 0 && (
          <div className={styles.insightsSection}>
            <h2 className={styles.sectionTitle}>🤖 Insights IA</h2>
            <div className={styles.insightsGrid}>
              {insights.map((insight, index) => (
                <div key={index} className={styles.insightCard}>
                  <p>{insight}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Heure de la journée */}
        <div className={styles.chartSection}>
          <h2 className={styles.sectionTitle}>⏰ Risque par heure de la journée</h2>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={correlations.time}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis label={{ value: '% consommation', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Bar dataKey="percentage" name="% de consommation">
                  {correlations.time.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.percentage > 60 ? '#f44336' : entry.percentage > 40 ? '#ff9800' : '#4caf50'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Niveau d'envie */}
        <div className={styles.chartSection}>
          <h2 className={styles.sectionTitle}>🔥 Corrélation Envie ↔ Consommation</h2>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={correlations.craving}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="level" label={{ value: 'Niveau d\'envie (0-10)', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: '% consommation', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="percentage"
                  stroke="#f44336"
                  strokeWidth={3}
                  name="% de consommation"
                  dot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className={styles.chartNote}>
            Plus le niveau d&apos;envie est élevé, plus la probabilité de consommation augmente
          </p>
        </div>

        {/* États émotionnels */}
        <div className={styles.chartSection}>
          <h2 className={styles.sectionTitle}>😔 Émotions les plus déclenchantes</h2>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={correlations.emotions} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" label={{ value: '% consommation', position: 'insideBottom', offset: -5 }} />
                <YAxis type="category" dataKey="emotion" width={100} />
                <Tooltip />
                <Bar dataKey="percentage" name="% de consommation">
                  {correlations.emotions.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Contextes */}
        {correlations.contexts.length > 0 && (
          <div className={styles.chartSection}>
            <h2 className={styles.sectionTitle}>📍 Contextes à risque</h2>
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={correlations.contexts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" label={{ value: '% consommation', position: 'insideBottom', offset: -5 }} />
                  <YAxis type="category" dataKey="context" width={120} />
                  <Tooltip />
                  <Bar dataKey="percentage" name="% de consommation" fill="#764ba2" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Jour de la semaine */}
        <div className={styles.chartSection}>
          <h2 className={styles.sectionTitle}>📅 Risque par jour de la semaine</h2>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={correlations.weekday}>
                <PolarGrid />
                <PolarAngleAxis dataKey="day" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar
                  name="% consommation"
                  dataKey="percentage"
                  stroke="#667eea"
                  fill="#667eea"
                  fillOpacity={0.6}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Décisions conscientes */}
        <div className={styles.chartSection}>
          <h2 className={styles.sectionTitle}>💡 Impact des décisions conscientes</h2>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={consciousnessData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis label={{ value: '% succès (pas de consommation)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Bar dataKey="success" name="% de succès">
                  <Cell fill="#4caf50" />
                  <Cell fill="#ff9800" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className={styles.chartNote}>
            Les décisions conscientes augmentent significativement les chances de ne pas consommer
          </p>
        </div>

        {/* Recommandations */}
        <div className={styles.recommendations}>
          <h2 className={styles.sectionTitle}>💪 Recommandations personnalisées</h2>
          <div className={styles.recommendationsList}>
            <div className={styles.recommendationCard}>
              <h3>🎯 Anticipe les moments à risque</h3>
              <p>
                Utilise les alertes préventives pour être averti avant tes heures et contextes les plus
                à risque identifiés ci-dessus.
              </p>
            </div>
            <div className={styles.recommendationCard}>
              <h3>🧘 Gère tes émotions déclenchantes</h3>
              <p>
                Développe des stratégies spécifiques pour les émotions identifiées comme déclenchantes.
                Parle au coach IA quand tu ressens ces émotions.
              </p>
            </div>
            <div className={styles.recommendationCard}>
              <h3>⚡ Pratique la pleine conscience</h3>
              <p>
                Les décisions conscientes augmentent tes chances de succès. Prends 30 secondes pour
                réfléchir avant chaque décision.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
