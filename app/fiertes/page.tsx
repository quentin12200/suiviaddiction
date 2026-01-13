'use client'

import { useState, useEffect } from 'react'
import Navigation from '../components/Navigation'
import styles from './fiertes.module.css'

interface Pride {
  id: string
  category: string
  title: string
  description?: string
  emoji?: string
}

const defaultPrides: Pride[] = [
  {
    id: '1',
    category: 'Famille',
    title: 'Papa de Louise (4 ans) et marié à Sophie',
    emoji: '👨‍👩‍👧'
  },
  {
    id: '2',
    category: 'CGT - Luttes',
    title: '213 jours de grève chez McDo',
    description: 'Conflit historique où la CGT était minoritaire - j\'ai tout appris',
    emoji: '💪'
  },
  {
    id: '3',
    category: 'CGT - Parcours',
    title: '10 ans à la CGT (mars 2026)',
    description: 'Passé par tous les mandats et responsabilités',
    emoji: '🚩'
  },
  {
    id: '4',
    category: 'CGT - Compétences',
    title: 'Formateur CGT',
    emoji: '🎓'
  },
  {
    id: '5',
    category: 'CGT - Responsabilités',
    title: 'Conseiller confédéral au siège (5 ans en mars 2026)',
    emoji: '👔'
  },
  {
    id: '6',
    category: 'CGT - Responsabilités',
    title: 'Membre du bureau de l\'UD',
    emoji: '📊'
  },
  {
    id: '7',
    category: 'CGT - Impact',
    title: 'Centaines de salariés défendus depuis 9 ans',
    emoji: '🛡️'
  },
  {
    id: '8',
    category: 'CGT - Compétences',
    title: 'Reconnu pour mes compétences en syndicalisation',
    emoji: '🔥'
  },
  {
    id: '9',
    category: 'Personnel - Courage',
    title: 'Coupé définitivement les liens avec mon père toxique',
    emoji: '✂️'
  },
  {
    id: '10',
    category: 'Personnel - Relations',
    title: 'Renoué avec mon frère',
    emoji: '🤝'
  },
  {
    id: '11',
    category: 'Santé',
    title: 'Arrêté l\'alcool (ou quasi)',
    emoji: '🍺'
  },
  {
    id: '12',
    category: 'Personnel - Qualités',
    title: 'Ma curiosité : "Quasi tout a une solution"',
    emoji: '💭'
  },
  {
    id: '13',
    category: 'Personnel - Qualités',
    title: 'Fier de mon "train" - les personnes qui sont montées et descendues',
    description: 'Les bonnes personnes dans ma vie',
    emoji: '🚂'
  },
  {
    id: '14',
    category: 'Personnel - Travail sur soi',
    title: 'Combattre ma colère',
    emoji: '⚔️'
  },
  {
    id: '15',
    category: 'Personnel - Qualités',
    title: 'Ma résilience',
    emoji: '🌟'
  },
  {
    id: '16',
    category: 'Personnel - Espérance',
    title: 'Continuer à croire que je peux être mieux définitivement',
    emoji: '🌅'
  }
]

