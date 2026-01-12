'use client'

import { useEffect, useState } from 'react'
import Navigation from '../../components/Navigation'
import Link from 'next/link'
import styles from './tracker.module.css'

interface AtomicHabit {
  id: string
  name: string
  category: string
  duration: number
  trackingMethod: string
  replacesAddiction: boolean
}

interface HabitCompletion {
  id: string
  habitId: string
  completed: boolean
  value?: number
  duration?: number
  note: string
}

interface HabitWithCompletion extends AtomicHabit {
  completion?: HabitCompletion
  streak?: number
}

export default function HabitTrackerPage() {
  const [habits, setHabits] = useState<HabitWithCompletion[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })

  useEffect(() => {
    fetchHabits()
  }, [selectedDate])

  const fetchHabits = async () => {
    try {
      const response = await fetch('/api/habits')
      const data = await response.json()

      if (data.success) {
        const habitsData = data.habits || []

        // Pour chaque habitude, récupérer sa complétion pour la date sélectionnée
        const habitsWithCompletions = await Promise.all(
          habitsData.map(async (habit: AtomicHabit) => {
            try {
              const completionRes = await fetch(
                `/api/habits/${habit.id}/complete?startDate=${selectedDate}&endDate=${selectedDate}`
              )
              const completionData = await completionRes.json()

              const completion = completionData.completions?.[0]

              return {
                ...habit,
                completion,
                streak: habit.stats?.currentStreak || 0,
              }
            } catch (error) {
              return { ...habit, streak: 0 }
            }
          })
        )

        setHabits(habitsWithCompletions)
      }
    } catch (error) {
      console.error('Erreur chargement habitudes:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleHabitCompletion = async (habitId: string, currentCompleted: boolean) => {
    try {
      const response = await fetch(`/api/habits/${habitId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          completed: !currentCompleted,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Mettre à jour l'UI
        fetchHabits()
      }
    } catch (error) {
      console.error('Erreur toggle habitude:', error)
    }
  }

  const changeDate = (direction: number) => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() + direction)
    setSelectedDate(date.toISOString().split('T')[0])
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const selectedD = new Date(date)
    selectedD.setHours(0, 0, 0, 0)

    if (selectedD.getTime() === today.getTime()) {
      return "Aujourd'hui"
    }

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (selectedD.getTime() === yesterday.getTime()) {
      return 'Hier'
    }

    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
  }

  const completedCount = habits.filter((h) => h.completion?.completed).length
  const totalCount = habits.length

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
          <h1 className={styles.title}>📊 Tracker d'Habitudes</h1>
          <Link href="/habits" className={styles.manageLink}>
            ⚙️ Gérer mes habitudes
          </Link>
        </div>

        {/* Sélecteur de date */}
        <div className={styles.dateSelector}>
          <button onClick={() => changeDate(-1)} className={styles.dateButton}>
            ← Jour précédent
          </button>

          <div className={styles.currentDate}>
            <div className={styles.dateLarge}>{formatDate(selectedDate)}</div>
            <div className={styles.dateSmall}>{selectedDate}</div>
          </div>

          <button
            onClick={() => changeDate(1)}
            className={styles.dateButton}
            disabled={selectedDate >= new Date().toISOString().split('T')[0]}
          >
            Jour suivant →
          </button>
        </div>

        {/* Progression du jour */}
        <div className={styles.progressCard}>
          <h3>Progression du jour</h3>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
            />
          </div>
          <div className={styles.progressText}>
            {completedCount} / {totalCount} habitudes complétées (
            {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%)
          </div>
        </div>

        {/* Liste des habitudes */}
        {habits.length === 0 ? (
          <div className={styles.empty}>
            <p>Aucune habitude active.</p>
            <Link href="/habits" className={styles.addButton}>
              ➕ Créer ma première habitude
            </Link>
          </div>
        ) : (
          <div className={styles.habitsList}>
            {habits.map((habit) => (
              <div
                key={habit.id}
                className={`${styles.habitCard} ${
                  habit.completion?.completed ? styles.habitCompleted : ''
                }`}
              >
                <div className={styles.habitMain}>
                  <div className={styles.habitInfo}>
                    <div className={styles.habitName}>
                      {habit.name}
                      {habit.replacesAddiction && (
                        <span className={styles.badge}>🚭 Alternative</span>
                      )}
                    </div>
                    <div className={styles.habitMeta}>
                      <span className={styles.category}>{habit.category}</span>
                      <span className={styles.duration}>{habit.duration} min</span>
                      {habit.streak !== undefined && habit.streak > 0 && (
                        <span className={styles.streak}>🔥 {habit.streak} jours</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      toggleHabitCompletion(
                        habit.id,
                        habit.completion?.completed || false
                      )
                    }
                    className={`${styles.checkButton} ${
                      habit.completion?.completed ? styles.checked : ''
                    }`}
                  >
                    {habit.completion?.completed ? '✅' : '⭕'}
                  </button>
                </div>

                {habit.completion?.note && (
                  <div className={styles.habitNote}>
                    <strong>Note:</strong> {habit.completion.note}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Motivation */}
        {completedCount === totalCount && totalCount > 0 && (
          <div className={styles.celebration}>
            <h2>🎉 Félicitations !</h2>
            <p>Tu as complété toutes tes habitudes aujourd'hui !</p>
            <p className={styles.quote}>
              "Chaque action que tu entreprends est un vote pour la personne que tu veux devenir"
              <br />
              <em>- James Clear</em>
            </p>
          </div>
        )}

        {completedCount === 0 && totalCount > 0 && (
          <div className={styles.motivation}>
            <h3>💪 Commence par une petite action</h3>
            <p>
              La loi du moindre effort: commence par l'habitude la plus facile.
              <br />
              Une fois lancé, c'est beaucoup plus facile de continuer !
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
