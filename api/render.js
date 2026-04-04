import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

/**
 * Server-side card renderer using Satori (SVG) + resvg (PNG).
 * No Chromium needed.
 *
 * POST /api/render?format=json
 * Body: { template, text, customerName, company, role, eyebrow,
 *         serifTitle, sansTitle, body, cta, colorMode, w, h }
 */

const VALID_TEMPLATES = new Set(['quote', 'richquote', 'titlecard', 'twitter', 'ijoined', 'dataviz'])

// Color palettes matching drawCanvas.js MODES + drawTitleCardCanvas.js accents
const PALETTES = {
  green:        { bg: '#f8fffb', text: '#000d05', pill: '#dfeae3', pillText: '#000d05', lineColor: '#008c44', ctaText: '#002910', accent: '#008c44' },
  pink:         { bg: '#fff7ff', text: '#0d020a', pill: '#fee7fd', pillText: '#0d020a', lineColor: '#8c0044', ctaText: '#3a092c', accent: '#8c0044' },
  yellow:       { bg: '#fdfff3', text: '#0c0d01', pill: '#eeff8c', pillText: '#0c0d01', lineColor: '#7a7200', ctaText: '#242603', accent: '#7a7200' },
  blue:         { bg: '#f5f6ff', text: '#02020c', pill: '#e5e5ff', pillText: '#02020c', lineColor: '#0014a8', ctaText: '#0e0e57', accent: '#0014a8' },
  'dark-green': { bg: '#0f2412', text: '#e8f5ee', pill: '#001408', pillText: '#c0ffd2', lineColor: 'rgba(0,210,80,1)', ctaText: '#002910', accent: 'rgba(0,210,80,1)' },
  'dark-pink':  { bg: '#230a1e', text: '#f5e8f2', pill: '#140006', pillText: '#c54b9b', lineColor: 'rgba(210,0,160,1)', ctaText: '#3a092c', accent: 'rgba(210,0,160,1)' },
  'dark-yellow':{ bg: '#1c1d03', text: '#f5f5e0', pill: '#0e0e00', pillText: '#d4e87a', lineColor: 'rgba(190,190,0,1)', ctaText: '#242603', accent: 'rgba(190,190,0,1)' },
  'dark-blue':  { bg: '#0f0f5a', text: '#e5e5ff', pill: '#00000e', pillText: '#d0d0ff', lineColor: 'rgba(100,100,255,1)', ctaText: '#0e0e57', accent: 'rgba(100,100,255,1)' },
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

// ─── Bundled customer logos ─────────────────────────────────────────────────

function loadCustomerLogo(companyName) {
  if (!companyName) return null
  const key = companyName.toLowerCase().replace(/[.\s]+/g, '').replace(/,/g, '')
  const svgPath = join(process.cwd(), 'public', 'logos', `${key}.svg`)
  if (!existsSync(svgPath)) return null
  const svg = readFileSync(svgPath, 'utf8')
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

// ─── Card layouts ──────────────────────────────────────────────────────────

function quoteCard(p, palette, w, h) {
  const pad = 40
  const isLand = w > h
  const text = p.text ? `\u201C${p.text}\u201D` : ''
  const firstName = p.customerName ? p.customerName.split(' ')[0] : ''
  const lastName = p.customerName ? p.customerName.split(' ').slice(1).join(' ') : ''
  const roleCompany = [p.role, p.company].filter(Boolean).join(',  ').toUpperCase()

  // Auto-shrink quote font to fit — start large like the canvas renderer
  const baseQ = isLand ? 120 : 96
  const len = text.length
  let qFont = baseQ
  if (len > 300) qFont = Math.max(48, baseQ - 40)
  else if (len > 200) qFont = Math.max(56, baseQ - 28)
  else if (len > 140) qFont = Math.max(64, baseQ - 18)
  else if (len > 80) qFont = Math.max(72, baseQ - 10)

  const logoH = 72

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
              padding: `${pad}px ${pad + 8}px`,
            },
            children: [
              // Quote text — fills top area
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
              // Bottom section: attribution + logo
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    flexDirection: 'column',
                  },
                  children: [
                    // — FirstName LastName
                    p.customerName ? {
                      type: 'div',
                      props: {
                        style: { display: 'flex', alignItems: 'baseline' },
                        children: [
                          { type: 'div', props: { style: { display: 'flex', fontSize: `${dashSz}px`, fontFamily: 'Serrif', color: palette.text, letterSpacing: '-0.02em' }, children: '\u2014' } },
                          { type: 'div', props: { style: { display: 'flex', fontSize: `${nameSz}px`, fontFamily: 'Serrif', color: palette.text, letterSpacing: '-0.02em', marginLeft: '8px' }, children: firstName } },
                          lastName ? { type: 'div', props: { style: { display: 'flex', fontSize: `${nameSz}px`, fontFamily: 'Saans', color: palette.text, marginLeft: '10px' }, children: lastName } } : null,
                        ].filter(Boolean),
                      },
                    } : null,
                    // ROLE, COMPANY pill — indented under the dash
                    roleCompany ? {
                      type: 'div',
                      props: {
                        style: {
                          display: 'flex',
                          alignSelf: 'flex-start',
                          marginLeft: '68px',
                          marginTop: '4px',
                        },
                        children: [{
                          type: 'div',
                          props: {
                            style: {
                              display: 'flex',
                              fontSize: `${pillSz}px`,
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
                    // AirOps logo — bottom left with space above
                    {
                      type: 'div',
                      props: {
                        style: {
                          display: 'flex',
                          marginTop: '40px',
                        },
                        children: [{
                          type: 'img',
                          props: {
                            src: `data:image/svg+xml,${encodeURIComponent(AIROPS_LOGO_SVG.replace(/currentColor/g, palette.text))}`,
                            width: 224,
                            height: logoH,
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

function richQuoteCard(p, palette, w, h) {
  const isLand = w > h
  const contentPad = isLand ? 53 : 40
  const half = Math.floor(w / 2)
  const text = p.text || ''
  const firstName = p.customerName ? p.customerName.split(' ')[0] : ''
  const lastName = p.customerName ? p.customerName.split(' ').slice(1).join(' ') : ''
  const role = p.role || ''

  // Responsive sizes matching drawRichQuoteCanvas
  const nameSz = isLand ? 120 : 96
  const nameLH = nameSz * 0.84
  const quoteSzBase = isLand ? 64 : 56

  // Auto-size quote text
  const len = text.length
  let qFont = quoteSzBase
  if (len > 300) qFont = Math.max(28, quoteSzBase - 24)
  else if (len > 200) qFont = Math.max(36, quoteSzBase - 16)
  else if (len > 120) qFont = Math.max(44, quoteSzBase - 8)

  // Left column: stippled headshot (top) + company logo panel (bottom)
  const logoAreaH = isLand ? 203 : Math.floor(h * 0.2)
  const photoAreaH = h - logoAreaH

  const leftChildren = [
    // Headshot image
    p.headshotImage ? {
      type: 'div',
      props: {
        style: {
          display: 'flex',
          width: `${half}px`,
          height: `${photoAreaH}px`,
          overflow: 'hidden',
        },
        children: [{
          type: 'img',
          props: {
            src: p.headshotImage,
            width: half,
            height: photoAreaH,
            style: { display: 'flex', objectFit: 'cover', width: '100%', height: '100%' },
          },
        }],
      },
    } : {
      type: 'div',
      props: {
        style: {
          display: 'flex',
          width: `${half}px`,
          height: `${photoAreaH}px`,
          backgroundColor: palette.pill,
        },
      },
    },
    // Company logo area
    {
      type: 'div',
      props: {
        style: {
          display: 'flex',
          width: `${half}px`,
          height: `${logoAreaH}px`,
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px 40px',
        },
        children: p.companyLogoImage ? [{
          type: 'img',
          props: {
            src: p.companyLogoImage,
            height: Math.floor(logoAreaH * 0.5),
            style: { display: 'flex', maxWidth: `${half - 80}px`, objectFit: 'contain' },
          },
        }] : [],
      },
    },
  ].filter(Boolean)

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
        // Vertical divider line at center
        { type: 'div', props: { style: { position: 'absolute', left: `${half}px`, top: '0', bottom: '0', width: '2px', backgroundColor: palette.lineColor } } },
        // Left column
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              width: `${half}px`,
              height: '100%',
            },
            children: leftChildren,
          },
        },
        // Right column: name + role + quote
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              width: `${half}px`,
              height: '100%',
              padding: `${contentPad}px ${contentPad}px`,
            },
            children: [
              // First name (serif)
              firstName ? {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    fontSize: `${nameSz}px`,
                    fontFamily: 'Serrif',
                    color: palette.text,
                    lineHeight: 0.84,
                    letterSpacing: '-0.02em',
                  },
                  children: firstName,
                },
              } : null,
              // Last name (sans)
              lastName ? {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    fontSize: `${nameSz}px`,
                    fontFamily: 'Saans',
                    fontWeight: 700,
                    color: palette.text,
                    lineHeight: 0.84,
                    letterSpacing: '-0.02em',
                    marginBottom: '24px',
                  },
                  children: lastName,
                },
              } : null,
              // Role
              role ? {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    fontSize: '28px',
                    fontFamily: 'Saans',
                    fontWeight: 500,
                    color: palette.text,
                    lineHeight: 1.3,
                    marginBottom: '24px',
                  },
                  children: role,
                },
              } : null,
              // Quote text
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    flexGrow: 1,
                    alignItems: 'flex-end',
                    fontSize: `${qFont}px`,
                    fontFamily: 'Saans',
                    fontWeight: 700,
                    color: palette.text,
                    lineHeight: 1.14,
                  },
                  children: text,
                },
              },
            ].filter(Boolean),
          },
        },
      ],
    },
  }
}

