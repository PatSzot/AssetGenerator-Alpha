/* global Buffer, process */
import chromium from '@sparticuz/chromium-min'
import puppeteer from 'puppeteer-core'
import { verifyCertificateApiKey } from './_certificateKeys.js'

// Encode payload to match App.jsx parseHashData:
//   JSON.parse(decodeURIComponent(escape(atob(b64))))
// Inverse: Buffer.from(json, 'utf8').toString('base64')
function encodeHashPayload(payload) {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64')
}

function getHeader(req, name) {
  const headers = req.headers ?? {}
  if (typeof headers.get === 'function') return headers.get(name)
  return headers[name.toLowerCase()] ?? headers[name]
}

function cleanString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function splitFullName(fullName) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  return {
    firstName: parts[0] ?? '',
    lastName:  parts.slice(1).join(' '),
  }
}

function certificateFilename(fullName) {
  const slug = fullName
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
  return `certificate-${slug || 'recipient'}.jpg`
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  if (!verifyCertificateApiKey(getHeader(req, 'x-api-key'))) {
    return res.status(401).json({ error: 'Invalid API key' })
  }

  const { cohortLevel } = req.body ?? {}
  const requestedFullName = cleanString(req.body?.fullName)
  const legacyFirstName   = cleanString(req.body?.firstName)
  const legacyLastName    = cleanString(req.body?.lastName)
  const fullName = requestedFullName || [legacyFirstName, legacyLastName].filter(Boolean).join(' ').trim()
  const date = cleanString(req.body?.date) || cleanString(req.body?.cohortDate)

  if (!fullName) {
    return res.status(400).json({ error: 'fullName is required' })
  }
  if (!date) {
    return res.status(400).json({ error: 'date is required' })
  }

  // Resolve the app's own URL so Puppeteer can navigate to the certificate page.
  // Set APP_URL in Vercel env vars to your production domain (e.g. https://asset-gen.vercel.app).
  // Falls back to VERCEL_URL (auto-set by Vercel on every deployment).
  const appUrl =
    process.env.APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
  if (!appUrl) {
    return res.status(500).json({ error: 'APP_URL env var is not configured' })
  }

  const parsedName = splitFullName(fullName)
  const certFirstName = requestedFullName ? parsedName.firstName : (legacyFirstName || parsedName.firstName)
  const certLastName  = requestedFullName ? parsedName.lastName  : (legacyLastName  || parsedName.lastName)

  const hashPayload = encodeHashPayload({
    customerName: fullName,
    cohortLevel:  cohortLevel || 'Intermediate',
    cohortDate:   date,
    settings: {
      templateType:       'certificate',
      certProgram:        'systems-builder',
      certFirstName,
      certLastName,
      certFullName:       fullName,
      certGraduationDate: date,
      dims:               { w: 1080, h: 1080 },
    },
    dims: { w: 1080, h: 1080 },
  })

  // Navigate to /systems-builder with the data hash - App.jsx reads this via parseHashData().
  const targetUrl = `${appUrl}/systems-builder#data=${hashPayload}`

  const CHROMIUM_URL =
    'https://github.com/Sparticuz/chromium/releases/download/v148.0.0/chromium-v148.0.0-pack.tar'
  const executablePath =
    process.env.CHROMIUM_PATH ||
    (await chromium.executablePath(CHROMIUM_URL))

  let browser
  try {
    // When using a local Chrome (CHROMIUM_PATH), use plain args.
    // chromium.args are tuned for the stripped serverless Chromium binary and
    // cause session-closed errors against a full Chrome install.
    const isLocalChrome = !!process.env.CHROMIUM_PATH
    const args = isLocalChrome
      ? ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      : chromium.args

    browser = await puppeteer.launch({
      args,
      defaultViewport: { width: 1920, height: 1080 },
      executablePath,
      headless:        isLocalChrome ? true : chromium.headless,
    })

    const page = await browser.newPage()
    await page.setViewport({ width: 1920, height: 1080 })

    // networkidle0 ensures all fonts + images (including GTMGen-Certificate.jpg) are downloaded
    await page.goto(targetUrl, { waitUntil: 'networkidle0', timeout: 30000 })

    // Wait for canvas to exist and have been drawn (width > 0 means drawCertificateCanvas ran)
    await page.waitForFunction(
      () => {
        const c = document.querySelector('canvas')
        return c && c.width > 0 && c.height > 0
      },
      { timeout: 15000 },
    )

    // Extra buffer for React to re-render after fonts + floralia are ready
    await new Promise(r => setTimeout(r, 1500))

    const dataUrl = await page.evaluate(() => {
      const canvas = document.querySelector('canvas')
      return canvas.toDataURL('image/jpeg', 0.95)
    })

    const base64 = dataUrl.replace(/^data:image\/jpeg;base64,/, '')
    const buffer = Buffer.from(base64, 'base64')

    // Return as raw JPEG by default; ?format=json returns { image: "<base64>" }
    if (req.query?.format === 'json') {
      return res.status(200).json({ image: base64 })
    }

    res.setHeader('Content-Type', 'image/jpeg')
    res.setHeader('Content-Length', buffer.length)
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${certificateFilename(fullName)}"`,
    )
    return res.status(200).send(buffer)
  } catch (e) {
    return res.status(500).json({ error: e.message })
  } finally {
    if (browser) await browser.close()
  }
}
