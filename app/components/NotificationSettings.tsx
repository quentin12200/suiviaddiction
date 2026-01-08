'use client'

import { useState, useEffect } from 'react'
import styles from './NotificationSettings.module.css'

export default function NotificationSettings() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)

      // Vérifier si déjà souscrit
      navigator.serviceWorker?.ready.then((registration) => {
        registration.pushManager.getSubscription().then((subscription) => {
          setSubscribed(!!subscription)
        })
      })
    }
  }, [])

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('Les notifications ne sont pas supportées par ce navigateur')
      return
    }

    if (!('serviceWorker' in navigator)) {
      alert('Les service workers ne sont pas supportés')
      return
    }

    setLoading(true)

    try {
      // Demander la permission
      const permission = await Notification.requestPermission()
      setPermission(permission)

      if (permission === 'granted') {
        // S'inscrire aux notifications push
        const registration = await navigator.serviceWorker.ready

        // Clé publique VAPID (doit être générée et configurée)
        const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

        if (!publicKey) {
          console.warn('Clé VAPID publique non configurée')
        }

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: publicKey || undefined,
        })

        // Envoyer la subscription au serveur
        await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription: subscription.toJSON(),
          }),
        })

        setSubscribed(true)

        // Envoyer une notification de test
        new Notification('Notifications activées ! 🎉', {
          body: 'Tu recevras maintenant des alertes personnalisées pour t\'accompagner.',
          icon: '/icon-192.png',
        })
      }
    } catch (error) {
      console.error('Erreur activation notifications:', error)
      alert('Erreur lors de l\'activation des notifications')
    } finally {
      setLoading(false)
    }
  }

  const unsubscribe = async () => {
    setLoading(true)

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        await subscription.unsubscribe()
        setSubscribed(false)
      }
    } catch (error) {
      console.error('Erreur désactivation notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!('Notification' in window)) {
    return null
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>🔔 Notifications</h3>
        <p className={styles.description}>
          Reçois des alertes préventives au bon moment pour t&apos;aider à rester sur ton chemin
        </p>
      </div>

      <div className={styles.status}>
        {permission === 'default' && (
          <div className={styles.statusItem}>
            <span className={styles.statusIcon}>⚪</span>
            <span>Notifications non configurées</span>
          </div>
        )}
        {permission === 'denied' && (
          <div className={styles.statusItem}>
            <span className={styles.statusIcon}>🔴</span>
            <span>Notifications refusées (vérifie tes paramètres navigateur)</span>
          </div>
        )}
        {permission === 'granted' && subscribed && (
          <div className={styles.statusItem}>
            <span className={styles.statusIcon}>🟢</span>
            <span>Notifications actives</span>
          </div>
        )}
      </div>

      <div className={styles.actions}>
        {permission !== 'granted' && (
          <button
            onClick={requestNotificationPermission}
            disabled={loading || permission === 'denied'}
            className={styles.enableBtn}
          >
            {loading ? 'Activation...' : 'Activer les notifications'}
          </button>
        )}

        {permission === 'granted' && subscribed && (
          <button
            onClick={unsubscribe}
            disabled={loading}
            className={styles.disableBtn}
          >
            Désactiver
          </button>
        )}
      </div>

      <div className={styles.features}>
        <h4>Types d&apos;alertes :</h4>
        <ul>
          <li>🌅 Moments à risque détectés par l&apos;IA</li>
          <li>💪 Encouragements après succès</li>
          <li>📊 Rappels objectifs quotidiens</li>
          <li>🎯 Suggestions de stratégies adaptées</li>
        </ul>
      </div>
    </div>
  )
}
