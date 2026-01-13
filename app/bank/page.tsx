'use client'

import { useMemo, useState } from 'react'
import Navigation from '../components/Navigation'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import styles from './bank.module.css'

interface AnalysisResult {
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

interface OperationRow {
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

interface ForecastRow {
  Date: string
  Flux_recurrents: string
  Flux_variables_estimes: string
  Flux_total: string
  Solde_estime: string
  Risque: boolean
  Detail_recurrents: string
}

interface IncomeRule {
  id: string
  label: string
  amount: string
  day: string
}

interface ManualEntry {
  id: string
  date: string
  label: string
  amount: string
  type: 'debit' | 'credit'
}

type DatePreset = 'last30' | 'currentMonth' | 'previousMonth' | 'custom'

export default function BankAnalysisPage() {
  const [file, setFile] = useState<File | null>(null)
  const [solde, setSolde] = useState('')
  const [horizon, setHorizon] = useState('30')
  const [decouvert, setDecouvert] = useState('-200')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [manualEntries, setManualEntries] = useState<ManualEntry[]>([])
  const [scenario, setScenario] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [operations, setOperations] = useState<OperationRow[]>([])
  const [categoryEdits, setCategoryEdits] = useState<Record<string, string>>({})
  const [recurrenceEdits, setRecurrenceEdits] = useState<Record<string, boolean>>({})
  const [excludedOps, setExcludedOps] = useState<Record<string, boolean>>({})
  const [categoryMandatory, setCategoryMandatory] = useState<Record<string, boolean>>({})
  const [datePreset, setDatePreset] = useState<DatePreset>('last30')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [filters, setFilters] = useState({
    date: '',
    label: '',
    amount: '',
    category: '',
    recurring: '',
    installment: '',
  })
  const [minimumResources, setMinimumResources] = useState('2600')
  const [incomeRules, setIncomeRules] = useState<IncomeRule[]>([
    { id: crypto.randomUUID(), label: 'Quentin CGT', amount: '2600', day: '30' },
    { id: crypto.randomUUID(), label: 'Salaire Sophie', amount: '1450', day: '20' },
    { id: crypto.randomUUID(), label: 'Aide Aveyron', amount: '450', day: '20' },
  ])

  const addManualEntry = () => {
    setManualEntries((prev) => ([...prev, {
      id: crypto.randomUUID(),
      date: '',
      label: '',
      amount: '',
      type: 'debit',
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setResult(null)

    if (!file) {
      setError('Merci de sélectionner un fichier CSV.')
      return
    }

    if (!solde) {
      setError('Merci d’indiquer ton solde actuel.')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('solde', solde)
      formData.append('horizon', horizon)
      formData.append('decouvert', decouvert)
      formData.append('manualEntries', JSON.stringify(
        manualEntries
          .filter((entry) => entry.date && entry.amount)
          .map((entry) => ({
            date: entry.date,
            label: entry.label,
            amount: Number(entry.amount),
            type: entry.type,
          }))
      ))

      const response = await fetch('/api/bank-analysis', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(data.error || 'Erreur lors de l’analyse du fichier.')
        return
      }

      setResult(data.data)
      setOperations(data.data.operations || [])
      setExcludedOps({})
      setCategoryEdits({})
      setRecurrenceEdits({})
      setCategoryMandatory({})
    } catch (err) {
      setError('Erreur de connexion au serveur.')
    } finally {
      setLoading(false)
    }
  }

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    operations.forEach((operation) => {
      if (operation.Montant >= 0) return
      const key = `${operation.Merchant_key}-${operation.Date}-${operation.Montant}`
      if (excludedOps[key]) return
      const category = categoryEdits[operation.Merchant_key] || operation.Categorie || 'Autre'
      totals[category] = (totals[category] || 0) + Math.abs(operation.Montant)
    })
    return Object.entries(totals)
      .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value)
  }, [operations, categoryEdits, excludedOps])

  const operationsWithOverrides = useMemo(() => (
    operations.map((operation) => {
      const key = `${operation.Merchant_key}-${operation.Date}-${operation.Montant}`
      return {
        ...operation,
        categoryLabel: categoryEdits[operation.Merchant_key] || operation.Categorie || 'Autre',
        recurringLabel: recurrenceEdits[operation.Merchant_key] ?? operation.Est_recurrent,
        excluded: excludedOps[key] ?? false,
        rowKey: key,
      }
    })
  ), [operations, categoryEdits, recurrenceEdits, excludedOps])

  const filteredOperations = useMemo(() => {
    if (!operationsWithOverrides.length) return []
    const today = new Date()
    const startOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const startOfPreviousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const endOfPreviousMonth = new Date(today.getFullYear(), today.getMonth(), 0)

    const fromDate = datePreset === 'custom' && dateFrom
      ? new Date(dateFrom)
      : datePreset === 'last30'
        ? new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000)
        : datePreset === 'previousMonth'
          ? startOfPreviousMonth
          : startOfCurrentMonth
    const toDate = datePreset === 'custom' && dateTo
      ? new Date(dateTo)
      : datePreset === 'previousMonth'
        ? endOfPreviousMonth
        : today

    return operationsWithOverrides.filter((operation) => {
      const dateValue = operation.Date ? new Date(operation.Date) : null
      if (dateValue && (dateValue < fromDate || dateValue > toDate)) {
        return false
      }
      if (filters.date && !operation.Date.includes(filters.date)) return false
      const labelValue = operation['Libelle simplifie'] || operation['Libelle operation'] || ''
      if (filters.label && !labelValue.toLowerCase().includes(filters.label.toLowerCase())) return false
      if (filters.amount && !operation.Montant.toFixed(2).includes(filters.amount)) return false
      if (filters.category && !operation.categoryLabel.toLowerCase().includes(filters.category.toLowerCase())) return false
      if (filters.recurring && (operation.recurringLabel ? 'oui' : 'non') !== filters.recurring.toLowerCase()) return false
      if (filters.installment && (operation.Paiement_4x ? 'oui' : 'non') !== filters.installment.toLowerCase()) return false
      return true
    })
  }, [operationsWithOverrides, datePreset, dateFrom, dateTo, filters])

  const monthComparison = useMemo(() => {
    if (!operations.length) return null
    const today = new Date()
    const startOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const startOfPreviousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const endOfPreviousMonth = new Date(today.getFullYear(), today.getMonth(), 0)

    const totals = {
      current: { expenses: 0, income: 0 },
      previous: { expenses: 0, income: 0 },
    }

    operationsWithOverrides.forEach((operation) => {
      const dateValue = operation.Date ? new Date(operation.Date) : null
      if (!dateValue) return
      const key = `${operation.Merchant_key}-${operation.Date}-${operation.Montant}`
      if (excludedOps[key]) return
      const target = dateValue >= startOfCurrentMonth
        ? totals.current
        : dateValue >= startOfPreviousMonth && dateValue <= endOfPreviousMonth
          ? totals.previous
          : null
      if (!target) return
      if (operation.Montant < 0) {
        target.expenses += Math.abs(operation.Montant)
      } else {
        target.income += operation.Montant
      }
    })

    return totals
  }, [operationsWithOverrides, excludedOps, operations.length])

  const mandatorySummary = useMemo(() => {
    if (!operationsWithOverrides.length) return null
    const today = new Date()
    const startOfPreviousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const endOfPreviousMonth = new Date(today.getFullYear(), today.getMonth(), 0)
    let mandatorySpend = 0
    operationsWithOverrides.forEach((operation) => {
      if (operation.Montant >= 0) return
      const dateValue = operation.Date ? new Date(operation.Date) : null
      if (!dateValue || dateValue < startOfPreviousMonth || dateValue > endOfPreviousMonth) return
      const category = operation.categoryLabel
      if (categoryMandatory[category]) {
        mandatorySpend += Math.abs(operation.Montant)
      }
    })
    const minResourcesValue = Number(minimumResources || 0)
    return {
      mandatorySpend,
      remaining: minResourcesValue - mandatorySpend,
    }
  }, [operationsWithOverrides, categoryMandatory, minimumResources])

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

  const handleScenarioSubmit = async () => {
    setAiResponse('')
    if (!scenario.trim()) return
    setAiLoading(true)
    try {
      const response = await fetch('/api/bank-analysis/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario,
          summary: result ? {
            endNextMonthBalance: result.endNextMonthBalance,
            endNextMonthDate: result.endNextMonthDate,
            minBalance: result.minBalance,
            minBalanceDate: result.minBalanceDate,
            paiements4xCount: result.paiements4xCount,
          } : null,
        }),
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        setAiResponse(data.error || 'Impossible de contacter l’IA.')
        return
      }
      setAiResponse(data.reply)
    } catch (err) {
      setAiResponse('Erreur de connexion à l’IA.')
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div>
      <Navigation />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>💳 Analyse bancaire</h1>
          <p>
            Charge ton export Caisse d’Épargne pour identifier les abonnements, prévoir ton solde
            et éviter les découverts.
          </p>
        </div>

        <div className={styles.notice}>
          <h2>⚙️ Préparation</h2>
          <ul>
            <li>Format CSV Caisse d’Épargne (séparateur « ; » et encodage latin1).</li>
            <li>Le script détecte automatiquement les colonnes et gère la virgule décimale.</li>
            <li>Les résultats restent sur ta machine et ne sont pas envoyés à un service externe.</li>
          </ul>
        </div>

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

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.fieldGroup}>
            <label htmlFor="csv">Fichier CSV</label>
            <input
              id="csv"
              type="file"
              accept=".csv"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </div>

