'use client'

import { useState } from 'react'
import Navigation from '../../components/Navigation'

export default function MigratePage() {
  const [status, setStatus] = useState<any>(null)
  const [migrating, setMigrating] = useState(false)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkStatus = async () => {
    try {
      setChecking(true)
      setError(null)
      const response = await fetch('/api/admin/migrate-habits')
      const data = await response.json()
      setStatus(data)
    } catch (err) {
      setError('Erreur lors de la vérification')
      console.error(err)
    } finally {
      setChecking(false)
    }
  }

  const runMigration = async () => {
    if (!confirm('⚠️ Êtes-vous sûr de vouloir exécuter la migration?\n\nCela va créer les tables AtomicHabit, HabitCompletion et Badge.')) {
      return
    }

    try {
      setMigrating(true)
      setError(null)
      const response = await fetch('/api/admin/migrate-habits', {
        method: 'POST',
      })
      const data = await response.json()

      if (data.success) {
        alert('✅ Migration réussie!\n\nTables créées: ' + data.tables.join(', '))
        checkStatus()
      } else {
        setError(data.error || 'Erreur lors de la migration')
        alert('❌ Erreur: ' + (data.error || 'Unknown error'))
      }
    } catch (err) {
      setError('Erreur lors de la migration')
      console.error(err)
      alert('❌ Erreur lors de la migration')
    } finally {
      setMigrating(false)
    }
  }

  return (
    <div>
      <Navigation />
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '20px' }}>
          🔧 Migration Base de Données
        </h1>

        <div style={{
          background: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '20px',
        }}>
          <strong>⚠️ Attention</strong>
          <p style={{ margin: '10px 0 0 0' }}>
            Cette page permet de créer les tables pour le système d'Habitudes Atomiques.
            N'exécutez la migration qu'une seule fois.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
          <button
            onClick={checkStatus}
            disabled={checking}
            style={{
              padding: '12px 24px',
              background: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: checking ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
            }}
          >
            {checking ? '⏳ Vérification...' : '🔍 Vérifier le statut'}
          </button>

          <button
            onClick={runMigration}
            disabled={migrating || (status && !status.needsMigration)}
            style={{
              padding: '12px 24px',
              background: (status && !status.needsMigration) ? '#6c757d' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: (migrating || (status && !status.needsMigration)) ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
            }}
          >
            {migrating ? '⏳ Migration en cours...' : '🚀 Exécuter la migration'}
          </button>
        </div>

        {error && (
          <div style={{
            background: '#f8d7da',
            border: '1px solid #f5c2c7',
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '20px',
            color: '#842029',
          }}>
            <strong>❌ Erreur:</strong> {error}
          </div>
        )}

        {status && (
          <div style={{
            background: 'white',
            border: '1px solid #dee2e6',
            borderRadius: '8px',
            padding: '20px',
          }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>
              Statut des tables
            </h2>

            {status.needsMigration ? (
              <div style={{
                background: '#fff3cd',
                border: '1px solid #ffc107',
                borderRadius: '6px',
                padding: '12px',
                marginBottom: '15px',
              }}>
                ⚠️ Migration nécessaire
              </div>
            ) : (
              <div style={{
                background: '#d1e7dd',
                border: '1px solid #badbcc',
                borderRadius: '6px',
                padding: '12px',
                marginBottom: '15px',
              }}>
                ✅ Toutes les tables existent
              </div>
            )}

            <div style={{ marginBottom: '15px' }}>
              <strong>Tables existantes:</strong>
              {status.existingTables && status.existingTables.length > 0 ? (
                <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                  {status.existingTables.map((table: string) => (
                    <li key={table} style={{ color: '#28a745' }}>
                      ✅ {table}
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ marginTop: '8px', color: '#6c757d' }}>Aucune table trouvée</p>
              )}
            </div>

            <div>
              <strong>Tables manquantes:</strong>
              {status.missingTables && status.missingTables.length > 0 ? (
                <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                  {status.missingTables.map((table: string) => (
                    <li key={table} style={{ color: '#dc3545' }}>
                      ❌ {table}
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ marginTop: '8px', color: '#28a745' }}>✅ Aucune table manquante</p>
              )}
            </div>
          </div>
        )}

        <div style={{
          marginTop: '30px',
          padding: '15px',
          background: '#f8f9fa',
          borderRadius: '8px',
        }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>
            📝 Instructions
          </h3>
          <ol style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
            <li>Cliquez sur "Vérifier le statut" pour voir quelles tables existent</li>
            <li>Si des tables manquent, cliquez sur "Exécuter la migration"</li>
            <li>Une fois la migration terminée, les habitudes fonctionneront</li>
            <li>Vous pouvez ensuite aller sur /habits pour créer vos habitudes</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
