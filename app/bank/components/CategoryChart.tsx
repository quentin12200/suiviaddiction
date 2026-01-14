import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import styles from '../bank.module.css'

interface CategoryData {
  name: string
  value: number
}

interface CategoryChartProps {
  data: CategoryData[]
  categoryMandatory: Record<string, boolean>
  setCategoryMandatory: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
}

export function CategoryChart({ data, categoryMandatory, setCategoryMandatory }: CategoryChartProps) {
  if (data.length === 0) {
    return <p>Aucune dépense détectée.</p>
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
            <th>Obligatoire</th>
          </tr>
        </thead>
        <tbody>
          {data.map((category) => (
            <tr key={category.name}>
              <td>{category.name}</td>
              <td>{category.value.toFixed(2)} €</td>
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
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
