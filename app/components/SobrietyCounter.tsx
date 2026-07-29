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
    months: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalMinutes: 0,
    totalDays: 0,
  })
  const [isRefreshing, setIsRefreshing] = useState(false)

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
      const totalDays = Math.floor(diff / (1000 * 60 * 60 * 24))
      const months = Math.floor(totalDays / 30)
      const days = totalDays % 30
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeElapsed({ months, days, hours, minutes, seconds, totalMinutes, totalDays })
    }

    updateCounter()
    const interval = setInterval(updateCounter, 1000)
    return () => clearInterval(interval)
  }, [data])

  const handleManualRefresh = async () => {
    setIsRefreshing(true)
    await fetchData()
    // Attendre 500ms pour que l'animation soit visible
    setTimeout(() => setIsRefreshing(false), 500)
  }

  const fetchData = async () => {
    try {
      // Cache-busting : timestamp + random pour éviter le cache
      const cacheBuster = `t=${Date.now()}&r=${Math.random()}`

      console.log('🔄 Fetching sobriety stats...', cacheBuster)

      const response = await fetch(`/api/sobriety/stats?${cacheBuster}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })

      const result = await response.json()

      console.log('📥 Received sobriety stats:', {
        success: result.success,
        lastJointDate: result.data?.lastJointDate,
        lastJointTime: result.data?.lastJointTime,
        fullResponse: result
      })

      if (result.success) {
        setData(result.data)
        console.log('✅ Timer updated with:', result.data)
      }
    } catch (error) {
      console.error('Erreur chargement stats sobriété:', error)
    }
  }

  if (!data || !data.lastJointDate || !data.lastJointTime) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h2 className={styles.title}>⏱️ Compteur d&apos;Arrêt</h2>
          <p className={styles.noData}>Aucune entrée enregistrée. Commence ton parcours !</p>
        </div>
      </div>
    )
  }

  // Bénéfices cannabis/THC
  const cannabisBenefits = {
    mentalClarity: timeElapsed.totalMinutes >= 60,
    thcElimination: timeElapsed.totalDays >= 1,
    memoryImprovement: timeElapsed.totalDays >= 2,
    sleepQuality: timeElapsed.totalDays >= 7,
    motivationBoost: timeElapsed.totalDays >= 14,
    receptorsHealing: timeElapsed.totalDays >= 30,
  }

  // Bénéfices cigarette/combustion
  const combustionBenefits = {
    sensesImprove: timeElapsed.totalDays >= 2,
    breathingImproves: timeElapsed.totalDays >= 3,
    coughReduction: timeElapsed.totalDays >= 7,
    lungFunction: timeElapsed.totalDays >= 30,
  }

  const lungRecovery = Math.min(100, (timeElapsed.totalDays / 365) * 100)
  const thcDetox = Math.min(100, (timeElapsed.totalDays / 30) * 100)

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 className={styles.title} style={{ margin: 0 }}>🚭 Arrêt Tabac &amp; Cannabis</h2>
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            style={{
              background: isRefreshing ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: isRefreshing ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
            }}
          >
            <span style={{ display: 'inline-block', animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }}>🔄</span>
            {isRefreshing ? 'Actualisation...' : 'Actualiser'}
          </button>
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

        {/* Compteur principal */}
        <div className={styles.mainCounter}>
          {timeElapsed.months > 0 && (
            <div className={styles.timeUnit}>
              <div className={styles.number}>{timeElapsed.months}</div>
              <div className={styles.label}>mois</div>
            </div>
          )}
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
          Dernière cigarette : {new Date(data.lastJointDate + 'T' + data.lastJointTime).toLocaleString('fr-FR')}
        </div>

        {/* Bénéfices cannabis */}
        <div className={styles.healthCard}>
          <h3>🧠 Cannabis / THC</h3>

          <div className={styles.lungProgress}>
            <div className={styles.progressLabel}>Régénération récepteurs CB1 : {thcDetox.toFixed(0)}%</div>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${thcDetox}%` }} />
            </div>
          </div>

          <div className={styles.benefits}>
            {cannabisBenefits.mentalClarity && <div className={styles.benefit}>✅ Clarté mentale revenue</div>}
            {cannabisBenefits.thcElimination && <div className={styles.benefit}>✅ THC quitte le système</div>}
            {cannabisBenefits.memoryImprovement && <div className={styles.benefit}>✅ Mémoire court terme améliorée</div>}
            {cannabisBenefits.sleepQuality && <div className={styles.benefit}>✅ Sommeil REM normalisé</div>}
            {cannabisBenefits.motivationBoost && <div className={styles.benefit}>✅ Motivation naturelle revenue</div>}
            {cannabisBenefits.receptorsHealing && <div className={styles.benefit}>✅ Récepteurs cannabinoïdes régénérés</div>}
          </div>

          {(!cannabisBenefits.receptorsHealing) && (
            <div className={styles.nextMilestones}>
              <h4>🎯 Prochains paliers</h4>
              {!cannabisBenefits.mentalClarity && timeElapsed.totalMinutes < 60 && <div className={styles.milestone}>Dans {60 - timeElapsed.totalMinutes} min : Clarté mentale</div>}
              {!cannabisBenefits.thcElimination && timeElapsed.totalDays < 1 && <div className={styles.milestone}>Dans 1 jour : THC éliminé</div>}
              {!cannabisBenefits.memoryImprovement && timeElapsed.totalDays < 2 && <div className={styles.milestone}>Dans {2 - timeElapsed.totalDays} jour(s) : Mémoire améliorée</div>}
              {!cannabisBenefits.sleepQuality && timeElapsed.totalDays < 7 && <div className={styles.milestone}>Dans {7 - timeElapsed.totalDays} jours : Sommeil normalisé</div>}
              {!cannabisBenefits.motivationBoost && timeElapsed.totalDays < 14 && <div className={styles.milestone}>Dans {14 - timeElapsed.totalDays} jours : Motivation revenue</div>}
              {!cannabisBenefits.receptorsHealing && timeElapsed.totalDays < 30 && <div className={styles.milestone}>Dans {30 - timeElapsed.totalDays} jours : Récepteurs guéris</div>}
            </div>
          )}
        </div>

        {/* Bénéfices cigarette */}
        <div className={styles.healthCard}>
          <h3>🫁 Cigarette / Poumons</h3>

          <div className={styles.lungProgress}>
            <div className={styles.progressLabel}>Récupération pulmonaire : {lungRecovery.toFixed(0)}%</div>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${lungRecovery}%` }} />
            </div>
          </div>

          <div className={styles.benefits}>
            {combustionBenefits.sensesImprove && <div className={styles.benefit}>✅ Goût et odorat améliorés</div>}
            {combustionBenefits.breathingImproves && <div className={styles.benefit}>✅ Respiration améliorée</div>}
            {combustionBenefits.coughReduction && <div className={styles.benefit}>✅ Toux réduite</div>}
            {combustionBenefits.lungFunction && <div className={styles.benefit}>✅ Fonction pulmonaire +30%</div>}
          </div>

          {!combustionBenefits.lungFunction && (
            <div className={styles.nextMilestones}>
              <h4>🎯 Prochains paliers</h4>
              {!combustionBenefits.sensesImprove && timeElapsed.totalDays < 2 && <div className={styles.milestone}>Dans {2 - timeElapsed.totalDays} jour(s) : Goût / odorat</div>}
              {!combustionBenefits.breathingImproves && timeElapsed.totalDays < 3 && <div className={styles.milestone}>Dans {3 - timeElapsed.totalDays} jour(s) : Respiration</div>}
              {!combustionBenefits.coughReduction && timeElapsed.totalDays < 7 && <div className={styles.milestone}>Dans {7 - timeElapsed.totalDays} jours : Toux réduite</div>}
              {!combustionBenefits.lungFunction && timeElapsed.totalDays < 30 && <div className={styles.milestone}>Dans {30 - timeElapsed.totalDays} jours : Poumons +30%</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
