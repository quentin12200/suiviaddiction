'use client'

import { useState, useEffect } from 'react'
import Navigation from '../components/Navigation'
import styles from './integrations.module.css'

interface IntegrationStatus {
  googleFit: boolean
  googleCalendar: boolean
  googleDrive: boolean
}

export default function IntegrationsPage() {
  const [status, setStatus] = useState<IntegrationStatus>({
    googleFit: false,
    googleCalendar: false,
    googleDrive: false,
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkIntegrationStatus()
  }, [])

  const checkIntegrationStatus = async () => {
    // TODO: Vérifier si les tokens OAuth sont présents
    const hasGoogleFit = localStorage.getItem('googleFitToken') !== null
    const hasGoogleCalendar = localStorage.getItem('googleCalendarToken') !== null
    const hasGoogleDrive = localStorage.getItem('googleDriveToken') !== null

    setStatus({
      googleFit: hasGoogleFit,
      googleCalendar: hasGoogleCalendar,
      googleDrive: hasGoogleDrive,
    })
  }

  const connectGoogle = async (service: string) => {
    setLoading(true)

    // TODO: Implémenter OAuth 2.0 flow
    // Pour l'instant, on affiche les instructions

    alert(`Pour connecter ${service}:

1. Va sur Google Cloud Console: https://console.cloud.google.com/
2. Crée un nouveau projet ou sélectionne un projet existant
3. Active les APIs nécessaires:
   - Google Fit API (pour les données de santé)
   - Google Calendar API (pour le calendrier)
   - Google Drive API (pour l'export automatique)
4. Crée des credentials OAuth 2.0
5. Ajoute l'URL de redirection: ${window.location.origin}/api/auth/google/callback
6. Configure les variables d'environnement sur Vercel:
   - GOOGLE_CLIENT_ID
   - GOOGLE_CLIENT_SECRET

Une fois configuré, l'intégration sera automatique.`)

    setLoading(false)
  }

  const disconnectService = (service: string) => {
    if (!confirm(`Déconnecter ${service} ?`)) return

    // Supprimer les tokens du localStorage
    if (service === 'Google Fit') {
      localStorage.removeItem('googleFitToken')
    } else if (service === 'Google Calendar') {
      localStorage.removeItem('googleCalendarToken')
    } else if (service === 'Google Drive') {
      localStorage.removeItem('googleDriveToken')
    }

    checkIntegrationStatus()
  }

  return (
    <div>
      <Navigation />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>🔗 Intégrations</h1>
          <p className={styles.subtitle}>
            Connecte tes services Google pour enrichir ton suivi
          </p>
        </div>

        {/* Google Fit */}
        <div className={styles.integrationCard}>
          <div className={styles.integrationHeader}>
            <div className={styles.integrationIcon}>📊</div>
            <div className={styles.integrationInfo}>
              <h2>Google Fit</h2>
              <p>Importe automatiquement tes données de santé (sommeil, activité, fréquence cardiaque)</p>
            </div>
            <div className={styles.integrationStatus}>
              {status.googleFit ? (
                <span className={styles.statusConnected}>✅ Connecté</span>
              ) : (
                <span className={styles.statusDisconnected}>❌ Non connecté</span>
              )}
            </div>
          </div>

          <div className={styles.integrationFeatures}>
            <h3>Fonctionnalités :</h3>
            <ul>
              <li>Import automatique des heures de sommeil</li>
              <li>Données d&apos;activité physique (pas, minutes actives)</li>
              <li>Fréquence cardiaque et variabilité</li>
              <li>Corrélation avec tes comportements addictifs</li>
            </ul>
          </div>

          <div className={styles.integrationActions}>
            {status.googleFit ? (
              <button
                onClick={() => disconnectService('Google Fit')}
                className={styles.disconnectButton}
              >
                Déconnecter
              </button>
            ) : (
              <button
                onClick={() => connectGoogle('Google Fit')}
                className={styles.connectButton}
                disabled={loading}
              >
                Connecter Google Fit
              </button>
            )}
          </div>
        </div>

        {/* Google Calendar */}
        <div className={styles.integrationCard}>
          <div className={styles.integrationHeader}>
            <div className={styles.integrationIcon}>📅</div>
            <div className={styles.integrationInfo}>
              <h2>Google Agenda</h2>
              <p>Synchronise tes événements et crée des rappels automatiques</p>
            </div>
            <div className={styles.integrationStatus}>
              {status.googleCalendar ? (
                <span className={styles.statusConnected}>✅ Connecté</span>
              ) : (
                <span className={styles.statusDisconnected}>❌ Non connecté</span>
              )}
            </div>
          </div>

          <div className={styles.integrationFeatures}>
            <h3>Fonctionnalités :</h3>
            <ul>
              <li>Rappels pour tes objectifs quotidiens</li>
              <li>Événements automatiques pour tes séances de discipline</li>
              <li>Alertes avant les moments à risque identifiés</li>
              <li>Visualisation de tes patterns dans le temps</li>
            </ul>
          </div>

          <div className={styles.integrationActions}>
            {status.googleCalendar ? (
              <button
                onClick={() => disconnectService('Google Calendar')}
                className={styles.disconnectButton}
              >
                Déconnecter
              </button>
            ) : (
              <button
                onClick={() => connectGoogle('Google Calendar')}
                className={styles.connectButton}
                disabled={loading}
              >
                Connecter Google Agenda
              </button>
            )}
          </div>
        </div>

        {/* Google Drive */}
        <div className={styles.integrationCard}>
          <div className={styles.integrationHeader}>
            <div className={styles.integrationIcon}>☁️</div>
            <div className={styles.integrationInfo}>
              <h2>Google Drive</h2>
              <p>Sauvegarde automatique quotidienne de toutes tes données</p>
            </div>
            <div className={styles.integrationStatus}>
              {status.googleDrive ? (
                <span className={styles.statusConnected}>✅ Connecté</span>
              ) : (
                <span className={styles.statusDisconnected}>❌ Non connecté</span>
              )}
            </div>
          </div>

          <div className={styles.integrationFeatures}>
            <h3>Fonctionnalités :</h3>
            <ul>
              <li>Export automatique quotidien en CSV</li>
              <li>Sauvegarde complète de ta base de données</li>
              <li>Historique versionné (garde 30 jours)</li>
              <li>Import depuis Drive pour restaurer tes données</li>
            </ul>
          </div>

          <div className={styles.integrationActions}>
            {status.googleDrive ? (
              <button
                onClick={() => disconnectService('Google Drive')}
                className={styles.disconnectButton}
              >
                Déconnecter
              </button>
            ) : (
              <button
                onClick={() => connectGoogle('Google Drive')}
                className={styles.connectButton}
                disabled={loading}
              >
                Connecter Google Drive
              </button>
            )}
          </div>
        </div>

        {/* Instructions détaillées */}
        <div className={styles.instructionsCard}>
          <h2>📖 Instructions de configuration</h2>

          <div className={styles.instructionSection}>
            <h3>1. Créer un projet Google Cloud</h3>
            <ol>
              <li>Va sur <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer">Google Cloud Console</a></li>
              <li>Clique sur &quot;Créer un projet&quot;</li>
              <li>Nomme-le &quot;Suivi Addiction&quot;</li>
            </ol>
          </div>

          <div className={styles.instructionSection}>
            <h3>2. Activer les APIs</h3>
            <ol>
              <li>Dans le menu, va dans &quot;APIs et Services&quot; → &quot;Bibliothèque&quot;</li>
              <li>Recherche et active :
                <ul>
                  <li>Google Fit API</li>
                  <li>Google Calendar API</li>
                  <li>Google Drive API</li>
                </ul>
              </li>
            </ol>
          </div>

          <div className={styles.instructionSection}>
            <h3>3. Créer les credentials OAuth 2.0</h3>
            <ol>
              <li>Va dans &quot;APIs et Services&quot; → &quot;Identifiants&quot;</li>
              <li>Clique sur &quot;Créer des identifiants&quot; → &quot;ID client OAuth&quot;</li>
              <li>Type d&apos;application : Application Web</li>
              <li>Ajoute l&apos;URI de redirection autorisée :
                <div className={styles.codeBlock}>
                  {typeof window !== 'undefined' && `${window.location.origin}/api/auth/google/callback`}
                </div>
              </li>
              <li>Copie le Client ID et le Client Secret</li>
            </ol>
          </div>

          <div className={styles.instructionSection}>
            <h3>4. Configurer Vercel</h3>
            <ol>
              <li>Va dans les paramètres de ton projet Vercel</li>
              <li>Ajoute les variables d&apos;environnement :
                <div className={styles.codeBlock}>
                  GOOGLE_CLIENT_ID=ton_client_id<br/>
                  GOOGLE_CLIENT_SECRET=ton_client_secret
                </div>
              </li>
              <li>Redéploie l&apos;application</li>
            </ol>
          </div>

          <div className={styles.note}>
            💡 <strong>Note :</strong> Cette fonctionnalité est en cours de développement.
            Les intégrations seront pleinement fonctionnelles dans une prochaine mise à jour.
            En attendant, tu peux exporter manuellement tes données via la page Historique.
          </div>
        </div>
      </div>
    </div>
  )
}
