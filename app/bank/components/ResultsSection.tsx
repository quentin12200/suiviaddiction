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
  const endBalance = parseFloat(result.endNextMonthBalance || '0')
  const minBalance = parseFloat(result.minBalance || '0')
  const isEndBalanceNegative = endBalance < 0
  const isMinBalanceNegative = minBalance < 0

  const totalExpenses = categoryTotals.reduce((sum, cat) => sum + cat.value, 0)
  const currentMonthExpenses = monthComparison?.current.expenses || 0
  const currentMonthIncome = monthComparison?.current.income || 0
  const currentMonthBalance = currentMonthIncome - currentMonthExpenses

  return (
    <div className={styles.results}>
      <h2>📊 Résultats de l\'analyse</h2>

      {isMinBalanceNegative && (
        <div className={styles.alert}>
          <strong>⚠️ Attention découvert prévu !</strong>
          <p>
            Ton solde minimum estimé sera de <strong>{result.minBalance} €</strong> le {result.minBalanceDate}.
            {isEndBalanceNegative && ` À la fin du mois prochain, tu seras toujours à découvert (${result.endNextMonthBalance} €).`}
          </p>
        </div>
      )}

      <div className={styles.summaryGrid}>
        <div className={isEndBalanceNegative ? styles.cardDanger : styles.cardSuccess}>
          <h4>Solde prévu fin mois prochain</h4>
          <p className={styles.bigAmount}>{result.endNextMonthBalance || 'n/a'} €</p>
          <small>{result.endNextMonthDate}</small>
        </div>
        <div className={isMinBalanceNegative ? styles.cardDanger : styles.cardSuccess}>
          <h4>Point le plus bas</h4>
          <p className={styles.bigAmount}>{result.minBalance || 'n/a'} €</p>
          <small>{result.minBalanceDate}</small>
        </div>
        <div>
          <h4>Paiements 4x détectés</h4>
          <p className={styles.bigAmount}>{result.paiements4xCount}</p>
        </div>
      </div>

      {monthComparison && (
        <div className={styles.monthSummary}>
          <h3>💰 Résumé du mois en cours</h3>
          <div className={styles.flowGrid}>
            <div className={styles.flowItem}>
              <span className={styles.flowLabel}>Entrées</span>
              <span className={styles.flowPositive}>+{currentMonthIncome.toFixed(2)} €</span>
            </div>
            <div className={styles.flowItem}>
              <span className={styles.flowLabel}>Sorties</span>
              <span className={styles.flowNegative}>-{currentMonthExpenses.toFixed(2)} €</span>
            </div>
            <div className={styles.flowItem}>
              <span className={styles.flowLabel}>Solde du mois</span>
              <span className={currentMonthBalance >= 0 ? styles.flowPositive : styles.flowNegative}>
                {currentMonthBalance >= 0 ? '+' : ''}{currentMonthBalance.toFixed(2)} €
              </span>
            </div>
          </div>
        </div>
      )}


      <div className={styles.section}>
        <h3>🏷️ Analyse des dépenses (période filtrée)</h3>
        <div className={styles.expenseSummary}>
          <p>
            <strong>Total des dépenses :</strong> {totalExpenses.toFixed(2)} €
          </p>
          <p className={styles.helpText}>
            💡 Coche "Obligatoire" pour les dépenses incompressibles (loyer, assurances, etc.)
            afin de calculer ton reste à vivre.
          </p>
        </div>
        <CategoryChart
          data={categoryTotals}
          categoryMandatory={categoryMandatory}
          setCategoryMandatory={setCategoryMandatory}
        />
      </div>

      {mandatorySummary && (
        <div className={styles.section}>
          <h3>🧮 Reste à vivre (basé sur le mois précédent)</h3>
          {mandatorySummary.mandatorySpend === 0 ? (
            <div className={styles.infoBox}>
              <p>
                ⚠️ <strong>Aucune dépense obligatoire cochée.</strong>
              </p>
              <p>
                Coche les catégories obligatoires ci-dessus (loyer, assurances, abonnements...)
                pour voir ton reste à vivre réel.
              </p>
            </div>
          ) : (
            <div className={styles.remainingSummary}>
              <div className={styles.remainingCalc}>
                <div className={styles.calcRow}>
                  <span>Ressources minimum déclarées</span>
                  <span className={styles.calcAmount}>{(mandatorySummary.mandatorySpend + mandatorySummary.remaining).toFixed(2)} €</span>
                </div>
                <div className={styles.calcRow}>
                  <span>− Dépenses obligatoires (mois précédent)</span>
                  <span className={styles.calcAmount}>−{mandatorySummary.mandatorySpend.toFixed(2)} €</span>
                </div>
                <div className={styles.calcRow + ' ' + styles.calcTotal}>
                  <span><strong>= Reste à vivre estimé</strong></span>
                  <span className={styles.calcAmount + ' ' + (mandatorySummary.remaining >= 0 ? styles.positive : styles.negative)}>
                    <strong>{mandatorySummary.remaining.toFixed(2)} €</strong>
                  </span>
                </div>
              </div>
              {mandatorySummary.remaining < 0 && (
                <p className={styles.warning}>
                  ⚠️ Attention : tes dépenses obligatoires dépassent tes ressources minimum !
                </p>
              )}
            </div>
          )}
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
