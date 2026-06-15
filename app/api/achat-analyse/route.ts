import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { imageBase64 } = await request.json()

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyse cette image de produit en vente en ligne. Réponds UNIQUEMENT en JSON avec ces clés :
- "produit" : le nom précis du produit
- "prix" : le prix si visible, sinon ""
- "categorie" : la catégorie (électronique, vêtement, maison, loisir, sport, beauté, autre)
- "commentaire" : une question directe et bienveillante en français tutoyant l'utilisateur, qui remet en question l'achat de façon personnalisée. Exemple pour un clavier : "T'as vraiment besoin d'un nouveau clavier ? Tu n'en as pas déjà un ?" Sois précis sur le type de produit, bref (1-2 phrases max), et challengeant sans être agressif.`
            },
            { type: 'image_url', image_url: { url: imageBase64, detail: 'low' } }
          ]
        }],
        max_tokens: 300
      })
    })

    const data = await response.json()
    const content = data.choices[0].message.content
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found')
    const result = JSON.parse(jsonMatch[0])
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Analyse échouée' }, { status: 500 })
  }
}
