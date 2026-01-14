import { useState } from 'react'
import type { OperationWithOverrides } from '../types'
import styles from '../bank.module.css'

interface CategoryData {
  name: string
  value: number
}

interface CategoryManagerProps {
  data: CategoryData[]
  categoryMandatory: Record<string, boolean>
  setCategoryMandatory: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  operations: OperationWithOverrides[]
  setCategoryEdits: React.Dispatch<React.SetStateAction<Record<string, string>>>
  setExcludedOps: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
}

export function CategoryManager({
  data,
  categoryMandatory,
  setCategoryMandatory,
  operations,
  setCategoryEdits,
  setExcludedOps
}: CategoryManagerProps) {
  const [selectedOps, setSelectedOps] = useState<Set<string>>(new Set())
  const [targetCategory, setTargetCategory] = useState<string>('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  if (data.length === 0) {
    return <p>Aucune dépense détectée.</p>
  }

  const getCategoryOperations = (categoryName: string) => {
    return operations
      .filter(op => op.categoryLabel === categoryName && op.Montant < 0 && !op.excluded)
      .sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime())
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

  const toggleSelectOp = (rowKey: string) => {
    setSelectedOps(prev => {
      const newSet = new Set(prev)
      if (newSet.has(rowKey)) {
        newSet.delete(rowKey)
      } else {
        newSet.add(rowKey)
      }
      return newSet
    })
  }

  const selectAllInCategory = (categoryName: string) => {
    const categoryOps = getCategoryOperations(categoryName)
    setSelectedOps(prev => {
      const newSet = new Set(prev)
      const allSelected = categoryOps.every(op => newSet.has(op.rowKey))

      if (allSelected) {
        categoryOps.forEach(op => newSet.delete(op.rowKey))
      } else {
        categoryOps.forEach(op => newSet.add(op.rowKey))
      }
      return newSet
    })
  }

  const moveSelectedToCategory = () => {
    if (!targetCategory || selectedOps.size === 0) return

    const selectedOperations = operations.filter(op => selectedOps.has(op.rowKey))

    selectedOperations.forEach(op => {
      setCategoryEdits(prev => ({
        ...prev,
        [op.Merchant_key]: targetCategory
      }))
    })

    setSelectedOps(new Set())
    setTargetCategory('')
  }

  const excludeSelected = () => {
    if (selectedOps.size === 0) return

    selectedOps.forEach(rowKey => {
      setExcludedOps(prev => ({
        ...prev,
        [rowKey]: true
      }))
    })

    setSelectedOps(new Set())
  }

  const excludeOperation = (rowKey: string) => {
    setExcludedOps(prev => ({
      ...prev,
      [rowKey]: true
    }))
  }

  const allCategories = data.map(cat => cat.name)

  return (
    <div className={styles.categoryManager}>
      {selectedOps.size > 0 && (
        <div className={styles.selectionBar}>
          <div className={styles.selectionInfo}>
            <strong>{selectedOps.size}</strong> opération{selectedOps.size > 1 ? 's' : ''} sélectionnée{selectedOps.size > 1 ? 's' : ''}
          </div>
          <div className={styles.selectionActions}>
            <select
              value={targetCategory}
              onChange={(e) => setTargetCategory(e.target.value)}
              className={styles.categorySelect}
            >
              <option value="">Choisir une catégorie...</option>
              {allCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <button
              onClick={moveSelectedToCategory}
              disabled={!targetCategory}
              className={styles.moveButton}
            >
              ➜ Déplacer
            </button>
            <button
              onClick={excludeSelected}
              className={styles.excludeButton}
            >
              🚫 Exclure
            </button>
            <button
              onClick={() => setSelectedOps(new Set())}
              className={styles.cancelButton}
            >
              ✖ Annuler
            </button>
          </div>
        </div>
      )}

      <div className={styles.categoryGrid}>
        {data.map((category) => {
          const categoryOps = getCategoryOperations(category.name)
          const isExpanded = expandedCategories.has(category.name)
          const selectedInCategory = categoryOps.filter(op => selectedOps.has(op.rowKey)).length

          return (
            <div key={category.name} className={styles.categoryCard}>
              <div className={styles.categoryHeader}>
                <div className={styles.categoryInfo}>
                  <h4>{category.name}</h4>
                  <p className={styles.categoryAmount}>{category.value.toFixed(2)} €</p>
                  <p className={styles.categoryCount}>
                    {categoryOps.length} opérations
                    {selectedInCategory > 0 && (
                      <span className={styles.selectedCount}> ({selectedInCategory} sélectionnées)</span>
                    )}
                  </p>
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
                    {isExpanded ? '▼ Masquer' : '▶ Voir'} ({categoryOps.length})
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className={styles.operationsList}>
                  {categoryOps.length > 0 && (
                    <div className={styles.selectAllRow}>
                      <label>
                        <input
                          type="checkbox"
                          checked={categoryOps.every(op => selectedOps.has(op.rowKey))}
                          onChange={() => selectAllInCategory(category.name)}
                        />
                        <span>Tout sélectionner</span>
                      </label>
                    </div>
                  )}
                  {categoryOps.length === 0 ? (
                    <p className={styles.emptyCategory}>Aucune opération</p>
                  ) : (
                    categoryOps.map((op) => (
                      <div
                        key={op.rowKey}
                        className={`${styles.operationItem} ${selectedOps.has(op.rowKey) ? styles.selected : ''}`}
                      >
                        <label className={styles.opCheckbox}>
                          <input
                            type="checkbox"
                            checked={selectedOps.has(op.rowKey)}
                            onChange={() => toggleSelectOp(op.rowKey)}
                          />
                        </label>
                        <div className={styles.operationContent}>
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
                        <button
                          className={styles.quickExclude}
                          onClick={() => excludeOperation(op.rowKey)}
                          title="Exclure cette opération"
                        >
                          🚫
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
