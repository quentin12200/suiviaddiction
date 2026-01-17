/**
 * Utilitaire pour parser les emails de notification Caisse d'Épargne
 * et extraire le solde bancaire automatiquement
 */

export interface ParsedSolde {
  solde: number
  soldeRaw: string
  confiance: 'haute' | 'moyenne' | 'faible'
  operation?: {
    label: string
    montant: number
    date: string
  }
}

/**
 * Parse le contenu d'un email de notification Caisse d'Épargne
 * pour extraire le solde et optionnellement la dernière opération
 */
export function parseEmailSolde(emailBody: string): ParsedSolde {
  // Décoder le HTML si nécessaire (parfois les emails sont encodés)
  let textContent = emailBody

  // Strip HTML tags pour ne garder que le texte
  textContent = textContent.replace(/<[^>]*>/g, ' ')
  // Nettoyer les entités HTML
  textContent = textContent.replace(/&nbsp;/g, ' ')
  textContent = textContent.replace(/&euro;/g, '€')
  textContent = textContent.replace(/&amp;/g, '&')
  // Normaliser les espaces multiples
  textContent = textContent.replace(/\s+/g, ' ')

  // Regex principal pour extraire le solde
  // Pattern: "Le solde de votre compte est désormais de : +938,12 €"
  const soldeRegex = /Le solde de votre compte est désormais de\s*:\s*([+-]?\d[\d\s]*,\d{2})\s*€/i
  const soldeMatch = textContent.match(soldeRegex)

  if (!soldeMatch) {
    throw new Error('PARSE_ERROR: Pattern solde non trouvé dans l\'email')
  }

  const soldeRaw = soldeMatch[1].trim()

  // Convertir le format français en nombre
  // "+938,12" ou "1 234,56" → 938.12 ou 1234.56
  let soldeString = soldeRaw
    .replace(/\s/g, '') // Retirer tous les espaces (pour "1 234,56")
    .replace(',', '.')   // Remplacer virgule par point

  const solde = parseFloat(soldeString)

  if (isNaN(solde)) {
    throw new Error(`PARSE_ERROR: Montant invalide "${soldeRaw}"`)
  }

  // Validation plausibilité (entre -10000€ et +100000€)
  if (solde < -10000 || solde > 100000) {
    console.warn(`⚠️ Solde hors range attendu: ${solde}€`)
  }

  // Bonus: Extraire la dernière opération récente
  // Pattern: "EDF\n16 janvier 2026 -404,21 €"
  const operationRegex = /([A-Z\s]{2,50})\s+(\d{1,2}\s+\w+\s+\d{4})\s+([-+]?\d[\d\s]*,\d{2})\s*€/
  const operationMatch = textContent.match(operationRegex)

  let operation: ParsedSolde['operation'] | undefined

  if (operationMatch) {
    const label = operationMatch[1].trim()
    const date = operationMatch[2].trim()
    const montantRaw = operationMatch[3].trim()

    // Convertir le montant de l'opération
    const montantString = montantRaw.replace(/\s/g, '').replace(',', '.')
    const montant = parseFloat(montantString)

    if (!isNaN(montant) && label && date) {
      operation = {
        label,
        montant,
        date,
      }
    }
  }

  return {
    solde,
    soldeRaw: soldeMatch[1].trim(), // Format original avec signe
    confiance: operation ? 'haute' : 'moyenne', // Plus de confiance si on a trouvé l'opération aussi
    operation,
  }
}

/**
 * Décode le contenu d'un email Gmail encodé en base64
 */
export function decodeGmailBody(encodedBody: string): string {
  try {
    // Gmail encode en base64url (variante du base64)
    // Remplacer - par + et _ par /
    const base64 = encodedBody.replace(/-/g, '+').replace(/_/g, '/')
    // Décoder
    const decoded = Buffer.from(base64, 'base64').toString('utf-8')
    return decoded
  } catch (error) {
    console.error('Erreur décodage base64:', error)
    // Si le décodage échoue, retourner tel quel
    return encodedBody
  }
}
