'use client'

import { Task, taskCategories } from '../../data/taskTypes'
import styles from '../taches.module.css'

interface TaskFormProps {
  formData: Partial<Task>
  setFormData: (data: Partial<Task>) => void
  onSubmit: (e: React.FormEvent) => void
  editingId: string | null
}

export function TaskForm({ formData, setFormData, onSubmit, editingId }: TaskFormProps) {
  return (
    <form onSubmit={onSubmit} className={styles.form}>
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Type *</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
            className={styles.select}
            required
          >
            <option value="ponctuelle">🎯 Ponctuelle (une fois)</option>
            <option value="quotidienne">🔄 Quotidienne (récurrente)</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Priorité *</label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
            className={styles.select}
            required
          >
            <option value="basse">🔵 Basse</option>
            <option value="normale">🟢 Normale</option>
            <option value="haute">🟡 Haute</option>
            <option value="urgente">🔴 Urgente</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Catégorie</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className={styles.select}
          >
            {taskCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Titre *</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className={styles.input}
          placeholder="Ex: Préparer formation CGT jeudi"
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
  )
}
