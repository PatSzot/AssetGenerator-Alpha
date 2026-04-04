import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import { readFileSync } from 'fs'
import { join } from 'path'

/**
 * Server-side card renderer using Satori (SVG) + resvg (PNG).
 * No Chromium needed.
 *
 * POST /api/render?format=json
 * Body: { template, text, customerName, company, role, eyebrow,
 *         serifTitle, sansTitle, body, cta, colorMode, w, h }
 */

const VALID_TEMPLATES = new Set(['quote', 'richquote', 'titlecard', 'twitter', 'ijoined'])

// Color palettes matching the canvas renderer
const PALETTES = {
  green:        { bg: '#f8fffa', text: '#002910', accent: '#057a28', pill: '#eef9f3', pillBorder: '#057a28' },
  pink:         { bg: '#fff7ff', text: '#3a092c', accent: '#c54b9b', pill: '#fee7fd', pillBorder: '#c54b9b' },
  yellow:       { bg: '#fdfff3', text: '#242603', accent: '#586605', pill: '#eeff8c', pillBorder: '#d4e87a' },
  blue:         { bg: '#f5f6ff', text: '#0f0f57', accent: '#1b1b8f', pill: '#e5e5ff', pillBorder: '#1b1b8f' },
  'dark-green': { bg: '#002910', text: '#f8fffa', accent: '#00ff64', pill: '#001d0b', pillBorder: '#c0ffd2' },
  'dark-pink':  { bg: '#3a092c', text: '#fff7ff', accent: '#c54b9b', pill: '#2a0620', pillBorder: '#c54b9b' },
  'dark-yellow':{ bg: '#242603', text: '#fdfff3', accent: '#eeff8c', pill: '#1a1c02', pillBorder: '#d4e87a' },
  'dark-blue':  { bg: '#0f0f57', text: '#f5f6ff', accent: '#8080ff', pill: '#0a0a3d', pillBorder: '#d0d0ff' },
}

function loadFont(name) {
  try {
    return readFileSync(join(process.cwd(), 'public', name))
  } catch {
    return null
  }
}

function getFonts() {
  const fonts = []
  const saans = loadFont('Saans-Regular.ttf')
  const saansMed = loadFont('Saans-Medium.ttf')
  const saansBold = loadFont('Saans-Bold.ttf')
  const mono = loadFont('SaansMono-Medium.ttf')
  const serif = loadFont('Serrif-Regular.otf')

  if (saans) fonts.push({ name: 'Saans', data: saans, weight: 400, style: 'normal' })
  if (saansMed) fonts.push({ name: 'Saans', data: saansMed, weight: 500, style: 'normal' })
  if (saansBold) fonts.push({ name: 'Saans', data: saansBold, weight: 700, style: 'normal' })
  if (mono) fonts.push({ name: 'SaansMono', data: mono, weight: 500, style: 'normal' })
  if (serif) fonts.push({ name: 'Serrif', data: serif, weight: 400, style: 'normal' })

  return fonts
}

// ─── Card layouts ──────────────────────────────────────────────────────────

function quoteCard(p, palette) {
  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: palette.bg,
        padding: '80px',
        fontFamily: 'Saans',
      },
      children: [
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              fontSize: '72px',
              fontFamily: 'Serrif',
              color: palette.accent,
              marginBottom: '16px',
              lineHeight: 1,
            },
            children: '\u201C',
          },
        },
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              fontSize: '36px',
              color: palette.text,
              lineHeight: 1.4,
              marginBottom: '48px',
              fontFamily: 'Serrif',
            },
            children: p.text || '',
          },
        },
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'column', gap: '4px' },
            children: [
              {
                type: 'div',
                props: {
                  style: { display: 'flex', fontSize: '20px', fontWeight: 500, color: palette.text },
                  children: p.customerName || '',
                },
              },
              {
                type: 'div',
                props: {
                  style: { display: 'flex', fontSize: '16px', color: palette.accent },
                  children: [p.role, p.company].filter(Boolean).join(', '),
                },
              },
            ],
          },
        },
      ],
    },
  }
}

