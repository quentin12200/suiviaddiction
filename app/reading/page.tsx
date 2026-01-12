'use client'

import { useEffect, useState } from 'react'
import Navigation from '../components/Navigation'
import styles from './reading.module.css'

interface Reading {
  id: string
  title: string
  author: string
  category: string
  description: string
  priority: number
  status: string
  notes: string
  startedAt: string | null
  finishedAt: string | null
}

interface AIInsight {
  type: string
  content: string
  loading: boolean
}

export default function ReadingPage() {
  const [readings, setReadings] = useState<Reading[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReading, setSelectedReading] = useState<Reading | null>(null)
  const [notes, setNotes] = useState('')
  const [aiInsights, setAiInsights] = useState<Record<string, AIInsight>>({})
  const [recommendations, setRecommendations] = useState<string>('')
  const [loadingRecommendations, setLoadingRecommendations] = useState(false)
  const [showRecommendations, setShowRecommendations] = useState(false)

  useEffect(() => {
    fetchReadings()
  }, [])

  const fetchReadings = async () => {
    try {
      const response = await fetch('/api/readings')
      const data = await response.json()
      if (data.success) {
        setReadings(data.readings)
      }
    } catch (error) {
      console.error('Erreur chargement lectures:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/readings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        fetchReadings()
      }
    } catch (error) {
      console.error('Erreur mise à jour statut:', error)
    }
  }

  const saveNotes = async (id: string) => {
    try {
      const response = await fetch(`/api/readings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })

      if (response.ok) {
        fetchReadings()
        setSelectedReading(null)
        setNotes('')
      }
    } catch (error) {
      console.error('Erreur sauvegarde notes:', error)
    }
  }

  const openNotes = (reading: Reading) => {
    setSelectedReading(reading)
    setNotes(reading.notes)
  }

  const getAIInsight = async (readingId: string, type: 'summary' | 'questions' | 'actions' | 'recommendation') => {
    const key = `${readingId}-${type}`

    // Si déjà chargé, toggle
    if (aiInsights[key] && !aiInsights[key].loading) {
      setAiInsights(prev => {
        const newInsights = { ...prev }
        delete newInsights[key]
        return newInsights
      })
      return
    }

    // Marquer comme loading
    setAiInsights(prev => ({
      ...prev,
      [key]: { type, content: '', loading: true }
    }))

    try {
      const response = await fetch('/api/readings/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ readingId, type }),
      })

      const data = await response.json()

      if (data.success) {
        setAiInsights(prev => ({
          ...prev,
          [key]: { type, content: data.insight, loading: false }
        }))
      } else {
        alert('Erreur lors de la génération des insights')
        setAiInsights(prev => {
          const newInsights = { ...prev }
          delete newInsights[key]
          return newInsights
        })
      }
    } catch (error) {
      console.error('Erreur insights IA:', error)
      alert('Erreur lors de la génération des insights')
      setAiInsights(prev => {
        const newInsights = { ...prev }
        delete newInsights[key]
        return newInsights
      })
    }
  }

  const getPersonalizedRecommendations = async () => {
    if (showRecommendations && recommendations) {
      setShowRecommendations(false)
      return
    }

    setLoadingRecommendations(true)
    setShowRecommendations(true)

    try {
      const response = await fetch('/api/readings/ai-recommendations')
      const data = await response.json()

      if (data.success) {
        setRecommendations(data.recommendations)
      } else {
        alert('Erreur lors de la génération des recommandations')
        setShowRecommendations(false)
      }
    } catch (error) {
      console.error('Erreur recommandations IA:', error)
      alert('Erreur lors de la génération des recommandations')
      setShowRecommendations(false)
    } finally {
      setLoadingRecommendations(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'en_cours':
        return <span className={styles.statusEnCours}>📖 En cours</span>
      case 'terminé':
        return <span className={styles.statusTerminé}>✅ Terminé</span>
      default:
        return <span className={styles.statusNonCommencé}>⏸️ Non commencé</span>
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'stoïcisme':
        return '🏛️'
      case 'psychologie':
        return '🧠'
      case 'discipline':
        return '💪'
      case 'existentialisme':
        return '🤔'
      case 'méditation':
        return '🧘'
      default:
        return '📚'
    }
  }

  const getInsightButtonLabel = (type: string) => {
    switch (type) {
      case 'summary':
        return '📖 Résumé'
      case 'questions':
        return '❓ Questions'
      case 'actions':
        return '✅ Actions'
      case 'recommendation':
        return '📚 Livres liés'
      default:
        return type
    }
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

  // Grouper par catégorie
  type ReadingType = typeof readings[number]
  const byCategory = readings.reduce((acc, reading: ReadingType) => {
    if (!acc[reading.category]) {
      acc[reading.category] = []
    }
    acc[reading.category].push(reading)
    return acc
  }, {} as Record<string, Reading[]>)

  return (
    <div>
      <Navigation />
      <div className={styles.container}>
        <div className={styles.pageHeader}>
          <h1 className={styles.title}>📚 Mes Lectures</h1>
          <button
            className={styles.aiRecommendButton}
            onClick={getPersonalizedRecommendations}
            disabled={loadingRecommendations}
          >
            {loadingRecommendations ? '🤖 Génération...' : showRecommendations ? '✖️ Fermer' : '🤖 Recommandations IA personnalisées'}
          </button>
        </div>

        {/* AI Recommendations Panel */}
        {showRecommendations && (
          <div className={styles.aiRecommendationsPanel}>
            <h2 className={styles.aiPanelTitle}>🤖 Recommandations personnalisées pour toi</h2>
            {loadingRecommendations ? (
              <div className={styles.aiLoading}>
                <div className={styles.spinner}></div>
                <p>Analyse de ton parcours et génération de recommandations...</p>
              </div>
            ) : (
              <div className={styles.aiContent}>
                {recommendations.split('\n').map((line, i) => {
                  if (line.trim().startsWith('**')) {
                    return <p key={i} className={styles.aiBold}>{line}</p>
                  } else if (line.trim().startsWith('🎯') || line.trim().startsWith('💡') || line.trim().startsWith('⚡') || line.trim().startsWith('🔥')) {
                    return <p key={i} className={styles.aiHighlight}>{line}</p>
                  } else if (line.trim()) {
                    return <p key={i}>{line}</p>
                  }
                  return <br key={i} />
                })}
              </div>
            )}
          </div>
        )}

        <div className={styles.legend}>
          <p><strong>Top 3 prioritaires pour toi :</strong></p>
          <ul>
            <li>📘 <strong>L'Homme en quête de sens</strong> (Viktor Frankl) → Pour le VIDE</li>
            <li>📗 <strong>Atomic Habits</strong> (James Clear) → Pour CASSER les patterns</li>
            <li>📕 <strong>Can't Hurt Me</strong> (David Goggins) → Pour l'ADRÉNALINE constructive</li>
          </ul>
        </div>

        {Object.entries(byCategory).map(([category, books]) => (
          <div key={category} className={styles.categorySection}>
            <h2 className={styles.categoryTitle}>
              {getCategoryIcon(category)} {category.charAt(0).toUpperCase() + category.slice(1)}
            </h2>

            <div className={styles.booksGrid}>
              {books.map((reading) => (
                <div
                  key={reading.id}
                  className={`${styles.bookCard} ${
                    reading.priority === 1 ? styles.topPriority : ''
                  }`}
                >
                  {reading.priority === 1 && (
                    <div className={styles.topBadge}>⭐ TOP</div>
                  )}

                  <div className={styles.bookHeader}>
                    <h3 className={styles.bookTitle}>{reading.title}</h3>
                    <p className={styles.bookAuthor}>{reading.author}</p>
                  </div>

                  <p className={styles.bookDescription}>{reading.description}</p>

                  <div className={styles.bookActions}>
                    {getStatusBadge(reading.status)}

                    <div className={styles.buttonGroup}>
                      {reading.status !== 'en_cours' && (
                        <button
                          className={styles.btnStart}
                          onClick={() => updateStatus(reading.id, 'en_cours')}
                        >
                          Commencer
                        </button>
                      )}
                      {reading.status === 'en_cours' && (
                        <button
                          className={styles.btnFinish}
                          onClick={() => updateStatus(reading.id, 'terminé')}
                        >
                          Terminer
                        </button>
                      )}
                      <button
                        className={styles.btnNotes}
                        onClick={() => openNotes(reading)}
                      >
                        📝 Notes
                      </button>
                    </div>
                  </div>

                  {/* AI Insights Buttons */}
                  <div className={styles.aiInsightsButtons}>
                    {(['summary', 'questions', 'actions', 'recommendation'] as const).map((type) => {
                      const key = `${reading.id}-${type}`
                      const insight = aiInsights[key]
                      const isLoading = insight?.loading
                      const isActive = insight && !insight.loading

                      return (
                        <button
                          key={type}
                          className={`${styles.aiInsightBtn} ${isActive ? styles.aiInsightBtnActive : ''}`}
                          onClick={() => getAIInsight(reading.id, type)}
                          disabled={isLoading}
                        >
                          {isLoading ? '⏳' : getInsightButtonLabel(type)}
                        </button>
                      )
                    })}
                  </div>

                  {/* Display AI Insights */}
                  {Object.entries(aiInsights)
                    .filter(([key]) => key.startsWith(reading.id))
                    .map(([key, insight]) => (
                      !insight.loading && (
                        <div key={key} className={styles.aiInsightContent}>
                          <div className={styles.aiInsightText}>
                            {insight.content.split('\n').map((line, i) => {
                              if (line.trim().startsWith('**')) {
                                return <p key={i} className={styles.aiBold}>{line}</p>
                              } else if (line.trim().startsWith('🔑') || line.trim().startsWith('💡') || line.trim().startsWith('✅') || line.trim().startsWith('🎯') || line.trim().startsWith('📚')) {
                                return <p key={i} className={styles.aiHighlight}>{line}</p>
                              } else if (line.trim()) {
                                return <p key={i}>{line}</p>
                              }
                              return <br key={i} />
                            })}
                          </div>
                        </div>
                      )
                    ))
                  }

                  {reading.notes && (
                    <div className={styles.notesPreview}>
                      💭 {reading.notes.substring(0, 100)}
                      {reading.notes.length > 100 ? '...' : ''}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Modal Notes */}
        {selectedReading && (
          <div className={styles.modal} onClick={() => setSelectedReading(null)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <h2>{selectedReading.title}</h2>
              <p className={styles.modalAuthor}>par {selectedReading.author}</p>

              <textarea
                className={styles.notesTextarea}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tes réflexions, citations marquantes, ce que tu appliques..."
                rows={10}
              />

              <div className={styles.modalButtons}>
                <button
                  className={styles.btnCancel}
                  onClick={() => setSelectedReading(null)}
                >
                  Annuler
                </button>
                <button
                  className={styles.btnSave}
                  onClick={() => saveNotes(selectedReading.id)}
                >
                  Sauvegarder
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
