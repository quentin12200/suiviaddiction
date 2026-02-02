'use client'

import { useState } from 'react'
import styles from './NicotineDoseModal.module.css'

interface Props {
  currentDose: number
  onSave: (dose: number) => void
  onClose: () => void
}

export default function NicotineDoseModal({ currentDose, onSave, onClose }: Props) {
  const [dose, setDose] = useState(currentDose)

  const handleSave = () => {
    onSave(dose)
    onClose()
  }

  const commonDoses = [7, 14, 21]

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>⚙️ Modifier la dose de nicotine</h2>

        <div className={styles.content}>
          <p className={styles.description}>
            Sélectionnez la dose de votre patch de nicotine en milligrammes (mg)
          </p>

          <div className={styles.quickButtons}>
            {commonDoses.map((d) => (
              <button
                key={d}
                className={`${styles.quickButton} ${dose === d ? styles.active : ''}`}
                onClick={() => setDose(d)}
              >
                {d} mg
              </button>
            ))}
          </div>

          <div className={styles.customInput}>
            <label htmlFor="customDose">Dose personnalisée :</label>
            <input
              id="customDose"
              type="number"
              min="0"
              max="42"
              value={dose}
              onChange={(e) => setDose(parseInt(e.target.value) || 0)}
              className={styles.input}
            />
            <span className={styles.unit}>mg</span>
          </div>
        </div>

        <div className={styles.actions}>
          <button onClick={onClose} className={styles.cancelButton}>
            Annuler
          </button>
          <button onClick={handleSave} className={styles.saveButton}>
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}
