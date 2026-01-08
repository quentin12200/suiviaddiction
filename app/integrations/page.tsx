'use client'

import { useState, useEffect } from 'react'
import Navigation from '../components/Navigation'
import styles from './integrations.module.css'

interface IntegrationStatus {
  googleFit: boolean
  googleCalendar: boolean
  googleDrive: boolean
}

interface Backup {
  id: string
  name: string
  createdTime: string
  size: string
  webViewLink: string
}

export default function IntegrationsPage() {
  const [status, setStatus] = useState<IntegrationStatus>({
    googleFit: false,
    googleCalendar: false,
    googleDrive: false,
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [backups, setBackups] = useState<Record<string, Backup[]>>({})
  const [loadingBackups, setLoadingBackups] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    checkIntegrationStatus()

    // Vérifier les paramètres URL (success/error après callback OAuth)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const success = params.get('success')
      const error = params.get('error')

      if (success) {
        setMessage({
          type: 'success',
          text: `✅ ${success === 'fit' ? 'Google Fit' : success === 'calendar' ? 'Google Calendar' : success === 'drive' ? 'Google Drive' : 'Google'} connecté avec succès !`,
        })
        checkIntegrationStatus()
        // Nettoyer l'URL
        window.history.replaceState({}, '', '/integrations')
      } else if (error) {
        const errorMessages: Record<string, string> = {
          access_denied: 'Accès refusé. Tu as annulé la connexion.',
          no_code: 'Erreur: Code d\'autorisation manquant.',
          config_missing: 'Configuration OAuth incomplète. Vérifie les variables d\'environnement.',
          token_exchange_failed: 'Échec de l\'échange de token.',
          server_error: 'Erreur serveur lors de la connexion.',
        }
        setMessage({
          type: 'error',
          text: `❌ ${errorMessages[error] || 'Erreur de connexion'}`,
        })
        // Nettoyer l'URL
        window.history.replaceState({}, '', '/integrations')
      }
    }
  }, [])

  const checkIntegrationStatus = async () => {
    // Vérifier les cookies pour voir si les services sont connectés
    try {
      const response = await fetch('/api/integrations/status')
      const data = await response.json()

      if (data.success) {
        setStatus({
          googleFit: data.fit || false,
          googleCalendar: data.calendar || false,
          googleDrive: data.drive || false,
        })
      }
    } catch (error) {
      console.error('Erreur vérification status:', error)
    }
  }

  const connectGoogle = async (service: string) => {
    setLoading(true)
    setMessage(null)

    // Vérifier si les credentials sont configurés
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

    if (!clientId) {
      setMessage({
        type: 'error',
        text: '❌ Configuration OAuth manquante. Consulte les instructions ci-dessous.',
      })
      setLoading(false)
      return
    }

    // Rediriger vers l'OAuth flow
    const serviceMap: Record<string, string> = {
      'Google Fit': 'fit',
      'Google Calendar': 'calendar',
      'Google Drive': 'drive',
    }

    const serviceKey = serviceMap[service] || 'fit'
    window.location.href = `/api/auth/google?service=${serviceKey}`
  }

  const disconnectService = async (service: string) => {
    if (!confirm(`Déconnecter ${service} ?`)) return

    const serviceMap: Record<string, string> = {
      'Google Fit': 'fit',
      'Google Calendar': 'calendar',
      'Google Drive': 'drive',
    }

    const serviceKey = serviceMap[service] || 'fit'

    try {
      await fetch(`/api/integrations/disconnect?service=${serviceKey}`, {
        method: 'POST',
      })
      setMessage({
        type: 'success',
        text: `✅ ${service} déconnecté`,
      })
      checkIntegrationStatus()
    } catch (error) {
      setMessage({
        type: 'error',
        text: `❌ Erreur lors de la déconnexion`,
      })
    }
  }

  const loadBackups = async () => {
    if (!status.googleDrive) return

    try {
      setLoadingBackups(true)
      const response = await fetch('/api/google/drive/backups')
      const data = await response.json()

      if (data.success) {
        setBackups(data.backups)
      }
    } catch (error) {
      console.error('Erreur chargement backups:', error)
    } finally {
      setLoadingBackups(false)
    }
  }

  const exportToDrive = async () => {
    if (!status.googleDrive) {
      setMessage({
        type: 'error',
        text: '❌ Google Drive non connecté',
      })
      return
    }

    try {
      setExporting(true)
      setMessage(null)

      const response = await fetch('/api/google/drive/export', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        setMessage({
          type: 'success',
          text: `✅ Export réussi ! ${data.entriesCount} entrées, ${data.goalsCount} objectifs, ${data.strategiesCount} stratégies, ${data.disciplineCount} disciplines exportés`,
        })
        loadBackups()
      } else {
        setMessage({
          type: 'error',
          text: `❌ ${data.error || 'Erreur lors de l\'export'}`,
        })
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: '❌ Erreur lors de l\'export',
      })
    } finally {
      setExporting(false)
    }
  }

  useEffect(() => {
    if (status.googleDrive) {
      loadBackups()
    }
  }, [status.googleDrive])

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

        {/* Message de statut */}
        {message && (
          <div className={message.type === 'success' ? styles.successMessage : styles.errorMessage}>
            {message.text}
          </div>
        )}

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

        {/* Google Drive Backups Section */}
        {status.googleDrive && (
          <div className={styles.backupsSection}>
            <div className={styles.backupsHeader}>
              <h2>💾 Sauvegardes Google Drive</h2>
              <button
                onClick={exportToDrive}
                className={styles.exportButton}
                disabled={exporting}
              >
                {exporting ? '⏳ Export en cours...' : '📤 Exporter maintenant'}
              </button>
            </div>

            <p className={styles.backupsDescription}>
              Tes données sont exportées automatiquement dans le dossier &quot;Suivi Addiction Backups&quot; sur Google Drive.
              Tu peux aussi déclencher un export manuel ci-dessus.
            </p>

            {loadingBackups ? (
              <p className={styles.loadingText}>Chargement des sauvegardes...</p>
            ) : Object.keys(backups).length > 0 ? (
              <div className={styles.backupsList}>
                {Object.entries(backups)
                  .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
                  .map(([date, files]) => (
                    <div key={date} className={styles.backupGroup}>
                      <h3 className={styles.backupDate}>
                        📅 {new Date(date).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </h3>
                      <div className={styles.backupFiles}>
                        {files.map((file) => (
                          <a
                            key={file.id}
                            href={file.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.backupFile}
                          >
                            <div className={styles.backupFileIcon}>📄</div>
                            <div className={styles.backupFileInfo}>
                              <div className={styles.backupFileName}>{file.name}</div>
                              <div className={styles.backupFileSize}>
                                {file.size ? `${(parseInt(file.size) / 1024).toFixed(1)} Ko` : 'N/A'}
                              </div>
                            </div>
                            <div className={styles.backupFileAction}>Ouvrir →</div>
                          </a>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className={styles.noBackups}>
                <p>Aucune sauvegarde trouvée. Clique sur &quot;Exporter maintenant&quot; pour créer ta première sauvegarde.</p>
              </div>
            )}
          </div>
        )}

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
