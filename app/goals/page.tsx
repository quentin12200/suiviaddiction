'use client'

import { useEffect, useState, FormEvent } from 'react'
import Navigation from '../components/Navigation'
import styles from './goals.module.css'

interface DailyGoal {
  id: string
  date: string
  maxJoints: number
  minIntervalMinutes: number
  note: string
}

interface GoalSuggestion {
  level: string
  maxJoints: number
  minIntervalMinutes: number
  note: string
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<DailyGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [formLoading, setFormLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [suggestions, setSuggestions] = useState<GoalSuggestion[]>([])
  const [aiAnalysis, setAiAnalysis] = useState('')
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)

  // Pré-remplir avec la date d'aujourd'hui
  const today = new Date().toISOString().split('T')[0]

  const [formData, setFormData] = useState({
    date: today,
    maxJoints: 5,
    minIntervalMinutes: 120,
    note: '',
  })

  useEffect(() => {
    fetchGoals()
  }, [])

  const fetchGoals = async () => {
    try {
      const response = await fetch('/api/goals')
      const data = await response.json()
      setGoals(data.goals || [])
    } catch (error) {
      console.error('Erreur chargement objectifs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setFormLoading(true)

    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Objectif enregistré avec succès !')
        fetchGoals()
        // Réinitialiser le formulaire
        setFormData({
          date: today,
          maxJoints: 5,
          minIntervalMinutes: 120,
          note: '',
        })
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'Erreur lors de l\'enregistrement')
      }
    } catch (err) {
      setError('Erreur de connexion au serveur')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet objectif ?')) {
      return
    }

    try {
      const response = await fetch(`/api/goals/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setSuccess('Objectif supprimé avec succès !')
        fetchGoals()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError('Erreur lors de la suppression')
      }
    } catch (err) {
      setError('Erreur de connexion au serveur')
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR')
  }

  const fetchAISuggestions = async () => {
    setLoadingSuggestions(true)
    setError('')

    try {
      const response = await fetch('/api/goals/suggest')
      const data = await response.json()

      if (data.success) {
        setSuggestions(data.suggestions || [])
        setAiAnalysis(data.analysis || '')
      } else {
        setError(data.message || 'Erreur lors de la génération des suggestions')
      }
    } catch (err) {
      setError('Erreur de connexion au serveur')
    } finally {
      setLoadingSuggestions(false)
    }
  }

  const applySuggestion = (suggestion: GoalSuggestion) => {
    setFormData({
      date: today,
      maxJoints: suggestion.maxJoints,
      minIntervalMinutes: suggestion.minIntervalMinutes,
      note: suggestion.note,
    })
    // Scroll vers le formulaire
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div>
      <Navigation />
      <div className={styles.container}>
        <h1 className={styles.title}>Gestion des objectifs</h1>

        {/* Suggestions IA */}
        <div className={styles.aiSection}>
          <div className={styles.aiHeader}>
            <div>
              <h2>🤖 Objectifs adaptatifs (IA)</h2>
              <p className={styles.aiSubtitle}>
                L&apos;IA analyse ta progression et te propose des objectifs réalistes
              </p>
            </div>
            <button
              onClick={fetchAISuggestions}
              className={styles.aiButton}
              disabled={loadingSuggestions}
            >
              {loadingSuggestions ? 'Génération...' : '✨ Générer suggestions'}
            </button>
          </div>

          {aiAnalysis && (
            <div className={styles.aiAnalysis}>
              <strong>📊 Analyse :</strong> {aiAnalysis}
            </div>
          )}

          {suggestions.length > 0 && (
            <div className={styles.suggestionsGrid}>
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className={`${styles.suggestionCard} ${
                    styles[`level${suggestion.level.charAt(0).toUpperCase() + suggestion.level.slice(1)}`]
                  }`}
                >
                  <div className={styles.suggestionLevel}>
                    {suggestion.level === 'easy' && '🟢 Facile'}
                    {suggestion.level === 'medium' && '🟡 Moyen'}
                    {suggestion.level === 'hard' && '🔴 Ambitieux'}
                  </div>
                  <div className={styles.suggestionStats}>
                    <div className={styles.suggestionStat}>
                      <span className={styles.suggestionLabel}>Max joints</span>
                      <span className={styles.suggestionValue}>{suggestion.maxJoints}</span>
                    </div>
                    <div className={styles.suggestionStat}>
                      <span className={styles.suggestionLabel}>Intervalle</span>
                      <span className={styles.suggestionValue}>
                        {suggestion.minIntervalMinutes} min
                      </span>
                    </div>
                  </div>
                  <p className={styles.suggestionNote}>{suggestion.note}</p>
                  <button
                    onClick={() => applySuggestion(suggestion)}
                    className={styles.applyButton}
                  >
                    Utiliser cet objectif
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Formulaire */}
        <div className={styles.formSection}>
          <h2>Définir un objectif</h2>
          {success && <div className={styles.success}>{success}</div>}
          {error && <div className={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="date" className={styles.label}>
                  Date *
                </label>
                <input
                  id="date"
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="maxJoints" className={styles.label}>
                  Nombre max de joints *
                </label>
                <input
                  id="maxJoints"
                  type="number"
                  name="maxJoints"
                  value={formData.maxJoints}
                  onChange={handleChange}
                  className={styles.input}
                  min="0"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="minIntervalMinutes" className={styles.label}>
                  Intervalle min (minutes) *
                </label>
                <input
                  id="minIntervalMinutes"
                  type="number"
                  name="minIntervalMinutes"
                  value={formData.minIntervalMinutes}
                  onChange={handleChange}
                  className={styles.input}
                  min="0"
                  required
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="note" className={styles.label}>
                Note / Motivation
              </label>
              <textarea
                id="note"
                name="note"
                value={formData.note}
                onChange={handleChange}
                className={styles.textarea}
                rows={3}
                placeholder="Ex: Réduire progressivement, objectif important..."
              />
            </div>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={formLoading}
            >
              {formLoading ? 'Enregistrement...' : 'Enregistrer l\'objectif'}
            </button>
          </form>
        </div>

        {/* Liste des objectifs */}
        <div className={styles.listSection}>
          <h2>Objectifs existants</h2>

          {loading ? (
            <p>Chargement...</p>
          ) : goals.length === 0 ? (
            <p className={styles.noData}>Aucun objectif défini pour le moment</p>
          ) : (
            <div className={styles.goalsGrid}>
              {goals.map((goal) => (
                <div key={goal.id} className={styles.goalCard}>
                  <div className={styles.goalHeader}>
                    <h3>{formatDate(goal.date)}</h3>
                    <button
                      onClick={() => handleDelete(goal.id)}
                      className={styles.deleteButton}
                    >
                      Supprimer
                    </button>
                  </div>
                  <div className={styles.goalBody}>
                    <div className={styles.goalStat}>
                      <span className={styles.goalLabel}>Max joints:</span>
                      <span className={styles.goalValue}>{goal.maxJoints}</span>
                    </div>
                    <div className={styles.goalStat}>
                      <span className={styles.goalLabel}>Intervalle min:</span>
                      <span className={styles.goalValue}>
                        {goal.minIntervalMinutes} min
                      </span>
                    </div>
                    {goal.note && (
                      <div className={styles.goalNote}>
                        <strong>Note:</strong> {goal.note}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
