'use client'

import { useState } from 'react'
import styles from './QuickThoughtButton.module.css'

export default function QuickThoughtButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [thought, setThought] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!thought.trim()) return

    setSaving(true)

    try {
      const response = await fetch('/api/thoughts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: thought }),
      })

      const data = await response.json()

      if (data.success) {
        setThought('')
        setIsOpen(false)
        // Notification temporaire
        const notification = document.createElement('div')
        notification.className = styles.notification
        notification.textContent = '✅ Pensée enregistrée !'
        document.body.appendChild(notification)
        setTimeout(() => notification.remove(), 3000)
      } else {
        alert('❌ Erreur: ' + (data.error || 'Impossible de sauvegarder'))
      }
    } catch (error) {
      alert('❌ Erreur de connexion')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* Bouton flottant */}
      <button
        className={styles.floatingButton}
        onClick={() => setIsOpen(!isOpen)}
        title="Note une pensée"
      >
        💭
      </button>

      {/* Modal */}
      {isOpen && (
        <>
          <div className={styles.overlay} onClick={() => setIsOpen(false)} />
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>💭 Note une pensée</h2>
              <button
                className={styles.closeButton}
                onClick={() => setIsOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <textarea
                value={thought}
                onChange={(e) => setThought(e.target.value)}
                placeholder="Qu'est-ce qui te passe par la tête ?"
                className={styles.textarea}
                rows={5}
                autoFocus
                disabled={saving}
              />
            </div>
            <div className={styles.modalFooter}>
              <button
                onClick={() => setIsOpen(false)}
                className={styles.cancelButton}
                disabled={saving}
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                className={styles.saveButton}
                disabled={saving || !thought.trim()}
              >
                {saving ? 'Enregistrement...' : '💾 Enregistrer'}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
