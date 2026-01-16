'use client'

import type { Alert } from '../types'
import styles from '../bank.module.css'

interface AlertesSectionProps {
  alerts: Alert[]
  minSolde: { solde: number; date: string }
  endSolde: { solde: number; date: string }
}

export function AlertesSection({ alerts, minSolde, endSolde }: AlertesSectionProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    })
  }

  // Grouper les alertes par type
  const dangerAlerts = alerts.filter(a => a.type === 'danger')
  const warningAlerts = alerts.filter(a => a.type === 'warning')
  const infoAlerts = alerts.filter(a => a.type === 'info')

  const hasAlerts = alerts.length > 0

  return (
    <div className={styles.modernAlertesSection}>
      {/* Header */}
      <div className={styles.modernAlertesHeader}>
        <div className={styles.modernAlertesHeaderLeft}>
          <h2 className={styles.modernAlertesTitle}>
            {hasAlerts ? '⚠️ Alertes et notifications' : '✅ Situation saine'}
          </h2>
          <p className={styles.modernAlertesSubtitle}>
            {hasAlerts
              ? `${alerts.length} alerte${alerts.length > 1 ? 's' : ''} détectée${alerts.length > 1 ? 's' : ''} sur la période`
              : 'Aucune alerte, votre solde reste dans la zone sécurisée'
            }
          </p>
        </div>

        {/* Badge de statut */}
        <div className={`${styles.statusBadge} ${hasAlerts ? styles.statusBadgeWarning : styles.statusBadgeOk}`}>
          {hasAlerts ? '⚠️ Attention' : '✓ OK'}
        </div>
      </div>

      {/* Stats Summary */}
      <div className={styles.modernSummaryGrid}>
        <div className={`${styles.modernSummaryCard} ${minSolde.solde < 0 ? styles.summaryCardDanger : styles.summaryCardSuccess}`}>
          <div className={styles.summaryCardIcon}>
            {minSolde.solde < 0 ? '📉' : '📊'}
          </div>
          <div className={styles.summaryCardContent}>
            <span className={styles.summaryCardLabel}>Solde minimum</span>
            <span className={`${styles.summaryCardValue} ${minSolde.solde < 0 ? styles.summaryValueNegative : ''}`}>
              {minSolde.solde.toFixed(2)}€
            </span>
            <span className={styles.summaryCardDate}>
              le {new Date(minSolde.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            </span>
          </div>
        </div>

        <div className={`${styles.modernSummaryCard} ${endSolde.solde < 0 ? styles.summaryCardDanger : styles.summaryCardSuccess}`}>
          <div className={styles.summaryCardIcon}>
            {endSolde.solde < 0 ? '🔴' : '🟢'}
          </div>
          <div className={styles.summaryCardContent}>
            <span className={styles.summaryCardLabel}>Solde en fin de période</span>
            <span className={`${styles.summaryCardValue} ${endSolde.solde < 0 ? styles.summaryValueNegative : ''}`}>
              {endSolde.solde.toFixed(2)}€
            </span>
            <span className={styles.summaryCardDate}>
              le {new Date(endSolde.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            </span>
          </div>
        </div>

        {hasAlerts && (
          <div className={styles.modernSummaryCard}>
            <div className={styles.summaryCardIcon}>🚨</div>
            <div className={styles.summaryCardContent}>
              <span className={styles.summaryCardLabel}>Total alertes</span>
              <span className={styles.summaryCardValue}>{alerts.length}</span>
              <span className={styles.summaryCardDate}>
                {dangerAlerts.length} critique{dangerAlerts.length > 1 ? 's' : ''}, {warningAlerts.length + infoAlerts.length} autre{(warningAlerts.length + infoAlerts.length) > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Liste des alertes */}
      {hasAlerts && (
        <div className={styles.modernAlertsContainer}>
          {dangerAlerts.length > 0 && (
            <div className={styles.modernAlertCategory}>
              <div className={styles.alertCategoryHeader}>
                <span className={styles.alertCategoryIcon}>🚨</span>
                <h3 className={styles.alertCategoryTitle}>Critiques ({dangerAlerts.length})</h3>
              </div>
              <div className={styles.alertsList}>
                {dangerAlerts.map((alert, index) => (
                  <div key={index} className={`${styles.modernAlertCard} ${styles.modernAlertDanger}`}>
                    <div className={styles.alertCardLeft}>
                      <div className={styles.alertCardIcon}>⚠️</div>
                      <div className={styles.alertCardContent}>
                        <div className={styles.alertCardDate}>{formatDate(alert.date)}</div>
                        <div className={styles.alertCardMessage}>{alert.message}</div>
                      </div>
                    </div>
                    <div className={styles.alertCardBadge}>Critique</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {warningAlerts.length > 0 && (
            <div className={styles.modernAlertCategory}>
              <div className={styles.alertCategoryHeader}>
                <span className={styles.alertCategoryIcon}>⚠️</span>
                <h3 className={styles.alertCategoryTitle}>Attention ({warningAlerts.length})</h3>
              </div>
              <div className={styles.alertsList}>
                {warningAlerts.map((alert, index) => (
                  <div key={index} className={`${styles.modernAlertCard} ${styles.modernAlertWarning}`}>
                    <div className={styles.alertCardLeft}>
                      <div className={styles.alertCardIcon}>⚠️</div>
                      <div className={styles.alertCardContent}>
                        <div className={styles.alertCardDate}>{formatDate(alert.date)}</div>
                        <div className={styles.alertCardMessage}>{alert.message}</div>
                      </div>
                    </div>
                    <div className={styles.alertCardBadge}>Attention</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {infoAlerts.length > 0 && (
            <div className={styles.modernAlertCategory}>
              <div className={styles.alertCategoryHeader}>
                <span className={styles.alertCategoryIcon}>ℹ️</span>
                <h3 className={styles.alertCategoryTitle}>Informations ({infoAlerts.length})</h3>
              </div>
              <div className={styles.alertsList}>
                {infoAlerts.map((alert, index) => (
                  <div key={index} className={`${styles.modernAlertCard} ${styles.modernAlertInfo}`}>
                    <div className={styles.alertCardLeft}>
                      <div className={styles.alertCardIcon}>ℹ️</div>
                      <div className={styles.alertCardContent}>
                        <div className={styles.alertCardDate}>{formatDate(alert.date)}</div>
                        <div className={styles.alertCardMessage}>{alert.message}</div>
                      </div>
                    </div>
                    <div className={styles.alertCardBadge}>Info</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Message de succès */}
      {!hasAlerts && (
        <div className={styles.successMessage}>
          <div className={styles.successIcon}>🎉</div>
          <div className={styles.successContent}>
            <h3>Excellent !</h3>
            <p>Votre solde reste au-dessus du découvert autorisé sur toute la période projetée.</p>
            <p className={styles.successTip}>
              💡 Continuez à surveiller régulièrement vos finances pour éviter les mauvaises surprises.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
