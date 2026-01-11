import Navigation from '../components/Navigation'
import PDFExport from '../components/PDFExport'

export default function ExportPage() {
  return (
    <div>
      <Navigation />
      <div style={{ padding: '40px 20px', minHeight: '100vh', background: '#f7fafc' }}>
        <PDFExport />
      </div>
    </div>
  )
}
