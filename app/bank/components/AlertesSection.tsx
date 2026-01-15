'use client'

import type { Alert } from '../types'
import styles from '../bank.module.css'

interface AlertesSectionProps {
  alerts: Alert[]
  minSolde: { solde: number; date: string }
  endSolde: { solde: number; date: string }
}

export function AlertesSection({ alerts, minSolde, endSolde }: AlertesSectionProps) {
  if (alerts.length === 0) {
    return (
      <div className={styles.section}>
        <h2>✅ Aucune alerte</h2>
        <p>Votre solde reste au-dessus du découvert autorisé sur toute la période.</p>
        <div className={styles.summary}>
          <div className={styles.summaryItem}>
            <span>Solde minimum:</span>
            <strong>{minSolde.solde.toFixed(2)}€</strong>
            <span className={styles.summaryDate}>
              le {new Date(minSolde.date).toLocaleDateString('fr-FR')}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span>Solde en fin de période:</span>
            <strong>{endSolde.solde.toFixed(2)}€</strong>
            <span className={styles.summaryDate}>
              le {new Date(endSolde.date).toLocaleDateString('fr-FR')}
            </span>
          </div>
        </div>
      </div>
    )
  }

  // Grouper les alertes par type
  const dangerAlerts = alerts.filter(a => a.type === 'danger')
  const warningAlerts = alerts.filter(a => a.type === 'warning')
  const infoAlerts = alerts.filter(a => a.type === 'info')

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    })
  }

  return (
    <div className={styles.section}>
      <h2>⚠️ Alertes ({alerts.length})</h2>

      <div className={styles.summary}>
        <div className={styles.summaryItem}>
          <span>Solde minimum:</span>
          <strong className={minSolde.solde < 0 ? styles.negative : ''}>
            {minSolde.solde.toFixed(2)}€
          </strong>
          <span className={styles.summaryDate}>
            le {new Date(minSolde.date).toLocaleDateString('fr-FR')}
          </span>
        </div>
        <div className={styles.summaryItem}>
          <span>Solde en fin de période:</span>
          <strong className={endSolde.solde < 0 ? styles.negative : ''}>
            {endSolde.solde.toFixed(2)}€
          </strong>
          <span className={styles.summaryDate}>
            le {new Date(endSolde.date).toLocaleDateString('fr-FR')}
          </span>
        </div>
      </div>

      <div className={styles.alerts}>
        {dangerAlerts.length > 0 && (
          <div className={styles.alertGroup}>
            <h3 className={styles.alertGroupTitle}>🚨 Danger ({dangerAlerts.length})</h3>
            {dangerAlerts.map((alert, index) => (
              <div key={index} className={`${styles.alert} ${styles.alertDanger}`}>
                <div className={styles.alertDate}>{formatDate(alert.date)}</div>
                <div className={styles.alertMessage}>{alert.message}</div>
              </div>
            ))}
          </div>
        )}

        {warningAlerts.length > 0 && (
          <div className={styles.alertGroup}>
            <h3 className={styles.alertGroupTitle}>⚠️ Attention ({warningAlerts.length})</h3>
            {warningAlerts.map((alert, index) => (
              <div key={index} className={`${styles.alert} ${styles.alertWarning}`}>
                <div className={styles.alertDate}>{formatDate(alert.date)}</div>
                <div className={styles.alertMessage}>{alert.message}</div>
              </div>
            ))}
          </div>
        )}

        {infoAlerts.length > 0 && (
          <div className={styles.alertGroup}>
            <h3 className={styles.alertGroupTitle}>ℹ️ Information ({infoAlerts.length})</h3>
            {infoAlerts.map((alert, index) => (
              <div key={index} className={`${styles.alert} ${styles.alertInfo}`}>
                <div className={styles.alertDate}>{formatDate(alert.date)}</div>
                <div className={styles.alertMessage}>{alert.message}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
