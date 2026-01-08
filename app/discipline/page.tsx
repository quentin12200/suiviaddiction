'use client'

import { useEffect, useState, FormEvent } from 'react'
import Navigation from '../components/Navigation'
import styles from './discipline.module.css'

interface DisciplineEntry {
  id: string
  date: string
  wakeUpTime: string | null
  sleepTime: string | null
  exerciseDone: boolean
  exerciseDuration: number
  productiveHours: number
  distractionsResisted: number
  promisesKept: number
  selfRating: number
  worstMoment: string
  bestMoment: string
  tomorrowCommitment: string
  excuses: string
  truthfulReflection: string
}

export default function DisciplinePage() {
  const [entries, setEntries] = useState<DisciplineEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  const today = new Date().toISOString().split('T')[0]

  const [formData, setFormData] = useState({
    date: today,
    wakeUpTime: '',
    sleepTime: '',
    exerciseDone: false,
    exerciseDuration: 0,
    productiveHours: 0,
    distractionsResisted: 0,
    promisesKept: 0,
    selfRating: 5,
    worstMoment: '',
    bestMoment: '',
    tomorrowCommitment: '',
    excuses: '',
    truthfulReflection: '',
  })

  useEffect(() => {
    fetchEntries()
  }, [])

  const fetchEntries = async () => {
    try {
      const response = await fetch('/api/discipline')
      const data = await response.json()
      if (data.success) {
        setEntries(data.entries || [])
      }
    } catch (error) {
      console.error('Erreur chargement discipline:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage('')

    try {
      const response = await fetch('/api/discipline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        setMessage('✅ Bilan enregistré. Maintenant AGIS en conséquence.')
        fetchEntries()
        // Réinitialiser pour demain
        setFormData({
          ...formData,
          date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          worstMoment: '',
          bestMoment: '',
          tomorrowCommitment: '',
          excuses: '',
          truthfulReflection: '',
        })
      } else {
        setMessage('❌ Erreur : ' + (data.error || 'Impossible d\'enregistrer'))
      }
    } catch (error) {
      setMessage('❌ Erreur de connexion')
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData((prev) => ({ ...prev, [name]: checked }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const calculateDisciplineScore = (entry: DisciplineEntry): number => {
    let score = entry.selfRating * 10

    if (entry.exerciseDone) score += 15
    score += entry.exerciseDuration * 0.5
    score += entry.productiveHours * 10
    score += entry.distractionsResisted * 5
    score += entry.promisesKept * 10

    // Pénalités
    if (!entry.wakeUpTime) score -= 10
    if (entry.excuses.length > 50) score -= 20

    return Math.max(0, Math.min(100, score))
  }

  const getDisciplineLevel = (score: number): { label: string; color: string } => {
    if (score >= 90) return { label: 'GUERRIER', color: '#4caf50' }
    if (score >= 75) return { label: 'DISCIPLINÉ', color: '#8bc34a' }
    if (score >= 60) return { label: 'EN PROGRÈS', color: '#ff9800' }
    if (score >= 40) return { label: 'FAIBLE', color: '#ff5722' }
    return { label: 'LÂCHE', color: '#f44336' }
  }

  const getAverageDisciplineScore = (): number => {
    if (entries.length === 0) return 0
    const total = entries.reduce((sum, entry) => sum + calculateDisciplineScore(entry), 0)
    return total / entries.length
  }

  return (
    <div>
      <Navigation />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>⚔️ DISCIPLINE & RESPONSABILITÉ</h1>
          <p className={styles.subtitle}>
            Arrête les excuses. Sois honnête. Agis.
          </p>
        </div>

        {/* Avertissement */}
        <div className={styles.warningBox}>
          <h3>⚠️ RÈGLES NON NÉGOCIABLES</h3>
          <ul>
            <li>Pas de mensonge à toi-même. JAMAIS.</li>
            <li>Chaque excuse est une défaite que tu t&apos;infliges.</li>
            <li>Tes intentions ne valent RIEN sans action.</li>
            <li>Demain n&apos;existe pas. Il n&apos;y a que MAINTENANT.</li>
            <li>Tu es 100% responsable de ta vie. PERSONNE d&apos;autre.</li>
          </ul>
        </div>

        {/* Score moyen */}
        {entries.length > 0 && (
          <div className={styles.scoreCard}>
            <h2>Score de Discipline Moyen</h2>
            <div className={styles.bigScore}>
              {getAverageDisciplineScore().toFixed(0)}
              <span>/100</span>
            </div>
            <p className={styles.scoreLabel}>
              {getDisciplineLevel(getAverageDisciplineScore()).label}
            </p>
          </div>
        )}

        {/* Formulaire */}
        <div className={styles.formSection}>
          <h2>📝 Bilan Quotidien - Sois BRUTAL</h2>
          {message && <div className={styles.message}>{message}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Date</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Heure réveil RÉELLE ⏰</label>
                <input
                  type="time"
                  name="wakeUpTime"
                  value={formData.wakeUpTime}
                  onChange={handleChange}
                  placeholder="Pas l'heure prévue, la VRAIE"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Heure coucher RÉELLE 😴</label>
                <input
                  type="time"
                  name="sleepTime"
                  value={formData.sleepTime}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>
                  <input
                    type="checkbox"
                    name="exerciseDone"
                    checked={formData.exerciseDone}
                    onChange={handleChange}
                  />
                  Sport fait ? (Oui/Non, pas de milieu)
                </label>
              </div>

              <div className={styles.formGroup}>
                <label>Durée sport (minutes) 💪</label>
                <input
                  type="number"
                  name="exerciseDuration"
                  value={formData.exerciseDuration}
                  onChange={handleChange}
                  min="0"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Heures VRAIMENT productives 📊</label>
                <input
                  type="number"
                  name="productiveHours"
                  value={formData.productiveHours}
                  onChange={handleChange}
                  min="0"
                  max="24"
                />
                <small>Compte que le temps où tu as VRAIMENT avancé</small>
              </div>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Distractions résistées 🛡️</label>
                <input
                  type="number"
                  name="distractionsResisted"
                  value={formData.distractionsResisted}
                  onChange={handleChange}
                  min="0"
                />
                <small>Combien de fois tu as dit NON aux tentations</small>
              </div>

              <div className={styles.formGroup}>
                <label>Promesses tenues ✅</label>
                <input
                  type="number"
                  name="promisesKept"
                  value={formData.promisesKept}
                  onChange={handleChange}
                  min="0"
                />
                <small>Sur combien de promesses faites à toi-même</small>
              </div>

              <div className={styles.formGroup}>
                <label>Auto-évaluation (0-10) 🎯</label>
                <input
                  type="range"
                  name="selfRating"
                  value={formData.selfRating}
                  onChange={handleChange}
                  min="0"
                  max="10"
                />
                <div className={styles.ratingValue}>{formData.selfRating}/10</div>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Le PIRE moment d&apos;aujourd&apos;hui 💀</label>
              <textarea
                name="worstMoment"
                value={formData.worstMoment}
                onChange={handleChange}
                rows={3}
                placeholder="Quand as-tu été le plus faible ? Décris PRÉCISÉMENT."
              />
            </div>

            <div className={styles.formGroup}>
              <label>Le MEILLEUR moment d&apos;aujourd&apos;hui 🏆</label>
              <textarea
                name="bestMoment"
                value={formData.bestMoment}
                onChange={handleChange}
                rows={3}
                placeholder="Quand as-tu été fier de toi ? Célèbre-le."
              />
            </div>

            <div className={styles.formGroup}>
              <label>Tes EXCUSES d&apos;aujourd&apos;hui 🤡</label>
              <textarea
                name="excuses"
                value={formData.excuses}
                onChange={handleChange}
                rows={3}
                placeholder="Liste toutes les excuses que tu t'es trouvées. Regarde comme elles sont pathétiques."
              />
            </div>

            <div className={styles.formGroup}>
              <label>Réflexion BRUTALEMENT honnête 🔥</label>
              <textarea
                name="truthfulReflection"
                value={formData.truthfulReflection}
                onChange={handleChange}
                rows={4}
                placeholder="Pas de langue de bois. Comment juges-tu VRAIMENT ta journée ?"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Engagement NON NÉGOCIABLE pour demain ⚡</label>
              <textarea
                name="tomorrowCommitment"
                value={formData.tomorrowCommitment}
                onChange={handleChange}
                rows={3}
                placeholder="Que vas-tu faire DIFFÉREMMENT demain ? Sois précis. Pas de 'je vais essayer'."
                required
              />
            </div>

            <button type="submit" className={styles.submitButton} disabled={submitting}>
              {submitting ? 'Enregistrement...' : '🔥 ENREGISTRER & S\'ENGAGER'}
            </button>
          </form>
        </div>

        {/* Historique */}
        <div className={styles.historySection}>
          <h2>📜 Historique de Discipline</h2>

          {loading ? (
            <p>Chargement...</p>
          ) : entries.length === 0 ? (
            <p className={styles.empty}>Aucune entrée. Commence MAINTENANT.</p>
          ) : (
            <div className={styles.entriesGrid}>
              {entries.map((entry) => {
                const score = calculateDisciplineScore(entry)
                const level = getDisciplineLevel(score)

                return (
                  <div key={entry.id} className={styles.entryCard}>
                    <div className={styles.entryHeader}>
                      <h3>{new Date(entry.date).toLocaleDateString('fr-FR')}</h3>
                      <div
                        className={styles.entryScore}
                        style={{ color: level.color }}
                      >
                        {score.toFixed(0)}
                        <span>{level.label}</span>
                      </div>
                    </div>

                    <div className={styles.entryStats}>
                      <div>⏰ Réveil: {entry.wakeUpTime || 'Non renseigné'}</div>
                      <div>💪 Sport: {entry.exerciseDone ? `✅ ${entry.exerciseDuration}min` : '❌'}</div>
                      <div>📊 Productif: {entry.productiveHours}h</div>
                      <div>🛡️ Résistances: {entry.distractionsResisted}</div>
                    </div>

                    {entry.truthfulReflection && (
                      <div className={styles.entryReflection}>
                        <strong>Réflexion:</strong>
                        <p>{entry.truthfulReflection}</p>
                      </div>
                    )}

                    {entry.tomorrowCommitment && (
                      <div className={styles.entryCommitment}>
                        <strong>Engagement:</strong>
                        <p>{entry.tomorrowCommitment}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
