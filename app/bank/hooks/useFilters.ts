import { useState } from 'react'
import type { Filters, DatePreset } from '../types'

export function useFilters() {
  const [datePreset, setDatePreset] = useState<DatePreset>('last30')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [filters, setFilters] = useState<Filters>({
    date: '',
    label: '',
    amount: '',
    category: '',
    recurring: '',
    installment: '',
  })

  return {
    datePreset,
    setDatePreset,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    filters,
    setFilters,
  }
}
