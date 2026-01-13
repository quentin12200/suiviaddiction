import { NextResponse } from 'next/server'
import { parse } from 'csv-parse/sync'

const REQUIRED_COLUMNS = [
  'Date de comptabilisation',
  'Libelle simplifie',
  'Libelle operation',
  'Reference',
  'Informations complementaires',
  'Type operation',
  'Categorie',
  'Sous categorie',
  'Debit',
  'Credit',
  'Date operation',
  'Date de valeur',
  'Pointage operation',
]

const NOISE_TOKENS = new Set([
  'cb', 'carte', 'paiement', 'fact', 'facture', 'sepa', 'prlv', 'prelevement',
  'virement', 'vir', 'ret', 'dab', 'retrait', 'transfert', 'operation',
  'paylib', 'contact', 'sans', 'ref', 'reference', 'prlvt', 'paiem', 'achat',
  'paypal', 'tp', 'tpe', 'fr', 'f', 'the', 'de', 'la', 'le', 'les', 'du', 'des',
])

const PERIODICITY_RULES = {
  hebdo: { center: 7, tolerance: 2 },
  bimensuel: { center: 14, tolerance: 3 },
  mensuel: { center: 30, tolerance: 5 },
  trimestriel: { center: 90, tolerance: 10 },
}

type RawRow = Record<string, string>

type NormalizedRow = RawRow & {
  Date: Date | null
  Montant: number
  Libelle_norm: string
  Merchant_key: string
  Paiement_4x: boolean
  Echeances_restantes: number | ''
}

type ManualEntry = {
  date: string
  amount: number
  label: string
  type: 'debit' | 'credit'
}

const parseDate = (value?: string): Date | null => {
  if (!value) return null
  const cleaned = value.trim()
  if (!cleaned) return null
  const parts = cleaned.split(/[\/\-]/).map((part) => part.trim())
  if (parts.length < 3) return null
  const [day, month, year] = parts
  const dayNum = Number(day)
  const monthNum = Number(month)
  const yearNum = Number(year.length === 2 ? `20${year}` : year)
  if (!dayNum || !monthNum || !yearNum) return null
  const date = new Date(yearNum, monthNum - 1, dayNum)
  return Number.isNaN(date.getTime()) ? null : date
}

const normalizeAmount = (value?: string): number => {
  if (!value) return 0
  const cleaned = value
    .replace(/\u00a0/g, '')
    .replace(/\s/g, '')
    .replace(',', '.')
    .replace(/[^0-9\.-]/g, '')
  const parsed = Number(cleaned)
  return Number.isNaN(parsed) ? 0 : parsed
}

const normalizeLabel = (value: string): string => {
  const lower = value.toLowerCase()
  const stripped = lower
    .replace(/\b\d{2,}\b/g, ' ')
    .replace(/\b[a-z0-9]{6,}\b/g, ' ')
    .replace(/[^a-zà-ÿ\s]/g, ' ')
  const tokens = stripped.split(/\s+/).filter((token) => token && !NOISE_TOKENS.has(token))
  return tokens.join(' ').replace(/\s+/g, ' ').trim()
}

const buildMerchantKey = (value: string): string => {
  const cleaned = value.replace(/\b\d{5}\b/g, ' ').replace(/\s+/g, ' ').trim()
  return cleaned.slice(0, 40).trim()
}

const detectInstallment = (label: string): { isInstallment: boolean; remaining: number | '' } => {
  const lower = label.toLowerCase()
  const match = lower.match(/\b([1-4])\s*\/\s*4\b/)
  if (match) {
    const current = Number(match[1])
    return { isInstallment: true, remaining: Math.max(0, 4 - current) }
  }
  if (lower.match(/\b4\s*x\b|\bx\s*4\b/)) {
    return { isInstallment: true, remaining: '' }
  }
  return { isInstallment: false, remaining: '' }
}

