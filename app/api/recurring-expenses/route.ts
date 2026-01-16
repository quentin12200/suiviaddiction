import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Récupérer toutes les dépenses récurrentes actives
export async function GET() {
  try {
    const expenses = await prisma.recurringExpense.findMany({
      where: { isActive: true },
      orderBy: { dayOfMonth: 'asc' }
    })

    return NextResponse.json({
      success: true,
      expenses
    })
  } catch (error) {
    console.error('Erreur GET recurring expenses:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur de chargement des dépenses' },
      { status: 500 }
    )
  }
}

// POST - Créer une nouvelle dépense récurrente
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const expense = await prisma.recurringExpense.create({
      data: {
        label: body.label,
        amount: body.amount,
        dayOfMonth: body.dayOfMonth,
        frequency: body.frequency || 'mensuel',
        category: body.category || 'Autre',
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        isVariable: body.isVariable || false,
        variableMonths: body.variableMonths || null,
        isActive: true
      }
    })

    return NextResponse.json({
      success: true,
      expense
    })
  } catch (error) {
    console.error('Erreur POST recurring expense:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur de création de la dépense' },
      { status: 500 }
    )
  }
}
