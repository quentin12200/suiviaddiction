'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '../components/Navigation'
import StateInfoTooltip from '../components/StateInfoTooltip'
import { emotionalStates as emotionalStatesData, physicalStates as physicalStatesData } from '../data/stateDefinitions'
import styles from './new.module.css'

export default function NewEntryPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Pré-remplir avec la date et l'heure actuelles (HEURE LOCALE, PAS UTC !)
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const dateStr = `${year}-${month}-${day}`
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes()
  ).padStart(2, '0')}`

  const [formData, setFormData] = useState({
    date: dateStr,
    time: timeStr,
    hasSmoked: false,
    jointCount: 1,
    jointTime: timeStr,
    cravingLevel: 5,
    emotionalStates: [] as string[],
    physicalStates: [] as string[],
    context: '',
    trigger: '',
    alternativeAction: '',
    consciousDecision: false,
    comment: '',
    // Gestion Adrénaline (discret)
    adrenalineEvent: false,
    adrenalineType: '',
    adrenalineTrigger: '',
    adrenalineAlternative: '',
    adrenalineOutcome: '',
    // Gestion Isolement (discret)
    isolationEvent: false,
    isolationPlanned: false,
    isolationActivity: '',
    isolationReason: '',
    isolationOutcome: '',
  })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Joindre les sélections multiples avec des virgules
      const dataToSend = {
        ...formData,
        emotionalState: formData.emotionalStates.join(', '),
        physicalState: formData.physicalStates.join(', '),
      }

      const response = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/')
          router.refresh()
        }, 1500)
      } else {
        setError(data.error || 'Erreur lors de la création')
      }
    } catch (err) {
      setError('Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    let processedValue: any = value

    if (type === 'number' || type === 'range') {
      processedValue = parseInt(value, 10) || 0
    } else if (type === 'checkbox') {
      processedValue = checked
    }

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }))
  }

  const toggleMultipleChoice = (category: 'emotionalStates' | 'physicalStates', value: string) => {
    setFormData((prev) => {
      const current = prev[category]
      const isSelected = current.includes(value)

      return {
        ...prev,
        [category]: isSelected
          ? current.filter((v) => v !== value)
          : [...current, value],
      }
    })
  }

  const emotionalStates = [
    'Calme',
    'Anxieux',
    'Stressé',
    'Joyeux',
    'Triste',
    'En colère',
    'Ennui',
    'Fatigué',
    'Énergique',
    'Peur',
    'Culpabilité',
    'Déterminé',
  ]

  const physicalStates = [
    'Bien',
    'Fatigué',
    'Tendu',
    'Relaxé',
    'Douleur',
    'Énergique',
    'Excité',
    'Hypervigilant',
  ]

  const contexts = [
    'Maison',
    'Bureau',
    'Extérieur',
    'Union Locale CGT',
    'Seul',
    'En groupe',
    'Soirée',
    'Autre',
  ]

  const triggerCategories = {
    'Émotions': [
      'Stress intense',
      'Anxiété',
      'Ennui profond',
      'Tristesse / Déprime',
      'Colère / Frustration',
      'Solitude',
      'Euphorie / Excitation',
    ],
    'Contexte social': [
      'Pression des amis',
      'Fête / Soirée',
      'Voir d\'autres fumer',
      'Conversation difficile',
      'Conflit relationnel',
      'Isolement social',
    ],
    'Moments de la journée': [
      'Réveil',
      'Pause café',
      'Après le repas',
      'Fin de journée de travail',
      'Soirée à la maison',
      'Avant de dormir',
      'Weekend / Jour off',
    ],
    'État physique': [
      'Fatigue extrême',
      'Douleur physique',
      'Manque de sommeil',
      'Après effort physique',
      'Maladie / Mal-être',
    ],
    'Environnement': [
      'Chez moi (habitude)',
      'Lieu habituel de conso',
      'Disponibilité facile',
      'Objet déclencheur (briquet, etc)',
      'Odeur / Stimulus sensoriel',
    ],
    'Activités': [
      'Rien à faire',
      'Procrastination',
      'Avant tâche difficile',
      'Après effort mental',
      'Pause travail',
      'Activité routinière (conduite, etc)',
    ],
    'États mentaux': [
      'Pensées obsédantes',
      'Envie soudaine inexpliquée',
      'Rationalisation ("juste une fois")',
      'Test de volonté',
      'Nostalgie de la sensation',
    ],
    'Autre': [
      'Autre (préciser en commentaire)',
    ],
  }

  return (
    <div>
      <Navigation />
      <div className={styles.container}>
        <h1 className={styles.title}>Nouvelle entrée</h1>

        {success && (
          <div className={styles.successMessage}>
            Entrée enregistrée avec succès ! Redirection...
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Date et heure */}
          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label htmlFor="date" className={styles.label}>
                Date *
              </label>
              <input
                id="date"
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className={styles.input}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="time" className={styles.label}>
                Heure *
              </label>
              <input
                id="time"
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                className={styles.input}
                required
              />
            </div>
          </div>

          {/* Ai-je fumé ? */}
          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="hasSmoked"
                checked={formData.hasSmoked}
                onChange={handleChange}
                className={styles.checkbox}
              />
              <span>Ai-je fumé ?</span>
            </label>
          </div>

          {/* Si fumé */}
          {formData.hasSmoked && (
            <>
              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label htmlFor="jointCount" className={styles.label}>
                    Nombre de joints *
                  </label>
                  <input
                    id="jointCount"
                    type="number"
                    name="jointCount"
                    value={formData.jointCount}
                    onChange={handleChange}
                    className={styles.input}
                    min="0"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="jointTime" className={styles.label}>
                    Heure du joint
                  </label>
                  <input
                    id="jointTime"
                    type="time"
                    name="jointTime"
                    value={formData.jointTime}
                    onChange={handleChange}
                    className={styles.input}
                  />
                </div>
              </div>
            </>
          )}

          {/* Envie de fumer */}
          <div className={styles.formGroup}>
            <label htmlFor="cravingLevel" className={styles.label}>
              Envie de fumer (0-10) : {formData.cravingLevel}
            </label>
            <input
              id="cravingLevel"
              type="range"
              name="cravingLevel"
              value={formData.cravingLevel}
              onChange={handleChange}
              className={styles.slider}
              min="0"
              max="10"
            />
          </div>

          {/* États émotionnels - SÉLECTION MULTIPLE */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              États émotionnels (plusieurs choix possibles)
            </label>
            <div className={styles.checkboxGrid}>
              {emotionalStates.map((state) => (
                <label key={state} className={styles.checkboxItemLabel}>
                  <input
                    type="checkbox"
                    checked={formData.emotionalStates.includes(state)}
                    onChange={() => toggleMultipleChoice('emotionalStates', state)}
                    className={styles.checkboxItem}
                  />
                  <span>
                    {state}
                    {emotionalStatesData[state] && (
                      <StateInfoTooltip stateInfo={emotionalStatesData[state]} />
                    )}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* États physiques - SÉLECTION MULTIPLE */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              États physiques (plusieurs choix possibles)
            </label>
            <div className={styles.checkboxGrid}>
              {physicalStates.map((state) => (
                <label key={state} className={styles.checkboxItemLabel}>
                  <input
                    type="checkbox"
                    checked={formData.physicalStates.includes(state)}
                    onChange={() => toggleMultipleChoice('physicalStates', state)}
                    className={styles.checkboxItem}
                  />
                  <span>
                    {state}
                    {physicalStatesData[state] && (
                      <StateInfoTooltip stateInfo={physicalStatesData[state]} />
                    )}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Contexte */}
          <div className={styles.formGroup}>
            <label htmlFor="context" className={styles.label}>
              Où es-tu / Contexte ?
            </label>
            <select
              id="context"
              name="context"
              value={formData.context}
              onChange={handleChange}
              className={styles.select}
            >
              <option value="">-- Sélectionner --</option>
              {contexts.map((ctx) => (
                <option key={ctx} value={ctx}>
                  {ctx}
                </option>
              ))}
            </select>
          </div>

          {/* Déclencheur */}
          <div className={styles.formGroup}>
            <label htmlFor="trigger" className={styles.label}>
              Qu'est-ce qui a déclenché l'envie ? *
            </label>
            <select
              id="trigger"
              name="trigger"
              value={formData.trigger}
              onChange={handleChange}
              className={styles.select}
              required
            >
              <option value="">-- Identifier le déclencheur --</option>
              {Object.entries(triggerCategories).map(([category, triggers]) => (
                <optgroup key={category} label={category}>
                  {triggers.map((trigger) => (
                    <option key={trigger} value={trigger}>
                      {trigger}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <small style={{ color: '#666', fontSize: '13px' }}>
              💡 Identifier les déclencheurs aide à anticiper les moments à risque
            </small>
          </div>

          {/* Action alternative (si pas fumé) */}
          {!formData.hasSmoked && (
            <div className={styles.formGroup}>
              <label htmlFor="alternativeAction" className={styles.label}>
                Action alternative (si pas fumé)
              </label>
              <input
                id="alternativeAction"
                type="text"
                name="alternativeAction"
                value={formData.alternativeAction}
                onChange={handleChange}
                className={styles.input}
                placeholder="Ex: Marche, méditation, sport..."
              />
            </div>
          )}

          {/* Décision consciente */}
          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="consciousDecision"
                checked={formData.consciousDecision}
                onChange={handleChange}
                className={styles.checkbox}
              />
              <span>Décision consciente</span>
            </label>
          </div>

          {/* GESTION ADRÉNALINE (Section discrète) */}
          <div className={styles.formGroup} style={{ borderTop: '2px solid #e0e0e0', paddingTop: '24px', marginTop: '24px' }}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="adrenalineEvent"
                checked={formData.adrenalineEvent}
                onChange={handleChange}
                className={styles.checkbox}
              />
              <span>📊 Gestion de stimulation/tension</span>
            </label>
            <small style={{ color: '#666', fontSize: '13px', display: 'block', marginTop: '8px' }}>
              Optionnel : Pour tracker les moments où tu cherches de l'adrénaline ou à décharger une tension
            </small>
          </div>

          {/* Si tracking adrénaline activé */}
          {formData.adrenalineEvent && (
            <>
              {/* Type de gestion */}
              <div className={styles.formGroup}>
                <label htmlFor="adrenalineType" className={styles.label}>
                  Type de gestion *
                </label>
                <select
                  id="adrenalineType"
                  name="adrenalineType"
                  value={formData.adrenalineType}
                  onChange={handleChange}
                  className={styles.select}
                  required
                >
                  <option value="">-- Sélectionner --</option>
                  <option value="risque">🔴 Comportement à risque</option>
                  <option value="échappatoire">🟡 Échappatoire passive</option>
                  <option value="alternative">🟢 Alternative constructive</option>
                </select>
              </div>

              {/* Déclencheur */}
              <div className={styles.formGroup}>
                <label htmlFor="adrenalineTrigger" className={styles.label}>
                  Qu'est-ce que tu cherchais vraiment ? *
                </label>
                <select
                  id="adrenalineTrigger"
                  name="adrenalineTrigger"
                  value={formData.adrenalineTrigger}
                  onChange={handleChange}
                  className={styles.select}
                  required
                >
                  <option value="">-- Identifier le besoin --</option>
                  <option value="routine">Routine/Monotonie</option>
                  <option value="stimulation">Besoin de stimulation intense</option>
                  <option value="transgression">Envie de transgression/limite</option>
                  <option value="procrastination">Procrastination</option>
                  <option value="vide">Vide/Absence d'objectif</option>
                  <option value="solitude">Solitude émotionnelle</option>
                  <option value="stress">Stress/Pression à évacuer</option>
                </select>
              </div>

              {/* Alternative testée */}
              <div className={styles.formGroup}>
                <label htmlFor="adrenalineAlternative" className={styles.label}>
                  Alternative testée avant de craquer
                </label>
                <input
                  id="adrenalineAlternative"
                  type="text"
                  name="adrenalineAlternative"
                  value={formData.adrenalineAlternative}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Ex: Sport intense, douche froide, projet créatif..."
                />
              </div>

              {/* Résultat */}
              <div className={styles.formGroup}>
                <label htmlFor="adrenalineOutcome" className={styles.label}>
                  Résultat
                </label>
                <select
                  id="adrenalineOutcome"
                  name="adrenalineOutcome"
                  value={formData.adrenalineOutcome}
                  onChange={handleChange}
                  className={styles.select}
                >
                  <option value="">-- Sélectionner --</option>
                  <option value="réussi">✅ Envie partie</option>
                  <option value="réduit">🟡 Envie réduite</option>
                  <option value="échoué">❌ Envie toujours là</option>
                </select>
              </div>
            </>
          )}

          {/* GESTION ISOLEMENT (Section discrète) */}
          <div className={styles.formGroup} style={{ borderTop: '2px solid #e0e0e0', paddingTop: '24px', marginTop: '24px' }}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="isolationEvent"
                checked={formData.isolationEvent}
                onChange={handleChange}
                className={styles.checkbox}
              />
              <span>🏠 Moment d'isolement</span>
            </label>
            <small style={{ color: '#666', fontSize: '13px', display: 'block', marginTop: '8px' }}>
              Optionnel : Pour comprendre si ton temps seul est constructif ou destructif
            </small>
          </div>

          {/* Si tracking isolement activé */}
          {formData.isolationEvent && (
            <>
              {/* Avais-tu un plan ? */}
              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="isolationPlanned"
                    checked={formData.isolationPlanned}
                    onChange={handleChange}
                    className={styles.checkbox}
                  />
                  <span>Avais-tu un projet/activité prévu(e) ?</span>
                </label>
              </div>

              {/* Activité prévue/faite */}
              <div className={styles.formGroup}>
                <label htmlFor="isolationActivity" className={styles.label}>
                  Quelle activité ? {formData.isolationPlanned ? '(prévue/faite)' : '(as-tu fini par faire ?)'}
                </label>
                <input
                  id="isolationActivity"
                  type="text"
                  name="isolationActivity"
                  value={formData.isolationActivity}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Ex: Créer, sport, lire, projet perso, bricolage..."
                />
              </div>

              {/* Raison de l'isolement */}
              <div className={styles.formGroup}>
                <label htmlFor="isolationReason" className={styles.label}>
                  Pourquoi tu t'isoles ? *
                </label>
                <select
                  id="isolationReason"
                  name="isolationReason"
                  value={formData.isolationReason}
                  onChange={handleChange}
                  className={styles.select}
                  required
                >
                  <option value="">-- Sélectionner --</option>
                  <option value="choix">✅ Par choix (me ressourcer)</option>
                  <option value="fuite">⚠️ Pour fuir quelque chose</option>
                  <option value="ennui">💭 Ennui/Rien d'autre à faire</option>
                  <option value="fatigue">😴 Fatigue/Besoin de repos</option>
                  <option value="concentration">🎯 Besoin de concentration</option>
                </select>
              </div>

              {/* Résultat après coup */}
              <div className={styles.formGroup}>
                <label htmlFor="isolationOutcome" className={styles.label}>
                  Résultat (après coup)
                </label>
                <select
                  id="isolationOutcome"
                  name="isolationOutcome"
                  value={formData.isolationOutcome}
                  onChange={handleChange}
                  className={styles.select}
                >
                  <option value="">-- Sélectionner --</option>
                  <option value="rechargé">✅ Rechargé/Satisfait</option>
                  <option value="neutre">😐 Neutre</option>
                  <option value="addictions">❌ Tombé dans les addictions</option>
                  <option value="vide">💭 Toujours ce sentiment de vide</option>
                </select>
              </div>
            </>
          )}

          {/* Commentaire */}
          <div className={styles.formGroup}>
            <label htmlFor="comment" className={styles.label}>
              Commentaire libre
            </label>
            <textarea
              id="comment"
              name="comment"
              value={formData.comment}
              onChange={handleChange}
              className={styles.textarea}
              rows={4}
              placeholder="Vos pensées, observations..."
            />
          </div>

          {/* Erreur */}
          {error && <div className={styles.error}>{error}</div>}

          {/* Boutons */}
          <div className={styles.buttonRow}>
            <button
              type="button"
              onClick={() => router.push('/')}
              className={styles.cancelButton}
            >
              Annuler
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
