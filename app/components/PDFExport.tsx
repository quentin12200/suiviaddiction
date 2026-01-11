'use client'

import { useState } from 'react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import styles from './PDFExport.module.css'

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

export default function PDFExport() {
  const [loading, setLoading] = useState(false)
  const [period, setPeriod] = useState('30')

  const generatePDF = async () => {
    setLoading(true)

    try {
      // Récupérer les données
      const response = await fetch(`/api/export/pdf?days=${period}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Erreur récupération données')
      }

      const data = result.data

      if (!data || data.summary.totalDays === 0) {
        alert('Aucune entrée trouvée pour cette période. Ajoute des entrées d\'abord.')
        return
      }

      // Créer le PDF
      const pdf = new jsPDF()
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()

      // En-tête
      pdf.setFontSize(22)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Rapport de Suivi Addiction', pageWidth / 2, 20, { align: 'center' })

      pdf.setFontSize(11)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Période: ${data.period.startDate} au ${data.period.endDate}`, pageWidth / 2, 28, { align: 'center' })
      pdf.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, 34, { align: 'center' })

      // Ligne séparatrice
      pdf.setLineWidth(0.5)
      pdf.line(15, 38, pageWidth - 15, 38)

      let yPos = 48

      // Résumé Exécutif
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text('📊 Résumé Exécutif', 15, yPos)
      yPos += 8

      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')

      const summaryData = [
        ['Période de suivi', `${data.summary.totalDays} jours`],
        ['Jours sans fumer', `${data.summary.cleanDays} (${Math.round(data.summary.cleanPercentage)}%)`],
        ['Jours avec consommation', `${data.summary.smokingDays}`],
        ['Total joints fumés', `${data.summary.totalJoints}`],
        ['Moyenne / jour', `${data.summary.avgJointsPerDay} joints`],
        ['Niveau d\'envie moyen', `${data.summary.avgCraving} / 10`],
        ['Streak actuel', `${data.summary.currentStreak} jours`],
        ['Meilleur streak (période)', `${data.summary.bestStreak} jours`],
      ]

      pdf.autoTable({
        startY: yPos,
        head: [['Indicateur', 'Valeur']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [102, 126, 234], fontSize: 10, fontStyle: 'bold' },
        bodyStyles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 80, fontStyle: 'bold' },
        },
      })

      yPos = (pdf as any).lastAutoTable.finalY + 10

      // Progression
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text('📈 Progression et Croissance', 15, yPos)
      yPos += 8

      const progressData = [
        ['Alternatives constructives réussies', `${data.summary.constructiveAlternatives}`],
        ['Moments d\'isolement ressourçants', `${data.summary.successfulIsolations}`],
      ]

      pdf.autoTable({
        startY: yPos,
        head: [['Réalisation', 'Nombre']],
        body: progressData,
        theme: 'grid',
        headStyles: { fillColor: [72, 187, 120], fontSize: 10, fontStyle: 'bold' },
        bodyStyles: { fontSize: 9 },
      })

      yPos = (pdf as any).lastAutoTable.finalY + 10

      // Nouvelle page si nécessaire
      if (yPos > pageHeight - 60) {
        pdf.addPage()
        yPos = 20
      }

      // Triggers
      if (data.triggers.length > 0) {
        pdf.setFontSize(14)
        pdf.setFont('helvetica', 'bold')
        pdf.text('⚠️ Déclencheurs Principaux', 15, yPos)
        yPos += 8

        const triggerData = data.triggers.map((t: any) => [
          t.trigger,
          `${t.count} fois`,
        ])

        pdf.autoTable({
          startY: yPos,
          head: [['Déclencheur', 'Fréquence']],
          body: triggerData,
          theme: 'grid',
          headStyles: { fillColor: [246, 173, 85], fontSize: 10, fontStyle: 'bold' },
          bodyStyles: { fontSize: 9 },
        })

        yPos = (pdf as any).lastAutoTable.finalY + 10
      }

      // Émotions
      if (data.emotions.length > 0 && yPos < pageHeight - 60) {
        pdf.setFontSize(14)
        pdf.setFont('helvetica', 'bold')
        pdf.text('💭 États Émotionnels Récurrents', 15, yPos)
        yPos += 8

        const emotionData = data.emotions.map((e: any) => [
          e.emotion,
          `${e.count} fois`,
        ])

        pdf.autoTable({
          startY: yPos,
          head: [['État émotionnel', 'Fréquence']],
          body: emotionData,
          theme: 'grid',
          headStyles: { fillColor: [159, 122, 234], fontSize: 10, fontStyle: 'bold' },
          bodyStyles: { fontSize: 9 },
        })

        yPos = (pdf as any).lastAutoTable.finalY + 10
      }

      // Nouvelle page pour l'analyse
      pdf.addPage()
      yPos = 20

      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text('💡 Analyse & Recommandations', 15, yPos)
      yPos += 10

      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')

      const analysis = []

      // Analyse taux de réussite
      if (data.summary.cleanPercentage >= 70) {
        analysis.push('✅ Excellente progression - taux de réussite élevé')
      } else if (data.summary.cleanPercentage >= 50) {
        analysis.push('🟡 Progression modérée - continuer les efforts')
      } else {
        analysis.push('🔴 Attention - taux de rechute important, renforcer stratégies')
      }

      // Analyse consommation
      if (data.summary.avgJointsPerDay < 1) {
        analysis.push('✅ Consommation très faible - excellent contrôle')
      } else if (data.summary.avgJointsPerDay < 3) {
        analysis.push('🟡 Consommation modérée - objectif de réduction possible')
      } else {
        analysis.push('🔴 Consommation élevée - travail sur alternatives nécessaire')
      }

      // Analyse streak
      if (data.summary.currentStreak >= 7) {
        analysis.push(`✅ Streak actif de ${data.summary.currentStreak} jours - maintenir la dynamique`)
      } else if (data.summary.currentStreak >= 3) {
        analysis.push(`🟡 Streak de ${data.summary.currentStreak} jours - proche du palier de 7 jours`)
      }

      // Analyse alternatives
      if (data.summary.constructiveAlternatives >= 10) {
        analysis.push('✅ Bon usage des alternatives constructives')
      } else if (data.summary.constructiveAlternatives > 0) {
        analysis.push('🟡 Continuer à développer les alternatives')
      } else {
        analysis.push('🔴 Mettre en place des alternatives aux moments de craving')
      }

      analysis.forEach(line => {
        pdf.text(line, 15, yPos)
        yPos += 7
      })

      // Pied de page
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'italic')
      pdf.text(
        'Document confidentiel - Usage médical et thérapeutique uniquement',
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      )

      // Sauvegarder
      pdf.save(`rapport-addiction-${data.period.endDate}.pdf`)
    } catch (error) {
      console.error('Erreur génération PDF:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      alert(`Erreur lors de la génération du PDF: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>📄 Export PDF</h2>
        <p className={styles.subtitle}>
          Génère un rapport professionnel pour ton médecin, centre d'addiction et proches
        </p>
      </div>

      <div className={styles.options}>
        <label className={styles.label}>
          Période à inclure :
          <select
            className={styles.select}
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="7">7 derniers jours</option>
            <option value="14">14 derniers jours</option>
            <option value="30">30 derniers jours (recommandé)</option>
            <option value="60">60 derniers jours</option>
            <option value="90">90 derniers jours</option>
          </select>
        </label>
      </div>

      <button
        className={styles.generateButton}
        onClick={generatePDF}
        disabled={loading}
      >
        {loading ? '📄 Génération en cours...' : '📥 Générer le rapport PDF'}
      </button>

      <div className={styles.info}>
        <h3>📋 Le rapport inclut :</h3>
        <ul>
          <li>✅ Résumé exécutif avec stats clés</li>
          <li>📊 Taux de réussite et progression</li>
          <li>🔥 Streaks (actuel et meilleur)</li>
          <li>⚠️ Déclencheurs identifiés</li>
          <li>💭 États émotionnels récurrents</li>
          <li>📈 Alternatives constructives utilisées</li>
          <li>💡 Analyse et recommandations</li>
        </ul>
      </div>
    </div>
  )
}
