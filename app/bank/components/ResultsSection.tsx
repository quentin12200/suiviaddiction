import type {
  AnalysisResult,
  OperationWithOverrides,
  DatePreset,
  Filters,
  MonthComparison,
  MandatorySummary
} from '../types'
import { CategoryChart } from './CategoryChart'
import { OperationsTable } from './OperationsTable'
import styles from '../bank.module.css'

interface ResultsSectionProps {
  result: AnalysisResult
  categoryTotals: Array<{ name: string; value: number }>
  categoryMandatory: Record<string, boolean>
  setCategoryMandatory: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  mandatorySummary: MandatorySummary | null
  filteredOperations: OperationWithOverrides[]
  datePreset: DatePreset
  setDatePreset: (value: DatePreset) => void
  dateFrom: string
  setDateFrom: (value: string) => void
  dateTo: string
  setDateTo: (value: string) => void
  filters: Filters
  setFilters: React.Dispatch<React.SetStateAction<Filters>>
  monthComparison: MonthComparison | null
  setCategoryEdits: React.Dispatch<React.SetStateAction<Record<string, string>>>
  setRecurrenceEdits: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  setExcludedOps: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
}

export function ResultsSection({
  result,
  categoryTotals,
  categoryMandatory,
  setCategoryMandatory,
  mandatorySummary,
  filteredOperations,
  datePreset,
  setDatePreset,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  filters,
  setFilters,
  monthComparison,
  setCategoryEdits,
  setRecurrenceEdits,
  setExcludedOps,
}: ResultsSectionProps) {
  return (
    <div className={styles.results}>
      <h2>📊 Résultats</h2>
      <div className={styles.summaryGrid}>
        <div>
          <h4>Solde fin mois prochain</h4>
          <p>{result.endNextMonthBalance || 'n/a'} €</p>
          <small>{result.endNextMonthDate}</small>
        </div>
        <div>
          <h4>Solde minimum estimé</h4>
          <p>{result.minBalance || 'n/a'} €</p>
          <small>{result.minBalanceDate}</small>
        </div>
        <div>
          <h4>Paiements 4x détectés</h4>
          <p>{result.paiements4xCount}</p>
        </div>
      </div>

      <div className={styles.section}>
        <h3>🏷️ Dépenses par catégorie</h3>
        <CategoryChart
          data={categoryTotals}
          categoryMandatory={categoryMandatory}
          setCategoryMandatory={setCategoryMandatory}
        />
      </div>

      {mandatorySummary && (
        <div className={styles.section}>
          <h3>🧮 Reste à vivre (basé sur le mois précédent)</h3>
          <p>
            Dépenses obligatoires estimées : <strong>{mandatorySummary.mandatorySpend.toFixed(2)} €</strong>
          </p>
          <p>
            Reste à vivre estimé : <strong>{mandatorySummary.remaining.toFixed(2)} €</strong>
          </p>
        </div>
      )}

      <OperationsTable
        operations={filteredOperations}
        datePreset={datePreset}
        setDatePreset={setDatePreset}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        filters={filters}
        setFilters={setFilters}
        monthComparison={monthComparison}
        setCategoryEdits={setCategoryEdits}
        setRecurrenceEdits={setRecurrenceEdits}
        setExcludedOps={setExcludedOps}
      />

      <div className={styles.console}>
        <h3>🧾 Résumé console</h3>
        <pre>{result.console}</pre>
      </div>
    </div>
  )
}
