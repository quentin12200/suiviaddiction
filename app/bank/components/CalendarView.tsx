'use client'

import { useState, useEffect } from 'react'
import type { RecurringExpense } from '../types'
import styles from '../bank.module.css'

interface CalendarViewProps {
  expenses: RecurringExpense[]
  onEdit: (expense: RecurringExpense) => void
  onDelete: (id: string) => void
  monthlyTotal: number
}

export function CalendarView({ expenses, onEdit, onDelete, monthlyTotal }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [showTwoMonths, setShowTwoMonths] = useState(false)

  // Détecter la largeur de l'écran
  useEffect(() => {
    const checkWidth = () => {
      setShowTwoMonths(window.innerWidth >= 1920)
    }
    checkWidth()
    window.addEventListener('resize', checkWidth)
    return () => window.removeEventListener('resize', checkWidth)
  }, [])

  // Générer les jours du mois
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    return {
      daysInMonth,
      startingDayOfWeek: startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1, // Lundi = 0
      year,
      month
    }
  }

  // Regrouper les dépenses par jour
  const expensesByDay = expenses.reduce((acc, expense) => {
    const day = expense.dayOfMonth
    if (!acc[day]) acc[day] = []
    acc[day].push(expense)
    return acc
  }, {} as Record<number, RecurringExpense[]>)

  // Calculer le total pour chaque jour
  const getTotalForDay = (day: number) => {
    const dayExpenses = expensesByDay[day] || []
    return dayExpenses.reduce((sum, exp) => sum + exp.amount, 0)
  }

  // Navigation mois
  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  const today = new Date()

  // Fonction pour rendre un mois
  const renderMonth = (monthDate: Date, isFirst: boolean = true) => {
    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(monthDate)
    const isThisMonth = today.getMonth() === month && today.getFullYear() === year

    return (
      <div key={`${year}-${month}`} className={styles.singleMonthCalendar}>
        {/* Titre du mois */}
        <h3 className={styles.monthTitle}>
          {monthDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
        </h3>

        {/* Jours de la semaine */}
        <div className={styles.calendarWeekdays}>
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
            <div key={day} className={styles.weekdayLabel}>{day}</div>
          ))}
        </div>

        {/* Grille du calendrier */}
        <div className={styles.calendarGrid}>
          {/* Cases vides avant le 1er du mois */}
          {Array.from({ length: startingDayOfWeek }).map((_, index) => (
            <div key={`empty-${index}`} className={styles.calendarDayEmpty} />
          ))}

          {/* Jours du mois */}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1
            const dayExpenses = expensesByDay[day] || []
            const dayTotal = getTotalForDay(day)
            const isToday = isThisMonth && today.getDate() === day
            const hasExpenses = dayExpenses.length > 0

            return (
              <div
                key={day}
                className={`${styles.calendarDay} ${isToday ? styles.calendarDayToday : ''} ${hasExpenses ? styles.calendarDayHasExpenses : ''}`}
              >
                <div className={styles.calendarDayNumber}>
                  {day}
                  {isToday && <span className={styles.todayBadge}>Aujourd'hui</span>}
                </div>

                {hasExpenses && (
                  <div className={styles.calendarDayContent}>
                    <div className={styles.dayExpensesCount}>
                      {dayExpenses.length} dépense{dayExpenses.length > 1 ? 's' : ''}
                    </div>
                    <div className={styles.dayExpensesTotal}>
                      {dayTotal.toFixed(2)}€
                    </div>

                    {/* Liste des dépenses */}
                    <div className={styles.dayExpensesList}>
                      {dayExpenses
                        .sort((a, b) => b.amount - a.amount)
                        .slice(0, 3)
                        .map(expense => (
                          <div key={expense.id} className={styles.calendarExpenseItem}>
                            <div className={styles.calendarExpenseInfo}>
                              <span className={styles.calendarExpenseLabel} title={expense.label}>
                                {expense.label}
                              </span>
                              <span className={styles.calendarExpenseAmount}>
                                {expense.amount.toFixed(2)}€
                              </span>
                            </div>
                            <div className={styles.calendarExpenseActions}>
                              <button
                                onClick={() => onEdit(expense)}
                                className={styles.calendarBtnEdit}
                                title="Modifier"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => onDelete(expense.id)}
                                className={styles.calendarBtnDelete}
                                title="Supprimer"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        ))}

                      {dayExpenses.length > 3 && (
                        <div className={styles.moreExpenses}>
                          +{dayExpenses.length - 3} autre{dayExpenses.length - 3 > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const nextMonthDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)

  return (
    <div className={styles.calendarContainer}>
      {/* Header du calendrier */}
      <div className={styles.calendarHeader}>
        <div className={styles.calendarHeaderLeft}>
          <h2 className={styles.calendarTitle}>
            📅 Calendrier des dépenses
          </h2>
          <p className={styles.calendarSubtitle}>
            Vue mensuelle de vos charges récurrentes
          </p>
        </div>
        <div className={styles.calendarHeaderRight}>
          <div className={styles.monthlyTotalCard}>
            <span className={styles.monthlyTotalLabel}>Total mensuel</span>
            <span className={styles.monthlyTotalAmount}>{monthlyTotal.toFixed(2)}€</span>
          </div>
        </div>
      </div>

      {/* Navigation du mois */}
      <div className={styles.monthNavigation}>
        <button onClick={previousMonth} className={styles.monthNavButton}>
          ← Mois précédent
        </button>
        <h3 className={styles.currentMonthTitle}>
          {showTwoMonths
            ? `${currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })} - ${nextMonthDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`
            : currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
          }
        </h3>
        <button onClick={nextMonth} className={styles.monthNavButton}>
          Mois suivant →
        </button>
      </div>

      {/* Grille des mois */}
      <div className={showTwoMonths ? styles.twoMonthsGrid : styles.singleMonthGrid}>
        {renderMonth(currentMonth, true)}
        {showTwoMonths && renderMonth(nextMonthDate, false)}
      </div>

      {/* Légende */}
      <div className={styles.calendarLegend}>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }} />
          <span>Aujourd'hui</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ background: '#ef4444' }} />
          <span>Jour avec dépenses</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ background: '#f8fafc', border: '2px solid #e2e8f0' }} />
          <span>Jour sans dépenses</span>
        </div>
      </div>
    </div>
  )
}
