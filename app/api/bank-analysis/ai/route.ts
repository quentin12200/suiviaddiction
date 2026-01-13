import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { scenario, summary } = body

    if (!scenario || typeof scenario !== 'string') {
      return NextResponse.json({ success: false, error: 'Scénario manquant.' }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'OPENAI_API_KEY manquante côté serveur.',
      }, { status: 500 })
    }

    const prompt = [
      'Tu es un assistant financier. Réponds en français avec des actions claires.',
      summary
        ? `Résumé: solde fin mois prochain ${summary.endNextMonthBalance} € (${summary.endNextMonthDate}), solde minimum ${summary.minBalance} € (${summary.minBalanceDate}), paiements 4x détectés: ${summary.paiements4xCount}.`
        : 'Pas de résumé disponible.',
      `Scénario utilisateur: ${scenario}`,
    ].join('\n')

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Tu analyses des transactions bancaires.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({
        success: false,
        error: `Erreur IA: ${errorText}`,
      }, { status: 500 })
    }

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content?.trim() || 'Aucune réponse IA.'

    return NextResponse.json({ success: true, reply })
  } catch (error) {
    console.error('Erreur IA bancaire:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la requête IA.' },
      { status: 500 }
    )
  }
}
