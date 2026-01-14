import { useState } from 'react'
import type { OperationWithOverrides } from '../types'
import styles from '../bank.module.css'

interface CategoryData {
  name: string
  value: number
}

interface CategoryDragDropProps {
  data: CategoryData[]
  categoryMandatory: Record<string, boolean>
  setCategoryMandatory: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  operations: OperationWithOverrides[]
  setCategoryEdits: React.Dispatch<React.SetStateAction<Record<string, string>>>
}

export function CategoryDragDrop({
  data,
  categoryMandatory,
  setCategoryMandatory,
  operations,
  setCategoryEdits
}: CategoryDragDropProps) {
  const [draggedOp, setDraggedOp] = useState<OperationWithOverrides | null>(null)
  const [dragOverCategory, setDragOverCategory] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  if (data.length === 0) {
    return <p>Aucune dépense détectée.</p>
  }

  const getCategoryOperations = (categoryName: string) => {
    return operations
      .filter(op => op.categoryLabel === categoryName && op.Montant < 0 && !op.excluded)
      .sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime())
  }

  const handleDragStart = (e: React.DragEvent, operation: OperationWithOverrides) => {
    setDraggedOp(operation)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, categoryName: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverCategory(categoryName)
  }

  const handleDragLeave = () => {
    setDragOverCategory(null)
  }

  const handleDrop = (e: React.DragEvent, targetCategory: string) => {
    e.preventDefault()
    if (draggedOp && draggedOp.categoryLabel !== targetCategory) {
      // Mettre à jour la catégorie de l'opération
      setCategoryEdits(prev => ({
        ...prev,
        [draggedOp.Merchant_key]: targetCategory
      }))
    }
    setDraggedOp(null)
    setDragOverCategory(null)
  }

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName)
      } else {
        newSet.add(categoryName)
      }
      return newSet
    })
  }

  return (
    <div className={styles.categoryGrid}>
      {data.map((category) => {
        const categoryOps = getCategoryOperations(category.name)
        const isExpanded = expandedCategories.has(category.name)
        const isDragOver = dragOverCategory === category.name

        return (
          <div
            key={category.name}
            className={`${styles.categoryCard} ${isDragOver ? styles.dragOver : ''}`}
            onDragOver={(e) => handleDragOver(e, category.name)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, category.name)}
          >
            <div className={styles.categoryHeader}>
              <div className={styles.categoryInfo}>
                <h4>{category.name}</h4>
                <p className={styles.categoryAmount}>{category.value.toFixed(2)} €</p>
                <p className={styles.categoryCount}>{categoryOps.length} opérations</p>
              </div>
              <div className={styles.categoryActions}>
                <label className={styles.mandatoryCheckbox}>
                  <input
                    type="checkbox"
                    checked={categoryMandatory[category.name] ?? false}
                    onChange={(event) => setCategoryMandatory((prev) => ({
                      ...prev,
                      [category.name]: event.target.checked,
                    }))}
                  />
                  <span>Obligatoire</span>
                </label>
                <button
                  className={styles.expandButton}
                  onClick={() => toggleCategory(category.name)}
                >
                  {isExpanded ? '▼' : '▶'} {isExpanded ? 'Masquer' : 'Voir'}
                </button>
              </div>
            </div>

            {isExpanded && (
              <div className={styles.operationsList}>
                {categoryOps.length === 0 ? (
                  <p className={styles.emptyCategory}>Glisse des opérations ici</p>
                ) : (
                  categoryOps.map((op) => (
                    <div
                      key={op.rowKey}
                      className={styles.operationItem}
                      draggable
                      onDragStart={(e) => handleDragStart(e, op)}
                    >
                      <div className={styles.operationMain}>
                        <span className={styles.operationDate}>{op.Date}</span>
                        <span className={styles.operationLabel}>
                          {op['Libelle simplifie'] || op['Libelle operation']}
                        </span>
                      </div>
                      <div className={styles.operationDetails}>
                        <span className={styles.operationAmount}>{op.Montant.toFixed(2)} €</span>
                        {op.recurringLabel && <span className={styles.badge}>Récurrent</span>}
                        {op.Paiement_4x && <span className={styles.badge}>4x</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
