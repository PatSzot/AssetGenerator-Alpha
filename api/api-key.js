import { generateCertificateApiKey, getAdminPassword } from './_certificateKeys.js'

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

function cleanString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

export default function handler(req, res) {
  setCorsHeaders(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })

  const password = cleanString(req.body?.password)
  if (password !== getAdminPassword()) {
    return res.status(401).json({ error: 'Invalid password' })
  }

  const { apiKey, createdAt } = generateCertificateApiKey()
  return res.status(200).json({
    apiKey,
    createdAt,
    header: 'x-api-key',
    endpoint: '/api/certificate',
    curl: [
      'curl -X POST "$APP_URL/api/certificate"',
      '  -H "Content-Type: application/json"',
      `  -H "x-api-key: ${apiKey}"`,
      '  -d \'{"fullName":"Jane Doe","date":"March 2026"}\'',
      '  --output certificate-jane-doe.jpg',
    ].join(' \\\n'),
  })
}
