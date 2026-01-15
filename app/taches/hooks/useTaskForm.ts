'use client'

import { useState, useCallback } from 'react'
import { Task } from '../../data/taskTypes'

const initialFormData: Partial<Task> = {
  title: '',
  description: '',
  type: 'ponctuelle',
  priority: 'normale',
  category: 'Personnel',
  completed: false
}

export function useTaskForm(onSubmit: (task: Partial<Task>, editingId: string | null) => void) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<Task>>(initialFormData)

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title) return

    onSubmit(formData, editingId)

    // Reset form
    setFormData(initialFormData)
    setIsAdding(false)
    setEditingId(null)
  }, [formData, editingId, onSubmit])

  const startEdit = useCallback((task: Task) => {
    setFormData(task)
    setEditingId(task.id)
    setIsAdding(true)
  }, [])

  const cancelEdit = useCallback(() => {
    setFormData(initialFormData)
    setEditingId(null)
    setIsAdding(false)
  }, [])

  return {
    isAdding,
    setIsAdding,
    editingId,
    formData,
    setFormData,
    handleSubmit,
    startEdit,
    cancelEdit,
  }
}