function titleCard(p, palette, w, h) {
  const pad = 40
  const isLand = w > h
  const serifSz = isLand ? 148 : 112
  const sansSz = isLand ? 144 : 108
  const subSz = 40
  const eyebrowSz = 28
  const logoH = 56

  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        width: '100%',
        height: '100%',
        backgroundColor: palette.bg,
        position: 'relative',
        fontFamily: 'Saans',
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
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              padding: `${pad}px ${pad + 8}px`,
            },
            children: [
              // Logo top center
              {
                type: 'div',
                props: {
                  style: { display: 'flex', marginBottom: '32px' },
                  children: [{
                    type: 'img',
                    props: {
                      src: `data:image/svg+xml,${encodeURIComponent(AIROPS_LOGO_SVG.replace(/currentColor/g, palette.text))}`,
                      width: Math.round(784 * logoH / 252),
                      height: logoH,
                      style: { display: 'flex' },
                    },
                  }],
                },
              },
              // Eyebrow pill
              p.eyebrow ? {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    fontSize: `${eyebrowSz}px`,
                    fontFamily: 'SaansMono',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: palette.accent,
                    marginBottom: '24px',
                    padding: '8px 16px',
                    border: `1.5px solid ${palette.accent}`,
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                  },
                  children: p.eyebrow,
                },
              } : null,
              // Serif title
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    fontSize: `${serifSz}px`,
                    fontFamily: 'Serrif',
                    color: palette.text,
                    lineHeight: 1.08,
                    letterSpacing: '-0.02em',
                    textAlign: 'center',
                    justifyContent: 'center',
                  },
                  children: p.serifTitle || '',
                },
              },
              // Sans title
              p.sansTitle ? {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    fontSize: `${sansSz}px`,
                    fontFamily: 'Saans',
                    color: palette.text,
                    lineHeight: 1.08,
                    letterSpacing: '-0.02em',
                    textAlign: 'center',
                    justifyContent: 'center',
                    marginBottom: '24px',
                  },
                  children: p.sansTitle,
                },
              } : null,
              // Body / subheadline
              p.body ? {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    fontSize: `${subSz}px`,
                    color: palette.text,
                    lineHeight: 1.14,
                    marginBottom: '8px',
                    textAlign: 'center',
                    justifyContent: 'center',
                    maxWidth: '1000px',
                  },
                  children: p.body,
                },
              } : null,
              // CTA pill
              p.cta ? {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    fontSize: '40px',
                    fontWeight: 600,
                    color: palette.ctaText,
                    backgroundColor: '#00ff64',
                    padding: '20px 48px',
                    borderRadius: '52px',
                    marginTop: '24px',
                  },
                  children: p.cta,
                },
              } : null,
            ].filter(Boolean),
          },
        },
      ],
    },
  }
}

