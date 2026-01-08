'use client'

import { useEffect, useState } from 'react'
import styles from './PWAInstaller.module.css'

export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Vérifier si on est sur iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(isIOSDevice)

    // Vérifier si l'app est déjà installée (mode standalone)
    const isInStandalone = window.matchMedia('(display-mode: standalone)').matches
    setIsStandalone(isInStandalone)

    // Enregistrer le service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('Service Worker enregistré:', registration)
        })
        .catch((error) => {
          console.error('Erreur enregistrement Service Worker:', error)
        })
    }

    // Capturer l'événement beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)

      // Afficher le prompt après un délai (meilleure UX)
      setTimeout(() => {
        setShowInstallPrompt(true)
      }, 3000)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Détecter l'installation
    window.addEventListener('appinstalled', () => {
      console.log('PWA installée avec succès!')
      setShowInstallPrompt(false)
      setDeferredPrompt(null)
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    // Afficher le prompt d'installation natif
    deferredPrompt.prompt()

    // Attendre la réponse de l'utilisateur
    const { outcome } = await deferredPrompt.userChoice
    console.log(`Installation: ${outcome}`)

    // Réinitialiser le prompt
    setDeferredPrompt(null)
    setShowInstallPrompt(false)
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    // Stocker dans localStorage pour ne pas redemander pendant 7 jours
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  // Ne rien afficher si déjà installé ou si pas de prompt
  if (isStandalone || (!showInstallPrompt && !isIOS)) {
    return null
  }

  // Prompt spécial pour iOS (install manuel)
  if (isIOS && !isStandalone) {
    const dismissed = localStorage.getItem('pwa-ios-dismissed')
    const shouldShow = !dismissed || Date.now() - parseInt(dismissed) > 7 * 24 * 60 * 60 * 1000

    if (!shouldShow) return null

    return (
      <div className={styles.iosPrompt}>
        <div className={styles.iosContent}>
          <h3>📱 Installer l&apos;application</h3>
          <p>
            Pour une meilleure expérience, ajoute cette app à ton écran d&apos;accueil :
          </p>
          <ol>
            <li>Appuie sur le bouton Partager <span>⎙</span></li>
            <li>Sélectionne &quot;Sur l&apos;écran d&apos;accueil&quot;</li>
          </ol>
          <button
            onClick={() => {
              localStorage.setItem('pwa-ios-dismissed', Date.now().toString())
              handleDismiss()
            }}
            className={styles.dismissBtn}
          >
            Compris
          </button>
        </div>
      </div>
    )
  }

  // Prompt pour Android/Desktop
  if (showInstallPrompt && deferredPrompt) {
    return (
      <div className={styles.installPrompt}>
        <div className={styles.promptContent}>
          <div className={styles.promptIcon}>📱</div>
          <div className={styles.promptText}>
            <h3>Installer l&apos;application</h3>
            <p>Accède rapidement à ton suivi et reçois des notifications</p>
          </div>
          <div className={styles.promptActions}>
            <button onClick={handleInstallClick} className={styles.installBtn}>
              Installer
            </button>
            <button onClick={handleDismiss} className={styles.dismissBtn}>
              Plus tard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
