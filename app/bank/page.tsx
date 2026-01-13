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
}

export default function BankAnalysisPage() {
  const [file, setFile] = useState<File | null>(null)
  const [solde, setSolde] = useState('')
  const [horizon, setHorizon] = useState('30')
  const [decouvert, setDecouvert] = useState('-200')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<AnalysisResult | null>(null)

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
                placeholder="1234.56"
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

          <button type="submit" className={styles.submitButton} disabled={loading}>
            {loading ? 'Analyse en cours...' : 'Lancer l’analyse'}
          </button>
        </form>

        {result && (
          <div className={styles.results}>
            <h2>📊 Résultats</h2>
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
          <h2>🤖 Scénarios IA (bientôt)</h2>
          <p>
            Tu pourras bientôt lancer des scénarios personnalisés (ex: « et si je réduis Netflix de
            50% ? ») en utilisant l’API ChatGPT pour enrichir l’analyse.
          </p>
        </div>
      </div>
    </div>
  )
}
