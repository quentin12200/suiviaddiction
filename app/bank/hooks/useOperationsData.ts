import { useState, useMemo } from 'react'
import type {
  OperationRow,
  OperationWithOverrides,
  Filters,
  DatePreset,
  MonthComparison
} from '../types'

export function useOperationsData() {
  const [operations, setOperations] = useState<OperationRow[]>([])
  const [categoryEdits, setCategoryEdits] = useState<Record<string, string>>({})
  const [recurrenceEdits, setRecurrenceEdits] = useState<Record<string, boolean>>({})
  const [excludedOps, setExcludedOps] = useState<Record<string, boolean>>({})
  const [categoryMandatory, setCategoryMandatory] = useState<Record<string, boolean>>({})

  const operationsWithOverrides = useMemo<OperationWithOverrides[]>(() => (
    operations.map((operation) => {
      const key = `${operation.Merchant_key}-${operation.Date}-${operation.Montant}`
      return {
        ...operation,
        categoryLabel: categoryEdits[operation.Merchant_key] || operation.Categorie || 'Autre',
        recurringLabel: recurrenceEdits[operation.Merchant_key] ?? operation.Est_recurrent,
        excluded: excludedOps[key] ?? false,
        rowKey: key,
      }
    })
  ), [operations, categoryEdits, recurrenceEdits, excludedOps])

  const resetEdits = () => {
    setExcludedOps({})
    setCategoryEdits({})
    setRecurrenceEdits({})
    setCategoryMandatory({})
  }

  return {
    operations,
    setOperations,
    categoryEdits,
    setCategoryEdits,
    recurrenceEdits,
    setRecurrenceEdits,
    excludedOps,
    setExcludedOps,
    categoryMandatory,
    setCategoryMandatory,
    operationsWithOverrides,
    resetEdits,
  }
}

export function useFilteredOperations(
  operationsWithOverrides: OperationWithOverrides[],
  datePreset: DatePreset,
  dateFrom: string,
  dateTo: string,
  filters: Filters
) {
  return useMemo(() => {
    if (!operationsWithOverrides.length) return []
    const today = new Date()
    const startOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const startOfPreviousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const endOfPreviousMonth = new Date(today.getFullYear(), today.getMonth(), 0)

    const fromDate = datePreset === 'custom' && dateFrom
      ? new Date(dateFrom)
      : datePreset === 'last30'
        ? new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000)
        : datePreset === 'previousMonth'
          ? startOfPreviousMonth
          : startOfCurrentMonth
    const toDate = datePreset === 'custom' && dateTo
      ? new Date(dateTo)
      : datePreset === 'previousMonth'
        ? endOfPreviousMonth
        : today

    return operationsWithOverrides.filter((operation) => {
      const dateValue = operation.Date ? new Date(operation.Date) : null
      if (dateValue && (dateValue < fromDate || dateValue > toDate)) {
        return false
      }
      if (filters.date && !operation.Date.includes(filters.date)) return false
      const labelValue = operation['Libelle simplifie'] || operation['Libelle operation'] || ''
      if (filters.label && !labelValue.toLowerCase().includes(filters.label.toLowerCase())) return false
      if (filters.amount && !operation.Montant.toFixed(2).includes(filters.amount)) return false
      if (filters.category && !operation.categoryLabel.toLowerCase().includes(filters.category.toLowerCase())) return false
      if (filters.recurring && (operation.recurringLabel ? 'oui' : 'non') !== filters.recurring.toLowerCase()) return false
      if (filters.installment && (operation.Paiement_4x ? 'oui' : 'non') !== filters.installment.toLowerCase()) return false
      return true
    })
  }, [operationsWithOverrides, datePreset, dateFrom, dateTo, filters])
}

export function useCategoryTotals(filteredOperations: OperationWithOverrides[]) {
  return useMemo(() => {
    const totals: Record<string, number> = {}
    filteredOperations.forEach((operation) => {
      if (operation.Montant >= 0) return
      if (operation.excluded) return
      const category = operation.categoryLabel || 'Autre'
      totals[category] = (totals[category] || 0) + Math.abs(operation.Montant)
    })
    return Object.entries(totals)
      .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value)
  }, [filteredOperations])
}

export function useMonthComparison(
  operationsWithOverrides: OperationWithOverrides[],
  excludedOps: Record<string, boolean>
): MonthComparison | null {
  return useMemo(() => {
    if (!operationsWithOverrides.length) return null
    const today = new Date()
    const startOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const startOfPreviousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const endOfPreviousMonth = new Date(today.getFullYear(), today.getMonth(), 0)

    const totals: MonthComparison = {
      current: { expenses: 0, income: 0 },
      previous: { expenses: 0, income: 0 },
    }

    operationsWithOverrides.forEach((operation) => {
      const dateValue = operation.Date ? new Date(operation.Date) : null
      if (!dateValue) return
      const key = `${operation.Merchant_key}-${operation.Date}-${operation.Montant}`
      if (excludedOps[key]) return
      const target = dateValue >= startOfCurrentMonth
        ? totals.current
        : dateValue >= startOfPreviousMonth && dateValue <= endOfPreviousMonth
          ? totals.previous
          : null
      if (!target) return
      if (operation.Montant < 0) {
        target.expenses += Math.abs(operation.Montant)
      } else {
        target.income += operation.Montant
      }
    })

    return totals
  }, [operationsWithOverrides, excludedOps])
}

export function useMandatorySummary(
  operationsWithOverrides: OperationWithOverrides[],
  categoryMandatory: Record<string, boolean>,
  minimumResources: string
) {
  return useMemo(() => {
    if (!operationsWithOverrides.length) return null
    const today = new Date()
    const startOfPreviousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const endOfPreviousMonth = new Date(today.getFullYear(), today.getMonth(), 0)
    let mandatorySpend = 0
    operationsWithOverrides.forEach((operation) => {
      if (operation.Montant >= 0) return
      const dateValue = operation.Date ? new Date(operation.Date) : null
      if (!dateValue || dateValue < startOfPreviousMonth || dateValue > endOfPreviousMonth) return
      const category = operation.categoryLabel
      if (categoryMandatory[category]) {
        mandatorySpend += Math.abs(operation.Montant)
      }
    })
    const minResourcesValue = Number(minimumResources || 0)
    return {
      mandatorySpend,
      remaining: minResourcesValue - mandatorySpend,
    }
  }, [operationsWithOverrides, categoryMandatory, minimumResources])
}
