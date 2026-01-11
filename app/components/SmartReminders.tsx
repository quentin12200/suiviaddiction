'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import styles from './SmartReminders.module.css'

interface Reminder {
  type: string
  priority: 'high' | 'medium' | 'low'
  message: string
  action?: string
}

interface RemindersData {
  reminders: Reminder[]
  hasUrgent: boolean
  count: number
}

export default function SmartReminders() {
  const [data, setData] = useState<RemindersData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState<string[]>([])

  useEffect(() => {
    fetchReminders()

    // Rafraîchir toutes les 5 minutes
    const interval = setInterval(fetchReminders, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const fetchReminders = async () => {
    try {
      const response = await fetch('/api/reminders/check')
      const result = await response.json()
      if (result.success) {
        setData(result.data)
      }
    } catch (error) {
      console.error('Erreur chargement rappels:', error)
    } finally {
      setLoading(false)
    }
  }

  const dismissReminder = (type: string) => {
    setDismissed([...dismissed, type])
  }

  if (loading) {
    return null
  }

  if (!data || data.count === 0) {
    return null
  }

  const visibleReminders = data.reminders.filter(
    r => !dismissed.includes(r.type)
  )

  if (visibleReminders.length === 0) {
    return null
  }

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'high':
        return styles.high
      case 'medium':
        return styles.medium
      default:
        return styles.low
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return '🚨'
      case 'medium':
        return '⚠️'
      default:
        return '💡'
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          🔔 Rappels Intelligents
          {data.hasUrgent && <span className={styles.urgent}>URGENT</span>}
        </h3>
      </div>

      <div className={styles.reminders}>
        {visibleReminders.map((reminder, index) => (
          <div
            key={`${reminder.type}-${index}`}
            className={`${styles.reminder} ${getPriorityClass(reminder.priority)}`}
          >
            <div className={styles.reminderContent}>
              <div className={styles.reminderIcon}>
                {getPriorityIcon(reminder.priority)}
              </div>
              <div className={styles.reminderText}>
                <p>{reminder.message}</p>
                {reminder.action && (
                  <Link href={reminder.action} className={styles.action}>
                    Voir →
                  </Link>
                )}
              </div>
            </div>
            <button
              className={styles.dismissButton}
              onClick={() => dismissReminder(reminder.type)}
              title="Masquer"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
