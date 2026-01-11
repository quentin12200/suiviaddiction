'use client'

import { useEffect, useState } from 'react'
import styles from './SobrietyCounter.module.css'

interface CounterData {
  lastJointDate: string | null
  lastJointTime: string | null
  totalJoints: number
}

export default function SobrietyCounter() {
  const [data, setData] = useState<CounterData | null>(null)
  const [timeElapsed, setTimeElapsed] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalMinutes: 0,
  })

  // Charger les données
  useEffect(() => {
    fetchData()

    // Rafraîchir les données toutes les 5 secondes
    const refreshInterval = setInterval(fetchData, 5000)

    // Rafraîchir quand la page redevient visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchData()
      }
    }

    // Rafraîchir quand on focus la fenêtre
    const handleFocus = () => {
      fetchData()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      clearInterval(refreshInterval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  // Mettre à jour le compteur chaque seconde
  useEffect(() => {
    if (!data?.lastJointDate || !data?.lastJointTime) {
      return
    }

    const updateCounter = () => {
      const lastJoint = new Date(`${data.lastJointDate}T${data.lastJointTime}:00`)
      const now = new Date()
      const diff = now.getTime() - lastJoint.getTime()

      const totalMinutes = Math.floor(diff / (1000 * 60))
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeElapsed({ days, hours, minutes, seconds, totalMinutes })
    }

    updateCounter()
    const interval = setInterval(updateCounter, 1000)
    return () => clearInterval(interval)
  }, [data])

  const fetchData = async () => {
    try {
      // Cache-busting : timestamp + random pour éviter le cache
      const cacheBuster = `t=${Date.now()}&r=${Math.random()}`

      const response = await fetch(`/api/sobriety/stats?${cacheBuster}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })

      const result = await response.json()

      if (result.success) {
        setData(result.data)
      }
    } catch (error) {
      console.error('Erreur chargement stats sobriété:', error)
    }
  }

  if (!data || !data.lastJointDate || !data.lastJointTime) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h2 className={styles.title}>⏱️ Compteur de Sobriété</h2>
          <p className={styles.noData}>Aucun joint enregistré. Commence ton parcours !</p>
        </div>
      </div>
    )
  }

  // COMBAT 1 : NICOTINE (déjà géré par patch 14mg)
  // Tu rajoutes de la nicotine inutilement avec le tabac du joint
  const nicotineBenefits = {
    // Après 20 min : rythme cardiaque normal (nicotine)
    heartRate: timeElapsed.totalMinutes >= 20,
    // Après 2h : pression artérielle normale
    bloodPressure: timeElapsed.totalMinutes >= 120,
    // Après 12h : niveau CO2 normal (combustion)
    co2Normal: timeElapsed.totalMinutes >= 720,
  }

  // COMBAT 2 : CANNABIS/THC (le VRAI combat psychologique)
  const cannabisBenefits = {
    // Après 1h : clarté mentale revient
    mentalClarity: timeElapsed.totalMinutes >= 60,
    // Après 24h : THC commence à quitter le système
    thcElimination: timeElapsed.days >= 1,
    // Après 2-3 jours : mémoire court terme s'améliore
    memoryImprovement: timeElapsed.days >= 2,
    // Après 1 semaine : sommeil REM se normalise
    sleepQuality: timeElapsed.days >= 7,
    // Après 2 semaines : motivation naturelle revient
    motivationBoost: timeElapsed.days >= 14,
    // Après 1 mois : récepteurs cannabinoïdes se régénèrent
    receptorsHealing: timeElapsed.days >= 30,
  }

  // COMBAT 3 : COMBUSTION (commun tabac + cannabis)
  const combustionBenefits = {
    // Après 2 jours : goût et odorat s'améliorent
    sensesImprove: timeElapsed.days >= 2,
    // Après 3 jours : respiration s'améliore
    breathingImproves: timeElapsed.days >= 3,
    // Après 1 semaine : toux diminue
    coughReduction: timeElapsed.days >= 7,
    // Après 1 mois : fonction pulmonaire +30%
    lungFunction: timeElapsed.days >= 30,
  }

  const lungRecovery = Math.min(100, (timeElapsed.days / 365) * 100) // Récupération complète en 1 an
  const thcDetox = Math.min(100, (timeElapsed.days / 30) * 100) // Récepteurs CB1 en 30 jours

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>⏱️ Temps Sans Fumer</h2>

        {/* Compteur principal */}
        <div className={styles.mainCounter}>
          {timeElapsed.days > 0 && (
            <div className={styles.timeUnit}>
              <div className={styles.number}>{timeElapsed.days}</div>
              <div className={styles.label}>jour{timeElapsed.days > 1 ? 's' : ''}</div>
            </div>
          )}
          <div className={styles.timeUnit}>
            <div className={styles.number}>{timeElapsed.hours}</div>
            <div className={styles.label}>heure{timeElapsed.hours > 1 ? 's' : ''}</div>
          </div>
          <div className={styles.timeUnit}>
            <div className={styles.number}>{timeElapsed.minutes}</div>
            <div className={styles.label}>min</div>
          </div>
          <div className={styles.timeUnit}>
            <div className={styles.number}>{timeElapsed.seconds}</div>
            <div className={styles.label}>sec</div>
          </div>
        </div>

        <div className={styles.lastJoint}>
          Dernier joint : {new Date(data.lastJointDate + 'T' + data.lastJointTime).toLocaleString('fr-FR')}
        </div>

        {/* ALERTE PATCH */}
        <div className={styles.warningCard}>
          <h3>⚠️ Rappel Important</h3>
          <p className={styles.warningText}>
            Tu portes un patch <strong>14mg de nicotine</strong>. Quand tu fumes un joint avec du tabac,
            tu RAJOUTES de la nicotine alors que ton corps en a déjà assez.
            <br/><br/>
            <strong>Résultat :</strong> Surdosage = anxiété, palpitations, nausées.
            <br/>
            <strong>Solution :</strong> Ton vrai combat c'est le THC, pas la nicotine. Passe aux joints SANS tabac.
          </p>
        </div>

        {/* COMBAT 1 : Nicotine (déjà géré par patch) */}
        <div className={styles.healthCard}>
          <h3>💊 Combat Nicotine (Patch 14mg)</h3>
          <p className={styles.subtitle}>Tu as déjà ce qu'il faut avec le patch. Le tabac du joint est INUTILE.</p>

          <div className={styles.benefits}>
            {nicotineBenefits.heartRate && (
              <div className={styles.benefit}>✅ Rythme cardiaque normalisé (sans surdosage)</div>
            )}
            {nicotineBenefits.bloodPressure && (
              <div className={styles.benefit}>✅ Pression artérielle stable</div>
            )}
            {nicotineBenefits.co2Normal && (
              <div className={styles.benefit}>✅ Niveau de CO2 normal</div>
            )}
          </div>

          {!nicotineBenefits.heartRate && timeElapsed.totalMinutes < 20 && (
            <div className={styles.nextMilestone}>
              Dans {20 - timeElapsed.totalMinutes} min : Rythme cardiaque normal
            </div>
          )}
        </div>

        {/* COMBAT 2 : Cannabis/THC (le VRAI combat) */}
        <div className={styles.healthCard}>
          <h3>🧠 Combat Cannabis/THC (Ton VRAI Défi)</h3>
          <p className={styles.subtitle}>C'est ça que tu combats vraiment. La défonce, pas la nicotine.</p>

          <div className={styles.lungProgress}>
            <div className={styles.progressLabel}>
              Régénération récepteurs CB1 : {thcDetox.toFixed(0)}%
            </div>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${thcDetox}%` }}
              />
            </div>
          </div>

          <div className={styles.benefits}>
            {cannabisBenefits.mentalClarity && (
              <div className={styles.benefit}>✅ Clarté mentale revenue</div>
            )}
            {cannabisBenefits.thcElimination && (
              <div className={styles.benefit}>✅ THC quitte le système</div>
            )}
            {cannabisBenefits.memoryImprovement && (
              <div className={styles.benefit}>✅ Mémoire court terme améliorée</div>
            )}
            {cannabisBenefits.sleepQuality && (
              <div className={styles.benefit}>✅ Sommeil REM normalisé</div>
            )}
            {cannabisBenefits.motivationBoost && (
              <div className={styles.benefit}>✅ Motivation naturelle revenue</div>
            )}
            {cannabisBenefits.receptorsHealing && (
              <div className={styles.benefit}>✅ Récepteurs cannabinoïdes régénérés</div>
            )}
          </div>

          <div className={styles.nextMilestones}>
            <h4>🎯 Prochains Paliers THC</h4>
            {!cannabisBenefits.mentalClarity && timeElapsed.totalMinutes < 60 && (
              <div className={styles.milestone}>Dans {60 - timeElapsed.totalMinutes} min : Clarté mentale</div>
            )}
            {!cannabisBenefits.thcElimination && timeElapsed.days < 1 && (
              <div className={styles.milestone}>Dans {1 - timeElapsed.days} jour : THC éliminé</div>
            )}
            {!cannabisBenefits.memoryImprovement && timeElapsed.days < 2 && (
              <div className={styles.milestone}>Dans {2 - timeElapsed.days} jours : Mémoire améliorée</div>
            )}
            {!cannabisBenefits.sleepQuality && timeElapsed.days < 7 && (
              <div className={styles.milestone}>Dans {7 - timeElapsed.days} jours : Sommeil normalisé</div>
            )}
            {!cannabisBenefits.motivationBoost && timeElapsed.days < 14 && (
              <div className={styles.milestone}>Dans {14 - timeElapsed.days} jours : Motivation revenue</div>
            )}
            {!cannabisBenefits.receptorsHealing && timeElapsed.days < 30 && (
              <div className={styles.milestone}>Dans {30 - timeElapsed.days} jours : Récepteurs guéris</div>
            )}
          </div>
        </div>

        {/* COMBAT 3 : Combustion (commun aux deux) */}
        <div className={styles.healthCard}>
          <h3>🫁 Combat Combustion (Fumée)</h3>
          <p className={styles.subtitle}>Tabac + Cannabis = même combat contre la fumée.</p>

          <div className={styles.lungProgress}>
            <div className={styles.progressLabel}>
              Fonction pulmonaire : {lungRecovery.toFixed(0)}%
            </div>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${lungRecovery}%` }}
              />
            </div>
          </div>

          <div className={styles.benefits}>
            {combustionBenefits.sensesImprove && (
              <div className={styles.benefit}>✅ Goût et odorat améliorés</div>
            )}
            {combustionBenefits.breathingImproves && (
              <div className={styles.benefit}>✅ Respiration améliorée</div>
            )}
            {combustionBenefits.coughReduction && (
              <div className={styles.benefit}>✅ Toux réduite</div>
            )}
            {combustionBenefits.lungFunction && (
              <div className={styles.benefit}>✅ Fonction pulmonaire +30%</div>
            )}
          </div>

          <div className={styles.nextMilestones}>
            <h4>🎯 Prochains Paliers Poumons</h4>
            {!combustionBenefits.sensesImprove && timeElapsed.days < 2 && (
              <div className={styles.milestone}>Dans {2 - timeElapsed.days} jours : Goût/odorat</div>
            )}
            {!combustionBenefits.breathingImproves && timeElapsed.days < 3 && (
              <div className={styles.milestone}>Dans {3 - timeElapsed.days} jours : Respiration</div>
            )}
            {!combustionBenefits.coughReduction && timeElapsed.days < 7 && (
              <div className={styles.milestone}>Dans {7 - timeElapsed.days} jours : Toux réduite</div>
            )}
            {!combustionBenefits.lungFunction && timeElapsed.days < 30 && (
              <div className={styles.milestone}>Dans {30 - timeElapsed.days} jours : Poumons +30%</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
