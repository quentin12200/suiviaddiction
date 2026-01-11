import Navigation from '../components/Navigation'
import Badges from '../components/Badges'

export default function BadgesPage() {
  return (
    <div>
      <Navigation />
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <Badges />
      </div>
    </div>
  )
}