export default function FiertesPage() {
  const [prides, setPrides] = useState<Pride[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<Pride>>({
    category: 'Personnel',
    title: '',
    description: '',
    emoji: ''
  })

  // Charger depuis localStorage
  useEffect(() => {
    const saved = localStorage.getItem('userPrides')
    if (saved) {
      setPrides(JSON.parse(saved))
    } else {
      // Si rien en localStorage, utiliser les fiertés par défaut
      setPrides(defaultPrides)
      localStorage.setItem('userPrides', JSON.stringify(defaultPrides))
    }
  }, [])

  // Sauvegarder dans localStorage
  const savePrides = (newPrides: Pride[]) => {
    setPrides(newPrides)
    localStorage.setItem('userPrides', JSON.stringify(newPrides))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title) return

    if (editingId) {
      // Modifier une fierté existante
      const updated = prides.map(p =>
        p.id === editingId
          ? { ...p, ...formData } as Pride
          : p
      )
      savePrides(updated)
      setEditingId(null)
    } else {
      // Ajouter une nouvelle fierté
      const newPride: Pride = {
        id: Date.now().toString(),
        category: formData.category || 'Personnel',
        title: formData.title || '',
        description: formData.description,
        emoji: formData.emoji
      }
      savePrides([...prides, newPride])
    }

    // Reset form
    setFormData({
      category: 'Personnel',
      title: '',
      description: '',
      emoji: ''
    })
    setIsEditing(false)
  }

  const handleEdit = (pride: Pride) => {
    setFormData(pride)
    setEditingId(pride.id)
    setIsEditing(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette fierté ?')) {
      savePrides(prides.filter(p => p.id !== id))
    }
  }

  const cancelEdit = () => {
    setFormData({
      category: 'Personnel',
      title: '',
      description: '',
      emoji: ''
    })
    setEditingId(null)
    setIsEditing(false)
  }

  const categories = Array.from(new Set(prides.map(p => p.category)))

  return (
    <div>
      <Navigation />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>🏆 Mes Fiertés & Victoires</h1>
          <p className={styles.subtitle}>
            Rappelle-toi qui tu es quand le doute arrive
          </p>
        </div>

        {/* Bouton ajouter/annuler */}
        <div className={styles.addButtonContainer}>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className={styles.addButton}
            >
              ➕ Ajouter une fierté
            </button>
          ) : (
            <button
              onClick={cancelEdit}
              className={styles.cancelButton}
            >
              ✕ Annuler
            </button>
          )}
        </div>

        {/* Formulaire d'ajout/édition */}
        {isEditing && (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Catégorie *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className={styles.select}
                  required
                >
                  <option value="Famille">Famille</option>
                  <option value="CGT - Luttes">CGT - Luttes</option>
                  <option value="CGT - Parcours">CGT - Parcours</option>
                  <option value="CGT - Compétences">CGT - Compétences</option>
                  <option value="CGT - Responsabilités">CGT - Responsabilités</option>
                  <option value="CGT - Impact">CGT - Impact</option>
                  <option value="Personnel - Courage">Personnel - Courage</option>
                  <option value="Personnel - Relations">Personnel - Relations</option>
                  <option value="Personnel - Qualités">Personnel - Qualités</option>
                  <option value="Personnel - Travail sur soi">Personnel - Travail sur soi</option>
                  <option value="Personnel - Espérance">Personnel - Espérance</option>
                  <option value="Santé">Santé</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Emoji (optionnel)</label>
                <input
                  type="text"
                  value={formData.emoji}
                  onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                  className={styles.input}
                  placeholder="Ex: 🎉"
                  maxLength={2}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Titre *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={styles.input}
                placeholder="Ex: Formateur CGT"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Description (optionnelle)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={styles.textarea}
                placeholder="Détails supplémentaires..."
                rows={2}
              />
            </div>

            <button type="submit" className={styles.submitButton}>
              {editingId ? '💾 Enregistrer' : '➕ Ajouter'}
            </button>
          </form>
        )}

        {/* Liste des fiertés par catégorie */}
        <div className={styles.pridesList}>
          {categories.map(category => {
            const categoryPrides = prides.filter(p => p.category === category)
            return (
              <div key={category} className={styles.categorySection}>
                <h2 className={styles.categoryTitle}>{category}</h2>
                <div className={styles.pridesGrid}>
                  {categoryPrides.map(pride => (
                    <div key={pride.id} className={styles.prideCard}>
                      <div className={styles.prideHeader}>
                        <span className={styles.prideEmoji}>{pride.emoji || '⭐'}</span>
                        <div className={styles.prideActions}>
                          <button
                            onClick={() => handleEdit(pride)}
                            className={styles.editButton}
                            title="Modifier"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(pride.id)}
                            className={styles.deleteButton}
                            title="Supprimer"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      <h3 className={styles.prideTitle}>{pride.title}</h3>
                      {pride.description && (
                        <p className={styles.prideDescription}>{pride.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
