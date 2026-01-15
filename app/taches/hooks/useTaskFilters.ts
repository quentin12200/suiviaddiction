'use client'

import { useState, useMemo } from 'react'
import { Task } from '../../data/taskTypes'

export type FilterType = 'all' | 'today' | 'pending' | 'completed'

export function useTaskFilters(tasks: Task[]) {
  const [filter, setFilter] = useState<FilterType>('today')

  const filteredTasks = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]

    switch (filter) {
      case 'today':
        return tasks.filter(t =>
          (t.type === 'quotidienne' && !t.completed) ||
          (t.type === 'ponctuelle' && !t.completed && t.dueDate === today)
        )
      case 'pending':
        return tasks.filter(t => !t.completed)
      case 'completed':
        return tasks.filter(t => t.completed)
      default:
        return tasks
    }
  }, [tasks, filter])

  return {
    filter,
    setFilter,
    filteredTasks,
  }
}
