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
            { type: 'text', text: 'Analyse cette image de produit et réponds en JSON: { "produit": "...", "prix": "...", "categorie": "..." }' },
            { type: 'image_url', image_url: { url: imageBase64, detail: 'low' } }
          ]
        }],
        max_tokens: 200
      })
    })

    const data = await response.json()
    const content = data.choices[0].message.content
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found')
    const result = JSON.parse(jsonMatch[0])
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Analyse échouée' }, { status: 500 })
  }
}
