import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { parseEmailSolde, decodeGmailBody } from '@/lib/parseEmailSolde'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Synchronise le solde bancaire depuis Gmail
 * Récupère le dernier email de notification Caisse d'Épargne et extrait le solde
 */
export async function POST(request: NextRequest) {
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

    // Récupérer le token Gmail depuis les cookies
    const gmailAccessToken = request.cookies.get('google_gmail_access_token')?.value

    if (!gmailAccessToken) {
      return NextResponse.json(
        {
          error: 'gmail_not_authorized',
          message: 'Vous devez autoriser l\'accès à Gmail',
          authUrl: '/api/auth/google/gmail',
        },
        { status: 401 }
      )
    }

    // Rechercher les emails de notification Caisse d'Épargne
    const query = 'from:nepasrepondre@notification.cemp.caisse-epargne.fr subject:"Opération liée à l\'alerte suivi"'

    // Appel Gmail API pour lister les messages
    const listResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=1`,
      {
        headers: {
          Authorization: `Bearer ${gmailAccessToken}`,
        },
      }
    )

    if (!listResponse.ok) {
      const errorData = await listResponse.json()
      console.error('Erreur Gmail API (list):', errorData)

      // Si le token est expiré, demander une nouvelle autorisation
      if (listResponse.status === 401) {
        return NextResponse.json(
          {
            error: 'gmail_token_expired',
            message: 'Votre autorisation Gmail a expiré, veuillez vous reconnecter',
            authUrl: '/api/auth/google/gmail',
          },
          { status: 401 }
        )
      }

      return NextResponse.json(
        { error: 'gmail_api_error', message: 'Erreur lors de l\'accès à Gmail' },
        { status: 500 }
      )
    }

    const listData = await listResponse.json()

    // Vérifier si des emails ont été trouvés
    if (!listData.messages || listData.messages.length === 0) {
      return NextResponse.json(
        {
          error: 'no_email',
          message: 'Aucune notification récente trouvée. Vérifiez que vous recevez bien les emails de la Caisse d\'Épargne.',
        },
        { status: 404 }
      )
    }

    const messageId = listData.messages[0].id

    // Récupérer le contenu complet de l'email
    const messageResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
      {
        headers: {
          Authorization: `Bearer ${gmailAccessToken}`,
        },
      }
    )

    if (!messageResponse.ok) {
      console.error('Erreur Gmail API (get message)')
      return NextResponse.json(
        { error: 'gmail_api_error', message: 'Erreur lors de la récupération de l\'email' },
        { status: 500 }
      )
    }

    const messageData = await messageResponse.json()

    // Extraire le corps de l'email
    let emailBody = ''
    const payload = messageData.payload

    // Fonction récursive pour extraire le texte de l'email
    const extractBody = (part: any): string => {
      if (part.body && part.body.data) {
        return decodeGmailBody(part.body.data)
      }
      if (part.parts) {
        for (const subPart of part.parts) {
          const body = extractBody(subPart)
          if (body) return body
        }
      }
      return ''
    }

    emailBody = extractBody(payload)

    if (!emailBody) {
      return NextResponse.json(
        { error: 'parse_failed', message: 'Impossible d\'extraire le contenu de l\'email' },
        { status: 422 }
      )
    }

    // Parser l'email pour extraire le solde
    let parsedData
    try {
      parsedData = parseEmailSolde(emailBody)
    } catch (error: any) {
      console.error('Erreur parsing email:', error)
      return NextResponse.json(
        {
          error: 'parse_failed',
          message: error.message || 'Format email non reconnu',
        },
        { status: 422 }
      )
    }

    // Extraire la date de l'email
    const emailDateMs = parseInt(messageData.internalDate)
    const emailDate = new Date(emailDateMs)

    // Extraire l'expéditeur pour validation
    const headers = messageData.payload.headers
    const fromHeader = headers.find((h: any) => h.name.toLowerCase() === 'from')
    const expediteur = fromHeader ? fromHeader.value : 'unknown'

    // Vérifier si cet email a déjà été traité (dédoublonnage)
    const existing = await prisma.emailSolde.findUnique({
      where: { emailId: messageId },
    })

    if (existing) {
      // Email déjà traité, retourner les données en cache
      return NextResponse.json({
        solde: existing.solde,
        soldeRaw: existing.soldeRaw,
        dateEmail: existing.emailDate.toISOString(),
        operation: existing.operationLabel
          ? {
              label: existing.operationLabel,
              montant: existing.operationMontant!,
              date: existing.operationDate!,
            }
          : undefined,
        source: 'cache',
        message: 'Solde déjà à jour (email déjà traité)',
      })
    }

    // Enregistrer dans la base de données
    const emailSoldeRecord = await prisma.emailSolde.create({
      data: {
        userId,
        solde: parsedData.solde,
        soldeRaw: parsedData.soldeRaw,
        operationLabel: parsedData.operation?.label,
        operationMontant: parsedData.operation?.montant,
        operationDate: parsedData.operation?.date,
        emailId: messageId,
        emailDate,
        expediteur,
      },
    })

    // Retourner les données au frontend
    return NextResponse.json({
      solde: parsedData.solde,
      soldeRaw: parsedData.soldeRaw,
      dateEmail: emailDate.toISOString(),
      operation: parsedData.operation,
      source: 'nouveau',
      confiance: parsedData.confiance,
    })
  } catch (error) {
    console.error('Erreur sync-gmail:', error)
    return NextResponse.json(
      { error: 'server_error', message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
