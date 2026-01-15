import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Données des dépenses récurrentes de l'utilisateur
const DEFAULT_EXPENSES = [
  { label: 'Crédit Immo', amount: 460, dayOfMonth: 5, category: 'Crédit' as const },
  { label: 'Assurance Emprunteur', amount: 14, dayOfMonth: 5, category: 'Assurance' as const },
  { label: 'Mutuelle', amount: 55.96, dayOfMonth: 5, category: 'Assurance' as const },
  { label: 'Impôts', amount: 237, dayOfMonth: 15, category: 'Autre' as const },
  { label: 'EDF', amount: 80, dayOfMonth: 5, category: 'Énergie' as const, isVariable: true, variableMonths: JSON.stringify({ '1': 238, '2': 150 }) },
  { label: 'Eau', amount: 30, dayOfMonth: 16, category: 'Énergie' as const },
  { label: 'Internet', amount: 29.99, dayOfMonth: 17, category: 'Abonnement' as const },
  { label: 'Netflix', amount: 17.99, dayOfMonth: 5, category: 'Abonnement' as const },
  { label: 'Spotify', amount: 10.99, dayOfMonth: 5, category: 'Abonnement' as const },
  { label: 'Canal+', amount: 24.99, dayOfMonth: 5, category: 'Abonnement' as const },
  { label: 'Assurance Voiture', amount: 45, dayOfMonth: 5, category: 'Assurance' as const },
  { label: 'Téléphone Sophie', amount: 9.99, dayOfMonth: 7, category: 'Abonnement' as const },
  { label: 'Téléphone Quentin', amount: 19.99, dayOfMonth: 12, category: 'Abonnement' as const },
  { label: 'Piscine', amount: 35, dayOfMonth: 5, category: 'Autre' as const },
  { label: 'Salle de sport', amount: 29.90, dayOfMonth: 1, category: 'Abonnement' as const },
  { label: 'Loyer garage', amount: 50, dayOfMonth: 1, category: 'Autre' as const },
  { label: 'Essence', amount: 150, dayOfMonth: 1, category: 'Autre' as const },
  { label: 'Courses alimentaires', amount: 400, dayOfMonth: 5, category: 'Autre' as const },
  { label: 'Courses alimentaires', amount: 200, dayOfMonth: 15, category: 'Autre' as const },
  { label: 'Courses alimentaires', amount: 200, dayOfMonth: 25, category: 'Autre' as const },
  { label: 'Prime assurance habitation', amount: 45, dayOfMonth: 20, category: 'Assurance' as const },
  { label: 'Frais bancaires', amount: 5, dayOfMonth: 1, category: 'Autre' as const },
  { label: 'Cantine enfants', amount: 80, dayOfMonth: 5, category: 'Autre' as const },
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
        ...exp,
        frequency: 'mensuel',
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
