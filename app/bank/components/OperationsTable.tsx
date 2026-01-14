import type { OperationWithOverrides, Filters, DatePreset, MonthComparison } from '../types'
import styles from '../bank.module.css'

interface OperationsTableProps {
  operations: OperationWithOverrides[]
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

export function OperationsTable({
  operations,
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
}: OperationsTableProps) {
  return (
    <div className={styles.section}>
      <h3>🧾 Opérations (modifie la catégorie ou la récurrence)</h3>
      <div className={styles.filters}>
        <div>
          <label>Filtre période</label>
          <select value={datePreset} onChange={(event) => setDatePreset(event.target.value as DatePreset)}>
            <option value="last30">30 derniers jours</option>
            <option value="currentMonth">Mois en cours</option>
            <option value="previousMonth">Mois précédent</option>
            <option value="custom">Personnalisé</option>
          </select>
        </div>
        {datePreset === 'custom' && (
          <>
            <div>
              <label>Du</label>
              <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
            </div>
            <div>
              <label>Au</label>
              <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
            </div>
          </>
        )}
      </div>
      {monthComparison && (
        <div className={styles.comparison}>
          <div>
            <h4>Mois précédent</h4>
            <p>Entrées: {monthComparison.previous.income.toFixed(2)} €</p>
            <p>Sorties: {monthComparison.previous.expenses.toFixed(2)} €</p>
          </div>
          <div>
            <h4>Mois en cours</h4>
            <p>Entrées: {monthComparison.current.income.toFixed(2)} €</p>
            <p>Sorties: {monthComparison.current.expenses.toFixed(2)} €</p>
          </div>
        </div>
      )}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Libellé</th>
              <th>Montant</th>
              <th>Catégorie</th>
              <th>Récurrent</th>
              <th>4x</th>
              <th>Exclure mois prochain</th>
            </tr>
            <tr>
              <th>
                <input
                  type="text"
                  value={filters.date}
                  onChange={(event) => setFilters((prev) => ({ ...prev, date: event.target.value }))}
                />
              </th>
              <th>
                <input
                  type="text"
                  value={filters.label}
                  onChange={(event) => setFilters((prev) => ({ ...prev, label: event.target.value }))}
                />
              </th>
              <th>
                <input
                  type="text"
                  value={filters.amount}
                  onChange={(event) => setFilters((prev) => ({ ...prev, amount: event.target.value }))}
                />
              </th>
              <th>
                <input
                  type="text"
                  value={filters.category}
                  onChange={(event) => setFilters((prev) => ({ ...prev, category: event.target.value }))}
                />
              </th>
              <th>
                <select
                  value={filters.recurring}
                  onChange={(event) => setFilters((prev) => ({ ...prev, recurring: event.target.value }))}
                >
                  <option value="">Tous</option>
                  <option value="oui">Oui</option>
                  <option value="non">Non</option>
                </select>
              </th>
              <th>
                <select
                  value={filters.installment}
                  onChange={(event) => setFilters((prev) => ({ ...prev, installment: event.target.value }))}
                >
                  <option value="">Tous</option>
                  <option value="oui">Oui</option>
                  <option value="non">Non</option>
                </select>
              </th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {operations.map((operation) => (
              <tr key={operation.rowKey}>
                <td>{operation.Date}</td>
                <td>{operation['Libelle simplifie'] || operation['Libelle operation']}</td>
                <td className={operation.Montant < 0 ? styles.negative : styles.positive}>
                  {operation.Montant.toFixed(2)} €
                </td>
                <td>
                  <input
                    type="text"
                    value={operation.categoryLabel}
                    onChange={(event) => setCategoryEdits((prev) => ({
                      ...prev,
                      [operation.Merchant_key]: event.target.value,
                    }))}
                  />
                </td>
                <td>
                  <select
                    value={operation.recurringLabel ? 'yes' : 'no'}
                    onChange={(event) => setRecurrenceEdits((prev) => ({
                      ...prev,
                      [operation.Merchant_key]: event.target.value === 'yes',
                    }))}
                  >
                    <option value="yes">Oui</option>
                    <option value="no">Non</option>
                  </select>
                </td>
                <td>{operation.Paiement_4x ? 'Oui' : 'Non'}</td>
                <td>
                  <input
                    type="checkbox"
                    checked={operation.excluded}
                    onChange={(event) => setExcludedOps((prev) => ({
                      ...prev,
                      [operation.rowKey]: event.target.checked,
                    }))}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
