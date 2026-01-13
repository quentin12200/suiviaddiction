'use client'

import { useState } from 'react'
import Navigation from '../components/Navigation'
import styles from './bank.module.css'

interface AnalysisResult {
  operations: string
  recurrents: string
  forecast: string
  console: string
  forecastFileName: string
  endNextMonthBalance: string
  endNextMonthDate: string
  minBalance: string
  minBalanceDate: string
  paiements4xCount: number
}

interface ManualEntry {
  id: string
  date: string
  label: string
  amount: string
  type: 'debit' | 'credit'
}

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

  const downloadFile = (base64: string, filename: string) => {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i)
    }
    const blob = new Blob([bytes], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
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
    } catch (err) {
      setError('Erreur de connexion au serveur.')
    } finally {
      setLoading(false)
    }
  }

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
            <div className={styles.buttons}>
              <button
                type="button"
                onClick={() => downloadFile(result.operations, 'operations_enrichies.csv')}
              >
                Télécharger operations_enrichies.csv
              </button>
              <button
                type="button"
                onClick={() => downloadFile(result.recurrents, 'recurrents_detectes.csv')}
              >
                Télécharger recurrents_detectes.csv
              </button>
              <button
                type="button"
                onClick={() => downloadFile(result.forecast, result.forecastFileName)}
              >
                Télécharger {result.forecastFileName}
              </button>
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
