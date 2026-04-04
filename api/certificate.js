import chromium from '@sparticuz/chromium'
import puppeteer from 'puppeteer-core'

// Encode payload to match App.jsx parseHashData:
//   JSON.parse(decodeURIComponent(escape(atob(b64))))
// Inverse: Buffer.from(json, 'utf8').toString('base64')
function encodeHashPayload(payload) {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64')
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const { firstName, lastName, cohortDate, cohortLevel } = req.body ?? {}
  if (!firstName && !lastName) {
    return res.status(400).json({ error: 'firstName or lastName is required' })
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

  const hashPayload = encodeHashPayload({
    customerName: [firstName, lastName].filter(Boolean).join(' '),
    cohortLevel:  cohortLevel || 'Intermediate',
    cohortDate:   cohortDate  || '',
  })

  // Navigate to /certificate with the data hash — App.jsx reads this via parseHashData()
  const targetUrl = `${appUrl}/certificate#data=${hashPayload}`

  const executablePath =
    process.env.CHROMIUM_PATH ||
    (await chromium.executablePath())

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
      headless:        true,
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
      `inline; filename="certificate-${[firstName, lastName].filter(Boolean).join('-')}.jpg"`,
    )
    return res.status(200).send(buffer)
  } catch (e) {
    return res.status(500).json({ error: e.message })
  } finally {
    if (browser) await browser.close()
  }
}
