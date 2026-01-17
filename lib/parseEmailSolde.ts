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

  // Supprimer COMPLÈTEMENT les balises style et script avec leur contenu
  textContent = textContent.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
  textContent = textContent.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')

  // Supprimer les commentaires HTML
  textContent = textContent.replace(/<!--[\s\S]*?-->/g, ' ')

  // Strip HTML tags pour ne garder que le texte
  textContent = textContent.replace(/<[^>]*>/g, ' ')

  // Décoder TOUTES les entités HTML courantes
  const htmlEntities: { [key: string]: string } = {
    '&nbsp;': ' ',
    '&euro;': '€',
    '&amp;': '&',
    '&eacute;': 'é',
    '&egrave;': 'è',
    '&ecirc;': 'ê',
    '&agrave;': 'à',
    '&acirc;': 'â',
    '&ocirc;': 'ô',
    '&ucirc;': 'û',
    '&ccedil;': 'ç',
    '&quot;': '"',
    '&lt;': '<',
    '&gt;': '>',
    '&rsquo;': "'",
    '&lsquo;': "'",
    '&rdquo;': '"',
    '&ldquo;': '"',
  }

  for (const [entity, char] of Object.entries(htmlEntities)) {
    textContent = textContent.replace(new RegExp(entity, 'g'), char)
  }

  // Normaliser les espaces multiples
  textContent = textContent.replace(/\s+/g, ' ')

  // Trim pour enlever les espaces au début et à la fin
  textContent = textContent.trim()

  // Regex principal pour extraire le solde (plusieurs patterns possibles)
  // Pattern 1: "Le solde de votre compte est désormais de : +938,12 €"
  let soldeRegex = /Le solde de votre compte est désormais de\s*:\s*([+-]?\d[\d\s]*,\d{2})\s*€/i
  let soldeMatch = textContent.match(soldeRegex)

  // Pattern 2: "solde de votre compte est désormais de +938,12 €" (sans "Le")
  if (!soldeMatch) {
    soldeRegex = /solde de votre compte est désormais de\s*:?\s*([+-]?\d[\d\s]*,\d{2})\s*€/i
    soldeMatch = textContent.match(soldeRegex)
  }

  // Pattern 3: "Le solde ... est de : +938,12 €" (variante courte)
  if (!soldeMatch) {
    soldeRegex = /solde.*?est.*?de\s*:?\s*([+-]?\d[\d\s]*,\d{2})\s*€/i
    soldeMatch = textContent.match(soldeRegex)
  }

  // Pattern 4: Chercher juste un montant précédé de "solde" (fallback large)
  if (!soldeMatch) {
    soldeRegex = /solde[^\d]*([+-]?\d[\d\s]*,\d{2})\s*€/i
    soldeMatch = textContent.match(soldeRegex)
  }

  if (!soldeMatch) {
    // Debug: Afficher un extrait de l'email pour diagnostic
    const excerpt = textContent.substring(0, 1500)
    console.error('❌ Pattern solde non trouvé. Extrait email (après nettoyage HTML):', excerpt)
    console.error('Longueur texte total:', textContent.length)
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
