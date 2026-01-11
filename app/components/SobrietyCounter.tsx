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

    // Rafraîchir les données toutes les 10 secondes
    const refreshInterval = setInterval(() => {
      fetchData()
    }, 10000)

    // Rafraîchir quand la page redevient visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('🔄 Page visible, rafraîchissement du compteur...')
        fetchData()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(refreshInterval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
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
      const response = await fetch('/api/sobriety/stats')
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

  // Calculs santé (basés sur des données médicales approximatives)
  const healthBenefits = {
    // Après 20 minutes : rythme cardiaque normal
    heartRate: timeElapsed.totalMinutes >= 20,
    // Après 12 heures : niveau CO2 normal
    co2Normal: timeElapsed.totalMinutes >= 720,
    // Après 1 jour : risque crise cardiaque diminue
    heartAttackRisk: timeElapsed.days >= 1,
    // Après 2 jours : goût et odorat s'améliorent
    sensesImprove: timeElapsed.days >= 2,
    // Après 3 jours : respiration s'améliore
    breathingImproves: timeElapsed.days >= 3,
    // Après 1 semaine : énergie augmente
    energyBoost: timeElapsed.days >= 7,
    // Après 1 mois : fonction pulmonaire améliore de 30%
    lungFunction: timeElapsed.days >= 30,
  }

  const lungRecovery = Math.min(100, (timeElapsed.days / 365) * 100) // Récupération complète en 1 an

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

        {/* Santé récupérée */}
        <div className={styles.healthCard}>
          <h3>🫁 Santé Récupérée</h3>

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
            {healthBenefits.heartRate && (
              <div className={styles.benefit}>✅ Rythme cardiaque normalisé</div>
            )}
            {healthBenefits.co2Normal && (
              <div className={styles.benefit}>✅ Niveau de CO2 normal</div>
            )}
            {healthBenefits.heartAttackRisk && (
              <div className={styles.benefit}>✅ Risque cardiaque réduit</div>
            )}
            {healthBenefits.sensesImprove && (
              <div className={styles.benefit}>✅ Goût et odorat améliorés</div>
            )}
            {healthBenefits.breathingImproves && (
              <div className={styles.benefit}>✅ Respiration améliorée</div>
            )}
            {healthBenefits.energyBoost && (
              <div className={styles.benefit}>✅ Énergie augmentée</div>
            )}
            {healthBenefits.lungFunction && (
              <div className={styles.benefit}>✅ Fonction pulmonaire +30%</div>
            )}
          </div>

          {/* Prochains paliers */}
          <div className={styles.nextMilestones}>
            <h4>🎯 Prochains Paliers</h4>
            {!healthBenefits.heartRate && (
              <div className={styles.milestone}>Dans {20 - timeElapsed.totalMinutes} min : Rythme cardiaque normal</div>
            )}
            {!healthBenefits.co2Normal && timeElapsed.totalMinutes < 720 && (
              <div className={styles.milestone}>Dans {Math.floor((720 - timeElapsed.totalMinutes) / 60)}h : CO2 normal</div>
            )}
            {!healthBenefits.heartAttackRisk && (
              <div className={styles.milestone}>Dans {1 - timeElapsed.days} jour : Risque cardiaque réduit</div>
            )}
            {!healthBenefits.sensesImprove && (
              <div className={styles.milestone}>Dans {2 - timeElapsed.days} jours : Goût/odorat améliorés</div>
            )}
            {!healthBenefits.breathingImproves && (
              <div className={styles.milestone}>Dans {3 - timeElapsed.days} jours : Respiration améliorée</div>
            )}
            {!healthBenefits.energyBoost && (
              <div className={styles.milestone}>Dans {7 - timeElapsed.days} jours : Boost d'énergie</div>
            )}
            {!healthBenefits.lungFunction && (
              <div className={styles.milestone}>Dans {30 - timeElapsed.days} jours : Poumons +30%</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
