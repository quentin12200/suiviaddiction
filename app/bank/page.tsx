'use client'

import { useState } from 'react'
import Navigation from '../components/Navigation'
import type { AnalysisResult } from './types'
import { useIncomeRules } from './hooks/useIncomeRules'
import { useManualEntries } from './hooks/useManualEntries'
import { useFilters } from './hooks/useFilters'
import {
  useOperationsData,
  useFilteredOperations,
  useCategoryTotals,
  useMonthComparison,
  useMandatorySummary,
} from './hooks/useOperationsData'
import { IncomeRulesSection } from './components/IncomeRulesSection'
import { ManualEntriesSection } from './components/ManualEntriesSection'
import { ResultsSection } from './components/ResultsSection'
import { AISection } from './components/AISection'
import styles from './bank.module.css'

export default function BankAnalysisPage() {
  const [file, setFile] = useState<File | null>(null)
  const [solde, setSolde] = useState('')
  const [horizon, setHorizon] = useState('30')
  const [decouvert, setDecouvert] = useState('-900')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [minimumResources, setMinimumResources] = useState('2600')

  const {
    incomeRules,
    addIncomeRule,
    updateIncomeRule,
    removeIncomeRule,
    incomeRulesTotal,
  } = useIncomeRules()

  const {
    manualEntries,
    addManualEntry,
    updateManualEntry,
    removeManualEntry,
  } = useManualEntries()

  const {
    datePreset,
    setDatePreset,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    filters,
    setFilters,
  } = useFilters()

  const {
    operations,
    setOperations,
    categoryEdits,
    setCategoryEdits,
    recurrenceEdits,
    setRecurrenceEdits,
    excludedOps,
    setExcludedOps,
    categoryMandatory,
    setCategoryMandatory,
    operationsWithOverrides,
    resetEdits,
  } = useOperationsData()

  const filteredOperations = useFilteredOperations(
    operationsWithOverrides,
    datePreset,
    dateFrom,
    dateTo,
    filters
  )

  const categoryTotals = useCategoryTotals(filteredOperations)
  const monthComparison = useMonthComparison(operationsWithOverrides, excludedOps)
  const mandatorySummary = useMandatorySummary(
    operationsWithOverrides,
    categoryMandatory,
    minimumResources
  )

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setResult(null)

    if (!file) {
      setError('Merci de sélectionner un fichier CSV.')
      return
    }

    if (!solde) {
      setError('Merci d\'indiquer ton solde actuel.')
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
      formData.append('incomeRules', JSON.stringify(
        incomeRules
          .filter((rule) => rule.label && rule.amount && rule.day)
          .map((rule) => ({
            label: rule.label,
            amount: Number(rule.amount),
            day: Number(rule.day),
          }))
      ))

      const response = await fetch('/api/bank-analysis', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(data.error || 'Erreur lors de l\'analyse du fichier.')
        return
      }

      setResult(data.data)
      setOperations(data.data.operations || [])
      resetEdits()
    } catch (err) {
      setError('Erreur de connexion au serveur.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Navigation />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>💳 Analyse bancaire</h1>
          <p>
            Charge ton export Caisse d Épargne pour identifier les abonnements, prévoir ton solde
            et éviter les découverts.
          </p>
        </div>

        <div className={styles.notice}>
          <h2>⚙️ Préparation</h2>
          <ul>
            <li>Format CSV Caisse d Épargne (séparateur « ; » et encodage latin1).</li>
            <li>Le script détecte automatiquement les colonnes et gère la virgule décimale.</li>
            <li>Les résultats restent sur ta machine et ne sont pas envoyés à un service externe.</li>
          </ul>
        </div>

        <IncomeRulesSection
          minimumResources={minimumResources}
          setMinimumResources={setMinimumResources}
          incomeRules={incomeRules}
          incomeRulesTotal={incomeRulesTotal}
          addIncomeRule={addIncomeRule}
          updateIncomeRule={updateIncomeRule}
          removeIncomeRule={removeIncomeRule}
        />

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

          <ManualEntriesSection
            manualEntries={manualEntries}
            addManualEntry={addManualEntry}
            updateManualEntry={updateManualEntry}
            removeManualEntry={removeManualEntry}
          />

          <button type="submit" className={styles.submitButton} disabled={loading}>
            {loading ? 'Analyse en cours...' : 'Lancer l\'analyse'}
          </button>
        </form>

        {result && (
          <ResultsSection
            result={result}
            categoryTotals={categoryTotals}
            categoryMandatory={categoryMandatory}
            setCategoryMandatory={setCategoryMandatory}
            mandatorySummary={mandatorySummary}
            filteredOperations={filteredOperations}
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
            allOperations={operationsWithOverrides}
            operations={operationsWithOverrides}
          />
        )}

        <AISection result={result} />
      </div>
    </div>
  )
}