function tweetCard(p, palette, w, h) {
  const pad = 40
  const isLand = w > h
  const nameSz = isLand ? 36 : 46
  const handleSz = isLand ? 24 : 30
  const avatarSz = Math.round(nameSz * 1.15 + handleSz)
  const boxPadX = isLand ? 52 : 64
  const boxPadY = isLand ? 52 : 64
  const logoH = 72

  // Auto-size tweet text
  const baseTFont = isLand ? 52 : 68
  const len = (p.text || '').length
  let tFont = baseTFont
  if (len > 300) tFont = Math.max(28, baseTFont - 30)
  else if (len > 200) tFont = Math.max(34, baseTFont - 20)
  else if (len > 120) tFont = Math.max(40, baseTFont - 12)

  const handle = p.authorHandle ? (p.authorHandle.startsWith('@') ? p.authorHandle : `@${p.authorHandle}`) : ''
  const initials = (p.authorName || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'

  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        width: '100%',
        height: '100%',
        backgroundColor: palette.bg,
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
      },
      children: [
        // Left vertical line
        { type: 'div', props: { style: { position: 'absolute', left: `${pad}px`, top: '0', bottom: '0', width: '2px', backgroundColor: palette.lineColor } } },
        // Right vertical line
        { type: 'div', props: { style: { position: 'absolute', right: `${pad}px`, top: '0', bottom: '0', width: '2px', backgroundColor: palette.lineColor } } },
        // White content box
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              width: `${w - pad * 2}px`,
              backgroundColor: '#ffffff',
              padding: `${boxPadY}px ${boxPadX}px`,
              // Horizontal guide lines as borders
              borderTop: `2px solid ${palette.lineColor}`,
              borderBottom: `2px solid ${palette.lineColor}`,
            },
            children: [
              // Author row: avatar + name/handle
              {
                type: 'div',
                props: {
                  style: { display: 'flex', alignItems: 'center', marginBottom: '36px' },
                  children: [
                    // Avatar circle with initials
                    {
                      type: 'div',
                      props: {
                        style: {
                          display: 'flex',
                          width: `${avatarSz}px`,
                          height: `${avatarSz}px`,
                          borderRadius: '50%',
                          backgroundColor: palette.pill,
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: `${Math.round(avatarSz * 0.38)}px`,
                          fontWeight: 500,
                          color: palette.pillText,
                          marginRight: '20px',
                          flexShrink: 0,
                        },
                        children: initials,
                      },
                    },
                    // Name + handle
                    {
                      type: 'div',
                      props: {
                        style: { display: 'flex', flexDirection: 'column' },
                        children: [
                          {
                            type: 'div',
                            props: {
                              style: { display: 'flex', fontSize: `${nameSz}px`, fontWeight: 700, color: palette.text },
                              children: p.authorName || '',
                            },
                          },
                          handle ? {
                            type: 'div',
                            props: {
                              style: { display: 'flex', fontSize: `${handleSz}px`, fontWeight: 500, fontFamily: 'SaansMono', letterSpacing: '0.02em', color: palette.pillText, opacity: 0.55 },
                              children: handle,
                            },
                          } : null,
                        ].filter(Boolean),
                      },
                    },
                  ],
                },
              },
              // Tweet text
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    fontSize: `${tFont}px`,
                    fontWeight: 500,
                    color: palette.text,
                    lineHeight: 1.2,
                  },
                  children: p.text || '',
                },
              },
            ],
          },
        },
        // Logo bottom center
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              bottom: `${pad}px`,
              left: '50%',
              transform: 'translateX(-50%)',
            },
            children: [{
              type: 'img',
              props: {
                src: `data:image/svg+xml,${encodeURIComponent(AIROPS_LOGO_SVG.replace(/currentColor/g, palette.text))}`,
                width: Math.round(784 * logoH / 252),
                height: logoH,
                style: { display: 'flex' },
              },
            }],
          },
        },
      ],
    },
  }
}

