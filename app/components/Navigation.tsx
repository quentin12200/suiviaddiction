'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import styles from './Navigation.module.css'

export default function Navigation() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Restaurer l'état de la sidebar depuis localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebarCollapsed')
    if (saved !== null) {
      setSidebarCollapsed(JSON.parse(saved))
    }
  }, [])

  const toggleSidebar = () => {
    const newState = !sidebarCollapsed
    setSidebarCollapsed(newState)
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newState))
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const navSections = [
    {
      title: 'PRINCIPAL',
      items: [
        { href: '/', label: 'Dashboard', icon: '📊' },
        { href: '/new', label: 'Nouvelle entrée', icon: '➕' },
        { href: '/history', label: 'Historique', icon: '📜' },
        { href: '/thoughts', label: 'Pensées', icon: '💭' },
      ],
    },
    {
      title: 'PROGRESSION',
      items: [
        { href: '/goals', label: 'Objectifs', icon: '🎯' },
        { href: '/discipline', label: 'Discipline', icon: '⚔️' },
        { href: '/strategies', label: 'Stratégies', icon: '🛡️' },
        { href: '/reading', label: 'Lectures', icon: '📚' },
      ],
    },
    {
      title: 'ANALYSE',
      items: [
        { href: '/correlations', label: 'Corrélations', icon: '📈' },
        { href: '/health', label: 'Santé', icon: '🏥' },
        { href: '/coach', label: 'Coach IA', icon: '🤖' },
      ],
    },
    {
      title: 'OUTILS',
      items: [
        { href: '/integrations', label: 'Intégrations', icon: '🔗' },
        { href: '/import', label: 'Import CSV', icon: '📥' },
      ],
    },
  ]

  return (
    <>
      {/* Overlay mobile */}
      {mobileMenuOpen && (
        <div
          className={styles.overlay}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Burger button mobile */}
      <button
        className={styles.mobileMenuButton}
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Sidebar */}
      <nav
        className={`${styles.sidebar} ${
          sidebarCollapsed ? styles.collapsed : ''
        } ${mobileMenuOpen ? styles.mobileOpen : ''}`}
      >
        {/* Header */}
        <div className={styles.sidebarHeader}>
          <div className={styles.brand}>
            <span className={styles.brandIcon}>🚭</span>
            {!sidebarCollapsed && (
              <span className={styles.brandText}>Suivi Addiction</span>
            )}
          </div>
          <button
            className={styles.collapseButton}
            onClick={toggleSidebar}
            aria-label="Réduire menu"
            title={sidebarCollapsed ? 'Agrandir' : 'Réduire'}
          >
            {sidebarCollapsed ? '»' : '«'}
          </button>
        </div>

        {/* Navigation sections */}
        <div className={styles.sidebarContent}>
          {navSections.map((section, idx) => (
            <div key={idx} className={styles.navSection}>
              {!sidebarCollapsed && (
                <div className={styles.sectionTitle}>{section.title}</div>
              )}
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.navItem} ${
                    pathname === item.href ? styles.active : ''
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                  title={sidebarCollapsed ? item.label : ''}
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  {!sidebarCollapsed && (
                    <span className={styles.navLabel}>{item.label}</span>
                  )}
                </Link>
              ))}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className={styles.sidebarFooter}>
          <button
            onClick={handleLogout}
            className={styles.logoutButton}
            title={sidebarCollapsed ? 'Déconnexion' : ''}
          >
            <span className={styles.navIcon}>🚪</span>
            {!sidebarCollapsed && (
              <span className={styles.navLabel}>Déconnexion</span>
            )}
          </button>
        </div>
      </nav>
    </>
  )
}
