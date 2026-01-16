'use client'

import { useState } from 'react'
import type { RecurringExpense } from '../types'
import { CalendarView } from './CalendarView'
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
  const [view, setView] = useState<'calendar' | 'list'>('calendar')
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

  // Icones par catégorie
  const categoryIcons: Record<string, string> = {
    'Crédit': '🏦',
    'Assurance': '🛡️',
    'Abonnement': '📱',
    'Énergie': '⚡',
    'Autre': '📋'
  }

  return (
    <div className={styles.expensesSection}>
      {/* Header moderne */}
      <div className={styles.expensesHeader}>
        <div className={styles.expensesHeaderTop}>
          <div className={styles.expensesTitleGroup}>
            <h2 className={styles.expensesMainTitle}>Dépenses récurrentes</h2>
            <p className={styles.expensesSubtitle}>
              Gérez vos charges mensuelles et visualisez-les sur le calendrier
            </p>
          </div>

          <div className={styles.expensesHeaderActions}>
            {expenses.length === 0 && (
              <button
                onClick={handleInitialize}
                disabled={isInitializing}
                className={styles.initButton}
              >
                {isInitializing ? '⏳ Initialisation...' : '⚡ Pré-remplir mes dépenses'}
              </button>
            )}
            <button
              onClick={() => setIsAdding(true)}
              className={styles.addExpenseButton}
            >
              + Ajouter une dépense
            </button>
          </div>
        </div>

        {/* Stats rapides */}
        <div className={styles.quickStats}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>💰</div>
            <div className={styles.statContent}>
              <span className={styles.statLabel}>Total mensuel</span>
              <span className={styles.statValue}>{monthlyTotal.toFixed(2)}€</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📊</div>
            <div className={styles.statContent}>
              <span className={styles.statLabel}>Nombre de dépenses</span>
              <span className={styles.statValue}>{expenses.length}</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🏷️</div>
            <div className={styles.statContent}>
              <span className={styles.statLabel}>Catégories</span>
              <span className={styles.statValue}>{Object.keys(byCategory).length}</span>
            </div>
          </div>
        </div>

        {/* Toggle vue */}
        <div className={styles.viewToggleContainer}>
          <button
            onClick={() => setView('calendar')}
            className={`${styles.viewToggleBtn} ${view === 'calendar' ? styles.viewToggleActive : ''}`}
          >
            📅 Calendrier
          </button>
          <button
            onClick={() => setView('list')}
            className={`${styles.viewToggleBtn} ${view === 'list' ? styles.viewToggleActive : ''}`}
          >
            📋 Liste par catégorie
          </button>
        </div>
      </div>

      {expenses.length === 0 && !isAdding && (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>📭</div>
          <h3 className={styles.emptyStateTitle}>Aucune dépense récurrente</h3>
          <p className={styles.emptyStateText}>
            Commencez par pré-remplir vos dépenses mensuelles ou ajoutez-les manuellement
          </p>
        </div>
      )}

      {/* Vue Calendrier */}
      {view === 'calendar' && expenses.length > 0 && (
        <CalendarView
          expenses={expenses}
          onEdit={handleEdit}
          onDelete={onDelete}
          monthlyTotal={monthlyTotal}
        />
      )}

      {/* Vue Liste */}
      {view === 'list' && expenses.length > 0 && (
        <div className={styles.categoriesView}>
          {Object.entries(byCategory).map(([category, categoryExpenses]) => {
            const categoryTotal = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0)

            return (
              <div key={category} className={styles.modernCategoryCard}>
                <div className={styles.categoryCardHeader}>
                  <div className={styles.categoryCardTitle}>
                    <span className={styles.categoryIcon}>{categoryIcons[category]}</span>
                    <span className={styles.categoryName}>{category}</span>
                  </div>
                  <div className={styles.categoryCardStats}>
                    <span className={styles.categoryTotal}>{categoryTotal.toFixed(2)}€</span>
                    <span className={styles.categoryCount}>{categoryExpenses.length} dépense{categoryExpenses.length > 1 ? 's' : ''}</span>
                  </div>
                </div>

                <div className={styles.modernExpensesList}>
                  {categoryExpenses
                    .sort((a, b) => a.dayOfMonth - b.dayOfMonth)
                    .map(exp => (
                      <div key={exp.id} className={styles.modernExpenseItem}>
                        <div className={styles.expenseItemLeft}>
                          <div className={styles.expenseDayBadge}>J{exp.dayOfMonth}</div>
                          <div className={styles.expenseItemInfo}>
                            <div className={styles.expenseItemLabel}>{exp.label}</div>
                            {exp.frequency !== 'mensuel' && (
                              <div className={styles.expenseFrequency}>
                                {exp.frequency === 'bimensuel' ? '📅 Bimensuel' : exp.frequency}
                              </div>
                            )}
                            {exp.endDate && (
                              <div className={styles.expenseEndDate}>
                                ⏱️ Jusqu'au {new Date(exp.endDate).toLocaleDateString('fr-FR')}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className={styles.expenseItemRight}>
                          <div className={styles.expenseItemAmount}>
                            {exp.isVariable && '~'}{exp.amount.toFixed(2)}€
                          </div>
                          <div className={styles.expenseItemActions}>
                            <button
                              onClick={() => handleEdit(exp)}
                              className={styles.modernBtnEdit}
                              title="Modifier"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => onDelete(exp.id)}
                              className={styles.modernBtnDelete}
                              title="Supprimer"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {isAdding && (
        <div className={styles.modernExpenseForm}>
          <div className={styles.formHeader}>
            <h3 className={styles.formTitle}>
              {editingId ? '✏️ Modifier la dépense' : '➕ Nouvelle dépense'}
            </h3>
            <button
              type="button"
              onClick={handleCancel}
              className={styles.formCloseBtn}
              title="Fermer"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className={styles.modernFormGrid}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Libellé</label>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="ex: EDF, Netflix, Crédit..."
                  value={formData.label}
                  onChange={e => setFormData({ ...formData, label: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>Montant (€)</label>
                <input
                  type="number"
                  step="0.01"
                  className={styles.formInput}
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>Jour du mois</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  className={styles.formInput}
                  placeholder="1 - 31"
                  value={formData.dayOfMonth}
                  onChange={e => setFormData({ ...formData, dayOfMonth: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>Catégorie</label>
                <select
                  className={styles.formSelect}
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value as RecurringExpense['category'] })}
                >
                  <option value="Crédit">🏦 Crédit</option>
                  <option value="Assurance">🛡️ Assurance</option>
                  <option value="Abonnement">📱 Abonnement</option>
                  <option value="Énergie">⚡ Énergie</option>
                  <option value="Autre">📋 Autre</option>
                </select>
              </div>
            </div>

            <div className={styles.formCheckbox}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  className={styles.checkboxInput}
                  checked={formData.isVariable}
                  onChange={e => setFormData({ ...formData, isVariable: e.target.checked })}
                />
                <span className={styles.checkboxText}>
                  💱 Montant variable (montant approximatif)
                </span>
              </label>
            </div>

            <div className={styles.modernFormActions}>
              <button type="submit" className={styles.modernBtnSubmit}>
                {editingId ? '✓ Enregistrer les modifications' : '+ Ajouter la dépense'}
              </button>
              <button type="button" onClick={handleCancel} className={styles.modernBtnCancel}>
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
