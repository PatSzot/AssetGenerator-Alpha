import chromium from '@sparticuz/chromium-min'
import puppeteer from 'puppeteer-core'
import { getTemplate } from './_templates.js'

/**
 * POST /api/screenshot
 *
 * Universal renderer that drives the SPA in headless Chromium and captures the
 * canvas. Pixel-exact with what users see in the GTMGen UI — same canvas code
 * path, no Satori translation.
 *
 * Body: {
 *   templateType: 'quote' | 'richquote' | ... ,  // required
 *   settings?: { [settingsKey]: value },         // partial settings override
 *   width?: number, height?: number,             // dims (defaults to template default)
 *   format?: 'png' | 'jpeg',                     // default jpeg
 *   quality?: number                             // jpeg quality 0..1, default 0.95
 * }
 *
 * Query: ?format=json  → returns { image: "<base64>" } instead of raw bytes.
 *
 * Pattern mirrors api/certificate.js: encode payload as base64 JSON in URL
 * hash, App.jsx's parseHashData picks it up, the canvas paints, we capture.
 */

function encodeHashPayload(payload) {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64')
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST')    return res.status(405).json({ error: 'POST only' })

  const {
    templateType,
    settings = {},
    width,
    height,
    format = 'jpeg',
    quality = 0.95,
  } = req.body ?? {}

  const tmpl = getTemplate(templateType)
  if (!tmpl) {
    return res.status(400).json({
      error: `Unknown templateType "${templateType}". See GET /api/templates.`,
    })
  }

  const w = Number(width)  || tmpl.defaultDims.w
  const h = Number(height) || tmpl.defaultDims.h
  const mimeType = format === 'png' ? 'image/png' : 'image/jpeg'

  const appUrl =
    process.env.APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
  if (!appUrl) {
    return res.status(500).json({ error: 'APP_URL env var is not configured' })
  }

  // Merge caller settings with templateType so the SPA hydrates fully.
  const mergedSettings = {
    ...settings,
    templateType,
    dims: { w, h },
  }
  const hashPayload = encodeHashPayload({
    settings: mergedSettings,
    dims: { w, h },
  })
  const targetUrl = `${appUrl}/${templateType}#data=${hashPayload}`

  const CHROMIUM_URL =
    'https://github.com/Sparticuz/chromium/releases/download/v148.0.0/chromium-v148.0.0-pack.tar'
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
      defaultViewport: { width: w, height: h },
      executablePath,
      headless: 'shell',
    })

    const page = await browser.newPage()
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 })

    await page.goto(targetUrl, { waitUntil: 'networkidle0', timeout: 30000 })

    // Wait for a canvas matching the requested dims to exist and be painted.
    // Webinar renders 5 canvases — we pick the one that matches w/h.
    await page.waitForFunction(
      (targetW, targetH) => {
        const canvases = document.querySelectorAll('canvas')
        for (const c of canvases) {
          if (c.width >= targetW * 0.9 && c.width <= targetW * 2.2 &&
              c.height >= targetH * 0.9 && c.height <= targetH * 2.2) {
            return true
          }
        }
        return false
      },
      { timeout: 20000 },
      w, h,
    )

    // Extra buffer for fonts + floralia regenerate + any stipple-loaded images.
    await new Promise(r => setTimeout(r, 1500))

    const dataUrl = await page.evaluate((targetW, targetH, mime, q) => {
      // Find the canvas closest to the requested dimensions (handles webinar's
      // 5-canvas view and DPR scaling).
      const canvases = [...document.querySelectorAll('canvas')]
      const pick = canvases
        .map(c => ({
          c,
          score: Math.abs(c.width / (window.devicePixelRatio || 1) - targetW) +
                 Math.abs(c.height / (window.devicePixelRatio || 1) - targetH),
        }))
        .sort((a, b) => a.score - b.score)[0]
      if (!pick) return null
      return mime === 'image/png'
        ? pick.c.toDataURL('image/png')
        : pick.c.toDataURL('image/jpeg', q)
    }, w, h, mimeType, quality)

    if (!dataUrl) {
      return res.status(500).json({ error: 'No canvas painted in the page.' })
    }

    const base64 = dataUrl.replace(/^data:image\/(png|jpeg);base64,/, '')
    const buffer = Buffer.from(base64, 'base64')

    if (req.query?.format === 'json') {
      return res.status(200).json({ image: base64, mimeType, width: w, height: h })
    }

    res.setHeader('Content-Type', mimeType)
    res.setHeader('Content-Length', buffer.length)
    res.setHeader(
      'Content-Disposition',
      `inline; filename="airops-${templateType}-${w}x${h}.${format === 'png' ? 'png' : 'jpg'}"`,
    )
    return res.status(200).send(buffer)
  } catch (e) {
    return res.status(500).json({ error: e.message, stack: e.stack })
  } finally {
    if (browser) await browser.close()
  }
}
