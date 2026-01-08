'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navigation from '@/app/components/Navigation'
import styles from './entry.module.css'

interface Entry {
  id: string
  date: string
  time: string
  hasSmoked: boolean
  jointCount: number
  jointTime: string | null
  minutesSinceLastJoint: number | null
  cravingLevel: number
  emotionalState: string
  physicalState: string
  context: string
  trigger: string
  alternativeAction: string
  consciousDecision: boolean
  comment: string
}

export default function EntryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [entry, setEntry] = useState<Entry | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<Partial<Entry>>({})

  const triggerCategories = {
    'Émotions': [
      'Stress intense',
      'Anxiété',
      'Ennui profond',
      'Tristesse / Déprime',
      'Colère / Frustration',
      'Solitude',
      'Euphorie / Excitation',
    ],
    'Contexte social': [
      'Pression des amis',
      'Fête / Soirée',
      'Voir d\'autres fumer',
      'Conversation difficile',
      'Conflit relationnel',
      'Isolement social',
    ],
    'Moments de la journée': [
      'Réveil',
      'Pause café',
      'Après le repas',
      'Fin de journée de travail',
      'Soirée à la maison',
      'Avant de dormir',
      'Weekend / Jour off',
    ],
    'État physique': [
      'Fatigue extrême',
      'Douleur physique',
      'Manque de sommeil',
      'Après effort physique',
      'Maladie / Mal-être',
    ],
    'Environnement': [
      'Chez moi (habitude)',
      'Lieu habituel de conso',
      'Disponibilité facile',
      'Objet déclencheur (briquet, etc)',
      'Odeur / Stimulus sensoriel',
    ],
    'Activités': [
      'Rien à faire',
      'Procrastination',
      'Avant tâche difficile',
      'Après effort mental',
      'Pause travail',
      'Activité routinière (conduite, etc)',
    ],
    'États mentaux': [
      'Pensées obsédantes',
      'Envie soudaine inexpliquée',
      'Rationalisation ("juste une fois")',
      'Test de volonté',
      'Nostalgie de la sensation',
    ],
    'Autre': [
      'Autre (préciser en commentaire)',
    ],
  }

  useEffect(() => {
    if (params.id) {
      fetchEntry(params.id as string)
    }
  }, [params.id])

  const fetchEntry = async (id: string) => {
    try {
      const response = await fetch(`/api/entries/${id}`)
      const data = await response.json()
      if (data.success && data.entry) {
        setEntry(data.entry)
        setFormData(data.entry)
      } else {
        alert('Entrée non trouvée')
        router.push('/history')
      }
    } catch (error) {
      console.error('Erreur chargement entrée:', error)
      alert('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) || 0 : value,
    }))
  }

  const handleSave = async () => {
    if (!entry) return

    setSaving(true)

    try {
      const response = await fetch(`/api/entries/${entry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        setEntry(data.entry)
        setEditing(false)
        alert('✅ Entrée mise à jour !')
      } else {
        alert('❌ Erreur: ' + (data.error || 'Impossible de sauvegarder'))
      }
    } catch (error) {
      alert('❌ Erreur de connexion')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!entry) return

    if (!confirm('Êtes-vous sûr de vouloir supprimer cette entrée ?')) return

    try {
      const response = await fetch(`/api/entries/${entry.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        alert('✅ Entrée supprimée')
        router.push('/history')
      } else {
        alert('❌ Erreur de suppression')
      }
    } catch (error) {
      alert('❌ Erreur de connexion')
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
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

  if (!entry) {
    return (
      <div>
        <Navigation />
        <div className={styles.container}>
          <p>Entrée non trouvée</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Navigation />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            {editing ? 'Modifier l\'entrée' : 'Détails de l\'entrée'}
          </h1>
          <div className={styles.actions}>
            {!editing ? (
              <>
                <button onClick={() => setEditing(true)} className={styles.editButton}>
                  ✏️ Modifier
                </button>
                <button onClick={handleDelete} className={styles.deleteButton}>
                  🗑️ Supprimer
                </button>
              </>
            ) : (
              <>
                <button onClick={handleSave} disabled={saving} className={styles.saveButton}>
                  {saving ? 'Sauvegarde...' : '✓ Sauvegarder'}
                </button>
                <button
                  onClick={() => {
                    setEditing(false)
                    setFormData(entry)
                  }}
                  disabled={saving}
                  className={styles.cancelButton}
                >
                  ✕ Annuler
                </button>
              </>
            )}
          </div>
        </div>

        <div className={styles.card}>
          <h2>{formatDate(entry.date)}</h2>

          <div className={styles.form}>
            {/* Date et heure */}
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Date</label>
                {editing ? (
                  <input
                    type="date"
                    name="date"
                    value={formData.date?.split('T')[0] || ''}
                    onChange={handleChange}
                    className={styles.input}
                  />
                ) : (
                  <p className={styles.value}>{formatDate(entry.date)}</p>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>Heure</label>
                {editing ? (
                  <input
                    type="time"
                    name="time"
                    value={formData.time || ''}
                    onChange={handleChange}
                    className={styles.input}
                  />
                ) : (
                  <p className={styles.value}>{entry.time}</p>
                )}
              </div>
            </div>

            {/* A fumé */}
            <div className={styles.formGroup}>
              <label>As-tu fumé ?</label>
              {editing ? (
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    name="hasSmoked"
                    checked={formData.hasSmoked || false}
                    onChange={handleChange}
                  />
                  <span>Oui, j'ai fumé</span>
                </label>
              ) : (
                <p className={styles.value}>
                  <span className={entry.hasSmoked ? styles.badgeYes : styles.badgeNo}>
                    {entry.hasSmoked ? 'Oui' : 'Non'}
                  </span>
                </p>
              )}
            </div>

            {/* Nombre de joints */}
            {(editing ? formData.hasSmoked : entry.hasSmoked) && (
              <div className={styles.formGroup}>
                <label>Nombre de joints</label>
                {editing ? (
                  <input
                    type="number"
                    name="jointCount"
                    value={formData.jointCount || 0}
                    onChange={handleChange}
                    className={styles.input}
                    min="0"
                  />
                ) : (
                  <p className={styles.value}>{entry.jointCount}</p>
                )}
              </div>
            )}

            {/* Niveau d'envie */}
            <div className={styles.formGroup}>
              <label>Niveau d'envie (0-10)</label>
              {editing ? (
                <input
                  type="range"
                  name="cravingLevel"
                  value={formData.cravingLevel || 0}
                  onChange={handleChange}
                  className={styles.range}
                  min="0"
                  max="10"
                />
              ) : (
                <p className={styles.value}>
                  <span className={styles.cravingBadge}>{entry.cravingLevel}/10</span>
                </p>
              )}
              {editing && <span className={styles.rangeValue}>{formData.cravingLevel}/10</span>}
            </div>

            {/* État émotionnel */}
            <div className={styles.formGroup}>
              <label>État émotionnel</label>
              {editing ? (
                <input
                  type="text"
                  name="emotionalState"
                  value={formData.emotionalState || ''}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Ex: stressé, calme, anxieux..."
                />
              ) : (
                <p className={styles.value}>{entry.emotionalState || '-'}</p>
              )}
            </div>

            {/* État physique */}
            <div className={styles.formGroup}>
              <label>État physique</label>
              {editing ? (
                <input
                  type="text"
                  name="physicalState"
                  value={formData.physicalState || ''}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Ex: fatigué, énergique..."
                />
              ) : (
                <p className={styles.value}>{entry.physicalState || '-'}</p>
              )}
            </div>

            {/* Contexte */}
            <div className={styles.formGroup}>
              <label>Contexte</label>
              {editing ? (
                <input
                  type="text"
                  name="context"
                  value={formData.context || ''}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Où étais-tu ? Avec qui ?"
                />
              ) : (
                <p className={styles.value}>{entry.context || '-'}</p>
              )}
            </div>

            {/* Déclencheur */}
            <div className={styles.formGroup}>
              <label>Déclencheur</label>
              {editing ? (
                <select
                  name="trigger"
                  value={formData.trigger || ''}
                  onChange={handleChange}
                  className={styles.select}
                >
                  <option value="">-- Identifier le déclencheur --</option>
                  {Object.entries(triggerCategories).map(([category, triggers]) => (
                    <optgroup key={category} label={category}>
                      {triggers.map((trigger) => (
                        <option key={trigger} value={trigger}>
                          {trigger}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              ) : (
                <p className={styles.value}>{entry.trigger || '-'}</p>
              )}
            </div>

            {/* Action alternative */}
            <div className={styles.formGroup}>
              <label>Action alternative</label>
              {editing ? (
                <textarea
                  name="alternativeAction"
                  value={formData.alternativeAction || ''}
                  onChange={handleChange}
                  className={styles.textarea}
                  placeholder="Qu'as-tu fait à la place ?"
                  rows={3}
                />
              ) : (
                <p className={styles.value}>{entry.alternativeAction || '-'}</p>
              )}
            </div>

            {/* Décision consciente */}
            <div className={styles.formGroup}>
              <label>Décision consciente ?</label>
              {editing ? (
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    name="consciousDecision"
                    checked={formData.consciousDecision || false}
                    onChange={handleChange}
                  />
                  <span>Oui, c'était une décision consciente</span>
                </label>
              ) : (
                <p className={styles.value}>
                  {entry.consciousDecision ? '✓ Oui' : '✗ Non'}
                </p>
              )}
            </div>

            {/* Commentaire */}
            <div className={styles.formGroup}>
              <label>Commentaire</label>
              {editing ? (
                <textarea
                  name="comment"
                  value={formData.comment || ''}
                  onChange={handleChange}
                  className={styles.textarea}
                  placeholder="Notes supplémentaires..."
                  rows={4}
                />
              ) : (
                <p className={styles.value}>{entry.comment || '-'}</p>
              )}
            </div>
          </div>

          <div className={styles.backButton}>
            <button onClick={() => router.push('/history')} className={styles.button}>
              ← Retour à l'historique
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
