'use client'

import { useMemo } from 'react'
import type { RecurringExpense, IncomeRule, SoldeProjection, Alert, OperationRow } from '../types'

interface UseSoldeProjectionParams {
  solde: number // Solde actuel saisi par l'utilisateur
  expenses: RecurringExpense[]
  incomeRules: IncomeRule[]
  operations: OperationRow[] // Opérations du CSV importé (pour le pointage)
  horizonDays: number // Nombre de jours à projeter
  decouvert: number // Découvert autorisé (négatif, ex: -900)
}

export function useSoldeProjection({
  solde,
  expenses,
  incomeRules,
  operations,
  horizonDays,
  decouvert
}: UseSoldeProjectionParams) {

  // Calculer la projection jour par jour
  const projection = useMemo((): SoldeProjection[] => {
    console.log('🔍 useSoldeProjection - Calcul de la projection')
    console.log('  Solde initial:', solde)
    console.log('  Nombre de dépenses récurrentes:', expenses.length)
    if (expenses.length > 0) {
      console.log('  Exemples de dépenses:', expenses.slice(0, 3).map(e => `${e.label} (le ${e.dayOfMonth})`))
    }
    console.log('  Nombre de revenus:', incomeRules.length)
    console.log('  Horizon (jours):', horizonDays)

    const result: SoldeProjection[] = []
    const today = new Date()
    let currentSolde = solde

    // Créer un index des opérations par date pour le pointage
    const operationsByDate = new Map<string, OperationRow[]>()
    operations.forEach(op => {
      const dateKey = op.Date.split('T')[0]
      if (!operationsByDate.has(dateKey)) {
        operationsByDate.set(dateKey, [])
      }
      operationsByDate.get(dateKey)!.push(op)
    })

    for (let i = 0; i <= horizonDays; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]
      const dayOfMonth = date.getDate()

      const dayOperations: SoldeProjection['operations'] = []

      // Ajouter les revenus pour ce jour
      incomeRules.forEach(rule => {
        if (parseInt(rule.day) === dayOfMonth) {
          const amount = parseFloat(rule.amount)
          dayOperations.push({
            label: rule.label,
            amount: amount,
            category: 'Revenu',
            isMatched: false // Les revenus ne sont pas matchés
          })
          currentSolde += amount
        }
      })

      // Ajouter les dépenses récurrentes pour ce jour
      expenses.forEach(exp => {
        if (!exp.isActive) return
        if (exp.dayOfMonth === dayOfMonth) {
          console.log(`  📅 Jour ${dayOfMonth} (${dateStr}): Dépense trouvée - ${exp.label} (${exp.amount}€)`)

          // Vérifier si la dépense est dans la période de validité
          if (exp.startDate && new Date(exp.startDate) > date) return
          if (exp.endDate && new Date(exp.endDate) < date) return

          // Gérer les dépenses variables par mois
          let amount = exp.amount
          if (exp.isVariable && exp.variableMonths) {
            try {
              const months = JSON.parse(exp.variableMonths)
              const monthKey = (date.getMonth() + 1).toString()
              amount = months[monthKey] || exp.amount
            } catch {
              // Utiliser le montant par défaut si erreur
            }
          }

          // Chercher si cette dépense a été matchée dans le CSV
          const dateOps = operationsByDate.get(dateStr) || []
          const matched = dateOps.some(op => {
            // Matching simple par label et montant approximatif
            const labelMatch = op.Libelle_norm.toLowerCase().includes(exp.label.toLowerCase()) ||
                              exp.label.toLowerCase().includes(op.Libelle_norm.toLowerCase())
            const amountMatch = Math.abs(op.Montant + amount) < 0.01 // Montant négatif dans CSV
            return labelMatch && amountMatch
          })

          dayOperations.push({
            label: exp.label,
            amount: -amount, // Négatif car c'est une dépense
            category: exp.category,
            isMatched: matched
          })
          currentSolde -= amount
        }
      })

      // Déterminer si en découvert
      const isOverdraft = currentSolde < 0 && currentSolde < decouvert

      result.push({
        date: dateStr,
        solde: currentSolde,
        isOverdraft,
        operations: dayOperations
      })
    }

    return result
  }, [solde, expenses, incomeRules, operations, horizonDays, decouvert])

  // Générer les alertes
  const alerts = useMemo((): Alert[] => {
    const result: Alert[] = []

    projection.forEach((day, index) => {
      // Alerte danger: découvert dépassé
      if (day.isOverdraft) {
        result.push({
          type: 'danger',
          date: day.date,
          message: `Découvert dépassé (${day.solde.toFixed(2)}€ < ${decouvert}€)`,
          solde: day.solde
        })
      }
      // Alerte warning: proche du découvert
      else if (day.solde < 0 && day.solde >= decouvert) {
        result.push({
          type: 'warning',
          date: day.date,
          message: `Solde négatif mais dans le découvert autorisé (${day.solde.toFixed(2)}€)`,
          solde: day.solde
        })
      }
      // Alerte info: grosse dépense à venir
      else if (index > 0) {
        const previousSolde = projection[index - 1].solde
        const drop = previousSolde - day.solde
        if (drop > 500) { // Chute de plus de 500€
          result.push({
            type: 'info',
            date: day.date,
            message: `Grosse dépense prévue: -${drop.toFixed(2)}€`,
            solde: day.solde
          })
        }
      }
    })

    return result
  }, [projection, decouvert])

  // Solde minimum sur la période
  const minSolde = useMemo(() => {
    if (projection.length === 0) return { solde: 0, date: '' }

    const min = projection.reduce((min, day) =>
      day.solde < min.solde ? day : min
    , projection[0])

    return { solde: min.solde, date: min.date }
  }, [projection])

  // Solde à la fin de la période
  const endSolde = useMemo(() => {
    if (projection.length === 0) return { solde: 0, date: '' }
    const last = projection[projection.length - 1]
    return { solde: last.solde, date: last.date }
  }, [projection])

  return {
    projection,
    alerts,
    minSolde,
    endSolde
  }
}
