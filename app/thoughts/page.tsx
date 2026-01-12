'use client'

import { useState, useEffect } from 'react'
import Navigation from '../components/Navigation'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import styles from './thoughts.module.css'

interface Thought {
  id: string
  content: string
  createdAt: string
}

export default function ThoughtsPage() {
  const [thoughts, setThoughts] = useState<Thought[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [newThought, setNewThought] = useState('')

  // Reconnaissance vocale
  const {
    isListening,
    isSupported,
    startListening,
    stopListening,
    transcript,
  } = useSpeechRecognition({
    onResult: (text) => {
      // Ajouter le texte reconnu au textarea
      setNewThought((prev) => {
        const separator = prev.trim() ? ' ' : ''
        return prev + separator + text
      })
    },
    onError: (error) => {
      alert(`❌ ${error}`)
    },
    continuous: true, // Mode continu - ne s'arrête pas tout seul!
    language: 'fr-FR',
  })

  useEffect(() => {
    fetchThoughts()
  }, [])

  const fetchThoughts = async () => {
    try {
      const response = await fetch('/api/thoughts')
      const data = await response.json()
      if (data.success) {
        setThoughts(data.thoughts || [])
      }
    } catch (error) {
      console.error('Erreur chargement pensées:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newThought.trim()) {
      alert('Écris quelque chose')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/thoughts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newThought }),
      })

      const data = await response.json()

      if (data.success) {
        setNewThought('')
        fetchThoughts()
      } else {
        alert('❌ Erreur: ' + (data.error || 'Impossible de sauvegarder'))
      }
    } catch (error) {
      alert('❌ Erreur de connexion')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleRecording = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div>
      <Navigation />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>💭 Mes Pensées</h1>
          <p className={styles.subtitle}>
            Note tes pensées, envies, réflexions. Chaque pensée est horodatée pour analyse.
          </p>
        </div>

        {/* Formulaire rapide */}
        <div className={styles.quickAdd}>
          <div className={styles.quickAddHeader}>
            <h2>📝 Note une pensée</h2>
            {isSupported ? (
              <button
                type="button"
                onClick={toggleRecording}
                className={`${styles.micButton} ${isListening ? styles.micButtonActive : ''}`}
                disabled={submitting}
                title={isListening ? 'Arrêter l\'enregistrement' : 'Parler au lieu d\'écrire'}
              >
                {isListening ? (
                  <>
                    <span className={styles.micIcon}>🔴</span>
                    <span className={styles.micText}>Arrêter</span>
                  </>
                ) : (
                  <>
                    <span className={styles.micIcon}>🎤</span>
                    <span className={styles.micText}>Parler</span>
                  </>
                )}
              </button>
            ) : (
              <div className={styles.notSupported} title="Utilise Chrome, Edge ou Safari pour la reconnaissance vocale">
                ⚠️ Micro non disponible
              </div>
            )}
          </div>

          {!isSupported && (
            <div className={styles.browserHint}>
              💡 <strong>Astuce:</strong> La reconnaissance vocale fonctionne sur Chrome, Edge et Safari.
              {typeof window !== 'undefined' && navigator.userAgent.includes('Firefox') && (
                <span> Firefox ne supporte pas encore cette fonctionnalité.</span>
              )}
            </div>
          )}

          {isListening && (
            <div className={styles.listeningIndicator}>
              <span className={styles.pulse}></span>
              <span>🎤 J'écoute... Prends ton temps! Clique "🔴 Arrêter" quand tu as fini.</span>
            </div>
          )}

          {transcript && isListening && (
            <div className={styles.liveTranscript}>
              <span className={styles.liveLabel}>En cours:</span> {transcript}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            <textarea
              value={newThought}
              onChange={(e) => setNewThought(e.target.value)}
              placeholder="Qu'est-ce qui te passe par la tête ? (Écris ou parle 🎤)"
              className={styles.textarea}
              rows={4}
              disabled={submitting}
            />
            <button
              type="submit"
              className={styles.submitButton}
              disabled={submitting || !newThought.trim()}
            >
              {submitting ? 'Enregistrement...' : '💾 Enregistrer'}
            </button>
          </form>
        </div>

        {/* Historique des pensées */}
        <div className={styles.history}>
          <h2>📜 Historique ({thoughts.length} pensées)</h2>

          {loading ? (
            <p>Chargement...</p>
          ) : thoughts.length === 0 ? (
            <p className={styles.empty}>Aucune pensée enregistrée. Note ta première !</p>
          ) : (
            <div className={styles.thoughtsList}>
              {thoughts.map((thought) => (
                <div key={thought.id} className={styles.thoughtCard}>
                  <div className={styles.thoughtHeader}>
                    <span className={styles.thoughtDate}>
                      {formatDate(thought.createdAt)}
                    </span>
                  </div>
                  <div className={styles.thoughtContent}>{thought.content}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
