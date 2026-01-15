'use client'

import { useState, useEffect, useCallback } from 'react'
import { Task } from '../../data/taskTypes'

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Système intelligent de report automatique et compteurs
  const updateTasksDaily = useCallback((taskList: Task[]): Task[] => {
    const today = new Date().toISOString().split('T')[0]

    return taskList.map(task => {
      // Pour les tâches quotidiennes
      if (task.type === 'quotidienne') {
        const lastCompleted = task.lastCompleted || ''

        // Si pas complété aujourd'hui et était pas complété hier
        if (lastCompleted !== today) {
          const daysSinceCompleted = lastCompleted
            ? Math.floor((new Date(today).getTime() - new Date(lastCompleted).getTime()) / (1000 * 60 * 60 * 24))
            : (task.daysNotCompleted || 0) + 1

          return {
            ...task,
            completed: false, // Reset pour aujourd'hui
            daysNotCompleted: daysSinceCompleted
          }
        }
      }

      // Pour les tâches ponctuelles non complétées
      if (task.type === 'ponctuelle' && !task.completed && task.dueDate) {
        const daysOverdue = Math.floor((new Date(today).getTime() - new Date(task.dueDate).getTime()) / (1000 * 60 * 60 * 24))
        if (daysOverdue > 0) {
          return {
            ...task,
            daysNotCompleted: daysOverdue
          }
        }
      }

      return task
    })
  }, [])

  // Synchroniser les tâches avec l'API
  const syncTasks = useCallback(async (newTasks: Task[]) => {
    await Promise.all(
      newTasks.map((task) =>
        fetch(`/api/tasks/${task.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(task),
        })
      )
    )
  }, [])

  // Charger les tâches depuis l'API
  const loadTasks = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/tasks')
      const data = await response.json()
      if (data.success) {
        const updatedTasks = updateTasksDaily(data.tasks || [])
        setTasks(updatedTasks)
        await syncTasks(updatedTasks)
      } else {
        setError('Erreur de chargement des tâches')
      }
    } catch (err) {
      console.error('Erreur chargement tâches:', err)
      setError('Erreur de connexion')
    } finally {
      setIsLoading(false)
    }
  }, [updateTasksDaily, syncTasks])

  // Charger au montage
  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  // Ajouter une tâche
  const addTask = useCallback(async (taskData: Partial<Task>) => {
    if (!taskData.title) return

    const today = new Date().toISOString().split('T')[0]

    const newTask: Task = {
      id: Date.now().toString(),
      title: taskData.title,
      description: taskData.description,
      type: taskData.type || 'ponctuelle',
      priority: taskData.priority || 'normale',
      category: taskData.category,
      completed: false,
      createdAt: today,
      dueDate: taskData.type === 'ponctuelle' ? today : undefined,
      daysNotCompleted: 0
    }

    const updatedTasks = [...tasks, newTask]
    setTasks(updatedTasks)

    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask),
      })
    } catch (err) {
      console.error('Erreur ajout tâche:', err)
      setError('Erreur lors de l\'ajout')
      // Rollback
      setTasks(tasks)
    }
  }, [tasks])

  // Modifier une tâche
  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    const updatedTasks = tasks.map(t =>
      t.id === id ? { ...t, ...updates } as Task : t
    )
    setTasks(updatedTasks)

    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTasks.find(t => t.id === id)),
      })
    } catch (err) {
      console.error('Erreur modification tâche:', err)
      setError('Erreur lors de la modification')
      // Rollback
      setTasks(tasks)
    }
  }, [tasks])

  // Supprimer une tâche
  const deleteTask = useCallback(async (id: string) => {
    if (!confirm('Supprimer cette tâche ?')) return

    const updatedTasks = tasks.filter(t => t.id !== id)
    setTasks(updatedTasks)

    try {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    } catch (err) {
      console.error('Erreur suppression tâche:', err)
      setError('Erreur lors de la suppression')
      // Rollback
      setTasks(tasks)
    }
  }, [tasks])

  // Cocher/décocher une tâche
  const toggleTask = useCallback(async (id: string) => {
    const today = new Date().toISOString().split('T')[0]

    const updatedTasks = tasks.map(task => {
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

    setTasks(updatedTasks)

    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTasks.find(task => task.id === id)),
      })
    } catch (err) {
      console.error('Erreur toggle tâche:', err)
      setError('Erreur lors de la modification')
      // Rollback
      setTasks(tasks)
    }
  }, [tasks])

  return {
    tasks,
    isLoading,
    error,
    addTask,
    updateTask,
    deleteTask,
    toggleTask,
    refreshTasks: loadTasks,
  }
}