const computePeriodicity = (deltas: number[]) => {
  if (!deltas.length) return { periodicity: 'inconnu', ratio: 0 }
  let bestPeriod = 'inconnu'
  let bestRatio = 0
  Object.entries(PERIODICITY_RULES).forEach(([label, rule]) => {
    const matches = deltas.filter((delta) => Math.abs(delta - rule.center) <= rule.tolerance)
    const ratio = matches.length / deltas.length
    if (ratio > bestRatio) {
      bestRatio = ratio
      bestPeriod = label
    }
  })
  if (bestRatio < 0.6) return { periodicity: 'inconnu', ratio: bestRatio }
  return { periodicity: bestPeriod, ratio: bestRatio }
}

const computeConfidence = (ratio: number, stableScore: number, occurrences: number) => {
  const occurrenceScore = Math.min(1, occurrences / 6)
  const score = 0.5 * ratio + 0.3 * stableScore + 0.2 * occurrenceScore
  return Math.round(score * 100)
}

const toCsv = (rows: Record<string, unknown>[], headers: string[], delimiter = ';') => {
  const escape = (value: unknown) => {
    const str = value === null || value === undefined ? '' : String(value)
    const escaped = str.replace(/"/g, '""')
    return `"${escaped}"`
  }
  const lines = [headers.join(delimiter)]
  rows.forEach((row) => {
    lines.push(headers.map((header) => escape(row[header])).join(delimiter))
  })
  return lines.join('\n')
}

const readCsv = (buffer: Buffer) => {
  const encodings: BufferEncoding[] = ['latin1', 'utf-8']
  let lastError: unknown
  for (const encoding of encodings) {
    try {
      const content = buffer.toString(encoding)
      const rows = parse(content, {
        columns: true,
        delimiter: ';',
        skip_empty_lines: true,
        relax_column_count: true,
        trim: true,
      }) as RawRow[]
      return rows
    } catch (error) {
      lastError = error
    }
  }
  throw lastError
}

const detectRecurrents = (rows: NormalizedRow[], sign: 'negative' | 'positive') => {
  const filtered = rows.filter((row) => {
    if (row.Paiement_4x) return false
    return sign === 'negative' ? row.Montant < 0 : row.Montant > 0
  })

  const grouped = new Map<string, NormalizedRow[]>()
  filtered.forEach((row) => {
    const key = row.Merchant_key
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)?.push(row)
  })

  const results: Record<string, unknown>[] = []
  grouped.forEach((groupRows, merchantKey) => {
    const sorted = [...groupRows].sort((a, b) => (a.Date?.getTime() ?? 0) - (b.Date?.getTime() ?? 0))
    if (sorted.length < 3) return

    const amounts = sorted.map((row) => row.Montant)
    const median = amounts.slice().sort((a, b) => a - b)[Math.floor(amounts.length / 2)]
    const mean = amounts.reduce((sum, value) => sum + value, 0) / amounts.length
    const variance = amounts.reduce((sum, value) => sum + (value - mean) ** 2, 0) / amounts.length
    const std = Math.sqrt(variance)
    const absMedian = Math.abs(median)
    const stabilityThreshold = Math.max(0.05 * absMedian, 2)
    const stable = std <= stabilityThreshold
    const stableScore = Math.max(0, 1 - std / stabilityThreshold)

    const dates = sorted.map((row) => row.Date).filter((date): date is Date => Boolean(date))
    const deltas = dates.slice(1).map((date, index) => {
      const prev = dates[index]
      return Math.round((date.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24))
    })
    const { periodicity, ratio } = computePeriodicity(deltas)
    if (!stable || ratio < 0.6) return

    const lastDate = dates[dates.length - 1]
    const periodDays = periodicity === 'inconnu' ? 0 : PERIODICITY_RULES[periodicity as keyof typeof PERIODICITY_RULES].center
    const nextDate = periodDays ? new Date(lastDate.getTime() + periodDays * 24 * 60 * 60 * 1000) : null

    const exampleLabel = sorted[0]['Libelle simplifie']
    const confidence = computeConfidence(ratio, stableScore, sorted.length)

    results.push({
      Merchant_key: merchantKey,
      Exemple_libelle: exampleLabel,
      Periodicite: periodicity,
      Montant_median: Number(median.toFixed(2)),
      Derniere_date: lastDate.toISOString().slice(0, 10),
      Prochaine_date_estimee: nextDate ? nextDate.toISOString().slice(0, 10) : '',
      Confiance: confidence,
      Categorie: sorted[0].Categorie,
      Sous_categorie: sorted[0]['Sous categorie'],
      Nb_occurrences: sorted.length,
    })
  })

  return results
}

