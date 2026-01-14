'use client'

import { useState, useEffect } from 'react'
import Navigation from '../components/Navigation'
import { Task, TaskStats, taskCategories, priorityEmojis } from '../data/taskTypes'
import styles from './taches.module.css'

export default function TachesPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'today' | 'pending' | 'completed'>('today')
  const [formData, setFormData] = useState<Partial<Task>>({
    title: '',
    description: '',
    type: 'ponctuelle',
    priority: 'normale',
    category: 'Personnel',
    completed: false
  })

  // Charger les tâches depuis l'API (sync multi-appareils)
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const response = await fetch('/api/tasks')
        const data = await response.json()
        if (data.success) {
          const updatedTasks = updateTasksDaily(data.tasks || [])
          setTasks(updatedTasks)
          await syncTasks(updatedTasks)
        }
      } catch (error) {
        console.error('Erreur chargement tâches:', error)
      }
    }

    loadTasks()
  }, [])

  // Système intelligent de report automatique et compteurs
  const updateTasksDaily = (taskList: Task[]): Task[] => {
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
  }

  const syncTasks = async (newTasks: Task[]) => {
    await Promise.all(
      newTasks.map((task) =>
        fetch(`/api/tasks/${task.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(task),
        })
      )
    )
  }

  const saveTasks = (newTasks: Task[]) => {
    setTasks(newTasks)
  }

  // Ajouter ou modifier une tâche
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title) return

    const today = new Date().toISOString().split('T')[0]

    if (editingId) {
      // Modifier
      const updated = tasks.map(t =>
        t.id === editingId ? { ...t, ...formData } as Task : t
      )
      saveTasks(updated)
      fetch(`/api/tasks/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated.find(t => t.id === editingId)),
      })
      setEditingId(null)
    } else {
      // Ajouter
      const newTask: Task = {
        id: Date.now().toString(),
        title: formData.title,
        description: formData.description,
        type: formData.type || 'ponctuelle',
        priority: formData.priority || 'normale',
        category: formData.category,
        completed: false,
        createdAt: today,
        dueDate: formData.type === 'ponctuelle' ? today : undefined,
        daysNotCompleted: 0
      }
      saveTasks([...tasks, newTask])
      fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask),
      })
    }

    // Reset form
    setFormData({
      title: '',
      description: '',
      type: 'ponctuelle',
      priority: 'normale',
      category: 'Personnel',
      completed: false
    })
    setIsAdding(false)
  }

  // Cocher/décocher une tâche
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

    saveTasks(updated)
    fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated.find(task => task.id === id)),
    })
  }

  // Supprimer une tâche
  const deleteTask = (id: string) => {
    if (confirm('Supprimer cette tâche ?')) {
      saveTasks(tasks.filter(t => t.id !== id))
      fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    }
  }

  // Modifier une tâche
  const editTask = (task: Task) => {
    setFormData(task)
    setEditingId(task.id)
    setIsAdding(true)
  }

  // Annuler édition
  const cancelEdit = () => {
    setFormData({
      title: '',
      description: '',
      type: 'ponctuelle',
      priority: 'normale',
      category: 'Personnel',
      completed: false
    })
    setEditingId(null)
    setIsAdding(false)
  }

  // Filtrer les tâches
  const getFilteredTasks = () => {
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
  }

  // Statistiques
  const getStats = (): TaskStats => {
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
  }

  const stats = getStats()
  const filteredTasks = getFilteredTasks()

  return (
    <div>
      <Navigation />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>📋 Mes Tâches</h1>
          <p className={styles.subtitle}>Système intelligent avec report automatique</p>
        </div>

        {/* Statistiques */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>{stats.pending}</div>
            <div className={styles.statLabel}>À faire</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>{stats.completed}</div>
            <div className={styles.statLabel}>Complétées</div>
          </div>
          {stats.needsAttention > 0 && (
            <div className={`${styles.statCard} ${styles.alert}`}>
              <div className={styles.statNumber}>⚠️ {stats.needsAttention}</div>
              <div className={styles.statLabel}>Nécessitent attention</div>
            </div>
          )}
        </div>

        {/* Filtres */}
        <div className={styles.filters}>
          <button
            className={filter === 'today' ? styles.filterActive : styles.filterButton}
            onClick={() => setFilter('today')}
          >
            🌅 Aujourd'hui
          </button>
          <button
            className={filter === 'pending' ? styles.filterActive : styles.filterButton}
            onClick={() => setFilter('pending')}
          >
            📌 En attente
          </button>
          <button
            className={filter === 'completed' ? styles.filterActive : styles.filterButton}
            onClick={() => setFilter('completed')}
          >
            ✅ Complétées
          </button>
          <button
            className={filter === 'all' ? styles.filterActive : styles.filterButton}
            onClick={() => setFilter('all')}
          >
            📚 Toutes
          </button>
        </div>

        {/* Bouton ajouter */}
        <div className={styles.addButtonContainer}>
          {!isAdding ? (
            <button onClick={() => setIsAdding(true)} className={styles.addButton}>
              ➕ Ajouter une tâche
            </button>
          ) : (
            <button onClick={cancelEdit} className={styles.cancelButton}>
              ✕ Annuler
            </button>
          )}
        </div>

        {/* Formulaire */}
        {isAdding && (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className={styles.select}
                  required
                >
                  <option value="ponctuelle">🎯 Ponctuelle (une fois)</option>
                  <option value="quotidienne">🔄 Quotidienne (récurrente)</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Priorité *</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  className={styles.select}
                  required
                >
                  <option value="basse">🔵 Basse</option>
                  <option value="normale">🟢 Normale</option>
                  <option value="haute">🟡 Haute</option>
                  <option value="urgente">🔴 Urgente</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Catégorie</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className={styles.select}
                >
                  {taskCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Titre *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={styles.input}
                placeholder="Ex: Préparer formation CGT jeudi"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Description (optionnelle)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={styles.textarea}
                placeholder="Détails supplémentaires..."
                rows={2}
              />
            </div>

            <button type="submit" className={styles.submitButton}>
              {editingId ? '💾 Enregistrer' : '➕ Ajouter'}
            </button>
          </form>
        )}

        {/* Liste des tâches */}
        <div className={styles.tasksList}>
          {filteredTasks.length === 0 ? (
            <div className={styles.emptyState}>
              <p>🎉 Aucune tâche {filter === 'today' ? "pour aujourd'hui" : filter}!</p>
            </div>
          ) : (
            filteredTasks.map(task => (
              <div
                key={task.id}
                className={`${styles.taskCard} ${task.completed ? styles.taskCompleted : ''} ${
                  (task.daysNotCompleted || 0) >= 3 ? styles.taskAlert : ''
                }`}
              >
                <div className={styles.taskMain}>
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
                      onClick={() => editTask(task)}
                      className={styles.editButton}
                      title="Modifier"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className={styles.deleteButton}
                      title="Supprimer"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
