'use client'

import { useState, FormEvent, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '../components/Navigation'
import styles from './new.module.css'

export default function NewEntryPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Pré-remplir avec la date et l'heure actuelles
  const now = new Date()
  const dateStr = now.toISOString().split('T')[0]
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes()
  ).padStart(2, '0')}`

  const [formData, setFormData] = useState({
    date: dateStr,
    time: timeStr,
    hasSmoked: false,
    jointCount: 1,
    jointTime: timeStr,
    cravingLevel: 5,
    emotionalState: '',
    physicalState: '',
    context: '',
    trigger: '',
    alternativeAction: '',
    consciousDecision: false,
    comment: '',
  })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/')
          router.refresh() // Force le rechargement des données du dashboard
        }, 1500)
      } else {
        setError(data.error || 'Erreur lors de la création')
      }
    } catch (err) {
      setError('Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    let processedValue: any = value

    // Convertir les nombres
    if (type === 'number' || type === 'range') {
      processedValue = parseInt(value, 10) || 0
    } else if (type === 'checkbox') {
      processedValue = checked
    }

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }))
  }

  const emotionalStates = [
    'Calme',
    'Anxieux',
    'Stressé',
    'Joyeux',
    'Triste',
    'En colère',
    'Ennui',
    'Fatigué',
    'Énergique',
  ]

  const physicalStates = [
    'Bien',
    'Fatigué',
    'Tendu',
    'Relaxé',
    'Douleur',
    'Énergique',
  ]

  const contexts = [
    'Seul',
    'En groupe',
    'Travail',
    'Maison',
    'Extérieur',
    'Soirée',
    'Autre',
  ]

  const triggers = [
    'Stress',
    'Ennui',
    'Social',
    'Routine',
    'Émotion négative',
    'Célébration',
    'Autre',
  ]

  return (
    <div>
      <Navigation />
      <div className={styles.container}>
        <h1 className={styles.title}>Nouvelle entrée</h1>

        {success && (
          <div className={styles.successMessage}>
            Entrée enregistrée avec succès ! Redirection...
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Date et heure */}
          <div className={styles.row}>
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
              <label htmlFor="time" className={styles.label}>
                Heure *
              </label>
              <input
                id="time"
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                className={styles.input}
                required
              />
            </div>
          </div>

          {/* Ai-je fumé ? */}
          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="hasSmoked"
                checked={formData.hasSmoked}
                onChange={handleChange}
                className={styles.checkbox}
              />
              <span>Ai-je fumé ?</span>
            </label>
          </div>

          {/* Si fumé, afficher les champs supplémentaires */}
          {formData.hasSmoked && (
            <>
              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label htmlFor="jointCount" className={styles.label}>
                    Nombre de joints *
                  </label>
                  <input
                    id="jointCount"
                    type="number"
                    name="jointCount"
                    value={formData.jointCount}
                    onChange={handleChange}
                    className={styles.input}
                    min="0"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="jointTime" className={styles.label}>
                    Heure du joint
                  </label>
                  <input
                    id="jointTime"
                    type="time"
                    name="jointTime"
                    value={formData.jointTime}
                    onChange={handleChange}
                    className={styles.input}
                  />
                </div>
              </div>
            </>
          )}

          {/* Envie de fumer */}
          <div className={styles.formGroup}>
            <label htmlFor="cravingLevel" className={styles.label}>
              Envie de fumer (0-10) : {formData.cravingLevel}
            </label>
            <input
              id="cravingLevel"
              type="range"
              name="cravingLevel"
              value={formData.cravingLevel}
              onChange={handleChange}
              className={styles.slider}
              min="0"
              max="10"
            />
          </div>

          {/* État émotionnel */}
          <div className={styles.formGroup}>
            <label htmlFor="emotionalState" className={styles.label}>
              État émotionnel
            </label>
            <select
              id="emotionalState"
              name="emotionalState"
              value={formData.emotionalState}
              onChange={handleChange}
              className={styles.select}
            >
              <option value="">-- Sélectionner --</option>
              {emotionalStates.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>

          {/* État physique */}
          <div className={styles.formGroup}>
            <label htmlFor="physicalState" className={styles.label}>
              État physique
            </label>
            <select
              id="physicalState"
              name="physicalState"
              value={formData.physicalState}
              onChange={handleChange}
              className={styles.select}
            >
              <option value="">-- Sélectionner --</option>
              {physicalStates.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>

          {/* Contexte */}
          <div className={styles.formGroup}>
            <label htmlFor="context" className={styles.label}>
              Contexte / Activité
            </label>
            <select
              id="context"
              name="context"
              value={formData.context}
              onChange={handleChange}
              className={styles.select}
            >
              <option value="">-- Sélectionner --</option>
              {contexts.map((ctx) => (
                <option key={ctx} value={ctx}>
                  {ctx}
                </option>
              ))}
            </select>
          </div>

          {/* Déclencheur */}
          <div className={styles.formGroup}>
            <label htmlFor="trigger" className={styles.label}>
              Déclencheur
            </label>
            <select
              id="trigger"
              name="trigger"
              value={formData.trigger}
              onChange={handleChange}
              className={styles.select}
            >
              <option value="">-- Sélectionner --</option>
              {triggers.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Action alternative (si pas fumé) */}
          {!formData.hasSmoked && (
            <div className={styles.formGroup}>
              <label htmlFor="alternativeAction" className={styles.label}>
                Action alternative (si pas fumé)
              </label>
              <input
                id="alternativeAction"
                type="text"
                name="alternativeAction"
                value={formData.alternativeAction}
                onChange={handleChange}
                className={styles.input}
                placeholder="Ex: Marché, méditation, sport..."
              />
            </div>
          )}

          {/* Décision consciente */}
          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="consciousDecision"
                checked={formData.consciousDecision}
                onChange={handleChange}
                className={styles.checkbox}
              />
              <span>Décision consciente</span>
            </label>
          </div>

          {/* Commentaire */}
          <div className={styles.formGroup}>
            <label htmlFor="comment" className={styles.label}>
              Commentaire libre
            </label>
            <textarea
              id="comment"
              name="comment"
              value={formData.comment}
              onChange={handleChange}
              className={styles.textarea}
              rows={4}
              placeholder="Vos pensées, observations..."
            />
          </div>

          {/* Erreur */}
          {error && <div className={styles.error}>{error}</div>}

          {/* Boutons */}
          <div className={styles.buttonRow}>
            <button
              type="button"
              onClick={() => router.push('/')}
              className={styles.cancelButton}
            >
              Annuler
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
