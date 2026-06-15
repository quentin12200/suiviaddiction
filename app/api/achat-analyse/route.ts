import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { imageBase64 } = await request.json()

    if (!imageBase64) {
      return NextResponse.json({ error: 'Aucune image reçue' }, { status: 400 })
    }

    console.log('🖼️ Image reçue, taille:', Math.round(imageBase64.length / 1024), 'KB')
    console.log('🖼️ Type:', imageBase64.substring(0, 30))

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
    console.log('🤖 OpenAI status:', response.status)
    console.log('🤖 OpenAI response:', JSON.stringify(data).substring(0, 500))

    if (!response.ok) {
      console.error('❌ OpenAI error:', data)
      return NextResponse.json({ error: `OpenAI error: ${data.error?.message || 'unknown'}` }, { status: 500 })
    }

    const content = data.choices?.[0]?.message?.content
    if (!content) {
      console.error('❌ No content in response')
      return NextResponse.json({ error: 'Pas de réponse de l\'IA' }, { status: 500 })
    }

    console.log('📝 Content:', content)

    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('❌ No JSON in content:', content)
      return NextResponse.json({ error: 'Format de réponse invalide' }, { status: 500 })
    }

    const result = JSON.parse(jsonMatch[0])
    console.log('✅ Parsed result:', result)
    return NextResponse.json(result)
  } catch (error) {
    console.error('❌ Exception:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
