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
import { useRecurringExpenses } from './hooks/useRecurringExpenses'
import { useSoldeProjection } from './hooks/useSoldeProjection'
import { IncomeRulesSection } from './components/IncomeRulesSection'
import { ManualEntriesSection } from './components/ManualEntriesSection'
import { ResultsSection } from './components/ResultsSection'
import { AISection } from './components/AISection'
import { RecurringExpensesList } from './components/RecurringExpensesList'
import { SoldeTimeline } from './components/SoldeTimeline'
import { AlertesSection } from './components/AlertesSection'
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

  // Gestion des dépenses récurrentes
  const {
    expenses,
    isLoading: expensesLoading,
    error: expensesError,
    addExpense,
    updateExpense,
    deleteExpense,
    monthlyTotal
  } = useRecurringExpenses()

  // Projection du solde avec les dépenses récurrentes
  const { projection, alerts, minSolde, endSolde } = useSoldeProjection({
    solde: parseFloat(solde) || 0,
    expenses,
    incomeRules,
    operations: operationsWithOverrides,
    horizonDays: parseInt(horizon) || 30,
    decouvert: parseFloat(decouvert) || -900
  })

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

        {/* Quick Actions - Bouton en haut */}
        <div className={styles.quickActionsBar}>
          <button
            onClick={() => {
              const soldeInput = document.getElementById('solde') as HTMLInputElement
              soldeInput?.focus()
              soldeInput?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }}
            className={styles.quickActionButton}
          >
            💰 Saisir mon solde
          </button>
          <button
            onClick={() => {
              const csvInput = document.getElementById('csv') as HTMLInputElement
              csvInput?.click()
            }}
            className={styles.quickActionButton}
          >
            📂 Importer CSV
          </button>
          <button
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            className={styles.quickActionButton}
          >
            ⬆️ Haut de page
          </button>
        </div>

        <div className={styles.notice}>
          <h2>⚙️ Préparation</h2>
          <ul>
            <li>Format CSV Caisse d Épargne (séparateur « ; » et encodage latin1).</li>
            <li>Le script détecte automatiquement les colonnes et gère la virgule décimale.</li>
            <li>Les résultats restent sur ta machine et ne sont pas envoyés à un service externe.</li>
          </ul>
        </div>

        {/* Configuration du solde - En haut */}
        <div className={styles.soldeConfigSection}>
          <div className={styles.soldeConfigHeader}>
            <h2 className={styles.soldeConfigTitle}>💰 Configuration du solde</h2>
            <p className={styles.soldeConfigSubtitle}>
              Saisissez votre solde actuel pour voir la projection jour par jour
            </p>
          </div>

          <div className={styles.soldeConfigGrid}>
            <div className={styles.soldeConfigCard}>
              <label htmlFor="solde" className={styles.soldeConfigLabel}>
                <span className={styles.soldeConfigIcon}>💵</span>
                Solde actuel (€)
              </label>
              <input
                id="solde"
                type="number"
                step="0.01"
                value={solde}
                onChange={(event) => setSolde(event.target.value)}
                placeholder="ex: 1234.56"
                className={styles.soldeConfigInput}
              />
            </div>

            <div className={styles.soldeConfigCard}>
              <label htmlFor="horizon" className={styles.soldeConfigLabel}>
                <span className={styles.soldeConfigIcon}>📅</span>
                Horizon (jours)
              </label>
              <input
                id="horizon"
                type="number"
                value={horizon}
                onChange={(event) => setHorizon(event.target.value)}
                className={styles.soldeConfigInput}
              />
              <small className={styles.soldeConfigHint}>
                Inclut automatiquement la fin du mois prochain
              </small>
            </div>

            <div className={styles.soldeConfigCard}>
              <label htmlFor="decouvert" className={styles.soldeConfigLabel}>
                <span className={styles.soldeConfigIcon}>⚠️</span>
                Découvert autorisé (€)
              </label>
              <input
                id="decouvert"
                type="number"
                step="0.01"
                value={decouvert}
                onChange={(event) => setDecouvert(event.target.value)}
                className={styles.soldeConfigInput}
              />
            </div>
          </div>

          {solde && (
            <div className={styles.soldeConfigSummary}>
              <div className={styles.summaryBadge}>
                ✅ Solde configuré : <strong>{parseFloat(solde).toFixed(2)}€</strong>
              </div>
              <div className={styles.summaryBadge}>
                📊 Projection sur <strong>{horizon} jours</strong>
              </div>
              <div className={styles.summaryBadge}>
                🚨 Découvert : <strong>{decouvert}€</strong>
              </div>
            </div>
          )}
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

        <RecurringExpensesList
          expenses={expenses}
          onAdd={addExpense}
          onUpdate={updateExpense}
          onDelete={deleteExpense}
          monthlyTotal={monthlyTotal}
        />

        {solde && (
          <>
            <AlertesSection
              alerts={alerts}
              minSolde={minSolde}
              endSolde={endSolde}
            />

            <SoldeTimeline
              projection={projection}
              decouvert={parseFloat(decouvert) || -900}
            />
          </>
        )}

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
