'use client'

import type { SoldeProjection } from '../types'
import styles from '../bank.module.css'

interface SoldeTimelineProps {
  projection: SoldeProjection[]
  decouvert: number
}

export function SoldeTimeline({ projection, decouvert }: SoldeTimelineProps) {
  if (projection.length === 0) {
    return (
      <div className={styles.modernTimelineSection}>
        <div className={styles.modernTimelineHeader}>
          <h2 className={styles.modernTimelineTitle}>📊 Projection du solde</h2>
          <p className={styles.modernTimelineSubtitle}>
            Saisissez votre solde actuel et lancez une analyse pour voir la projection jour par jour
          </p>
        </div>
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>📈</div>
          <h3 className={styles.emptyStateTitle}>En attente de données</h3>
          <p className={styles.emptyStateText}>
            Entrez votre solde actuel pour afficher la projection
          </p>
        </div>
      </div>
    )
  }

  // Formater la date pour affichage
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const day = date.toLocaleDateString('fr-FR', { weekday: 'short' })
    const dayNum = date.getDate()
    const month = date.toLocaleDateString('fr-FR', { month: 'short' })
    return { day, dayNum, month, full: `${day} ${dayNum} ${month}` }
  }

  // Calculer les stats
  const minSolde = Math.min(...projection.map(p => p.solde))
  const maxSolde = Math.max(...projection.map(p => p.solde))
  const avgSolde = projection.reduce((sum, p) => sum + p.solde, 0) / projection.length

  return (
    <div className={styles.modernTimelineSection}>
      {/* Header */}
      <div className={styles.modernTimelineHeader}>
        <div className={styles.modernTimelineHeaderLeft}>
          <h2 className={styles.modernTimelineTitle}>📊 Projection jour par jour</h2>
          <p className={styles.modernTimelineSubtitle}>
            Visualisez l'évolution de votre solde sur les {projection.length} prochains jours
          </p>
        </div>

        {/* Mini stats */}
        <div className={styles.timelineMiniStats}>
          <div className={styles.miniStatItem}>
            <span className={styles.miniStatLabel}>Min</span>
            <span className={`${styles.miniStatValue} ${minSolde < 0 ? styles.miniStatNegative : ''}`}>
              {minSolde.toFixed(2)}€
            </span>
          </div>
          <div className={styles.miniStatItem}>
            <span className={styles.miniStatLabel}>Moy</span>
            <span className={styles.miniStatValue}>{avgSolde.toFixed(2)}€</span>
          </div>
          <div className={styles.miniStatItem}>
            <span className={styles.miniStatLabel}>Max</span>
            <span className={`${styles.miniStatValue} ${styles.miniStatPositive}`}>
              {maxSolde.toFixed(2)}€
            </span>
          </div>
        </div>
      </div>

      {/* Timeline moderne */}
      <div className={styles.modernTimeline}>
        {projection.map((day, index) => {
          const isToday = index === 0
          const hasOperations = day.operations.length > 0
          const dateInfo = formatDate(day.date)

          // Déterminer le type de jour
          let dayType = 'ok'
          if (day.isOverdraft) dayType = 'danger'
          else if (day.solde < 0) dayType = 'warning'
          else if (day.solde < 200) dayType = 'info'

          return (
            <div
              key={day.date}
              className={`${styles.modernTimelineDay} ${styles[`modernDay${dayType.charAt(0).toUpperCase() + dayType.slice(1)}`]} ${isToday ? styles.modernDayToday : ''}`}
            >
              {/* Indicateur vertical */}
              <div className={styles.timelineIndicator}>
                <div className={styles.timelineDot} />
                {index < projection.length - 1 && <div className={styles.timelineLine} />}
              </div>

              {/* Contenu du jour */}
              <div className={styles.modernDayCard}>
                {/* Header du jour */}
                <div className={styles.modernDayHeader}>
                  <div className={styles.modernDayDateInfo}>
                    <div className={styles.modernDayWeekday}>
                      {dateInfo.day}
                      {isToday && <span className={styles.modernTodayBadge}>Aujourd'hui</span>}
                    </div>
                    <div className={styles.modernDayDate}>
                      {dateInfo.dayNum} {dateInfo.month}
                    </div>
                  </div>

                  <div className={styles.modernDaySolde}>
                    <span className={styles.modernSoldeLabel}>Solde</span>
                    <span className={`${styles.modernSoldeValue} ${
                      day.isOverdraft ? styles.modernSoldeNegative :
                      day.solde < 0 ? styles.modernSoldeWarning :
                      ''
                    }`}>
                      {day.solde.toFixed(2)}€
                    </span>
                  </div>
                </div>

                {/* Opérations */}
                {hasOperations && (
                  <div className={styles.modernDayOperations}>
                    <div className={styles.operationsTitle}>
                      {day.operations.length} opération{day.operations.length > 1 ? 's' : ''}
                    </div>
                    <div className={styles.modernOperationsList}>
                      {day.operations.map((op, opIndex) => (
                        <div
                          key={opIndex}
                          className={`${styles.modernOperation} ${
                            op.amount > 0 ? styles.modernOperationCredit : styles.modernOperationDebit
                          } ${op.isMatched ? styles.modernOperationMatched : ''}`}
                        >
                          <div className={styles.modernOperationIcon}>
                            {op.amount > 0 ? '💰' : '💸'}
                          </div>
                          <div className={styles.modernOperationInfo}>
                            <span className={styles.modernOperationLabel}>
                              {op.label}
                              {op.isMatched && <span className={styles.matchedBadge}>✓ Pointé</span>}
                            </span>
                          </div>
                          <div className={`${styles.modernOperationAmount} ${
                            op.amount > 0 ? styles.amountCredit : styles.amountDebit
                          }`}>
                            {op.amount > 0 ? '+' : ''}{op.amount.toFixed(2)}€
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Alerte découvert */}
                {day.isOverdraft && (
                  <div className={styles.modernDayAlert}>
                    <span className={styles.alertIconLarge}>⚠️</span>
                    <div className={styles.alertContent}>
                      <strong>Découvert dépassé</strong>
                      <span>Limite autorisée: {decouvert}€</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Légende */}
      <div className={styles.modernLegend}>
        <div className={styles.modernLegendTitle}>Légende</div>
        <div className={styles.modernLegendItems}>
          <div className={styles.modernLegendItem}>
            <div className={styles.legendDot} style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }} />
            <span>Solde positif (&gt; 200€)</span>
          </div>
          <div className={styles.modernLegendItem}>
            <div className={styles.legendDot} style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)' }} />
            <span>Solde faible (&lt; 200€)</span>
          </div>
          <div className={styles.modernLegendItem}>
            <div className={styles.legendDot} style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' }} />
            <span>Découvert autorisé</span>
          </div>
          <div className={styles.modernLegendItem}>
            <div className={styles.legendDot} style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }} />
            <span>Découvert dépassé</span>
          </div>
          <div className={styles.modernLegendItem}>
            <span className={styles.legendBadge}>✓ Pointé</span>
            <span>Opération trouvée dans le CSV</span>
          </div>
        </div>
      </div>
    </div>
  )
}
