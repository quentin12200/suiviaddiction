'use client'

import { useState, useEffect, useCallback } from 'react'
import type { RecurringExpense } from '../types'

export function useRecurringExpenses() {
  const [expenses, setExpenses] = useState<RecurringExpense[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Charger les dépenses récurrentes
  const loadExpenses = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/recurring-expenses')
      const data = await response.json()

      if (data.success) {
        setExpenses(data.expenses || [])
      } else {
        setError('Erreur de chargement des dépenses')
      }
    } catch (err) {
      console.error('Erreur chargement dépenses:', err)
      setError('Erreur de connexion')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Charger au montage
  useEffect(() => {
    loadExpenses()
  }, [loadExpenses])

  // Ajouter une dépense
  const addExpense = useCallback(async (expenseData: Partial<RecurringExpense>) => {
    try {
      const response = await fetch('/api/recurring-expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseData)
      })

      const data = await response.json()

      if (data.success) {
        setExpenses(prev => [...prev, data.expense])
      } else {
        setError('Erreur de création de la dépense')
      }
    } catch (err) {
      console.error('Erreur création dépense:', err)
      setError('Erreur de connexion')
    }
  }, [])

  // Modifier une dépense
  const updateExpense = useCallback(async (id: string, updates: Partial<RecurringExpense>) => {
    try {
      const response = await fetch(`/api/recurring-expenses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      const data = await response.json()

      if (data.success) {
        setExpenses(prev => prev.map(exp =>
          exp.id === id ? data.expense : exp
        ))
      } else {
        setError('Erreur de modification de la dépense')
      }
    } catch (err) {
      console.error('Erreur modification dépense:', err)
      setError('Erreur de connexion')
    }
  }, [])

  // Supprimer une dépense
  const deleteExpense = useCallback(async (id: string) => {
    if (!confirm('Supprimer cette dépense récurrente ?')) return

    try {
      const response = await fetch(`/api/recurring-expenses/${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        setExpenses(prev => prev.filter(exp => exp.id !== id))
      } else {
        setError('Erreur de suppression de la dépense')
      }
    } catch (err) {
      console.error('Erreur suppression dépense:', err)
      setError('Erreur de connexion')
    }
  }, [])

  // Calculer le total mensuel
  const monthlyTotal = expenses.reduce((sum, exp) => {
    if (!exp.isActive) return sum

    // Pour les dépenses variables, utiliser une moyenne si pas de mois spécifié
    if (exp.isVariable && exp.variableMonths) {
      try {
        const months = JSON.parse(exp.variableMonths)
        const values = Object.values(months) as number[]
        const avg = values.reduce((a, b) => a + b, 0) / values.length
        return sum + avg
      } catch {
        return sum + exp.amount
      }
    }

    return sum + exp.amount
  }, 0)

  return {
    expenses,
    isLoading,
    error,
    addExpense,
    updateExpense,
    deleteExpense,
    refreshExpenses: loadExpenses,
    monthlyTotal
  }
}
