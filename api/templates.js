import { TEMPLATES } from './_templates.js'

/**
 * GET /api/templates
 *
 * Returns the template manifest used by downstream consumers (Betty Slack bot,
 * future tools). Keep this stable — Betty fetches it on boot to build its
 * Claude tool schema and interactive pickers.
 */
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET')     return res.status(405).json({ error: 'GET only' })

  return res.status(200).json({
    version: 1,
    templates: TEMPLATES,
  })
}
