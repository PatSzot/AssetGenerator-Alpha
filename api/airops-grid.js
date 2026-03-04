export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const { gridId, sheetId, apiKey } = req.body ?? {}
  if (!gridId || !sheetId || !apiKey) {
    return res.status(400).json({ error: 'Missing gridId, sheetId, or apiKey' })
  }

  // Try AirOps grid endpoint patterns (most likely first)
  const candidates = [
    `https://app.airops.com/public_api/grids/${gridId}/rows?sheet_id=${sheetId}`,
    `https://app.airops.com/public_api/grids/${gridId}/sheets/${sheetId}/rows`,
    `https://app.airops.com/public_api/sheets/${sheetId}/rows`,
  ]

  let lastError = ''
  for (const url of candidates) {
    try {
      const r = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
        }
      })
      const body = await r.text()
      if (!r.ok) { lastError = `${url} → ${r.status}: ${body.slice(0, 300)}`; continue }
      const data = JSON.parse(body)
      const rows = Array.isArray(data) ? data
        : (data.rows ?? data.data ?? data.results ?? [])
      return res.status(200).json({ rows, endpoint: url })
    } catch (e) {
      lastError = `${url} → ${e.message}`
    }
  }

  return res.status(502).json({
    error: 'Could not reach AirOps grid API. Check your API key.',
    detail: lastError,
  })
}
