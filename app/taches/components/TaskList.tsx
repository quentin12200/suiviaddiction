'use client'

import { Task } from '../../data/taskTypes'
import { TaskCard } from './TaskCard'
import styles from '../taches.module.css'

interface TaskListProps {
  tasks: Task[]
  filter: string
  onToggle: (id: string) => void
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
}

export function TaskList({ tasks, filter, onToggle, onEdit, onDelete }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>🎉 Aucune tâche {filter === 'today' ? "pour aujourd'hui" : filter}!</p>
      </div>
    )
  }

  return (
    <div className={styles.tasksList}>
      {tasks.map(task => (
        <TaskCard
          key={task.id}
          task={task}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
