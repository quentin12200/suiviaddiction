import type { Metadata } from 'next'
import './globals.css'
import PWAInstaller from './components/PWAInstaller'

export const metadata: Metadata = {
  title: 'Suivi d\'Addiction - Coach Personnel',
  description: 'Application de suivi et accompagnement pour la liberté face aux addictions',
  manifest: '/manifest.json',
  themeColor: '#667eea',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SuiviAddiction',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="icon" href="/icon-192.png" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        {children}
        <PWAInstaller />
      </body>
    </html>
  )
}
