import { useState } from 'react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { OperationWithOverrides } from '../types'
import styles from '../bank.module.css'

interface CategoryData {
  name: string
  value: number
}

interface CategoryChartProps {
  data: CategoryData[]
  categoryMandatory: Record<string, boolean>
  setCategoryMandatory: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  operations: OperationWithOverrides[]
}

export function CategoryChart({ data, categoryMandatory, setCategoryMandatory, operations }: CategoryChartProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  if (data.length === 0) {
    return <p>Aucune dépense détectée.</p>
  }

  const getCategoryOperations = (categoryName: string) => {
    return operations
      .filter(op => op.categoryLabel === categoryName && op.Montant < 0 && !op.excluded)
      .sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime())
  }

  return (
    <>
      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ left: 8, right: 16 }}>
            <XAxis dataKey="name" interval={0} angle={-20} textAnchor="end" height={60} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#2563eb" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Catégorie</th>
            <th>Total dépenses</th>
            <th>Nb</th>
            <th>Obligatoire</th>
            <th>Détail</th>
          </tr>
        </thead>
        <tbody>
          {data.map((category) => {
            const categoryOps = getCategoryOperations(category.name)
            const isExpanded = expandedCategory === category.name

            return (
              <>
                <tr key={category.name}>
                  <td><strong>{category.name}</strong></td>
                  <td><strong>{category.value.toFixed(2)} €</strong></td>
                  <td>{categoryOps.length}</td>
                  <td>
                    <input
                      type="checkbox"
                      checked={categoryMandatory[category.name] ?? false}
                      onChange={(event) => setCategoryMandatory((prev) => ({
                        ...prev,
                        [category.name]: event.target.checked,
                      }))}
                    />
                  </td>
                  <td>
                    <button
                      className={styles.detailButton}
                      onClick={() => setExpandedCategory(isExpanded ? null : category.name)}
                    >
                      {isExpanded ? '▼ Masquer' : '▶ Voir'}
                    </button>
                  </td>
                </tr>
                {isExpanded && categoryOps.map((op, idx) => (
                  <tr key={`${category.name}-${idx}`} className={styles.detailRow}>
                    <td className={styles.detailCell}>
                      <span className={styles.detailDate}>{op.Date}</span>
                      <span className={styles.detailLabel}>
                        {op['Libelle simplifie'] || op['Libelle operation']}
                      </span>
                    </td>
                    <td className={styles.negative}>{op.Montant.toFixed(2)} €</td>
                    <td colSpan={3}>
                      {op.recurringLabel && <span className={styles.badge}>Récurrent</span>}
                      {op.Paiement_4x && <span className={styles.badge}>4x</span>}
                    </td>
                  </tr>
                ))}
              </>
            )
          })}
        </tbody>
      </table>
    </>
  )
}
