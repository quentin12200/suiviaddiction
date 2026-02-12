'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '../components/Navigation'
import styles from './page.module.css'

export default function JournalPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    mood: '',
    energy: 5,
    thought: '',
    gratitude: '',
    challenge: '',
    victory: '',
    tomorrow: '',
    context: '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/journal/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          timestamp: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        alert('✅ Entrée de journal enregistrée !')
        router.push('/')
      } else {
        alert('❌ Erreur lors de l\'enregistrement')
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('❌ Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Navigation />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>📝 Journal de Pensées</h1>
          <p className={styles.subtitle}>
            Prends un moment pour te reconnecter à toi-même. Écris librement.
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* État émotionnel */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>🎭 Comment te sens-tu maintenant ?</h2>
            <div className={styles.moodGrid}>
              {[
                { emoji: '😊', label: 'Serein', value: 'serein' },
                { emoji: '😌', label: 'Calme', value: 'calme' },
                { emoji: '😐', label: 'Neutre', value: 'neutre' },
                { emoji: '😰', label: 'Anxieux', value: 'anxieux' },
                { emoji: '😤', label: 'Frustré', value: 'frustre' },
                { emoji: '😔', label: 'Triste', value: 'triste' },
                { emoji: '🔥', label: 'Motivé', value: 'motive' },
                { emoji: '😴', label: 'Fatigué', value: 'fatigue' },
              ].map(({ emoji, label, value }) => (
                <button
                  key={value}
                  type="button"
                  className={`${styles.moodButton} ${formData.mood === value ? styles.selected : ''}`}
                  onClick={() => setFormData({ ...formData, mood: value })}
                >
                  <span className={styles.emoji}>{emoji}</span>
                  <span className={styles.label}>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Niveau d'énergie */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>⚡ Niveau d'énergie</h2>
            <div className={styles.energySlider}>
              <label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.energy}
                  onChange={(e) => setFormData({ ...formData, energy: parseInt(e.target.value) })}
                  className={styles.slider}
                />
                <div className={styles.energyValue}>
                  {formData.energy}/10
                  {formData.energy <= 3 && ' - Épuisé'}
                  {formData.energy >= 4 && formData.energy <= 6 && ' - Moyen'}
                  {formData.energy >= 7 && ' - Plein d\'énergie'}
                </div>
              </label>
            </div>
          </div>

          {/* Pensée du moment */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>💭 Qu'est-ce qui occupe ton esprit ?</h2>
            <p className={styles.hint}>
              Sans filtre. Écris ce qui te passe par la tête. Personne ne lira ça.
            </p>
            <textarea
              value={formData.thought}
              onChange={(e) => setFormData({ ...formData, thought: e.target.value })}
              className={styles.textarea}
              rows={6}
              placeholder="Ex: Je me sens bizarre aujourd'hui. J'ai envie de faire quelque chose de productif mais je procrastine..."
            />
          </div>

          {/* Contexte */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>📍 Où es-tu / Que fais-tu ?</h2>
            <input
              type="text"
              value={formData.context}
              onChange={(e) => setFormData({ ...formData, context: e.target.value })}
              className={styles.input}
              placeholder="Ex: Chez moi, au bureau, en balade, au café..."
            />
          </div>

          {/* Gratitude */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>🙏 Une chose pour laquelle tu es reconnaissant aujourd'hui</h2>
            <p className={styles.hint}>
              Même quelque chose de simple. Cet exercice recâble ton cerveau vers le positif.
            </p>
            <textarea
              value={formData.gratitude}
              onChange={(e) => setFormData({ ...formData, gratitude: e.target.value })}
              className={styles.textarea}
              rows={3}
              placeholder="Ex: Le soleil ce matin, mon patch de nicotine qui m'aide, avoir mangé sainement..."
            />
          </div>

          {/* Défi */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>🏔️ Quel est ton plus gros défi en ce moment ?</h2>
            <textarea
              value={formData.challenge}
              onChange={(e) => setFormData({ ...formData, challenge: e.target.value })}
              className={styles.textarea}
              rows={3}
              placeholder="Ex: Résister à l'envie de fumer, gérer mon hyperactivité, rester concentré..."
            />
          </div>

          {/* Victoire */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>🏆 Une victoire d'aujourd'hui (même petite)</h2>
            <p className={styles.hint}>
              Chaque victoire compte. N'attends pas d'avoir sauvé le monde.
            </p>
            <textarea
              value={formData.victory}
              onChange={(e) => setFormData({ ...formData, victory: e.target.value })}
              className={styles.textarea}
              rows={3}
              placeholder="Ex: J'ai pas fumé aujourd'hui, j'ai fait du sport, j'ai terminé une tâche..."
            />
          </div>

          {/* Intention pour demain */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>🎯 UNE intention claire pour demain</h2>
            <p className={styles.hint}>
              Pas 10 objectifs. UN seul. Précis. Réalisable.
            </p>
            <input
              type="text"
              value={formData.tomorrow}
              onChange={(e) => setFormData({ ...formData, tomorrow: e.target.value })}
              className={styles.input}
              placeholder="Ex: Faire 30 min de sport le matin, ne pas consulter mon tél avant 9h..."
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? 'Enregistrement...' : '💾 Enregistrer mon journal'}
          </button>
        </form>

        {/* Rappel */}
        <div className={styles.reminderCard}>
          <h3>💡 Pourquoi tenir un journal ?</h3>
          <ul>
            <li><strong>Clarté mentale :</strong> Externaliser tes pensées libère de l'espace mental</li>
            <li><strong>Suivi des progrès :</strong> Tu verras ton évolution sur le long terme</li>
            <li><strong>Identification des patterns :</strong> Repère ce qui déclenche tes envies</li>
            <li><strong>Ancrage :</strong> Ramène ton attention sur le présent</li>
            <li><strong>Gratitude :</strong> Recâble ton cerveau vers le positif</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
