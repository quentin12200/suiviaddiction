'use client'

import { useState } from 'react'
import type { RecurringExpense } from '../types'
import styles from '../bank.module.css'

interface RecurringExpensesListProps {
  expenses: RecurringExpense[]
  onAdd: (expense: Partial<RecurringExpense>) => void
  onUpdate: (id: string, updates: Partial<RecurringExpense>) => void
  onDelete: (id: string) => void
  monthlyTotal: number
}

export function RecurringExpensesList({
  expenses,
  onAdd,
  onUpdate,
  onDelete,
  monthlyTotal
}: RecurringExpensesListProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)
  const [formData, setFormData] = useState({
    label: '',
    amount: '',
    dayOfMonth: '',
    category: 'Autre' as RecurringExpense['category'],
    isVariable: false
  })

  const handleInitialize = async () => {
    if (!confirm('Voulez-vous pré-remplir vos dépenses mensuelles ? Cela ajoutera toutes vos dépenses récurrentes par défaut.')) {
      return
    }

    setIsInitializing(true)
    try {
      const response = await fetch('/api/recurring-expenses/init', {
        method: 'POST'
      })

      const data = await response.json()

      if (data.success) {
        alert(`${data.count} dépenses récurrentes créées avec succès !`)
        // Recharger la page pour voir les nouvelles dépenses
        window.location.reload()
      } else {
        alert(`Erreur: ${data.error}`)
      }
    } catch (error) {
      console.error('Erreur initialisation:', error)
      alert('Erreur lors de l\'initialisation des dépenses')
    } finally {
      setIsInitializing(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (editingId) {
      onUpdate(editingId, {
        label: formData.label,
        amount: parseFloat(formData.amount),
        dayOfMonth: parseInt(formData.dayOfMonth),
        category: formData.category,
        isVariable: formData.isVariable
      })
      setEditingId(null)
    } else {
      onAdd({
        label: formData.label,
        amount: parseFloat(formData.amount),
        dayOfMonth: parseInt(formData.dayOfMonth),
        category: formData.category,
        isVariable: formData.isVariable,
        frequency: 'mensuel'
      })
    }

    setFormData({
      label: '',
      amount: '',
      dayOfMonth: '',
      category: 'Autre',
      isVariable: false
    })
    setIsAdding(false)
  }

  const handleEdit = (expense: RecurringExpense) => {
    setEditingId(expense.id)
    setFormData({
      label: expense.label,
      amount: expense.amount.toString(),
      dayOfMonth: expense.dayOfMonth.toString(),
      category: expense.category,
      isVariable: expense.isVariable
    })
    setIsAdding(true)
  }

  const handleCancel = () => {
    setIsAdding(false)
    setEditingId(null)
    setFormData({
      label: '',
      amount: '',
      dayOfMonth: '',
      category: 'Autre',
      isVariable: false
    })
  }

  // Grouper par catégorie
  const byCategory = expenses.reduce((acc, exp) => {
    if (!acc[exp.category]) acc[exp.category] = []
    acc[exp.category].push(exp)
    return acc
  }, {} as Record<string, RecurringExpense[]>)

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <h2>💳 Dépenses récurrentes</h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <strong>Total mensuel: {monthlyTotal.toFixed(2)}€</strong>
          {expenses.length === 0 && (
            <button
              onClick={handleInitialize}
              disabled={isInitializing}
              className={styles.btnAdd}
              style={{ margin: 0 }}
            >
              {isInitializing ? 'Initialisation...' : '⚡ Pré-remplir mes dépenses'}
            </button>
          )}
        </div>
      </div>

      {expenses.length === 0 && !isAdding && (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          background: '#f8fafc',
          borderRadius: '12px',
          border: '2px dashed #cbd5e1'
        }}>
          <p style={{ color: '#64748b', marginBottom: '16px' }}>
            Aucune dépense récurrente enregistrée.
          </p>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Cliquez sur "Pré-remplir mes dépenses" pour ajouter vos 23 dépenses mensuelles,
            ou utilisez le bouton ci-dessous pour en ajouter manuellement.
          </p>
        </div>
      )}

      <div className={styles.expensesGrid}>
        {Object.entries(byCategory).map(([category, categoryExpenses]) => (
          <div key={category} className={styles.categoryGroup}>
            <h3>{category}</h3>
            <div className={styles.expensesList}>
              {categoryExpenses
                .sort((a, b) => a.dayOfMonth - b.dayOfMonth)
                .map(exp => (
                  <div key={exp.id} className={styles.expenseItem}>
                    <div className={styles.expenseInfo}>
                      <span className={styles.expenseDay}>Le {exp.dayOfMonth}</span>
                      <span className={styles.expenseLabel}>{exp.label}</span>
                      <span className={styles.expenseAmount}>
                        {exp.isVariable ? '~' : ''}{exp.amount.toFixed(2)}€
                      </span>
                    </div>
                    <div className={styles.expenseActions}>
                      <button
                        onClick={() => handleEdit(exp)}
                        className={styles.btnEdit}
                        title="Modifier"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => onDelete(exp.id)}
                        className={styles.btnDelete}
                        title="Supprimer"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      {!isAdding && (
        <button
          onClick={() => setIsAdding(true)}
          className={styles.btnAdd}
        >
          + Ajouter une dépense récurrente
        </button>
      )}

      {isAdding && (
        <form onSubmit={handleSubmit} className={styles.expenseForm}>
          <h3>{editingId ? 'Modifier' : 'Nouvelle'} dépense</h3>
          <div className={styles.formGrid}>
            <input
              type="text"
              placeholder="Libellé (ex: EDF)"
              value={formData.label}
              onChange={e => setFormData({ ...formData, label: e.target.value })}
              required
            />
            <input
              type="number"
              step="0.01"
              placeholder="Montant (€)"
              value={formData.amount}
              onChange={e => setFormData({ ...formData, amount: e.target.value })}
              required
            />
            <input
              type="number"
              min="1"
              max="31"
              placeholder="Jour du mois (1-31)"
              value={formData.dayOfMonth}
              onChange={e => setFormData({ ...formData, dayOfMonth: e.target.value })}
              required
            />
            <select
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value as RecurringExpense['category'] })}
            >
              <option value="Crédit">Crédit</option>
              <option value="Assurance">Assurance</option>
              <option value="Abonnement">Abonnement</option>
              <option value="Énergie">Énergie</option>
              <option value="Autre">Autre</option>
            </select>
            <label>
              <input
                type="checkbox"
                checked={formData.isVariable}
                onChange={e => setFormData({ ...formData, isVariable: e.target.checked })}
              />
              Montant variable
            </label>
          </div>
          <div className={styles.formActions}>
            <button type="submit" className={styles.btnSubmit}>
              {editingId ? 'Modifier' : 'Ajouter'}
            </button>
            <button type="button" onClick={handleCancel} className={styles.btnCancel}>
              Annuler
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
