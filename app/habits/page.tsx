'use client'

import { useEffect, useState } from 'react'
import Navigation from '../components/Navigation'
import styles from './habits.module.css'

interface AtomicHabit {
  id: string
  name: string
  trigger: string
  identity: string
  stackAfter: string | null
  visualCue: string | null
  reward: string | null
  pleasure: string | null
  difficulty: string
  preparation: string | null
  duration: number
  trackingMethod: string
  category: string
  isActive: boolean
  isPositive: boolean
  replacesAddiction: boolean
  stats?: {
    currentStreak: number
    longestStreak: number
    totalCompletions: number
    completionRate: number
  }
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<AtomicHabit[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    // Step 1: Make it Obvious
    name: '',
    trigger: '',
    identity: '',
    stackAfter: '',
    visualCue: '',

    // Step 2: Make it Attractive
    reward: '',
    pleasure: '',

    // Step 3: Make it Easy
    difficulty: 'easy',
    preparation: '',
    duration: '5',

    // Step 4: Make it Satisfying
    trackingMethod: 'checkbox',

    // Métadonnées
    category: 'general',
    isPositive: true,
    replacesAddiction: false,
  })

  useEffect(() => {
    fetchHabits()
  }, [])

  const fetchHabits = async () => {
    try {
      const response = await fetch('/api/habits')
      const data = await response.json()
      if (data.success) {
        setHabits(data.habits || [])
      }
    } catch (error) {
      console.error('Erreur chargement habitudes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        alert('✅ Habitude créée avec succès !')
        setShowForm(false)
        setCurrentStep(1)
        setFormData({
          name: '',
          trigger: '',
          identity: '',
          stackAfter: '',
          visualCue: '',
          reward: '',
          pleasure: '',
          difficulty: 'easy',
          preparation: '',
          duration: '5',
          trackingMethod: 'checkbox',
          category: 'general',
          isPositive: true,
          replacesAddiction: false,
        })
        fetchHabits()
      } else {
        alert('❌ Erreur lors de la création')
      }
    } catch (error) {
      console.error('Erreur création habitude:', error)
      alert('❌ Erreur de connexion')
    }
  }

  const toggleHabitActive = async (habitId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/habits/${habitId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      })

      if (response.ok) {
        fetchHabits()
      }
    } catch (error) {
      console.error('Erreur toggle habitude:', error)
    }
  }

  const deleteHabit = async (habitId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette habitude ?')) return

    try {
      const response = await fetch(`/api/habits/${habitId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        alert('✅ Habitude supprimée')
        fetchHabits()
      }
    } catch (error) {
      console.error('Erreur suppression:', error)
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

  return (
    <div>
      <Navigation />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>🎯 Habitudes Atomiques</h1>
          <p className={styles.subtitle}>
            Construis de nouvelles habitudes solides pour remplacer l'addiction
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className={styles.addButton}
        >
          {showForm ? '❌ Annuler' : '➕ Nouvelle habitude'}
        </button>

        {showForm && (
          <div className={styles.formCard}>
            <h2 className={styles.formTitle}>
              Créer une Habitude Atomique (Méthode James Clear)
            </h2>

            <div className={styles.steps}>
              <div className={`${styles.step} ${currentStep === 1 ? styles.stepActive : ''}`}>
                1. Rendre évident
              </div>
              <div className={`${styles.step} ${currentStep === 2 ? styles.stepActive : ''}`}>
                2. Rendre attractif
              </div>
              <div className={`${styles.step} ${currentStep === 3 ? styles.stepActive : ''}`}>
                3. Rendre facile
              </div>
              <div className={`${styles.step} ${currentStep === 4 ? styles.stepActive : ''}`}>
                4. Rendre satisfaisant
              </div>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              {/* ÉTAPE 1: Make it Obvious */}
              {currentStep === 1 && (
                <div className={styles.stepContent}>
                  <h3>📍 Étape 1: Rendre l'habitude ÉVIDENTE</h3>
                  <p className={styles.stepDescription}>
                    Définis clairement ton habitude et quand tu vas la faire
                  </p>

                  <div className={styles.formGroup}>
                    <label>Nom de l'habitude *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Marcher 20 minutes"
                      required
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>QUAND vas-tu la faire ? (trigger) *</label>
                    <input
                      type="text"
                      name="trigger"
                      value={formData.trigger}
                      onChange={handleInputChange}
                      placeholder="Chaque matin après avoir bu mon café"
                      required
                      className={styles.input}
                    />
                    <small>Exemple: "après mon café", "à 18h", "quand je rentre du travail"</small>
                  </div>

                  <div className={styles.formGroup}>
                    <label>POURQUOI ? Qui veux-tu devenir ? *</label>
                    <input
                      type="text"
                      name="identity"
                      value={formData.identity}
                      onChange={handleInputChange}
                      placeholder="Quelqu'un d'énergique et en forme"
                      required
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Empiler après quelle habitude existante ? (optionnel)</label>
                    <input
                      type="text"
                      name="stackAfter"
                      value={formData.stackAfter}
                      onChange={handleInputChange}
                      placeholder="Après avoir pris ma douche"
                      className={styles.input}
                    />
                    <small>Habit stacking: mettre cette habitude juste après une routine existante</small>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Rappel visuel (optionnel)</label>
                    <input
                      type="text"
                      name="visualCue"
                      value={formData.visualCue}
                      onChange={handleInputChange}
                      placeholder="Mes chaussures devant la porte"
                      className={styles.input}
                    />
                    <small>Quelque chose que tu mets en évidence pour y penser</small>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Catégorie</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className={styles.select}
                    >
                      <option value="general">Général</option>
                      <option value="sport">Sport / Mouvement</option>
                      <option value="meditation">Méditation / Mindfulness</option>
                      <option value="alimentation">Alimentation</option>
                      <option value="lecture">Lecture / Apprentissage</option>
                      <option value="creativite">Créativité</option>
                      <option value="social">Social / Relations</option>
                    </select>
                  </div>

                  <div className={styles.checkboxGroup}>
                    <label>
                      <input
                        type="checkbox"
                        name="replacesAddiction"
                        checked={formData.replacesAddiction}
                        onChange={handleInputChange}
                      />
                      Cette habitude remplace l'envie de fumer
                    </label>
                  </div>
                </div>
              )}

              {/* ÉTAPE 2: Make it Attractive */}
              {currentStep === 2 && (
                <div className={styles.stepContent}>
                  <h3>✨ Étape 2: Rendre l'habitude ATTRACTIVE</h3>
                  <p className={styles.stepDescription}>
                    Associe du plaisir à cette habitude pour avoir envie de la faire
                  </p>

                  <div className={styles.formGroup}>
                    <label>Récompense immédiate (optionnel)</label>
                    <input
                      type="text"
                      name="reward"
                      value={formData.reward}
                      onChange={handleInputChange}
                      placeholder="Une viennoiserie à 15 min de marche"
                      className={styles.input}
                    />
                    <small>Quelque chose de plaisant à obtenir en faisant l'habitude</small>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Élément plaisant pendant l'habitude (optionnel)</label>
                    <input
                      type="text"
                      name="pleasure"
                      value={formData.pleasure}
                      onChange={handleInputChange}
                      placeholder="Écouter mon podcast préféré"
                      className={styles.input}
                    />
                    <small>Musique, podcast, lieu agréable... Temptation bundling!</small>
                  </div>
                </div>
              )}

              {/* ÉTAPE 3: Make it Easy */}
              {currentStep === 3 && (
                <div className={styles.stepContent}>
                  <h3>🚀 Étape 3: Rendre l'habitude FACILE</h3>
                  <p className={styles.stepDescription}>
                    Réduis les frictions pour commencer le plus facilement possible
                  </p>

                  <div className={styles.formGroup}>
                    <label>Durée prévue (en minutes) *</label>
                    <input
                      type="number"
                      name="duration"
                      value={formData.duration}
                      onChange={handleInputChange}
                      min="1"
                      max="120"
                      required
                      className={styles.input}
                    />
                    <small>Commence petit! 5-10 minutes c'est déjà génial</small>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Difficulté</label>
                    <select
                      name="difficulty"
                      value={formData.difficulty}
                      onChange={handleInputChange}
                      className={styles.select}
                    >
                      <option value="easy">Facile</option>
                      <option value="medium">Moyen</option>
                      <option value="hard">Difficile</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Préparation pour faciliter le démarrage (optionnel)</label>
                    <input
                      type="text"
                      name="preparation"
                      value={formData.preparation}
                      onChange={handleInputChange}
                      placeholder="Tenue de sport sur la chaise, livre sur la table"
                      className={styles.input}
                    />
                    <small>Ce que tu prépares à l'avance pour éliminer les frictions</small>
                  </div>
                </div>
              )}

              {/* ÉTAPE 4: Make it Satisfying */}
              {currentStep === 4 && (
                <div className={styles.stepContent}>
                  <h3>🏆 Étape 4: Rendre l'habitude SATISFAISANTE</h3>
                  <p className={styles.stepDescription}>
                    Comment vas-tu tracker et célébrer tes progrès ?
                  </p>

                  <div className={styles.formGroup}>
                    <label>Méthode de suivi</label>
                    <select
                      name="trackingMethod"
                      value={formData.trackingMethod}
                      onChange={handleInputChange}
                      className={styles.select}
                    >
                      <option value="checkbox">Case à cocher (Fait/Pas fait)</option>
                      <option value="counter">Compteur (Nombre de fois)</option>
                      <option value="timer">Durée (Minutes)</option>
                      <option value="yes_no">Oui/Non avec note</option>
                    </select>
                  </div>

                  <div className={styles.summary}>
                    <h4>📋 Résumé de ton habitude:</h4>
                    <p>
                      <strong>Je vais</strong> {formData.name || '___'}{' '}
                      <strong>{formData.trigger ? formData.trigger : '___'}</strong>{' '}
                      <strong>pour que je devienne</strong> {formData.identity || '___'}
                    </p>
                  </div>
                </div>
              )}

              <div className={styles.formActions}>
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className={styles.buttonSecondary}
                  >
                    ← Précédent
                  </button>
                )}

                {currentStep < 4 && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(currentStep + 1)}
                    className={styles.buttonPrimary}
                  >
                    Suivant →
                  </button>
                )}

                {currentStep === 4 && (
                  <button
                    type="submit"
                    className={styles.buttonSuccess}
                  >
                    ✅ Créer l'habitude
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Liste des habitudes */}
        <div className={styles.habitsList}>
          <h2>Mes Habitudes ({habits.length})</h2>

          {habits.length === 0 ? (
            <p className={styles.empty}>
              Aucune habitude pour l'instant. Crée ta première habitude atomique ! 🎯
            </p>
          ) : (
            <div className={styles.habits}>
              {habits.map((habit) => (
                <div
                  key={habit.id}
                  className={`${styles.habitCard} ${!habit.isActive ? styles.habitInactive : ''}`}
                >
                  <div className={styles.habitHeader}>
                    <h3>{habit.name}</h3>
                    {habit.replacesAddiction && (
                      <span className={styles.badge}>🚭 Alternative</span>
                    )}
                    <span className={styles.category}>{habit.category}</span>
                  </div>

                  <div className={styles.habitDetails}>
                    <p>
                      <strong>QUAND:</strong> {habit.trigger}
                    </p>
                    <p>
                      <strong>POUR DEVENIR:</strong> {habit.identity}
                    </p>
                    {habit.pleasure && (
                      <p>
                        <strong>PLAISIR:</strong> {habit.pleasure}
                      </p>
                    )}
                    <p>
                      <strong>DURÉE:</strong> {habit.duration} min
                    </p>
                  </div>

                  {habit.stats && (
                    <div className={styles.stats}>
                      <div className={styles.stat}>
                        <div className={styles.statValue}>{habit.stats.currentStreak}</div>
                        <div className={styles.statLabel}>🔥 Streak actuel</div>
                      </div>
                      <div className={styles.stat}>
                        <div className={styles.statValue}>{habit.stats.totalCompletions}</div>
                        <div className={styles.statLabel}>✅ Total</div>
                      </div>
                      <div className={styles.stat}>
                        <div className={styles.statValue}>{habit.stats.completionRate}%</div>
                        <div className={styles.statLabel}>📊 Taux</div>
                      </div>
                    </div>
                  )}

                  <div className={styles.habitActions}>
                    <button
                      onClick={() => toggleHabitActive(habit.id, habit.isActive)}
                      className={styles.buttonSecondary}
                    >
                      {habit.isActive ? '⏸️ Pause' : '▶️ Activer'}
                    </button>
                    <button
                      onClick={() => deleteHabit(habit.id)}
                      className={styles.buttonDanger}
                    >
                      🗑️
                    </button>
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
