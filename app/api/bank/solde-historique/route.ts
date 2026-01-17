import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Récupère l'historique des soldes bancaires enregistrés
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier la session utilisateur
    const session = await getSession()

    if (!session || !session.isLoggedIn || !session.username) {
      return NextResponse.json(
        { error: 'auth_required', message: 'Vous devez être connecté' },
        { status: 401 }
      )
    }

    const userId = session.username

    // Récupérer le paramètre limit (par défaut 30)
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '30')

    // Récupérer l'historique depuis la base de données
    const historique = await prisma.emailSolde.findMany({
      where: { userId },
      orderBy: { emailDate: 'desc' },
      take: limit,
      select: {
        id: true,
        solde: true,
        soldeRaw: true,
        emailDate: true,
        operationLabel: true,
        operationMontant: true,
        operationDate: true,
        fetchedAt: true,
      },
    })

    // Formater les données pour le frontend
    const formatted = historique.map((record) => ({
      id: record.id,
      solde: record.solde,
      soldeRaw: record.soldeRaw,
      dateEmail: record.emailDate.toISOString(),
      operation: record.operationLabel
        ? {
            label: record.operationLabel,
            montant: record.operationMontant!,
            date: record.operationDate!,
          }
        : undefined,
      fetchedAt: record.fetchedAt.toISOString(),
    }))

    return NextResponse.json({
      success: true,
      count: formatted.length,
      historique: formatted,
    })
  } catch (error) {
    console.error('Erreur solde-historique:', error)
    return NextResponse.json(
      { error: 'server_error', message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
