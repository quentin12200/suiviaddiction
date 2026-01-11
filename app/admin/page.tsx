'use client'

import { useState } from 'react'
import Navigation from '../components/Navigation'

export default function AdminPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const fixData = async () => {
    if (!confirm('Réparer toutes les données ? Cette action va marquer TOUTES les entrées comme "a fumé" car tu fumes tous les jours.')) {
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/admin/fix-data', {
        method: 'POST',
      })
      const data = await response.json()

      if (data.success) {
        setResult('✅ Données réparées !\n\n' + data.fixes.join('\n'))
        // Rafraîchir la page après 2 secondes
        setTimeout(() => {
          window.location.href = '/'
        }, 2000)
      } else {
        setResult('❌ Erreur : ' + data.error)
      }
    } catch (error) {
      setResult('❌ Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Navigation />
      <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
        <h1>🔧 Administration</h1>

        <div style={{
          background: '#fff',
          padding: '30px',
          borderRadius: '12px',
          marginTop: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h2>Réparer les Données</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Cette action va corriger toutes les entrées qui ont été mal enregistrées :
          </p>
          <ul style={{ color: '#666', marginBottom: '20px' }}>
            <li>Marquer toutes les entrées comme "a fumé" (car tu fumes tous les jours)</li>
            <li>Corriger les jointCount à 0</li>
            <li>Remplir les jointTime manquants</li>
          </ul>

          <button
            onClick={fixData}
            disabled={loading}
            style={{
              background: '#ef4444',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: '600',
            }}
          >
            {loading ? '⏳ Réparation en cours...' : '🔧 Réparer les données'}
          </button>

          {result && (
            <pre style={{
              marginTop: '20px',
              padding: '15px',
              background: '#f3f4f6',
              borderRadius: '8px',
              whiteSpace: 'pre-wrap',
              fontSize: '14px',
            }}>
              {result}
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}
