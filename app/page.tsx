'use client'

import { useState } from 'react'
import Link from 'next/link'
import Navigation from './components/Navigation'
import SobrietyCounter from './components/SobrietyCounter'
import styles from './page.module.css'

// Composants désactivés (code conservé, non supprimé) :
// import FreedomScore from './components/FreedomScore'
// import AIEncouragement from './components/AIEncouragement'
// import ActiveStrategies from './components/ActiveStrategies'
// import AlertMonitor from './components/AlertMonitor'
// import NotificationSettings from './components/NotificationSettings'
// import HealthWidget from './components/HealthWidget'
// import PeriodStats from './components/PeriodStats'
// import SmartReminders from './components/SmartReminders'
// import TasksWidget from './components/TasksWidget'

export default function DashboardPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div>
      <Navigation />
      <div className={styles.container}>
        <SobrietyCounter key={`sobriety-${refreshKey}`} />

        <div className={styles.journalShortcut}>
          <Link href="/journal" className={styles.journalButton}>
            📓 Ouvrir mon journal
          </Link>
        </div>
      </div>
    </div>
  )
}
