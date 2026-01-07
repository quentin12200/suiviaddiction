'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
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
  createdAt: string
  updatedAt: string
}

export default function EntryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [entry, setEntry] = useState<Entry | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (params.id) {
      fetchEntry(params.id as string)
    }
  }, [params.id])

  const fetchEntry = async (id: string) => {
    try {
      const response = await fetch(`/api/entries/${id}`)
      const data = await response.json()

      if (data.entry) {
        setEntry(data.entry)
      } else {
        setError('Entrée non trouvée')
      }
    } catch (error) {
      console.error('Erreur chargement entrée:', error)
      setError('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!entry || !confirm('Êtes-vous sûr de vouloir supprimer cette entrée ?')) {
      return
    }

    try {
      const response = await fetch(`/api/entries/${entry.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/history')
      } else {
        setError('Erreur lors de la suppression')
      }
    } catch (err) {
      setError('Erreur de connexion au serveur')
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

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('fr-FR')
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

  if (error || !entry) {
    return (
      <div>
        <Navigation />
        <div className={styles.container}>
          <div className={styles.error}>{error || 'Entrée non trouvée'}</div>
          <button onClick={() => router.push('/history')} className={styles.backButton}>
            Retour à l&apos;historique
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Navigation />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Détail de l&apos;entrée</h1>
          <div className={styles.headerActions}>
            <button onClick={() => router.push('/history')} className={styles.backButton}>
              Retour
            </button>
            <button onClick={handleDelete} className={styles.deleteButton}>
              Supprimer
            </button>
          </div>
        </div>

        <div className={styles.card}>
          {/* Informations principales */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Informations générales</h2>
            <div className={styles.grid}>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Date</span>
                <span className={styles.fieldValue}>{formatDate(entry.date)}</span>
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Heure</span>
                <span className={styles.fieldValue}>{entry.time}</span>
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Consommation</span>
                <span className={entry.hasSmoked ? styles.badgeYes : styles.badgeNo}>
                  {entry.hasSmoked ? 'Oui' : 'Non'}
                </span>
              </div>
              {entry.hasSmoked && (
                <>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Nombre de joints</span>
                    <span className={styles.fieldValue}>{entry.jointCount}</span>
                  </div>
                  {entry.jointTime && (
                    <div className={styles.field}>
                      <span className={styles.fieldLabel}>Heure du joint</span>
                      <span className={styles.fieldValue}>{entry.jointTime}</span>
                    </div>
                  )}
                  {entry.minutesSinceLastJoint !== null && (
                    <div className={styles.field}>
                      <span className={styles.fieldLabel}>Temps depuis dernier joint</span>
                      <span className={styles.fieldValue}>
                        {Math.floor(entry.minutesSinceLastJoint / 60)}h{' '}
                        {entry.minutesSinceLastJoint % 60}min
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

          {/* État mental et physique */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>État mental et physique</h2>
            <div className={styles.grid}>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Niveau d&apos;envie</span>
                <span className={styles.cravingBadge}>
                  {entry.cravingLevel}/10
                </span>
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>État émotionnel</span>
                <span className={styles.fieldValue}>
                  {entry.emotionalState || 'Non renseigné'}
                </span>
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>État physique</span>
                <span className={styles.fieldValue}>
                  {entry.physicalState || 'Non renseigné'}
                </span>
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Décision consciente</span>
                <span className={entry.consciousDecision ? styles.badgeYes : styles.badgeNo}>
                  {entry.consciousDecision ? 'Oui' : 'Non'}
                </span>
              </div>
            </div>
          </section>

          {/* Contexte */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Contexte</h2>
            <div className={styles.grid}>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Contexte / Activité</span>
                <span className={styles.fieldValue}>
                  {entry.context || 'Non renseigné'}
                </span>
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Déclencheur</span>
                <span className={styles.fieldValue}>
                  {entry.trigger || 'Non renseigné'}
                </span>
              </div>
              {entry.alternativeAction && (
                <div className={styles.field}>
                  <span className={styles.fieldLabel}>Action alternative</span>
                  <span className={styles.fieldValue}>{entry.alternativeAction}</span>
                </div>
              )}
            </div>
          </section>

          {/* Commentaire */}
          {entry.comment && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Commentaire</h2>
              <div className={styles.comment}>{entry.comment}</div>
            </section>
          )}

          {/* Métadonnées */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Métadonnées</h2>
            <div className={styles.grid}>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Créé le</span>
                <span className={styles.fieldValue}>
                  {formatDateTime(entry.createdAt)}
                </span>
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Modifié le</span>
                <span className={styles.fieldValue}>
                  {formatDateTime(entry.updatedAt)}
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