// ─── Data Viz fallback (Satori-based bar chart) ───────────────────────────

function dataVizCard(p, palette, w, h) {
  const pad = 40
  const isDark = (p.colorMode || 'light') === 'dark' || (p.colorMode || '') === 'midnight'
  const bg = isDark ? '#00250e' : '#ffffff'
  const textColor = isDark ? '#f8fffa' : '#002910'
  const barFill = '#ccffe0'
  const barAccent = '#eeff8c'
  const borderColor = '#009b32'
  const axisColor = '#a9a9a9'

  // Parse data
  const rows = (p.data || '').split('\n').filter(Boolean).map(line => {
    const [label, ...rest] = line.split(':')
    const val = parseFloat(rest.join(':').replace(/[,%$]/g, '').trim()) || 0
    return { label: label.trim(), value: val }
  })

  const maxVal = Math.max(...rows.map(r => r.value), 1)
  const chartAreaW = w - pad * 4
  const barMaxH = h * 0.45
  const barW = Math.min(80, (chartAreaW / rows.length) * 0.6)
  const barGap = rows.length > 0 ? (chartAreaW - barW * rows.length) / (rows.length + 1) : 0

  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        backgroundColor: bg,
        border: `1px solid ${borderColor}`,
        padding: `${pad}px`,
        fontFamily: 'Saans',
        position: 'relative',
      },
      children: [
        // Title
        p.title ? {
          type: 'div',
          props: {
            style: { display: 'flex', fontSize: '40px', fontFamily: 'Serrif', color: textColor, letterSpacing: '-0.02em', marginBottom: '8px' },
            children: p.title,
          },
        } : null,
        // Subtitle
        p.subtitle ? {
          type: 'div',
          props: {
            style: { display: 'flex', fontSize: '14px', fontFamily: 'SaansMono', color: axisColor, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '24px' },
            children: p.subtitle,
          },
        } : null,
        // Subcopy
        p.subcopy ? {
          type: 'div',
          props: {
            style: { display: 'flex', fontSize: '18px', color: textColor, marginBottom: '32px', lineHeight: 1.4 },
            children: p.subcopy,
          },
        } : null,
        // Bar chart area
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexGrow: 1, alignItems: 'flex-end', justifyContent: 'center', gap: `${barGap}px`, paddingBottom: '40px' },
            children: rows.map((row, i) => ({
              type: 'div',
              props: {
                style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' },
                children: [
                  // Value label
                  {
                    type: 'div',
                    props: {
                      style: { display: 'flex', fontSize: '14px', fontFamily: 'SaansMono', fontWeight: 500, color: textColor },
                      children: String(row.value),
                    },
                  },
                  // Bar
                  {
                    type: 'div',
                    props: {
                      style: {
                        display: 'flex',
                        width: `${barW}px`,
                        height: `${Math.max(4, (row.value / maxVal) * barMaxH)}px`,
                        backgroundColor: i === rows.length - 1 ? barAccent : barFill,
                        border: `1px solid ${isDark ? borderColor : '#002910'}`,
                      },
                    },
                  },
                  // Label
                  {
                    type: 'div',
                    props: {
                      style: { display: 'flex', fontSize: '12px', fontFamily: 'SaansMono', fontWeight: 500, color: axisColor, textTransform: 'uppercase', letterSpacing: '0.08em' },
                      children: row.label,
                    },
                  },
                ],
              },
            })),
          },
        },
        // AirOps Research logo bottom-right
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              bottom: '-1px',
              right: '-1px',
              border: `1px solid ${borderColor}`,
              backgroundColor: '#ffffff',
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
            },
            children: [{
              type: 'img',
              props: {
                src: `data:image/svg+xml,${encodeURIComponent(AIROPS_LOGO_SVG.replace(/currentColor/g, '#001408'))}`,
                width: 100,
                height: 32,
                style: { display: 'flex' },
              },
            }],
          },
        },
      ].filter(Boolean),
    },
  }
}

function buildCard(template, params, palette, w, h) {
  switch (template) {
    case 'quote':
      return quoteCard(params, palette, w, h)
    case 'richquote':
      return richQuoteCard(params, palette, w, h)
    case 'titlecard':
      return titleCard(params, palette, w, h)
    case 'twitter':
      return tweetCard(params, palette, w, h)
    case 'dataviz':
      return dataVizCard(params, palette, w, h)
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

    // Auto-load bundled customer logo if company is provided but no logo image
    if (fields.company && !fields.companyLogoImage) {
      const bundled = loadCustomerLogo(fields.company)
      if (bundled) fields.companyLogoImage = bundled
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
