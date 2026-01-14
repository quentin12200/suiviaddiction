import type { ManualEntry } from '../types'
import styles from '../bank.module.css'

interface ManualEntriesSectionProps {
  manualEntries: ManualEntry[]
  addManualEntry: () => void
  updateManualEntry: (id: string, updates: Partial<ManualEntry>) => void
  removeManualEntry: (id: string) => void
}

export function ManualEntriesSection({
  manualEntries,
  addManualEntry,
  updateManualEntry,
  removeManualEntry,
}: ManualEntriesSectionProps) {
  return (
    <div className={styles.manualEntries}>
      <div className={styles.manualHeader}>
        <h3>🧾 Entrées prévues (ajoute une entrée à venir)</h3>
        <button type="button" onClick={addManualEntry}>
          ➕ Ajouter
        </button>
      </div>
      {manualEntries.length === 0 && (
        <p className={styles.manualHint}>
          Ajoute ici les remboursements à venir, primes, loyers, dépenses prévues, etc.
        </p>
      )}
      {manualEntries.map((entry) => (
        <div key={entry.id} className={styles.manualRow}>
          <input
            type="date"
            value={entry.date}
            onChange={(event) => updateManualEntry(entry.id, { date: event.target.value })}
          />
          <input
            type="text"
            placeholder="Libellé (ex: Remboursement frais)"
            value={entry.label}
            onChange={(event) => updateManualEntry(entry.id, { label: event.target.value })}
          />
          <input
            type="number"
            step="0.01"
            placeholder="Montant"
            value={entry.amount}
            onChange={(event) => updateManualEntry(entry.id, { amount: event.target.value })}
          />
          <select
            value={entry.type}
            onChange={(event) => updateManualEntry(entry.id, { type: event.target.value as ManualEntry['type'] })}
          >
            <option value="debit">Sortie</option>
            <option value="credit">Entrée</option>
          </select>
          <button type="button" onClick={() => removeManualEntry(entry.id)}>
            ✖️
          </button>
        </div>
      ))}
    </div>
  )
}
