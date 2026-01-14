import { useState, useMemo } from 'react'
import type { IncomeRule } from '../types'

export function useIncomeRules() {
  const [incomeRules, setIncomeRules] = useState<IncomeRule[]>([
    { id: crypto.randomUUID(), label: 'Quentin CGT', amount: '2600', day: '30' },
    { id: crypto.randomUUID(), label: 'Salaire Sophie', amount: '1450', day: '20' },
    { id: crypto.randomUUID(), label: 'Aide Aveyron', amount: '450', day: '20' },
  ])

  const addIncomeRule = () => {
    setIncomeRules((prev) => ([...prev, {
      id: crypto.randomUUID(),
      label: '',
      amount: '',
      day: '',
    }]))
  }

  const updateIncomeRule = (id: string, updates: Partial<IncomeRule>) => {
    setIncomeRules((prev) => prev.map((rule) => (
      rule.id === id ? { ...rule, ...updates } : rule
    )))
  }

  const removeIncomeRule = (id: string) => {
    setIncomeRules((prev) => prev.filter((rule) => rule.id !== id))
  }

  const incomeRulesTotal = useMemo(() => (
    incomeRules.reduce((sum, rule) => sum + Number(rule.amount || 0), 0)
  ), [incomeRules])

  return {
    incomeRules,
    addIncomeRule,
    updateIncomeRule,
    removeIncomeRule,
    incomeRulesTotal,
  }
}