const estimateVariableSpend = (rows: NormalizedRow[], recurrentKeys: string[]) => {
  const nonRecurring = rows.filter((row) => row.Montant < 0 && !recurrentKeys.includes(row.Merchant_key))
  if (!nonRecurring.length) {
    return Array.from({ length: 7 }).fill(0) as number[]
  }

  const maxDate = nonRecurring.reduce((max, row) => {
    if (!row.Date) return max
    return row.Date > max ? row.Date : max
  }, nonRecurring[0].Date ?? new Date())

  const startDate = new Date(maxDate.getTime() - 56 * 24 * 60 * 60 * 1000)
  const totalsByDay = new Map<string, number>()

  nonRecurring.forEach((row) => {
    if (!row.Date || row.Date < startDate) return
    const key = row.Date.toISOString().slice(0, 10)
    totalsByDay.set(key, (totalsByDay.get(key) ?? 0) + row.Montant)
  })

  const weekdayTotals = Array.from({ length: 7 }, () => [] as number[])
  for (let i = 0; i <= 56; i += 1) {
    const day = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
    const key = day.toISOString().slice(0, 10)
    const total = totalsByDay.get(key) ?? 0
    weekdayTotals[day.getDay()].push(total)
  }

  const globalAvg = weekdayTotals.flat().reduce((sum, value) => sum + value, 0) / weekdayTotals.flat().length
  return weekdayTotals.map((values) => {
    if (!values.length) return globalAvg
    return values.reduce((sum, value) => sum + value, 0) / values.length
  })
}

const generateForecast = (
  rows: NormalizedRow[],
  recurrentExpenses: Record<string, unknown>[],
  recurrentIncomes: Record<string, unknown>[],
  manualEntries: ManualEntry[],
  soldeInitial: number,
  horizon: number,
) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const endDate = new Date(today.getTime() + horizon * 24 * 60 * 60 * 1000)

  const recurringEvents: { date: string; amount: number; label: string }[] = []

  const pushRecurring = (recurrents: Record<string, unknown>[]) => {
    recurrents.forEach((row) => {
      const periodicite = row.Periodicite as string
      if (periodicite === 'inconnu') return
      const rule = PERIODICITY_RULES[periodicite as keyof typeof PERIODICITY_RULES]
      if (!rule) return
      const lastDate = new Date(String(row.Derniere_date))
      const nextDate = new Date(lastDate.getTime() + rule.center * 24 * 60 * 60 * 1000)
      for (let cursor = nextDate; cursor <= endDate; cursor = new Date(cursor.getTime() + rule.center * 24 * 60 * 60 * 1000)) {
        recurringEvents.push({
          date: cursor.toISOString().slice(0, 10),
          amount: Number(row.Montant_median),
          label: String(row.Merchant_key),
        })
      }
    })
  }

  pushRecurring(recurrentExpenses)
  pushRecurring(recurrentIncomes)

  manualEntries.forEach((entry) => {
    if (!entry.date) return
    const amount = entry.type === 'debit' ? -Math.abs(entry.amount) : Math.abs(entry.amount)
    recurringEvents.push({
      date: entry.date,
      amount,
      label: entry.label || 'Manual',
    })
  })

  const recurringDaily = new Map<string, number>()
  const recurringDetails = new Map<string, string[]>()
  recurringEvents.forEach((event) => {
    recurringDaily.set(event.date, (recurringDaily.get(event.date) ?? 0) + event.amount)
    if (!recurringDetails.has(event.date)) recurringDetails.set(event.date, [])
    recurringDetails.get(event.date)?.push(`${event.label}:${event.amount.toFixed(2)}`)
  })

  const recurrentKeys = recurrentExpenses.map((row) => String(row.Merchant_key))
  const weekdayAvgs = estimateVariableSpend(rows, recurrentKeys)

  const forecastRows: Record<string, unknown>[] = []
  let runningBalance = soldeInitial

  for (let cursor = new Date(today); cursor <= endDate; cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000)) {
    const key = cursor.toISOString().slice(0, 10)
    const recurringAmount = recurringDaily.get(key) ?? 0
    const variableAmount = weekdayAvgs[cursor.getDay()] ?? 0
    const total = recurringAmount + variableAmount
    runningBalance += total

    forecastRows.push({
      Date: key,
      Flux_recurrents: recurringAmount.toFixed(2),
      Flux_variables_estimes: variableAmount.toFixed(2),
      Flux_total: total.toFixed(2),
      Solde_estime: runningBalance.toFixed(2),
      Risque: false,
      Detail_recurrents: (recurringDetails.get(key) ?? []).join(' | '),
    })
  }

  return forecastRows
}

