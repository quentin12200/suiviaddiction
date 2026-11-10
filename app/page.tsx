'use client'

import Navigation from './components/Navigation'
import QuitDashboard from './components/QuitDashboard'
import styles from './page.module.css'

// Composants désactivés (code conservé, non supprimé) :
// import SobrietyCounter from './components/SobrietyCounter'
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
  return (
    <div>
      <Navigation />
      <main className={styles.container}>
        <QuitDashboard />
      </main>
    </div>
  )
}
