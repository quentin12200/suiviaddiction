'use client'

import { useEffect, useState } from 'react'
import Navigation from '../components/Navigation'
import styles from './discipline.module.css'

interface Entry {
  id: string
  date: string
  time: string
  hasSmoked: boolean
  jointCount: number
  cravingLevel: number
  emotionalState: string
  physicalState: string
  context: string
  trigger: string
  alternativeAction: string
  comment: string
}

interface Challenge {
  entryId: string
  question: string
  answered: boolean
  answer: string
}

export default function DisciplinePage() {
  const [todayEntries, setTodayEntries] = useState<Entry[]>([])
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [currentChallenge, setCurrentChallenge] = useState(0)

  useEffect(() => {
    fetchTodayEntries()
  }, [])

  const fetchTodayEntries = async () => {
    try {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const todayString = `${year}-${month}-${day}`

      const response = await fetch('/api/discipline/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: todayString }),
      })

      const data = await response.json()

      if (data.success) {
        setTodayEntries(data.entries)
        setChallenges(data.challenges)
      }
    } catch (error) {
      console.error('Erreur chargement discipline:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = (answer: string) => {
    const updated = [...challenges]
    updated[currentChallenge].answered = true
    updated[currentChallenge].answer = answer
    setChallenges(updated)

    // Sauvegarder localement
    localStorage.setItem('disciplineAnswers', JSON.stringify(updated))

    // Passer à la question suivante
    if (currentChallenge < challenges.length - 1) {
      setCurrentChallenge(currentChallenge + 1)
    }
  }

  if (loading) {
    return (
      <div>
        <Navigation />
        <div className={styles.container}>
          <p>Analyse de ta journée...</p>
        </div>
      </div>
    )
  }

  const smokedEntries = todayEntries.filter(e => e.hasSmoked)
  const totalJoints = smokedEntries.reduce((sum, e) => sum + e.jointCount, 0)
  const answeredCount = challenges.filter(c => c.answered).length

  return (
    <div>
      <Navigation />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>🔥 Remise en Question</h1>
          <p className={styles.subtitle}>
            Confrontons tes choix d&apos;aujourd&apos;hui
          </p>
        </div>

        {/* Résumé du jour */}
        <div className={styles.summaryCard}>
          <h2>Résumé du jour</h2>
          <div className={styles.stats}>
            <div className={styles.statItem}>
              <div className={styles.statValue}>{todayEntries.length}</div>
              <div className={styles.statLabel}>Entrées enregistrées</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statValue}>{totalJoints}</div>
              <div className={styles.statLabel}>Joints fumés</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statValue}>{answeredCount}/{challenges.length}</div>
              <div className={styles.statLabel}>Questions répondues</div>
            </div>
          </div>

          {/* Alerte si peu d'entrées */}
          {todayEntries.length < 3 && (
            <div className={styles.warning}>
              <h3>⚠️ Suivi Insuffisant</h3>
              <p>
                Tu n&apos;as enregistré que {todayEntries.length} entrée{todayEntries.length > 1 ? 's' : ''} aujourd&apos;hui.
                <br />
                <strong>Le suivi est essentiel</strong> pour comprendre tes patterns et progresser.
                <br />
                Sans données précises, tu te mens à toi-même.
              </p>
              <button onClick={() => window.location.href = '/new'} className={styles.addButton}>
                ➕ Ajouter une entrée MAINTENANT
              </button>
            </div>
          )}
        </div>

        {/* Questions de remise en question */}
        {challenges.length > 0 ? (
          <div className={styles.challengeSection}>
            <h2>
              Question {currentChallenge + 1} sur {challenges.length}
            </h2>

            <div className={styles.challengeCard}>
              <div className={styles.questionNumber}>
                {currentChallenge + 1}/{challenges.length}
              </div>

              <div className={styles.question}>
                {challenges[currentChallenge].question}
              </div>

              {!challenges[currentChallenge].answered ? (
                <div className={styles.answerSection}>
                  <textarea
                    className={styles.answerInput}
                    placeholder="Réponds honnêtement. Pas d'excuses, juste la vérité..."
                    rows={6}
                    id="answerText"
                  />
                  <button
                    onClick={() => {
                      const textarea = document.getElementById('answerText') as HTMLTextAreaElement
                      if (textarea.value.trim()) {
                        handleAnswer(textarea.value)
                        textarea.value = ''
                      } else {
                        alert('Réponds à la question. Sois honnête avec toi-même.')
                      }
                    }}
                    className={styles.submitAnswer}
                  >
                    Valider ma réponse
                  </button>
                </div>
              ) : (
                <div className={styles.answeredSection}>
                  <div className={styles.yourAnswer}>
                    <strong>Ta réponse :</strong>
                    <p>{challenges[currentChallenge].answer}</p>
                  </div>
                  {currentChallenge < challenges.length - 1 && (
                    <button
                      onClick={() => setCurrentChallenge(currentChallenge + 1)}
                      className={styles.nextButton}
                    >
                      Question suivante →
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Navigation entre questions */}
            <div className={styles.navigation}>
              {challenges.map((c, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentChallenge(index)}
                  className={`${styles.navDot} ${index === currentChallenge ? styles.active : ''} ${c.answered ? styles.answered : ''}`}
                />
              ))}
            </div>

            {/* Résumé final si toutes les questions sont répondues */}
            {answeredCount === challenges.length && (
              <div className={styles.completionCard}>
                <h2>✅ Réflexion Terminée</h2>
                <p>
                  Tu as répondu à toutes les questions. Maintenant, la vraie question :
                </p>
                <div className={styles.finalQuestion}>
                  Que vas-tu faire DIFFÉREMMENT demain ?
                </div>
                <button
                  onClick={() => window.location.href = '/'}
                  className={styles.finishButton}
                >
                  Retour au tableau de bord
                </button>
              </div>
            )}
          </div>
        ) : smokedEntries.length === 0 ? (
          <div className={styles.noChallenges}>
            <h2>🎉 Aucun joint aujourd&apos;hui !</h2>
            <p>Continue comme ça. Reste vigilant.</p>
          </div>
        ) : (
          <div className={styles.noChallenges}>
            <p>Aucune question générée pour le moment.</p>
          </div>
        )}

        {/* Liste des entrées du jour */}
        {todayEntries.length > 0 && (
          <div className={styles.entriesSection}>
            <h2>Tes entrées d&apos;aujourd&apos;hui</h2>
            <div className={styles.entriesList}>
              {todayEntries.map((entry) => (
                <div key={entry.id} className={styles.entryItem}>
                  <div className={styles.entryTime}>{entry.time}</div>
                  <div className={styles.entryContent}>
                    {entry.hasSmoked ? (
                      <div className={styles.smoked}>
                        🚬 {entry.jointCount} joint{entry.jointCount > 1 ? 's' : ''}
                        {entry.trigger && <span className={styles.trigger}> → {entry.trigger}</span>}
                      </div>
                    ) : (
                      <div className={styles.notSmoked}>
                        ✅ Pas fumé (envie: {entry.cravingLevel}/10)
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