const endOfNextMonthDate = () => {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() + 2, 0)
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const solde = formData.get('solde')
    const horizon = formData.get('horizon')
    const decouvert = formData.get('decouvert')
    const manualEntriesRaw = formData.get('manualEntries')

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: 'Fichier CSV manquant.' }, { status: 400 })
    }

    if (!solde) {
      return NextResponse.json({ success: false, error: 'Solde manquant.' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const rows = readCsv(buffer)
    const missingColumns = REQUIRED_COLUMNS.filter((col) => !Object.keys(rows[0] ?? {}).includes(col))
    if (missingColumns.length) {
      return NextResponse.json({
        success: false,
        error: `Colonnes manquantes: ${missingColumns.join(', ')}`,
      }, { status: 400 })
    }

    const normalizedRows: NormalizedRow[] = rows.map((row) => {
      const debit = normalizeAmount(row.Debit)
      const credit = normalizeAmount(row.Credit)
      const label = row['Libelle operation'] || ''
      const installment = detectInstallment(label)
      const dateRef = parseDate(row['Date de comptabilisation'])
        || parseDate(row['Date operation'])
        || parseDate(row['Date de valeur'])

      const libelleNorm = normalizeLabel(row['Libelle simplifie'] || '')
      return {
        ...row,
        Date: dateRef,
        Montant: credit - debit,
        Libelle_norm: libelleNorm,
        Merchant_key: buildMerchantKey(libelleNorm),
        Paiement_4x: installment.isInstallment,
        Echeances_restantes: installment.remaining,
      }
    }).sort((a, b) => (a.Date?.getTime() ?? 0) - (b.Date?.getTime() ?? 0))

    const recurrentExpenses = detectRecurrents(normalizedRows, 'negative')
    const recurrentIncomes = detectRecurrents(normalizedRows, 'positive')

    const recurrentMap = new Map(
      [...recurrentExpenses, ...recurrentIncomes].map((row) => [String(row.Merchant_key), row])
    )

    const operationsRows = normalizedRows.map((row) => ({
      ...row,
      Date: row.Date ? row.Date.toISOString().slice(0, 10) : '',
      Est_recurrent: recurrentMap.has(row.Merchant_key),
      Tag_recurrent: recurrentMap.get(row.Merchant_key)?.Periodicite ?? '',
      Confiance_recurrent: recurrentMap.get(row.Merchant_key)?.Confiance ?? '',
    }))

    let parsedManualEntries: ManualEntry[] = []
    if (typeof manualEntriesRaw === 'string' && manualEntriesRaw.trim()) {
      try {
        parsedManualEntries = JSON.parse(manualEntriesRaw)
      } catch (parseError) {
        parsedManualEntries = []
      }
    }

    const horizonValue = typeof horizon === 'string' && horizon ? Number(horizon) : 30
    const endNextMonth = endOfNextMonthDate()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const daysToEndNextMonth = Math.ceil((endNextMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    const effectiveHorizon = Math.max(horizonValue, daysToEndNextMonth)

    const forecastRows = generateForecast(
      normalizedRows,
      recurrentExpenses,
      recurrentIncomes,
      parsedManualEntries,
      Number(solde),
      effectiveHorizon,
    )

    const decouvertValue = typeof decouvert === 'string' && decouvert ? Number(decouvert) : -200
    forecastRows.forEach((row) => {
      row.Risque = Number(row.Solde_estime) < decouvertValue
    })

    const forecastHeaders = [
      'Date',
      'Flux_recurrents',
      'Flux_variables_estimes',
      'Flux_total',
      'Solde_estime',
      'Risque',
      'Detail_recurrents',
    ]

    const operationsHeaders = [
      ...REQUIRED_COLUMNS,
      'Date',
      'Montant',
      'Libelle_norm',
      'Merchant_key',
      'Paiement_4x',
      'Echeances_restantes',
      'Est_recurrent',
      'Tag_recurrent',
      'Confiance_recurrent',
    ]

    const recurrentsHeaders = [
      'Merchant_key',
      'Exemple_libelle',
      'Periodicite',
      'Montant_median',
      'Derniere_date',
      'Prochaine_date_estimee',
      'Confiance',
      'Categorie',
      'Sous_categorie',
      'Nb_occurrences',
    ]

    const operationsCsv = toCsv(operationsRows, operationsHeaders)
    const recurrentsCsv = toCsv(recurrentExpenses, recurrentsHeaders)
    const forecastCsv = toCsv(forecastRows, forecastHeaders)

    const forecastFileName = `previsionnel_${effectiveHorizon}j.csv`

    const minRow = forecastRows.reduce((min, row) => {
      if (!min) return row
      return Number(row.Solde_estime) < Number(min.Solde_estime) ? row : min
    }, forecastRows[0])

    const endNextMonthKey = endNextMonth.toISOString().slice(0, 10)
    const endNextMonthRow = forecastRows.find((row) => row.Date === endNextMonthKey)

    const consoleLines = [
      '=== Récurrents détectés (top 10) ===',
      ...recurrentExpenses.slice(0, 10).map((row) => (
        `- ${row.Merchant_key} | ${row.Montant_median} | ${row.Periodicite} | prochaine: ${row.Prochaine_date_estimee}`
      )),
      '',
      '=== Jours à risque (5 prochains jours avec solde minimum) ===',
      ...forecastRows
        .slice()
        .sort((a, b) => Number(a.Solde_estime) - Number(b.Solde_estime))
        .slice(0, 5)
        .map((row) => `- ${row.Date} : solde estimé ${row.Solde_estime}`),
      '',
      `Solde minimum estimé: ${minRow?.Solde_estime} le ${minRow?.Date}`,
    ]

    return NextResponse.json({
      success: true,
      data: {
        operations: Buffer.from(operationsCsv).toString('base64'),
        recurrents: Buffer.from(recurrentsCsv).toString('base64'),
        forecast: Buffer.from(forecastCsv).toString('base64'),
        console: consoleLines.join('\n'),
        forecastFileName,
        endNextMonthBalance: endNextMonthRow?.Solde_estime ?? '',
        endNextMonthDate: endNextMonthKey,
        minBalance: minRow?.Solde_estime ?? '',
        minBalanceDate: minRow?.Date ?? '',
        paiements4xCount: normalizedRows.filter((row) => row.Paiement_4x).length,
      },
    })
  } catch (error) {
    console.error('Erreur analyse bancaire:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de l\'analyse bancaire.' },
      { status: 500 }
    )
  }
}
