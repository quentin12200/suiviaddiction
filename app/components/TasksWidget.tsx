'use client'

import Link from 'next/link'
import { useTasks } from '../taches/hooks/useTasks'
import { useTaskFilters } from '../taches/hooks/useTaskFilters'
import { priorityEmojis } from '../data/taskTypes'
import styles from './TasksWidget.module.css'

export default function TasksWidget() {
  const { tasks, toggleTask } = useTasks()
  const { filteredTasks } = useTaskFilters(tasks)

  // Filtrer uniquement les tâches d'aujourd'hui pour le widget
  const todayTasks = filteredTasks

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
