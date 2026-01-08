'use client'

import { useState, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '../components/Navigation'
import styles from './import.module.css'

export default function ImportPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [result, setResult] = useState<{ imported: number; errors: number } | null>(null)

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setError('')
      setSuccess('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      setError('Veuillez sélectionner un fichier CSV')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/import-csv', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(`Import réussi ! ${data.imported} entrées importées.`)
        setResult({ imported: data.imported, errors: data.errors || 0 })
        setFile(null)
      } else {
        setError(data.error || 'Erreur lors de l\'import')
      }
    } catch (err) {
      setError('Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Navigation />
      <div className={styles.container}>
        <h1 className={styles.title}>Importer des données CSV</h1>

        <div className={styles.instructions}>
          <h2>Format du fichier CSV</h2>
          <p>Le fichier CSV doit contenir les colonnes suivantes :</p>
          <ul>
            <li><strong>date</strong> : Format YYYY-MM-DD</li>
            <li><strong>time</strong> : Format HH:MM</li>
            <li><strong>hasSmoked</strong> : true ou false</li>
            <li><strong>jointCount</strong> : Nombre (0 si pas fumé)</li>
            <li><strong>cravingLevel</strong> : Nombre de 0 à 10</li>
            <li>Et optionnellement : emotionalState, physicalState, context, trigger, etc.</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="csvFile" className={styles.label}>
              Sélectionner un fichier CSV
            </label>
            <input
              id="csvFile"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className={styles.fileInput}
            />
            {file && (
              <p className={styles.fileName}>Fichier sélectionné : {file.name}</p>
            )}
          </div>

          {error && <div className={styles.error}>{error}</div>}
          {success && (
            <div className={styles.success}>
              {success}
              {result && result.errors > 0 && (
                <p className={styles.warning}>
                  {result.errors} ligne(s) ignorée(s) en raison d'erreurs.
                </p>
              )}
            </div>
          )}

          <div className={styles.buttonRow}>
            <button
              type="button"
              onClick={() => router.push('/')}
              className={styles.cancelButton}
            >
              Retour
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading || !file}
            >
              {loading ? 'Import en cours...' : 'Importer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
