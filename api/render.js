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

// Color palettes matching drawCanvas.js MODES
const PALETTES = {
  green:        { bg: '#f8fffb', text: '#000d05', pill: '#dfeae3', pillText: '#000d05', lineColor: '#008c44' },
  pink:         { bg: '#fff7ff', text: '#0d020a', pill: '#fee7fd', pillText: '#0d020a', lineColor: '#8c0044' },
  yellow:       { bg: '#fdfff3', text: '#0c0d01', pill: '#eeff8c', pillText: '#0c0d01', lineColor: '#7a7200' },
  blue:         { bg: '#f5f6ff', text: '#02020c', pill: '#e5e5ff', pillText: '#02020c', lineColor: '#0014a8' },
  'dark-green': { bg: '#002910', text: '#f8fffa', pill: '#001d0b', pillText: '#c0ffd2', lineColor: '#00ff64' },
  'dark-pink':  { bg: '#3a092c', text: '#fff7ff', pill: '#2a0620', pillText: '#c54b9b', lineColor: '#c54b9b' },
  'dark-yellow':{ bg: '#242603', text: '#fdfff3', pill: '#1a1c02', pillText: '#d4e87a', lineColor: '#7a7200' },
  'dark-blue':  { bg: '#0f0f57', text: '#f5f6ff', pill: '#0a0a3d', pillText: '#d0d0ff', lineColor: '#0014a8' },
}

// AirOps logo as SVG string for embedding
const AIROPS_LOGO_SVG = `<svg viewBox="0 0 784 252" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M111.828 65.6415V88.4663C101.564 72.0112 85.627 61.9258 65.9084 61.9258C23.7703 61.9258 0 92.9782 0 134.647C0 176.581 24.0404 208.695 66.4487 208.695C86.1672 208.695 101.834 198.609 111.828 182.154V204.979H144.782V65.6415H111.828ZM72.9315 181.093C48.8911 181.093 35.1152 159.064 35.1152 134.647C35.1152 110.76 48.621 89.7933 73.4717 89.7933C94.0006 89.7933 111.558 104.391 111.558 134.116C111.558 163.31 94.8109 181.093 72.9315 181.093Z" fill="currentColor"/>
<path d="M173.137 65.6494V204.987H208.252V65.6494H173.137Z" fill="currentColor"/>
<path d="M272.998 100.141V65.6386H237.883V204.976H272.998V125.355C272.998 104.919 287.314 96.691 300.82 96.691C308.653 96.691 316.757 98.8143 321.079 100.407V63.25C298.119 63.25 279.211 76.7856 272.998 100.141Z" fill="currentColor"/>
<path d="M329.629 108.115C329.629 151.377 359.882 182.163 403.371 182.163C447.13 182.163 477.115 151.377 477.115 108.115C477.115 65.6507 447.13 35.3945 403.371 35.3945C359.882 35.3945 329.629 65.6507 329.629 108.115ZM441.997 108.115C441.997 135.187 427.141 154.561 403.371 154.561C379.33 154.561 364.744 135.187 364.744 108.115C364.744 82.1058 379.33 63.2621 403.371 63.2621C427.141 63.2621 441.997 82.1058 441.997 108.115Z" fill="currentColor"/>
<path d="M575.086 61.9258C554.557 61.9258 537.81 73.869 528.896 92.9782V65.6415H493.781V251.425H528.896V180.031C538.891 197.282 557.529 208.695 577.247 208.695C615.604 208.695 642.345 179.235 642.345 137.035C642.345 92.7128 614.523 61.9258 575.086 61.9258ZM568.874 182.685C545.374 182.685 528.896 163.31 528.896 135.708C528.896 107.31 545.374 87.4047 568.874 87.4047C591.293 87.4047 607.23 107.841 607.23 136.77C607.23 163.841 591.293 182.685 568.874 182.685Z" fill="currentColor"/>
<path d="M653.555 156.675C653.555 181.889 676.244 208.695 721.624 208.695C767.274 208.695 783.751 182.42 783.751 161.983C783.751 130.666 746.205 125.092 721.084 120.315C704.066 117.395 693.262 115.007 693.262 105.452C693.262 94.5706 705.417 87.6701 718.383 87.6701C735.94 87.6701 742.693 99.6133 743.233 112.353H778.349C778.349 91.6511 763.492 61.9258 717.572 61.9258C677.865 61.9258 658.147 83.9544 658.147 107.575C658.147 141.282 696.233 144.732 721.354 149.509C735.94 152.163 748.636 155.348 748.636 165.699C748.636 176.05 736.21 182.95 722.975 182.95C710.549 182.95 688.67 176.05 688.67 156.675H653.555Z" fill="currentColor"/>
<path d="M191.339 48.6576C176.921 48.6576 166.578 38.4949 166.578 24.6368C166.578 10.7786 176.921 0 191.339 0C205.13 0 216.1 10.7786 216.1 24.6368C216.1 38.4949 205.13 48.6576 191.339 48.6576Z" fill="currentColor"/>
</svg>`

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

