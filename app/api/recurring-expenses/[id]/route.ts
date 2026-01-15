import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// PATCH - Modifier une dépense récurrente
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { id } = params

    const expense = await prisma.recurringExpense.update({
      where: { id },
      data: {
        ...(body.label !== undefined && { label: body.label }),
        ...(body.amount !== undefined && { amount: body.amount }),
        ...(body.dayOfMonth !== undefined && { dayOfMonth: body.dayOfMonth }),
        ...(body.frequency !== undefined && { frequency: body.frequency }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.startDate !== undefined && {
          startDate: body.startDate ? new Date(body.startDate) : null
        }),
        ...(body.endDate !== undefined && {
          endDate: body.endDate ? new Date(body.endDate) : null
        }),
        ...(body.isVariable !== undefined && { isVariable: body.isVariable }),
        ...(body.variableMonths !== undefined && { variableMonths: body.variableMonths }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      }
    })

    return NextResponse.json({
      success: true,
      expense
    })
  } catch (error) {
    console.error('Erreur PATCH recurring expense:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur de modification de la dépense' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer (désactiver) une dépense récurrente
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Soft delete: on désactive au lieu de supprimer
    const expense = await prisma.recurringExpense.update({
      where: { id },
      data: { isActive: false }
    })

    return NextResponse.json({
      success: true,
      expense
    })
  } catch (error) {
    console.error('Erreur DELETE recurring expense:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur de suppression de la dépense' },
      { status: 500 }
    )
  }
}
