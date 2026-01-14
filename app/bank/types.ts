export interface AnalysisResult {
  operations: OperationRow[]
  recurrents: Record<string, unknown>[]
  forecast: ForecastRow[]
  console: string
  forecastFileName: string
  endNextMonthBalance: string
  endNextMonthDate: string
  minBalance: string
  minBalanceDate: string
  paiements4xCount: number
}

export interface OperationRow {
  Date: string
  Montant: number
  Libelle_norm: string
  Merchant_key: string
  Paiement_4x: boolean
  Echeances_restantes: number | ''
  Categorie: string
  'Sous categorie': string
  Est_recurrent: boolean
  Tag_recurrent: string
  Confiance_recurrent: number | ''
  'Libelle simplifie': string
  'Libelle operation': string
}

export interface ForecastRow {
  Date: string
  Flux_recurrents: string
  Flux_variables_estimes: string
  Flux_total: string
  Solde_estime: string
  Risque: boolean
  Detail_recurrents: string
}

export interface IncomeRule {
  id: string
  label: string
  amount: string
  day: string
}

export interface ManualEntry {
  id: string
  date: string
  label: string
  amount: string
  type: 'debit' | 'credit'
}

export type DatePreset = 'last30' | 'currentMonth' | 'previousMonth' | 'custom'

export interface OperationWithOverrides extends OperationRow {
  categoryLabel: string
  recurringLabel: boolean
  excluded: boolean
  rowKey: string
}

export interface Filters {
  date: string
  label: string
  amount: string
  category: string
  recurring: string
  installment: string
}

export interface MonthComparison {
  current: { expenses: number; income: number }
  previous: { expenses: number; income: number }
}

export interface MandatorySummary {
  mandatorySpend: number
  remaining: number
}
