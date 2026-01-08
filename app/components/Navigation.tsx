'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import styles from './Navigation.module.css'

export default function Navigation() {
  const [menuOpen, setMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const navItems = [
    { href: '/', label: 'Tableau de bord' },
    { href: '/new', label: 'Nouvelle entrée' },
    { href: '/history', label: 'Historique' },
    { href: '/goals', label: 'Objectifs' },
    { href: '/strategies', label: 'Stratégies' },
    { href: '/correlations', label: 'Corrélations' },
    { href: '/coach', label: 'Coach IA' },
    { href: '/import', label: 'Importer CSV' },
  ]

  return (
    <nav className={styles.nav}>
      <div className={styles.container}>
        <div className={styles.brand}>
          <Link href="/">Suivi d&apos;Addiction</Link>
        </div>

        {/* Burger menu pour mobile */}
        <button
          className={styles.burger}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Navigation principale */}
        <ul className={`${styles.menu} ${menuOpen ? styles.menuOpen : ''}`}>
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={pathname === item.href ? styles.active : ''}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            </li>
          ))}
          <li>
            <button onClick={handleLogout} className={styles.logoutBtn}>
              Déconnexion
            </button>
          </li>
        </ul>
      </div>
    </nav>
  )
}
