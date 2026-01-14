'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Task, priorityEmojis } from '../data/taskTypes'
import styles from './TasksWidget.module.css'

export default function TasksWidget() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [todayTasks, setTodayTasks] = useState<Task[]>([])

  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    try {
      const response = await fetch('/api/tasks')
      const data = await response.json()
      if (data.success) {
        const loadedTasks: Task[] = data.tasks
        setTasks(loadedTasks)

        const today = new Date().toISOString().split('T')[0]
        const filtered = loadedTasks.filter(t =>
          (t.type === 'quotidienne' && !t.completed) ||
          (t.type === 'ponctuelle' && !t.completed && t.dueDate === today)
        )
        setTodayTasks(filtered)
      }
    } catch (error) {
      console.error('Erreur chargement tâches widget:', error)
    }
  }

  const toggleTask = (id: string) => {
    const today = new Date().toISOString().split('T')[0]

    const updated = tasks.map(task => {
      if (task.id === id) {
        const newCompleted = !task.completed

        if (task.type === 'quotidienne') {
          return {
            ...task,
            completed: newCompleted,
            lastCompleted: newCompleted ? today : task.lastCompleted,
            daysNotCompleted: newCompleted ? 0 : task.daysNotCompleted
          }
        } else {
          return {
            ...task,
            completed: newCompleted,
            daysNotCompleted: newCompleted ? 0 : task.daysNotCompleted
          }
        }
      }
      return task
    })

    setTasks(updated)
    fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated.find(task => task.id === id)),
    }).finally(() => {
      loadTasks()
    })
  }

  const stats = {
    total: todayTasks.length,
    completed: todayTasks.filter(t => t.completed).length,
    needsAttention: todayTasks.filter(t => (t.daysNotCompleted || 0) >= 3).length
  }

  return (
    <div className={styles.widget}>
      <div className={styles.header}>
        <h2 className={styles.title}>📋 Mes Tâches du Jour</h2>
        <Link href="/taches" className={styles.viewAllLink}>
          Voir tout →
        </Link>
      </div>

      {/* Statistiques */}
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statNumber}>{stats.total - stats.completed}</span>
          <span className={styles.statLabel}>À faire</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statNumber}>{stats.completed}</span>
          <span className={styles.statLabel}>Faites</span>
        </div>
        {stats.needsAttention > 0 && (
          <div className={`${styles.stat} ${styles.alert}`}>
            <span className={styles.statNumber}>⚠️ {stats.needsAttention}</span>
            <span className={styles.statLabel}>Alertes</span>
          </div>
        )}
      </div>

      {/* Liste des tâches */}
      <div className={styles.tasksList}>
        {todayTasks.length === 0 ? (
          <div className={styles.emptyState}>
            🎉 Aucune tâche pour aujourd'hui !
            <Link href="/taches" className={styles.addTaskLink}>
              ➕ Ajouter une tâche
            </Link>
          </div>
        ) : (
          todayTasks.map(task => (
            <div
              key={task.id}
              className={`${styles.taskItem} ${task.completed ? styles.completed : ''} ${
                (task.daysNotCompleted || 0) >= 3 ? styles.warning : ''
              } ${
                (task.daysNotCompleted || 0) >= 7 ? styles.urgent : ''
              }`}
            >
              <label className={styles.taskCheckbox}>
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task.id)}
                />
                <span className={styles.checkmark}></span>
              </label>

              <div className={styles.taskContent}>
                <div className={styles.taskHeader}>
                  <span className={styles.priority}>{priorityEmojis[task.priority]}</span>
                  <span className={styles.taskTitle}>{task.title}</span>
                  {task.type === 'quotidienne' && (
                    <span className={styles.badge}>🔄</span>
                  )}
                </div>

                {!task.completed && (task.daysNotCompleted || 0) >= 3 && (
                  <div className={styles.alert}>
                    {(task.daysNotCompleted || 0) >= 7 ? '🚨' : '⚠️'} Pas fait depuis {task.daysNotCompleted} jours
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {todayTasks.length > 0 && (
        <Link href="/taches" className={styles.viewAllButton}>
          📋 Gérer mes tâches
        </Link>
      )}
    </div>
  )
}
