'use client'

import { useState } from 'react'
import Navigation from '../components/Navigation'

export default function AutoRestorePage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const runAutoRestore = async () => {
    if (!confirm('Lancer la récupération automatique des données ? Cette action va analyser toutes vos entrées et restaurer automatiquement celles qui étaient probablement des moments de résistance.')) {
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/admin/auto-restore', {
        method: 'POST',
      })
      const data = await response.json()

      if (data.success) {
        setResult(data)
      } else {
        setResult({ error: data.error })
      }
    } catch (error) {
      setResult({ error: 'Erreur réseau' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Navigation />
      <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
        <h1>🔧 Récupération Automatique des Données</h1>

        <div style={{
          background: '#dbeafe',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '30px',
          border: '2px solid #3b82f6'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#1e40af' }}>ℹ️ Comment ça fonctionne</h3>
          <p style={{ margin: '0 0 10px 0', color: '#1e40af' }}>
            Le script analyse toutes vos entrées et utilise des indices pour deviner lesquelles étaient des moments de résistance :
          </p>
          <ul style={{ color: '#1e40af', margin: '0' }}>
            <li><strong>jointCount = 0</strong> → Très probablement "pas fumé"</li>
            <li><strong>Pas de jointTime</strong> → Très probablement "pas fumé"</li>
            <li><strong>Alternative action renseignée</strong> → Probablement "pas fumé"</li>
            <li><strong>Pas de trigger</strong> → Probablement "pas fumé"</li>
            <li><strong>Décision consciente</strong> → Peut-être "pas fumé"</li>
          </ul>
        </div>

        <div style={{
          background: '#fff',
          padding: '30px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '30px',
        }}>
          <h2>Lancer la récupération</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Cliquez sur le bouton ci-dessous pour démarrer l'analyse et la restauration automatique.
          </p>

          <button
            onClick={runAutoRestore}
            disabled={loading}
            style={{
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              opacity: loading ? 0.5 : 1,
            }}
          >
            {loading ? '⏳ Récupération en cours...' : '🚀 Lancer la récupération automatique'}
          </button>
        </div>

        {result && !result.error && (
          <div style={{
            background: '#d1fae5',
            padding: '30px',
            borderRadius: '12px',
            border: '2px solid #10b981',
          }}>
            <h2 style={{ color: '#065f46', marginTop: 0 }}>✅ Récupération terminée !</h2>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#065f46', marginBottom: '10px' }}>
                {result.restored} entrées restaurées automatiquement
              </div>
              <div style={{ fontSize: '18px', color: '#047857' }}>
                {result.uncertain} entrées incertaines à vérifier manuellement sur /fix-entries
              </div>
            </div>

            {result.details?.restoredEntries && result.details.restoredEntries.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <h3 style={{ color: '#065f46' }}>Entrées restaurées :</h3>
                <div style={{
                  maxHeight: '300px',
                  overflowY: 'auto',
                  background: 'white',
                  padding: '15px',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}>
                  {result.details.restoredEntries.map((entry: any, index: number) => (
                    <div key={index} style={{
                      padding: '10px',
                      borderBottom: '1px solid #e5e7eb',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <div>
                        <strong>{entry.date}</strong> à {entry.time}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        Score: {entry.score} - {entry.reasons.join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.details?.uncertainEntries && result.details.uncertainEntries.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <h3 style={{ color: '#065f46' }}>Entrées incertaines (à vérifier sur /fix-entries) :</h3>
                <div style={{
                  maxHeight: '200px',
                  overflowY: 'auto',
                  background: '#fef3c7',
                  padding: '15px',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}>
                  {result.details.uncertainEntries.map((entry: any, index: number) => (
                    <div key={index} style={{
                      padding: '10px',
                      borderBottom: '1px solid #fbbf24',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <div>
                        <strong>{entry.date}</strong> à {entry.time}
                      </div>
                      <div style={{ fontSize: '12px', color: '#92400e' }}>
                        Score: {entry.score} - {entry.reasons.join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{
              marginTop: '30px',
              padding: '15px',
              background: '#fef3c7',
              borderRadius: '8px',
              border: '1px solid #fbbf24',
            }}>
              <p style={{ margin: 0, color: '#92400e' }}>
                <strong>Prochaine étape :</strong> Allez sur <a href="/fix-entries" style={{ color: '#92400e', textDecoration: 'underline' }}>/fix-entries</a> pour vérifier et corriger manuellement les entrées incertaines si nécessaire.
              </p>
            </div>

            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button
                onClick={() => window.location.href = '/'}
                style={{
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600',
                  marginRight: '10px',
                }}
              >
                🏠 Retour au tableau de bord
              </button>
              <button
                onClick={() => window.location.href = '/fix-entries'}
                style={{
                  background: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600',
                }}
              >
                🔧 Vérifier les entrées incertaines
              </button>
            </div>
          </div>
        )}

        {result?.error && (
          <div style={{
            background: '#fee2e2',
            padding: '20px',
            borderRadius: '12px',
            border: '2px solid #ef4444',
            color: '#991b1b',
          }}>
            <h3 style={{ marginTop: 0 }}>❌ Erreur</h3>
            <p>{result.error}</p>
          </div>
        )}
      </div>
    </div>
  )
}
