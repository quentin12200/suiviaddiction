import { useState } from 'react'
import type { ManualEntry } from '../types'

export function useManualEntries() {
  const [manualEntries, setManualEntries] = useState<ManualEntry[]>([])

  const addManualEntry = () => {
    setManualEntries((prev) => ([...prev, {
      id: crypto.randomUUID(),
      date: '',
      label: '',
      amount: '',
      type: 'debit' as const,
    }]))
  }

  const updateManualEntry = (id: string, updates: Partial<ManualEntry>) => {
    setManualEntries((prev) => prev.map((entry) => (
      entry.id === id ? { ...entry, ...updates } : entry
    )))
  }

  const removeManualEntry = (id: string) => {
    setManualEntries((prev) => prev.filter((entry) => entry.id !== id))
  }

  return {
    manualEntries,
    addManualEntry,
    updateManualEntry,
    removeManualEntry,
  }
}
