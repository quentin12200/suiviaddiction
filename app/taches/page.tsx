'use client'

import Navigation from '../components/Navigation'
import { useTasks } from './hooks/useTasks'
import { useTaskFilters } from './hooks/useTaskFilters'
import { useTaskStats } from './hooks/useTaskStats'
import { useTaskForm } from './hooks/useTaskForm'
import { TaskStatsSection } from './components/TaskStatsSection'
import { TaskFilters } from './components/TaskFilters'
import { TaskForm } from './components/TaskForm'
import { TaskList } from './components/TaskList'
import styles from './taches.module.css'

export default function TachesPage() {
  // Hooks
  const { tasks, isLoading, addTask, updateTask, deleteTask, toggleTask } = useTasks()
  const { filter, setFilter, filteredTasks } = useTaskFilters(tasks)
  const stats = useTaskStats(tasks)

  const handleFormSubmit = (taskData: any, editingId: string | null) => {
    if (editingId) {
      updateTask(editingId, taskData)
    } else {
      addTask(taskData)
    }
  }

  const {
    isAdding,
    setIsAdding,
    editingId,
    formData,
    setFormData,
    handleSubmit,
    startEdit,
    cancelEdit,
  } = useTaskForm(handleFormSubmit)

  if (isLoading) {
    return (
      <div>
        <Navigation />
        <div className={styles.container}>
          <p>Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Navigation />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>📋 Mes Tâches</h1>
          <p className={styles.subtitle}>Système intelligent avec report automatique</p>
        </div>

        {/* Statistiques */}
        <TaskStatsSection stats={stats} />

        {/* Filtres */}
        <TaskFilters filter={filter} setFilter={setFilter} />

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
          <TaskForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            editingId={editingId}
          />
        )}

        {/* Liste des tâches */}
        <TaskList
          tasks={filteredTasks}
          filter={filter}
          onToggle={toggleTask}
          onEdit={startEdit}
          onDelete={deleteTask}
        />
      </div>
    </div>
  )
}
