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

export default function ReadingPage() {
  const [readings, setReadings] = useState<Reading[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReading, setSelectedReading] = useState<Reading | null>(null)
  const [notes, setNotes] = useState('')

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
  const byCategory = readings.reduce((acc, reading) => {
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
        <h1 className={styles.title}>📚 Mes Lectures</h1>

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
