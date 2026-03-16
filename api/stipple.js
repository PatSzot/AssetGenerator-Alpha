export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method !== 'POST') return res.status(405).end()

  const { image, mimeType = 'image/jpeg' } = req.body ?? {}
  if (!image) return res.status(400).json({ error: 'No image provided' })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' })

  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: 'Black and white hand drawn stipple effect.' },
            { inlineData: { mimeType, data: image } },
          ],
        }],
        generationConfig: { responseModalities: ['IMAGE'] },
      }),
    }
  )

  if (!resp.ok) {
    const err = await resp.text()
    return res.status(502).json({ error: err })
  }

  const data = await resp.json()
  const part = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData)
  if (!part) return res.status(502).json({ error: 'No image returned by Gemini' })

  res.json({ image: part.inlineData.data, mimeType: part.inlineData.mimeType })
}
