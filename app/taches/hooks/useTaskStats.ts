'use client'

import { useMemo } from 'react'
import { Task, TaskStats } from '../../data/taskTypes'

export function useTaskStats(tasks: Task[]): TaskStats {
  return useMemo(() => {
    const today = new Date().toISOString().split('T')[0]

    return {
      total: tasks.length,
      completed: tasks.filter(t => t.completed).length,
      pending: tasks.filter(t => !t.completed).length,
      overdue: tasks.filter(t =>
        !t.completed && t.dueDate && t.dueDate < today
      ).length,
      needsAttention: tasks.filter(t =>
        !t.completed && (t.daysNotCompleted || 0) >= 3
      ).length
    }
  }, [tasks])
}