function quoteCard(p, palette, w, h) {
  const pad = 40
  const text = p.text ? `\u201C${p.text}\u201D` : ''
  const firstName = p.customerName ? p.customerName.split(' ')[0] : ''
  const lastName = p.customerName ? p.customerName.split(' ').slice(1).join(' ') : ''
  const roleCompany = [p.role, p.company].filter(Boolean).join(', ').toUpperCase()

  // Scale quote font based on text length
  const len = text.length
  let qFont = 96
  if (len > 200) qFont = 64
  else if (len > 140) qFont = 72
  else if (len > 80) qFont = 84

  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        width: '100%',
        height: '100%',
        backgroundColor: palette.bg,
        position: 'relative',
      },
      children: [
        // Left vertical line
        { type: 'div', props: { style: { position: 'absolute', left: `${pad}px`, top: '0', bottom: '0', width: '2px', backgroundColor: palette.lineColor } } },
        // Right vertical line
        { type: 'div', props: { style: { position: 'absolute', right: `${pad}px`, top: '0', bottom: '0', width: '2px', backgroundColor: palette.lineColor } } },
        // Content
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              width: '100%',
              height: '100%',
              padding: `${pad}px ${pad + 16}px`,
            },
            children: [
              // Quote text
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    flexDirection: 'column',
                    flexGrow: 1,
                    justifyContent: 'flex-start',
                    paddingTop: '0px',
                  },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: {
                          display: 'flex',
                          fontSize: `${qFont}px`,
                          fontFamily: 'Serrif',
                          color: palette.text,
                          lineHeight: 1.08,
                          letterSpacing: '-0.02em',
                        },
                        children: text,
                      },
                    },
                  ],
                },
              },
              // Attribution + logo
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  },
                  children: [
                    // Name line: — FirstName LastName
                    p.customerName ? {
                      type: 'div',
                      props: {
                        style: { display: 'flex', alignItems: 'baseline', gap: '0px' },
                        children: [
                          { type: 'div', props: { style: { display: 'flex', fontSize: '56px', fontFamily: 'Serrif', color: palette.text, letterSpacing: '-0.02em' }, children: '\u2014' } },
                          { type: 'div', props: { style: { display: 'flex', fontSize: '64px', fontFamily: 'Serrif', color: palette.text, letterSpacing: '-0.02em', marginLeft: '8px' }, children: firstName } },
                          { type: 'div', props: { style: { display: 'flex', fontSize: '64px', fontFamily: 'Saans', color: palette.text, marginLeft: '8px' }, children: lastName } },
                        ],
                      },
                    } : null,
                    // Role/Company pill
                    roleCompany ? {
                      type: 'div',
                      props: {
                        style: {
                          display: 'flex',
                          alignSelf: 'flex-start',
                          marginLeft: '64px',
                          marginTop: '4px',
                          marginBottom: '24px',
                        },
                        children: [{
                          type: 'div',
                          props: {
                            style: {
                              display: 'flex',
                              fontSize: '32px',
                              fontFamily: 'SaansMono',
                              fontWeight: 500,
                              letterSpacing: '0.06em',
                              color: palette.pillText,
                              backgroundColor: palette.pill,
                              padding: '2px 16px',
                            },
                            children: roleCompany,
                          },
                        }],
                      },
                    } : null,
                    // AirOps logo
                    {
                      type: 'div',
                      props: {
                        style: {
                          display: 'flex',
                          marginTop: '16px',
                          color: palette.text,
                          height: '72px',
                          width: '224px',
                        },
                        children: [{
                          type: 'img',
                          props: {
                            src: `data:image/svg+xml,${encodeURIComponent(AIROPS_LOGO_SVG.replace(/currentColor/g, palette.text))}`,
                            width: 224,
                            height: 72,
                            style: { display: 'flex' },
                          },
                        }],
                      },
                    },
                  ].filter(Boolean),
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

function buildCard(template, params, palette, w, h) {
  switch (template) {
    case 'quote':
    case 'richquote':
      return quoteCard(params, palette, w, h)
    case 'titlecard':
      return titleCard(params, palette)
    case 'twitter':
      return tweetCard(params, palette)
    default:
      return quoteCard(params, palette, w, h)
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

    const element = buildCard(template, fields, palette, w, h)

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