function titleCard(p, palette) {
  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: palette.bg,
        padding: '80px',
        fontFamily: 'Saans',
      },
      children: [
        p.eyebrow ? {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              fontSize: '14px',
              fontFamily: 'SaansMono',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: palette.accent,
              marginBottom: '24px',
              padding: '8px 16px',
              border: `1px solid ${palette.pillBorder}`,
              backgroundColor: palette.pill,
              borderRadius: '5px',
              alignSelf: 'flex-start',
            },
            children: p.eyebrow,
          },
        } : null,
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              fontSize: '72px',
              fontFamily: 'Serrif',
              color: palette.text,
              lineHeight: 1.04,
              letterSpacing: '-0.02em',
              marginBottom: '8px',
            },
            children: p.serifTitle || '',
          },
        },
        p.sansTitle ? {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              fontSize: '72px',
              fontFamily: 'Saans',
              color: palette.text,
              lineHeight: 1.04,
              letterSpacing: '-0.03em',
              marginBottom: '32px',
            },
            children: p.sansTitle,
          },
        } : null,
        p.body ? {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              fontSize: '24px',
              color: palette.text,
              lineHeight: 1.3,
              marginBottom: '32px',
              opacity: 0.8,
            },
            children: p.body,
          },
        } : null,
        p.cta ? {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              fontSize: '20px',
              fontWeight: 500,
              color: '#002910',
              backgroundColor: '#00ff64',
              padding: '16px 32px',
              borderRadius: '58px',
              alignSelf: 'flex-start',
            },
            children: p.cta,
          },
        } : null,
      ].filter(Boolean),
    },
  }
}

function tweetCard(p, palette) {
  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: palette.bg,
        padding: '80px',
        fontFamily: 'Saans',
      },
      children: [
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '32px' },
            children: [
              {
                type: 'div',
                props: {
                  style: { display: 'flex', fontSize: '20px', fontWeight: 500, color: palette.text },
                  children: p.authorName || '',
                },
              },
              {
                type: 'div',
                props: {
                  style: { display: 'flex', fontSize: '16px', color: palette.accent },
                  children: p.authorHandle ? `@${p.authorHandle.replace('@', '')}` : '',
                },
              },
            ],
          },
        },
        {
          type: 'div',
          props: {
            style: { display: 'flex', fontSize: '32px', color: palette.text, lineHeight: 1.4 },
            children: p.text || '',
          },
        },
      ],
    },
  }
}

function buildCard(template, params, palette) {
  switch (template) {
    case 'quote':
    case 'richquote':
      return quoteCard(params, palette)
    case 'titlecard':
      return titleCard(params, palette)
    case 'twitter':
      return tweetCard(params, palette)
    default:
      return quoteCard(params, palette)
  }
}

// ─── Handler ───────────────────────────────────────────────────────────────

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

  const w = Number(fields.w) || 1080
  const h = Number(fields.h) || 1080
  const colorMode = fields.colorMode || 'green'
  const palette = PALETTES[colorMode] || PALETTES.green

  try {
    const fonts = getFonts()
    if (fonts.length === 0) {
      return res.status(500).json({ error: 'No fonts found' })
    }

    const element = buildCard(template, fields, palette)

    const svg = await satori(element, { width: w, height: h, fonts })

    const resvg = new Resvg(svg, {
      fitTo: { mode: 'width', value: w },
    })
    const pngData = resvg.render()
    const pngBuffer = pngData.asPng()

    if (req.query?.format === 'json') {
      return res.status(200).json({ image: pngBuffer.toString('base64') })
    }

    res.setHeader('Content-Type', 'image/png')
    res.setHeader('Content-Length', pngBuffer.length)
    res.setHeader('Content-Disposition', `inline; filename="${template}.png"`)
    return res.status(200).send(pngBuffer)
  } catch (e) {
    console.error('[render] Error:', e)
    return res.status(500).json({ error: e.message })
  }
}
