'use client'

import { useState } from 'react'
import styles from './StateInfoTooltip.module.css'
import { StateInfo } from '../data/stateDefinitions'

interface StateInfoTooltipProps {
  stateInfo: StateInfo
}

export default function StateInfoTooltip({ stateInfo }: StateInfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleTooltip = () => {
    setIsOpen(!isOpen)
  }

  const closeTooltip = () => {
    setIsOpen(false)
  }

  return (
    <div className={styles.tooltipContainer}>
      <button
        type="button"
        className={styles.infoButton}
        onClick={toggleTooltip}
        aria-label={`Plus d'informations sur ${stateInfo.name}`}
      ></button>

      {isOpen && (
        <>
          <div className={styles.overlay} onClick={closeTooltip} />
          <div className={styles.popup}>
            <div className={styles.popupHeader}>
              <h3 className={styles.popupTitle}>
                {stateInfo.emoji} {stateInfo.name}
                {stateInfo.isValorized && <span className={styles.star}> ⭐</span>}
                {stateInfo.isPiege && <span className={styles.warning}> ⚠️</span>}
              </h3>
              <button
                type="button"
                className={styles.closeButton}
                onClick={closeTooltip}
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>

            <div className={styles.popupContent}>
              <div className={styles.definition}>
                <strong>Définition :</strong> {stateInfo.definition}
              </div>

              <div className={styles.examples}>
                <strong>Exemples concrets :</strong>
                <ul className={styles.exampleList}>
                  {stateInfo.examples.map((example, index) => (
                    <li key={index}>{example}</li>
                  ))}
                </ul>
              </div>

              {stateInfo.importance && (
                <div className={`${styles.importance} ${
                  stateInfo.isValorized ? styles.valorized :
                  stateInfo.isPiege ? styles.danger : ''
                }`}>
                  <strong>💡 À retenir :</strong> {stateInfo.importance}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
