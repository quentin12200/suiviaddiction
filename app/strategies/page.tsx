'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '../components/Navigation'
import styles from './strategies.module.css'

interface Strategy {
  id: string
  category: string
  title: string
  description: string
  alternatives: string[]
  trigger: string
  difficulty: 'easy' | 'medium' | 'hard'
  isActive?: boolean
}

export default function StrategiesPage() {
  const router = useRouter()
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [activeStrategies, setActiveStrategies] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadStrategies()
  }, [])

  const loadStrategies = async () => {
    try {
      // Charger les stratégies générées par l'IA
      const strategiesRes = await fetch('/api/strategies')
      const strategiesData = await strategiesRes.json()

      // Charger les stratégies actives
      const activeRes = await fetch('/api/strategies/toggle')
      const activeData = await activeRes.json()

      if (strategiesData.success && strategiesData.strategies) {
        const activeIds = new Set<string>(
          activeData.strategies?.map((s: any) => s.strategyId as string) || []
        )
        setActiveStrategies(activeIds)
        setStrategies(strategiesData.strategies)
      }
    } catch (error) {
      console.error('Erreur chargement stratégies:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleStrategy = async (strategy: Strategy) => {
    const newIsActive = !activeStrategies.has(strategy.id)

    try {
      const response = await fetch('/api/strategies/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategyId: strategy.id,
          title: strategy.title,
          description: strategy.description,
          category: strategy.category,
          isActive: newIsActive,
        }),
      })

      if (response.ok) {
        const newActive = new Set(activeStrategies)
        if (newIsActive) {
          newActive.add(strategy.id)
        } else {
          newActive.delete(strategy.id)
        }
        setActiveStrategies(newActive)
      }
    } catch (error) {
      console.error('Erreur toggle stratégie:', error)
    }
  }

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      morning: '🌅',
      afternoon: '☀️',
      evening: '🌙',
      stress: '⚡',
      emotional: '💭',
      social: '👥',
    }
    return icons[category] || '🎯'
  }

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      morning: 'Matin',
      afternoon: 'Après-midi',
      evening: 'Soir',
      stress: 'Gestion du stress',
      emotional: 'Émotions',
      social: 'Social',
    }
    return labels[category] || category
  }

  const getDifficultyLabel = (difficulty: string) => {
    const labels: { [key: string]: string } = {
      easy: 'Facile',
      medium: 'Moyen',
      hard: 'Difficile',
    }
    return labels[difficulty] || difficulty
  }

  const getDifficultyColor = (difficulty: string) => {
    const colors: { [key: string]: string } = {
      easy: '#4caf50',
      medium: '#ff9800',
      hard: '#f44336',
    }
    return colors[difficulty] || '#999'
  }

  const filteredStrategies =
    filter === 'all'
      ? strategies
      : filter === 'active'
      ? strategies.filter(s => activeStrategies.has(s.id))
      : strategies.filter(s => s.category === filter)

  if (loading) {
    return (
      <div>
        <Navigation />
        <div className={styles.container}>
          <div className={styles.loading}>Génération de vos stratégies personnalisées...</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Navigation />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>🎯 Mes Stratégies Personnalisées</h1>
          <p className={styles.subtitle}>
            Active les stratégies qui correspondent à tes besoins. Elles apparaîtront sur ton dashboard
            pour te guider au quotidien.
          </p>
        </div>

        {/* Filtres */}
        <div className={styles.filters}>
          <button
            className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
            onClick={() => setFilter('all')}
          >
            Toutes
          </button>
          <button
            className={`${styles.filterBtn} ${filter === 'active' ? styles.active : ''}`}
            onClick={() => setFilter('active')}
          >
            Activées ({activeStrategies.size})
          </button>
          <button
            className={`${styles.filterBtn} ${filter === 'morning' ? styles.active : ''}`}
            onClick={() => setFilter('morning')}
          >
            🌅 Matin
          </button>
          <button
            className={`${styles.filterBtn} ${filter === 'evening' ? styles.active : ''}`}
            onClick={() => setFilter('evening')}
          >
            🌙 Soir
          </button>
          <button
            className={`${styles.filterBtn} ${filter === 'stress' ? styles.active : ''}`}
            onClick={() => setFilter('stress')}
          >
            ⚡ Stress
          </button>
        </div>

        {/* Liste des stratégies */}
        <div className={styles.strategiesGrid}>
          {filteredStrategies.map(strategy => (
            <div
              key={strategy.id}
              className={`${styles.strategyCard} ${
                activeStrategies.has(strategy.id) ? styles.cardActive : ''
              }`}
            >
              <div className={styles.cardHeader}>
                <div className={styles.categoryBadge}>
                  <span className={styles.categoryIcon}>{getCategoryIcon(strategy.category)}</span>
                  <span className={styles.categoryLabel}>
                    {getCategoryLabel(strategy.category)}
                  </span>
                </div>
                <div
                  className={styles.difficultyBadge}
                  style={{ borderColor: getDifficultyColor(strategy.difficulty) }}
                >
                  {getDifficultyLabel(strategy.difficulty)}
                </div>
              </div>

              <h3 className={styles.cardTitle}>{strategy.title}</h3>
              <p className={styles.cardDescription}>{strategy.description}</p>

              <div className={styles.cardMeta}>
                <div className={styles.trigger}>
                  <strong>Déclencheur :</strong> {strategy.trigger}
                </div>
              </div>

              <div className={styles.alternatives}>
                <strong>Alternatives :</strong>
                <ul>
                  {strategy.alternatives.map((alt, idx) => (
                    <li key={idx}>{alt}</li>
                  ))}
                </ul>
              </div>

              <button
                className={`${styles.toggleBtn} ${
                  activeStrategies.has(strategy.id) ? styles.btnActive : ''
                }`}
                onClick={() => toggleStrategy(strategy)}
              >
                {activeStrategies.has(strategy.id) ? '✓ Activée' : 'Activer'}
              </button>
            </div>
          ))}
        </div>

        {filteredStrategies.length === 0 && (
          <div className={styles.empty}>
            <p>Aucune stratégie trouvée pour ce filtre.</p>
          </div>
        )}

        {strategies.length === 0 && (
          <div className={styles.empty}>
            <p>Continue à enregistrer des entrées pour que l'IA puisse générer des stratégies personnalisées.</p>
          </div>
        )}
      </div>
    </div>
  )
}
