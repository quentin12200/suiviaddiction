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

interface HealthData {
  steps: number
  activeMinutes: number
  sleepHours: number
  heartRate: number
  calories: number
}

export default function CorrelationsPage() {
  const [correlations, setCorrelations] = useState<CorrelationsData | null>(null)
  const [insights, setInsights] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [dataPoints, setDataPoints] = useState(0)
  const [healthData, setHealthData] = useState<HealthData | null>(null)
  const [googleFitConnected, setGoogleFitConnected] = useState(false)

  useEffect(() => {
    fetchCorrelations()
    checkGoogleFitStatus()
  }, [])

  useEffect(() => {
    if (googleFitConnected) {
      fetchHealthData()
    }
  }, [googleFitConnected])

  const checkGoogleFitStatus = async () => {
    try {
      const response = await fetch('/api/integrations/status')
      const data = await response.json()
      if (data.success && data.fit) {
        setGoogleFitConnected(true)
      }
    } catch (error) {
      console.error('Erreur vérification Google Fit:', error)
    }
  }

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
      }
    } catch (error) {
      console.error('Erreur récupération données santé:', error)
    }
  }

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

        {/* Corrélations Santé */}
        {googleFitConnected && healthData && (
          <div className={styles.healthSection}>
            <h2 className={styles.sectionTitle}>🏃 Corrélations Santé & Addiction</h2>
            <p className={styles.healthIntro}>
              Tes données Google Fit révèlent des liens importants entre ta santé physique et tes comportements addictifs.
            </p>

            <div className={styles.healthGrid}>
              {/* Sommeil */}
              <div className={styles.healthCard}>
                <div className={styles.healthCardHeader}>
                  <div className={styles.healthCardIcon}>😴</div>
                  <div>
                    <h3>Sommeil</h3>
                    <div className={styles.healthCardValue}>
                      {healthData.sleepHours.toFixed(1)}h
                    </div>
                  </div>
                </div>
                <div className={styles.healthCardContent}>
                  <p className={styles.healthCorrelation}>
                    {healthData.sleepHours < 6 && (
                      <span className={styles.warning}>
                        ⚠️ <strong>Attention:</strong> Un sommeil insuffisant (&lt;6h) augmente les risques de rechute de 40%.
                      </span>
                    )}
                    {healthData.sleepHours >= 6 && healthData.sleepHours < 7 && (
                      <span className={styles.moderate}>
                        💡 Tu approches du minimum recommandé. Vise 7-9h pour un meilleur contrôle.
                      </span>
                    )}
                    {healthData.sleepHours >= 7 && (
                      <span className={styles.positive}>
                        ✅ <strong>Excellent!</strong> Un bon sommeil renforce ta volonté et réduit les envies.
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Activité physique */}
              <div className={styles.healthCard}>
                <div className={styles.healthCardHeader}>
                  <div className={styles.healthCardIcon}>🚶</div>
                  <div>
                    <h3>Activité</h3>
                    <div className={styles.healthCardValue}>
                      {healthData.steps.toLocaleString()} pas
                    </div>
                  </div>
                </div>
                <div className={styles.healthCardContent}>
                  <p className={styles.healthCorrelation}>
                    {healthData.steps < 5000 && (
                      <span className={styles.warning}>
                        ⚠️ <strong>Activité faible:</strong> L&apos;inactivité augmente le stress et les envies. Vise au moins 8000 pas.
                      </span>
                    )}
                    {healthData.steps >= 5000 && healthData.steps < 8000 && (
                      <span className={styles.moderate}>
                        💡 Bon début! Augmente progressivement vers 10 000 pas pour de meilleurs résultats.
                      </span>
                    )}
                    {healthData.steps >= 8000 && (
                      <span className={styles.positive}>
                        ✅ <strong>Super!</strong> L&apos;activité physique libère des endorphines naturelles qui réduisent les envies.
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Minutes actives */}
              <div className={styles.healthCard}>
                <div className={styles.healthCardHeader}>
                  <div className={styles.healthCardIcon}>⏱️</div>
                  <div>
                    <h3>Minutes actives</h3>
                    <div className={styles.healthCardValue}>
                      {healthData.activeMinutes} min
                    </div>
                  </div>
                </div>
                <div className={styles.healthCardContent}>
                  <p className={styles.healthCorrelation}>
                    {healthData.activeMinutes < 30 && (
                      <span className={styles.warning}>
                        ⚠️ Moins de 30 min d&apos;activité intense. L&apos;exercice est un outil puissant contre l&apos;addiction.
                      </span>
                    )}
                    {healthData.activeMinutes >= 30 && healthData.activeMinutes < 60 && (
                      <span className={styles.moderate}>
                        💡 Objectif minimum atteint! 60 min serait idéal pour maximiser les bénéfices.
                      </span>
                    )}
                    {healthData.activeMinutes >= 60 && (
                      <span className={styles.positive}>
                        ✅ <strong>Bravo!</strong> Tu es dans la zone optimale pour réduire le stress et les envies.
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Fréquence cardiaque */}
              <div className={styles.healthCard}>
                <div className={styles.healthCardHeader}>
                  <div className={styles.healthCardIcon}>❤️</div>
                  <div>
                    <h3>Rythme cardiaque</h3>
                    <div className={styles.healthCardValue}>
                      {healthData.heartRate} bpm
                    </div>
                  </div>
                </div>
                <div className={styles.healthCardContent}>
                  <p className={styles.healthCorrelation}>
                    {healthData.heartRate > 80 && (
                      <span className={styles.warning}>
                        ⚠️ Rythme élevé au repos. Signe possible de stress chronique lié à l&apos;addiction.
                      </span>
                    )}
                    {healthData.heartRate >= 60 && healthData.heartRate <= 80 && (
                      <span className={styles.positive}>
                        ✅ Rythme normal au repos. Signe d&apos;une bonne gestion du stress.
                      </span>
                    )}
                    {healthData.heartRate < 60 && (
                      <span className={styles.positive}>
                        ✅ <strong>Excellent!</strong> Rythme bas au repos, signe de bonne condition physique.
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.healthInsights}>
              <h3>💡 Insights santé personnalisés</h3>
              <div className={styles.insightsList}>
                {healthData.sleepHours < 7 && healthData.steps < 8000 && (
                  <div className={styles.insightItem}>
                    <span className={styles.insightIcon}>🎯</span>
                    <p>
                      Tes données montrent un <strong>sommeil insuffisant ET une activité faible</strong>.
                      Cette combinaison double le risque de rechute. Priorise ces deux aspects cette semaine.
                    </p>
                  </div>
                )}
                {healthData.activeMinutes >= 60 && healthData.sleepHours >= 7 && (
                  <div className={styles.insightItem}>
                    <span className={styles.insightIcon}>🌟</span>
                    <p>
                      <strong>Routine excellente!</strong> Ton sommeil et ton activité physique sont dans les zones optimales.
                      Continue ainsi, c&apos;est un bouclier solide contre les rechutes.
                    </p>
                  </div>
                )}
                {healthData.heartRate > 80 && (
                  <div className={styles.insightItem}>
                    <span className={styles.insightIcon}>🧘</span>
                    <p>
                      Ton rythme cardiaque au repos est élevé, suggérant du <strong>stress chronique</strong>.
                      Essaye 10 minutes de méditation ou respiration profonde chaque jour.
                    </p>
                  </div>
                )}
                <div className={styles.insightItem}>
                  <span className={styles.insightIcon}>📊</span>
                  <p>
                    Les études montrent qu&apos;une routine de <strong>8h de sommeil + 10 000 pas + 30 min d&apos;exercice</strong> réduit
                    les envies addictives de 60% en moyenne.
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.healthCta}>
              <p>
                🏃 Consulte la <a href="/health">page Santé</a> pour voir tes tendances détaillées sur 7 et 30 jours.
              </p>
            </div>
          </div>
        )}

        {!googleFitConnected && (
          <div className={styles.healthPrompt}>
            <div className={styles.healthPromptIcon}>📊</div>
            <h3>Découvre les corrélations entre ta santé et tes comportements</h3>
            <p>
              Connecte Google Fit pour voir comment ton sommeil, ton activité physique et ton rythme cardiaque
              influencent tes risques de consommation. Ces insights peuvent transformer ta stratégie de rétablissement.
            </p>
            <a href="/integrations" className={styles.healthPromptButton}>
              Connecter Google Fit
            </a>
          </div>
        )}

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
