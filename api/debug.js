/**
 * GET /api/debug
 *
 * Reports the function runtime state so we can diagnose
 * FUNCTION_INVOCATION_FAILED on /api/screenshot without dashboard access.
 *
 * Each import is wrapped in try/catch — if any module fails to load, the
 * function still responds with the error instead of crashing at boot.
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  const report = {
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    env: {
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
      APP_URL: process.env.APP_URL,
    },
    imports: {},
  }

  try {
    const chromium = (await import('@sparticuz/chromium-min')).default
    report.imports.chromium = {
      ok: true,
      args: Array.isArray(chromium?.args) ? chromium.args.length : null,
      headless: chromium?.headless,
      hasExecutablePath: typeof chromium?.executablePath === 'function',
    }
  } catch (e) {
    report.imports.chromium = { ok: false, error: e.message, stack: e.stack?.split('\n').slice(0, 5) }
  }

  try {
    const puppeteer = (await import('puppeteer-core')).default
    report.imports.puppeteer = {
      ok: true,
      hasLaunch: typeof puppeteer?.launch === 'function',
    }
  } catch (e) {
    report.imports.puppeteer = { ok: false, error: e.message, stack: e.stack?.split('\n').slice(0, 5) }
  }

  try {
    const { TEMPLATES } = await import('./_templates.js')
    report.imports.templates = { ok: true, count: TEMPLATES.length }
  } catch (e) {
    report.imports.templates = { ok: false, error: e.message }
  }

  return res.status(200).json(report)
}
