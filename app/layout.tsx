import type { Metadata } from 'next'
import { Bricolage_Grotesque, Figtree } from 'next/font/google'
import './globals.css'
import PWAInstaller from './components/PWAInstaller'
import QuickThoughtButton from './components/QuickThoughtButton'

const display = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
})

const body = Figtree({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Suivi d\'Addiction - Coach Personnel',
  description: 'Application de suivi et accompagnement pour la liberté face aux addictions',
  manifest: '/manifest.json',
  themeColor: '#1E2A2C',
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
    <html lang="fr" className={`${display.variable} ${body.variable}`}>
      <head>
        <link rel="icon" href="/icon-192.png" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        {children}
        <PWAInstaller />
        <QuickThoughtButton />
      </body>
    </html>
  )
}
