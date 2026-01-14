import type { IncomeRule } from '../types'
import styles from '../bank.module.css'

interface IncomeRulesSectionProps {
  minimumResources: string
  setMinimumResources: (value: string) => void
  incomeRules: IncomeRule[]
  incomeRulesTotal: number
  addIncomeRule: () => void
  updateIncomeRule: (id: string, updates: Partial<IncomeRule>) => void
  removeIncomeRule: (id: string) => void
}

export function IncomeRulesSection({
  minimumResources,
  setMinimumResources,
  incomeRules,
  incomeRulesTotal,
  addIncomeRule,
  updateIncomeRule,
  removeIncomeRule,
}: IncomeRulesSectionProps) {
  return (
    <div className={styles.configCard}>
      <h2>💼 Revenus & ressources minimum</h2>
      <p>Décris ici tes revenus fixes pour analyser le reste à vivre et anticiper les mois prochains.</p>
      <div className={styles.fieldGroup}>
        <label htmlFor="minimumResources">Ressources minimum mensuelles (€)</label>
        <input
          id="minimumResources"
          type="number"
          step="0.01"
          value={minimumResources}
          onChange={(event) => setMinimumResources(event.target.value)}
        />
        <small>Revenus fixes déclarés: {incomeRulesTotal.toFixed(2)} € / mois.</small>
      </div>
      <div className={styles.manualEntries}>
        <div className={styles.manualHeader}>
          <h3>Revenus récurrents (jour de paiement)</h3>
          <button type="button" onClick={addIncomeRule}>
            ➕ Ajouter
          </button>
        </div>
        {incomeRules.map((rule) => (
          <div key={rule.id} className={styles.manualRow}>
            <input
              type="text"
              placeholder="Libellé (ex: Salaire Sophie)"
              value={rule.label}
              onChange={(event) => updateIncomeRule(rule.id, { label: event.target.value })}
            />
            <input
              type="number"
              step="0.01"
              placeholder="Montant"
              value={rule.amount}
              onChange={(event) => updateIncomeRule(rule.id, { amount: event.target.value })}
            />
            <input
              type="number"
              min="1"
              max="31"
              placeholder="Jour"
              value={rule.day}
              onChange={(event) => updateIncomeRule(rule.id, { day: event.target.value })}
            />
            <button type="button" onClick={() => removeIncomeRule(rule.id)}>
              ✖️
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
