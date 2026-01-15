import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Données des dépenses récurrentes de l'utilisateur
const DEFAULT_EXPENSES = [
  // Jour 5 - Jour critique 1187,45€
  { label: 'Crédit immobilier', amount: 653.95, dayOfMonth: 5, category: 'Crédit' as const },
  { label: 'CE Midi-Pyrénées (assurances)', amount: 243.68, dayOfMonth: 5, category: 'Assurance' as const },
  { label: 'BPCE Assurances IARD (1)', amount: 104.24, dayOfMonth: 5, category: 'Assurance' as const },
  { label: 'BPCE Assurances IARD (2)', amount: 69.13, dayOfMonth: 5, category: 'Assurance' as const },
  { label: 'BPCE Assurances IARD (3)', amount: 45.56, dayOfMonth: 5, category: 'Assurance' as const },
  { label: 'Canva', amount: 28.00, dayOfMonth: 5, category: 'Abonnement' as const },
  { label: 'Tech VIP', amount: 29.90, dayOfMonth: 5, category: 'Abonnement' as const },
  { label: 'Blizzard', amount: 12.99, dayOfMonth: 5, category: 'Abonnement' as const },

  // Jour 6
  { label: 'CNP Assurances', amount: 5.00, dayOfMonth: 6, category: 'Assurance' as const },
  { label: 'PayPal', amount: 75.00, dayOfMonth: 6, category: 'Autre' as const, endDate: '2026-03-31' },

  // Jour 7
  { label: 'Section locale Multipro', amount: 20.00, dayOfMonth: 7, category: 'Autre' as const },

  // Jour 9
  { label: 'EDF électricité', amount: 150.00, dayOfMonth: 9, category: 'Énergie' as const },

  // Jour 12
  { label: 'Association financement PCF', amount: 26.00, dayOfMonth: 12, category: 'Autre' as const },

  // Jour 13
  { label: 'OpenAI ChatGPT', amount: 20.66, dayOfMonth: 13, category: 'Abonnement' as const },
  { label: 'Adobe', amount: 23.99, dayOfMonth: 13, category: 'Abonnement' as const },

  // Jour 14
  { label: 'Cofidis', amount: 15.74, dayOfMonth: 14, category: 'Crédit' as const, endDate: '2026-03-31' },

  // Jour 15
  { label: 'DIAC', amount: 341.25, dayOfMonth: 15, category: 'Crédit' as const },
  { label: 'APF France Handicap', amount: 10.00, dayOfMonth: 15, category: 'Autre' as const },

  // Jour 16
  { label: 'Orange SA', amount: 28.99, dayOfMonth: 16, category: 'Abonnement' as const },

  // Jour 22
  { label: 'Remboursement crédit', amount: 97.00, dayOfMonth: 22, category: 'Crédit' as const, endDate: '2027-01-22' },
  { label: 'Électricité (janvier)', amount: 119.00, dayOfMonth: 22, category: 'Énergie' as const, startDate: '2026-01-01', endDate: '2026-01-31' },

  // Jour 23
  { label: 'SFR Internet & téléphonie', amount: 66.98, dayOfMonth: 23, category: 'Abonnement' as const },

  // Jour 25 - Bimensuel
  { label: 'CGT FAPT', amount: 22.00, dayOfMonth: 25, category: 'Autre' as const, frequency: 'bimensuel' },

  // Jour 29
  { label: 'Anthropic Claude', amount: 21.60, dayOfMonth: 29, category: 'Abonnement' as const },
  { label: 'Orange Fibre', amount: 30.99, dayOfMonth: 29, category: 'Abonnement' as const },

  // Jour 9 - Bimensuel (hors janvier)
  { label: 'EDF électricité (bimensuel)', amount: 238.00, dayOfMonth: 9, category: 'Énergie' as const, frequency: 'bimensuel', startDate: '2026-02-01' },
]

// POST - Initialiser les dépenses par défaut
export async function POST(request: NextRequest) {
  try {
    // Vérifier si des dépenses existent déjà
    const existingCount = await prisma.recurringExpense.count()

    if (existingCount > 0) {
      return NextResponse.json({
        success: false,
        error: 'Des dépenses existent déjà. Supprimez-les d\'abord si vous voulez réinitialiser.'
      }, { status: 400 })
    }

    // Créer toutes les dépenses
    const expenses = await prisma.recurringExpense.createMany({
      data: DEFAULT_EXPENSES.map(exp => ({
        label: exp.label,
        amount: exp.amount,
        dayOfMonth: exp.dayOfMonth,
        category: exp.category,
        frequency: exp.frequency || 'mensuel',
        startDate: exp.startDate ? new Date(exp.startDate) : null,
        endDate: exp.endDate ? new Date(exp.endDate) : null,
        isVariable: exp.isVariable || false,
        variableMonths: exp.variableMonths || null,
        isActive: true
      }))
    })

    return NextResponse.json({
      success: true,
      message: `${expenses.count} dépenses récurrentes créées`,
      count: expenses.count
    })
  } catch (error) {
    console.error('Erreur initialisation dépenses:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de l\'initialisation' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer toutes les dépenses
export async function DELETE() {
  try {
    const result = await prisma.recurringExpense.deleteMany({})

    return NextResponse.json({
      success: true,
      message: `${result.count} dépenses supprimées`,
      count: result.count
    })
  } catch (error) {
    console.error('Erreur suppression dépenses:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la suppression' },
      { status: 500 }
    )
  }
}
