// Types pour le système de tâches intelligent

export interface Task {
  id: string
  title: string
  description?: string
  type: 'ponctuelle' | 'quotidienne' // Ponctuelle = une fois, Quotidienne = récurrente
  completed: boolean
  createdAt: string
  dueDate?: string // Pour les tâches ponctuelles
  lastCompleted?: string // Pour les tâches quotidiennes
  daysNotCompleted?: number // Compteur de jours non faits (pour alertes)
  priority: 'basse' | 'normale' | 'haute' | 'urgente'
  category?: string // Ex: "CGT", "Personnel", "Santé", "Louise"
  isFromHabit?: boolean // Si la tâche vient d'une habitude du tracker
  habitId?: string // ID de l'habitude source
}

export interface TaskStats {
  total: number
  completed: number
  pending: number
  overdue: number
  needsAttention: number // Tâches non faites depuis 3+ jours
}

export const taskCategories = [
  'CGT',
  'Personnel',
  'Santé',
  'Louise',
  'Sophie',
  'Sevrage',
  'Maison',
  'Autre'
]

export const priorityColors = {
  basse: '#6c757d',
  normale: '#0d6efd',
  haute: '#ffc107',
  urgente: '#dc3545'
}

export const priorityEmojis = {
  basse: '🔵',
  normale: '🟢',
  haute: '🟡',
  urgente: '🔴'
}