          <div className={styles.grid}>
            <div className={styles.fieldGroup}>
              <label htmlFor="solde">Solde actuel (€)</label>
              <input
                id="solde"
                type="number"
                step="0.01"
                value={solde}
                onChange={(event) => setSolde(event.target.value)}
                placeholder="Solde du jour (ex: 1234.56)"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="horizon">Horizon (jours)</label>
              <input
                id="horizon"
                type="number"
                value={horizon}
                onChange={(event) => setHorizon(event.target.value)}
              />
              <small>Le calcul inclut automatiquement la fin du mois prochain.</small>
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="decouvert">Découvert autorisé (€)</label>
              <input
                id="decouvert"
                type="number"
                step="0.01"
                value={decouvert}
                onChange={(event) => setDecouvert(event.target.value)}
              />
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}

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

          <button type="submit" className={styles.submitButton} disabled={loading}>
            {loading ? 'Analyse en cours...' : 'Lancer l’analyse'}
          </button>
        </form>

        {result && (
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
              {categoryTotals.length === 0 ? (
                <p>Aucune dépense détectée.</p>
              ) : (
                <div className={styles.chartWrapper}>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={categoryTotals} margin={{ left: 8, right: 16 }}>
                      <XAxis dataKey="name" interval={0} angle={-20} textAnchor="end" height={60} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#2563eb" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Catégorie</th>
                    <th>Total dépenses</th>
                    <th>Obligatoire</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryTotals.map((category) => (
                    <tr key={category.name}>
                      <td>{category.name}</td>
                      <td>{category.value.toFixed(2)} €</td>
                      <td>
                        <input
                          type="checkbox"
                          checked={categoryMandatory[category.name] ?? false}
                          onChange={(event) => setCategoryMandatory((prev) => ({
                            ...prev,
                            [category.name]: event.target.checked,
                          }))}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                    {filteredOperations.map((operation) => (
                      <tr key={`${operation.Merchant_key}-${operation.Date}-${operation.Montant}`}>
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

            <div className={styles.console}>
              <h3>🧾 Résumé console</h3>
              <pre>{result.console}</pre>
            </div>
          </div>
        )}

        <div className={styles.aiCard}>
          <h2>🤖 Scénarios IA (beta)</h2>
          <p>
            Décris un scénario (ex: « si j’ajoute 200€ le 15 »). Nécessite une clé
            <strong> OPENAI_API_KEY</strong> configurée côté serveur.
          </p>
          <div className={styles.aiForm}>
            <textarea
              value={scenario}
              onChange={(event) => setScenario(event.target.value)}
              placeholder="Décris ton scénario (ex: et si j'ajoute 200€ de revenus le 15 ?)"
            />
            <button type="button" onClick={handleScenarioSubmit} disabled={aiLoading}>
              {aiLoading ? 'Analyse...' : 'Analyser avec IA'}
            </button>
          </div>
          {aiResponse && <p className={styles.aiResponse}>{aiResponse}</p>}
        </div>
      </div>
    </div>
  )
}
