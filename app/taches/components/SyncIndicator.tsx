'use client'

import { SyncStatus } from '../hooks/useSyncQueue'
import styles from '../taches.module.css'

interface SyncIndicatorProps {
  syncStatus: SyncStatus
  pendingCount: number
  isOnline: boolean
  onForceSync: () => void
}

export function SyncIndicator({ syncStatus, pendingCount, isOnline, onForceSync }: SyncIndicatorProps) {
  const getStatusDisplay = () => {
    switch (syncStatus) {
      case 'synced':
        return { icon: '☁️', text: 'Synchronisé', color: '#28a745' }
      case 'pending':
        return { icon: '⏳', text: `${pendingCount} en attente`, color: '#ffc107' }
      case 'offline':
        return { icon: '📴', text: 'Hors ligne', color: '#6c757d' }
      case 'error':
        return { icon: '❌', text: 'Erreur de sync', color: '#dc3545' }
    }
  }

  const status = getStatusDisplay()

  return (
    <div className={styles.syncIndicator} style={{ borderColor: status.color }}>
      <span className={styles.syncIcon}>{status.icon}</span>
      <span className={styles.syncText}>{status.text}</span>
      {(syncStatus === 'error' || syncStatus === 'pending') && isOnline && (
        <button onClick={onForceSync} className={styles.forceSyncButton}>
          🔄 Réessayer
        </button>
      )}
      {!isOnline && (
        <span className={styles.offlineWarning}>Les modifications seront synchronisées dès la reconnexion</span>
      )}
    </div>
  )
}
