'use client'

import { useState, useEffect, useCallback } from 'react'
import { Task } from '../../data/taskTypes'
import { useSyncQueue } from './useSyncQueue'

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Système de synchronisation robuste
  const { syncStatus, pendingCount, isOnline, enqueue, forceSync } = useSyncQueue()

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

  // Charger les tâches depuis l'API
  const loadTasks = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/tasks')
      const data = await response.json()
      if (data.success) {
        const originalTasks = data.tasks || []
        const updatedTasks = updateTasksDaily(originalTasks)

        // Détection des tâches modifiées par updateTasksDaily
        const originalTasksMap = new Map(originalTasks.map(t => [t.id, t]))
        const modifiedTasks = updatedTasks.filter(updated => {
          const original = originalTasksMap.get(updated.id)
          if (!original) return false
          return (
            updated.completed !== original.completed ||
            updated.lastCompleted !== original.lastCompleted ||
            updated.daysNotCompleted !== original.daysNotCompleted
          )
        })

        // Sauvegarder les modifications dans la base de données
        if (modifiedTasks.length > 0) {
          try {
            await fetch('/api/tasks', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tasks: modifiedTasks }),
            })
            console.log(`✅ ${modifiedTasks.length} tâche(s) mise(s) à jour pour le nouveau jour`)
          } catch (syncError) {
            console.error('Erreur sauvegarde updateTasksDaily:', syncError)
          }
        }

        setTasks(updatedTasks)
      } else {
        setError('Erreur de chargement des tâches')
      }
    } catch (err) {
      console.error('Erreur chargement tâches:', err)
      setError('Erreur de connexion')
    } finally {
      if (showLoading) setIsLoading(false)
    }
  }, [updateTasksDaily])

  // Charger au montage
  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  // Polling pour sync multi-appareils (refresh toutes les 10 secondes)
  useEffect(() => {
    const interval = setInterval(() => {
      // Recharger les tâches depuis l'API sans afficher "Chargement..."
      loadTasks(false)
    }, 10000) // 10 secondes

    return () => clearInterval(interval)
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

    // Optimistic update
    const updatedTasks = [...tasks, newTask]
    setTasks(updatedTasks)

    // Ajouter à la queue de sync
    enqueue(newTask.id, 'create', newTask)
  }, [tasks, enqueue])

  // Modifier une tâche
  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    // Optimistic update
    const updatedTasks = tasks.map(t =>
      t.id === id ? { ...t, ...updates } as Task : t
    )
    setTasks(updatedTasks)

    // Ajouter à la queue de sync
    const updatedTask = updatedTasks.find(t => t.id === id)
    if (updatedTask) {
      enqueue(id, 'update', updatedTask)
    }
  }, [tasks, enqueue])

  // Supprimer une tâche
  const deleteTask = useCallback(async (id: string) => {
    if (!confirm('Supprimer cette tâche ?')) return

    // Optimistic update
    const updatedTasks = tasks.filter(t => t.id !== id)
    setTasks(updatedTasks)

    // Ajouter à la queue de sync
    enqueue(id, 'delete', null)
  }, [tasks, enqueue])

  // Cocher/décocher une tâche
  const toggleTask = useCallback(async (id: string) => {
    const today = new Date().toISOString().split('T')[0]

    // Optimistic update
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

    // Ajouter à la queue de sync
    const updatedTask = updatedTasks.find(task => task.id === id)
    if (updatedTask) {
      enqueue(id, 'update', updatedTask)
    }
  }, [tasks, enqueue])

  return {
    tasks,
    isLoading,
    error,
    addTask,
    updateTask,
    deleteTask,
    toggleTask,
    refreshTasks: loadTasks,
    // Sync info
    syncStatus,
    pendingCount,
    isOnline,
    forceSync,
  }
}
