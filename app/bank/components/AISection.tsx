import { useState } from 'react'
import type { AnalysisResult } from '../types'
import styles from '../bank.module.css'

interface AISectionProps {
  result: AnalysisResult | null
}

export function AISection({ result }: AISectionProps) {
  const [scenario, setScenario] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  const handleScenarioSubmit = async () => {
    setAiResponse('')
    if (!scenario.trim()) return
    setAiLoading(true)
    try {
      const response = await fetch('/api/bank-analysis/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario,
          summary: result ? {
            endNextMonthBalance: result.endNextMonthBalance,
            endNextMonthDate: result.endNextMonthDate,
            minBalance: result.minBalance,
            minBalanceDate: result.minBalanceDate,
            paiements4xCount: result.paiements4xCount,
          } : null,
        }),
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        setAiResponse(data.error || 'Impossible de contacter l\'IA.')
        return
      }
      setAiResponse(data.reply)
    } catch (err) {
      setAiResponse('Erreur de connexion à l\'IA.')
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className={styles.aiCard}>
      <h2>🤖 Scénarios IA (beta)</h2>
      <p>
        Décris un scénario (ex: « si j'ajoute 200€ le 15 »). Nécessite une clé
        <strong> OPENAI_API_KEY</strong> configurée côté serveur.
      </p>
      <div className={styles.aiForm}>
        <textarea
          value={scenario}
          onChange={(event) => setScenario(event.target.value)}
          placeholder="Décris ton scénario (ex: et si j'ajoute 200€ de revenus le 15 ?)"
        />
        <button type="button" onClick={handleScenarioSubmit} disabled={aiLoading}>
          {aiLoading ? 'Analyse...' : 'Analyser avec IA'}
        </button>
      </div>
      {aiResponse && <p className={styles.aiResponse}>{aiResponse}</p>}
    </div>
  )
}
