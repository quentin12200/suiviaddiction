'use client'

import { Task, priorityEmojis } from '../../data/taskTypes'
import styles from '../taches.module.css'

interface TaskCardProps {
  task: Task
  onToggle: (id: string) => void
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
}

export function TaskCard({ task, onToggle, onEdit, onDelete }: TaskCardProps) {
  return (
    <div
      className={`${styles.taskCard} ${task.completed ? styles.taskCompleted : ''} ${
        (task.daysNotCompleted || 0) >= 3 ? styles.taskAlert : ''
      }`}
    >
      <div className={styles.taskMain}>
        <label className={styles.taskCheckbox}>
          <input
            type="checkbox"
            checked={task.completed}
            onChange={() => onToggle(task.id)}
          />
          <span className={styles.checkmark}></span>
        </label>

        <div className={styles.taskContent}>
          <div className={styles.taskHeader}>
            <span className={styles.taskPriority}>
              {priorityEmojis[task.priority]}
            </span>
            <h3 className={styles.taskTitle}>{task.title}</h3>
            {task.type === 'quotidienne' && (
              <span className={styles.taskBadge}>🔄 Quotidienne</span>
            )}
            {task.category && (
              <span className={styles.taskCategory}>{task.category}</span>
            )}
          </div>

          {task.description && (
            <p className={styles.taskDescription}>{task.description}</p>
          )}

          {/* Alertes */}
          {!task.completed && (task.daysNotCompleted || 0) >= 3 && (
            <div className={styles.taskWarning}>
              ⚠️ Pas fait depuis {task.daysNotCompleted} jours !
            </div>
          )}
          {!task.completed && (task.daysNotCompleted || 0) >= 7 && (
            <div className={styles.taskDanger}>
              🚨 URGENT : Pas fait depuis {task.daysNotCompleted} jours !
            </div>
          )}
        </div>

        <div className={styles.taskActions}>
          <button
            onClick={() => onEdit(task)}
            className={styles.editButton}
            title="Modifier"
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className={styles.deleteButton}
            title="Supprimer"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  )
}
