'use client'

import { useState, useEffect } from 'react'
import Navigation from '../components/Navigation'

interface Entry {
  id: number
  date: string
  time: string
  hasSmoked: boolean
  jointCount: number
  jointTime: string | null
  cravingLevel: number
  emotionalState: string
  comment: string
}

export default function FixEntriesPage() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchEntries()
  }, [])

  const fetchEntries = async () => {
    try {
      const response = await fetch('/api/entries?limit=100')
      const data = await response.json()

      // Trier par date décroissante
      const sorted = data.entries.sort((a: Entry, b: Entry) => {
        const dateA = new Date(a.date + 'T' + a.time)
        const dateB = new Date(b.date + 'T' + b.time)
        return dateB.getTime() - dateA.getTime()
      })

      setEntries(sorted)
    } catch (error) {
      console.error('Erreur chargement entrées:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleHasSmoked = async (entryId: number, currentValue: boolean) => {
    setSaving(true)
    setMessage('')

    try {
      const response = await fetch(`/api/entries/${entryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hasSmoked: !currentValue,
          jointCount: !currentValue ? 1 : 0,
        }),
      })

      if (response.ok) {
        // Mettre à jour localement
        setEntries(entries.map(e =>
          e.id === entryId
            ? { ...e, hasSmoked: !currentValue, jointCount: !currentValue ? 1 : 0 }
            : e
        ))
        setMessage('✅ Entrée corrigée')
      } else {
        setMessage('❌ Erreur lors de la correction')
      }
    } catch (error) {
      setMessage('❌ Erreur réseau')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div>
        <Navigation />
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <p>Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Navigation />
      <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1>🔧 Corriger les Entrées</h1>

        <div style={{
          background: '#fef3c7',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '30px',
          border: '2px solid #fbbf24'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#92400e' }}>⚠️ Instructions</h3>
          <p style={{ margin: '0', color: '#92400e' }}>
            Cliquez sur le bouton à côté de chaque entrée pour basculer entre "J'ai fumé" et "Je n'ai pas fumé".
            Les entrées sont triées de la plus récente à la plus ancienne.
          </p>
        </div>

        {message && (
          <div style={{
            background: message.includes('✅') ? '#d1fae5' : '#fee2e2',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            color: message.includes('✅') ? '#065f46' : '#991b1b',
          }}>
            {message}
          </div>
        )}

        <div style={{
          background: '#fff',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          overflow: 'hidden',
        }}>
          {entries.map((entry) => {
            const entryDate = new Date(entry.date)
            const dateStr = entryDate.toLocaleDateString('fr-FR', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })

            return (
              <div
                key={entry.id}
                style={{
                  padding: '20px',
                  borderBottom: '1px solid #e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '20px',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', marginBottom: '5px' }}>
                    {dateStr} à {entry.time}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    {entry.comment || entry.emotionalState || 'Aucun commentaire'}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  {entry.hasSmoked && (
                    <span style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      whiteSpace: 'nowrap',
                    }}>
                      {entry.jointCount} joint{entry.jointCount > 1 ? 's' : ''}
                    </span>
                  )}

                  <button
                    onClick={() => toggleHasSmoked(entry.id, entry.hasSmoked)}
                    disabled={saving}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      fontWeight: '600',
                      fontSize: '14px',
                      whiteSpace: 'nowrap',
                      background: entry.hasSmoked ? '#ef4444' : '#10b981',
                      color: 'white',
                      opacity: saving ? 0.5 : 1,
                    }}
                  >
                    {entry.hasSmoked ? '🚬 J\'ai fumé' : '✅ Je n\'ai pas fumé'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {entries.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            Aucune entrée trouvée
          </div>
        )}
      </div>
    </div>
  )
}
