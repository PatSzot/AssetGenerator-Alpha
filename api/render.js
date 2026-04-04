import chromium from '@sparticuz/chromium-min'
import puppeteer from 'puppeteer-core'

/**
 * Generic render endpoint — screenshots any template with a hash payload.
 *
 * POST /api/render?format=json
 * Body: { template: "quote"|"richquote"|"titlecard"|"twitter"|"ijoined", ...fields }
 *
 * Fields are passed through as the hash payload (same shape App.jsx expects):
 *   text, customerName, company, role, images,
 *   eyebrow, serifTitle, sansTitle, body, cta,
 *   colorMode, w, h
 */

const VALID_TEMPLATES = new Set(['quote', 'richquote', 'titlecard', 'twitter', 'ijoined'])

function encodeHashPayload(payload) {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64')
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const { template, ...fields } = req.body ?? {}

  if (!template || !VALID_TEMPLATES.has(template)) {
    return res.status(400).json({
      error: `Invalid template. Must be one of: ${[...VALID_TEMPLATES].join(', ')}`,
    })
  }

  const appUrl =
    process.env.APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
  if (!appUrl) {
    return res.status(500).json({ error: 'APP_URL env var is not configured' })
  }

  const w = fields.w || 1080
  const h = fields.h || 1080

  const hashPayload = encodeHashPayload(fields)
  const targetUrl = `${appUrl}/${template}#data=${hashPayload}`

  const CHROMIUM_URL =
    'https://github.com/Sparticuz/chromium/releases/download/v130.0.0/chromium-v130.0.0-pack.tar'
  const executablePath =
    process.env.CHROMIUM_PATH ||
    (await chromium.executablePath(CHROMIUM_URL))

  let browser
  try {
    const isLocalChrome = !!process.env.CHROMIUM_PATH
    const args = isLocalChrome
      ? ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      : chromium.args

    browser = await puppeteer.launch({
      args,
      defaultViewport: { width: Number(w), height: Number(h) },
      executablePath,
      headless: 'shell',
    })

    const page = await browser.newPage()
    await page.setViewport({ width: Number(w), height: Number(h) })
    await page.goto(targetUrl, { waitUntil: 'networkidle0', timeout: 30000 })

    // Wait for canvas to render
    await page.waitForFunction(
      () => {
        const c = document.querySelector('canvas')
        return c && c.width > 0 && c.height > 0
      },
      { timeout: 15000 },
    )

    // Buffer for fonts and rendering
    await new Promise(r => setTimeout(r, 1500))

    const dataUrl = await page.evaluate(() => {
      const canvas = document.querySelector('canvas')
      return canvas.toDataURL('image/jpeg', 0.95)
    })

    const base64 = dataUrl.replace(/^data:image\/jpeg;base64,/, '')
    const buffer = Buffer.from(base64, 'base64')

    if (req.query?.format === 'json') {
      return res.status(200).json({ image: base64 })
    }

    res.setHeader('Content-Type', 'image/jpeg')
    res.setHeader('Content-Length', buffer.length)
    res.setHeader('Content-Disposition', `inline; filename="${template}.jpg"`)
    return res.status(200).send(buffer)
  } catch (e) {
    return res.status(500).json({ error: e.message })
  } finally {
    if (browser) await browser.close()
  }
}
