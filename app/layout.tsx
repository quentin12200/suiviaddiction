import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Suivi d\'Addiction',
  description: 'Application personnelle de suivi d\'addiction',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
