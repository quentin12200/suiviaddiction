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
      <div className={styles.section}>
        <h2>📊 Projection du solde</h2>
        <p>Saisissez votre solde actuel et lancez une analyse pour voir la projection.</p>
      </div>
    )
  }

  // Formater la date pour affichage
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const day = date.toLocaleDateString('fr-FR', { weekday: 'short' })
    const dayNum = date.getDate()
    const month = date.toLocaleDateString('fr-FR', { month: 'short' })
    return `${day} ${dayNum} ${month}`
  }

  return (
    <div className={styles.section}>
      <h2>📊 Projection du solde jour par jour</h2>

      <div className={styles.timeline}>
        {projection.map((day, index) => {
          const isToday = index === 0
          const hasOperations = day.operations.length > 0

          return (
            <div
              key={day.date}
              className={`${styles.timelineDay} ${
                day.isOverdraft ? styles.dayDanger :
                day.solde < 0 ? styles.dayWarning :
                day.solde < 200 ? styles.dayInfo :
                styles.dayOk
              } ${isToday ? styles.dayToday : ''}`}
            >
              <div className={styles.dayHeader}>
                <span className={styles.dayDate}>
                  {formatDate(day.date)}
                  {isToday && ' (aujourd\'hui)'}
                </span>
                <span className={`${styles.daySolde} ${
                  day.isOverdraft ? styles.soldeNegative :
                  day.solde < 0 ? styles.soldeWarning :
                  ''
                }`}>
                  {day.solde.toFixed(2)}€
                </span>
              </div>

              {hasOperations && (
                <div className={styles.dayOperations}>
                  {day.operations.map((op, opIndex) => (
                    <div
                      key={opIndex}
                      className={`${styles.operation} ${
                        op.amount > 0 ? styles.operationCredit : styles.operationDebit
                      } ${op.isMatched ? styles.operationMatched : ''}`}
                    >
                      <span className={styles.operationLabel}>
                        {op.label}
                        {op.isMatched && ' ✓'}
                      </span>
                      <span className={styles.operationAmount}>
                        {op.amount > 0 ? '+' : ''}{op.amount.toFixed(2)}€
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {day.isOverdraft && (
                <div className={styles.dayAlert}>
                  ⚠️ Découvert dépassé (limite: {decouvert}€)
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ backgroundColor: '#22c55e' }}></span>
          <span>Solde positif</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ backgroundColor: '#f59e0b' }}></span>
          <span>Solde faible (&lt; 200€)</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ backgroundColor: '#f97316' }}></span>
          <span>Découvert autorisé</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ backgroundColor: '#ef4444' }}></span>
          <span>Découvert dépassé</span>
        </div>
        <div className={styles.legendItem}>
          <span>✓</span>
          <span>Opération trouvée dans le CSV</span>
        </div>
      </div>
    </div>
  )
}
