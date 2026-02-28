import { buildLogo } from './drawCanvas.js'
import { STIPPLE_COLORS } from './drawFleurons.js'

const CARD_BG    = '#f8fffb'
const CARD_TEXT  = '#002910'
const CARD_GREEN = '#008c44'
const CANVAS_BG  = '#000d05'

// ── Star polygon path (caller fills/strokes)
function starPath(ctx, cx, cy, outerR, innerR, points) {
  ctx.beginPath()
  for (let i = 0; i < points * 2; i++) {
    const a = (i * Math.PI / points) - Math.PI / 2
    const r = i % 2 === 0 ? outerR : innerR
    i === 0
      ? ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a))
      : ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a))
  }
  ctx.closePath()
}

// ── Diamond fill (half-size s, centered at cx/cy)
function fillDiamond(ctx, cx, cy, s, color) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(cx,     cy - s)
  ctx.lineTo(cx + s, cy)
  ctx.lineTo(cx,     cy + s)
  ctx.lineTo(cx - s, cy)
  ctx.closePath()
  ctx.fill()
}

// ── Decorative vine strip (vertical) with diamonds
function drawVineStrip(ctx, cx, topY, botY, s) {
  ctx.strokeStyle = CARD_GREEN
  ctx.lineWidth   = Math.max(1, s)
  ctx.globalAlpha = 0.45
  ctx.beginPath()
  ctx.moveTo(cx, topY)
  ctx.lineTo(cx, botY)
  ctx.stroke()
  const numD = 7
  for (let i = 0; i < numD; i++) {
    const dy  = topY + (i + 0.5) * (botY - topY) / numD
    const ds  = i === Math.floor(numD / 2) ? Math.round(5 * s) : Math.round(3 * s)
    fillDiamond(ctx, cx, dy, ds, CARD_GREEN)
  }
  ctx.globalAlpha = 1
  ctx.lineWidth   = 1
}

// ── AirOps University seal (procedural)
function drawSeal(ctx, cx, cy, size, sans, serif) {
  const R = size / 2
  const lS = size / 184.6  // scale vs Figma 184.6px reference

  // Outer star burst — 24-point star
  starPath(ctx, cx, cy, R, R * 0.905, 24)
  ctx.fillStyle = CARD_GREEN
  ctx.fill()

  // Thin white ring
  starPath(ctx, cx, cy, R * 0.902, R * 0.884, 24)
  ctx.fillStyle = CARD_BG
  ctx.fill()

  // Second green star ring
  starPath(ctx, cx, cy, R * 0.881, R * 0.862, 24)
  ctx.fillStyle = CARD_GREEN
  ctx.fill()

  // Green disc fill
  ctx.beginPath()
  ctx.arc(cx, cy, R * 0.852, 0, Math.PI * 2)
  ctx.fillStyle = CARD_GREEN
  ctx.fill()

  // ── Circular text
  const textR  = R * 0.71
  const textSz = Math.max(6, Math.round(R * 0.115))
  ctx.fillStyle    = '#ffffff'
  ctx.font         = `600 ${textSz}px ${sans}`
  ctx.letterSpacing = '0px'
  ctx.textBaseline = 'middle'
  ctx.textAlign    = 'center'

  // Top arc "AIROPS UNIVERSITY" — 140° arc
  const topText = 'AIROPS UNIVERSITY'
  const topArc  = 2.44  // radians ≈ 140°
  for (let i = 0; i < topText.length; i++) {
    const a = -Math.PI / 2 - topArc / 2 + (i + 0.5) * topArc / topText.length
    ctx.save()
    ctx.translate(cx + textR * Math.cos(a), cy + textR * Math.sin(a))
    ctx.rotate(a + Math.PI / 2)
    ctx.fillText(topText[i], 0, 0)
    ctx.restore()
  }

  // Bottom arc "CRAFT QUALITY CONTENT" — 155° arc, counter-clockwise (left-to-right from outside)
  const botText = 'CRAFT QUALITY CONTENT'
  const botArc  = 2.70  // radians ≈ 155°
  for (let i = 0; i < botText.length; i++) {
    const a = Math.PI / 2 + botArc / 2 - (i + 0.5) * botArc / botText.length
    ctx.save()
    ctx.translate(cx + textR * Math.cos(a), cy + textR * Math.sin(a))
    ctx.rotate(a - Math.PI / 2)
    ctx.fillText(botText[i], 0, 0)
    ctx.restore()
  }

  // Dots at the junction points (sides where top and bottom arcs meet)
  const dotR = Math.max(1.5, 2 * lS)
  ;[Math.PI / 2 - botArc / 2, Math.PI / 2 + botArc / 2].forEach(a => {
    ctx.beginPath()
    ctx.arc(cx + textR * Math.cos(a), cy + textR * Math.sin(a), dotR, 0, Math.PI * 2)
    ctx.fillStyle = '#ffffff'
    ctx.fill()
  })

  // Inner white fill circle for letters
  const innerR = R * 0.572  // 52.9 / 92.3
  ctx.beginPath()
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2)
  ctx.fillStyle = CARD_BG
  ctx.fill()

  // Subtle inner circle border
  ctx.beginPath()
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2)
  ctx.strokeStyle = CARD_GREEN
  ctx.lineWidth   = Math.max(1, lS)
  ctx.globalAlpha = 0.3
  ctx.stroke()
  ctx.globalAlpha = 1
  ctx.lineWidth   = 1

  // Letters A / U / O (from Figma positions in 184.6px seal)
  const letterSz = Math.max(8, Math.round(28.62 * lS))
  ctx.font         = `400 ${letterSz}px ${serif}`
  ctx.letterSpacing = `${(-letterSz * 0.03).toFixed(2)}px`
  ctx.fillStyle    = CARD_GREEN
  ctx.textBaseline = 'middle'
  ctx.textAlign    = 'center'
  ctx.fillText('A', cx - 35.04 * lS, cy - 9.77 * lS)
  ctx.fillText('U', cx - 0.17  * lS, cy + 24.48 * lS)
  ctx.fillText('O', cx + 38.47 * lS, cy - 9.77 * lS)

  ctx.textBaseline = 'top'
  ctx.textAlign    = 'left'
  ctx.letterSpacing = '0px'
}

// ── Main renderer
export function drawCertificateCanvas(canvas, settings, fontsReady, floralia) {
  const {
    dims,
    certFirstName = 'Firstname',
    certLastName  = 'Lastname',
  } = settings

  const { w: cw, h: ch } = dims
  const dpr = settings.dpr ?? 1

  canvas.width  = cw * dpr
  canvas.height = ch * dpr

  const ctx = canvas.getContext('2d')
  if (dpr !== 1) ctx.scale(dpr, dpr)

  const serif  = fontsReady ? "'Serrif VF', Georgia, serif"     : 'Georgia, serif'
  const sans   = fontsReady ? "'Saans', sans-serif"              : 'sans-serif'
  const script = fontsReady ? "'Monsieur La Doulaise', cursive"  : 'cursive'
  const sigFnt = fontsReady ? "'Mrs Saint Delafield', cursive"   : 'cursive'

  // ── Background
  ctx.fillStyle = CANVAS_BG
  ctx.fillRect(0, 0, cw, ch)

  // ── Floralia (identical to Twitter template, always green accent)
  if (settings.showFloralia && floralia?.insideDots) {
    const rotAngle = ((settings.decorationRotation ?? 0) * Math.PI) / 180
    if (rotAngle !== 0) {
      ctx.save()
      ctx.translate(cw / 2, ch / 2)
      ctx.rotate(rotAngle)
      ctx.translate(-cw / 2, -ch / 2)
    }

    const fScale   = Math.max(cw, ch) * 1.5
    const offX     = (cw - fScale) / 2
    const offY     = (ch - fScale) / 2
    const dotR     = Math.max(cw, ch) * 0.0022
    const accent   = STIPPLE_COLORS['green']
    const stepNorm = 0.006
    const shiftX   = ((40 - offX) / fScale) % stepNorm
    const shiftY   = ((40 - offY) / fScale) % stepNorm

    const drawFloraliaDots = (dots, alpha) => {
      ctx.fillStyle   = accent
      ctx.globalAlpha = alpha
      ctx.beginPath()
      dots.forEach(({ x, y }) => {
        const px = offX + (x + shiftX) * fScale
        const py = offY + (y + shiftY) * fScale
        if (px > -dotR && px < cw + dotR && py > -dotR && py < ch + dotR) {
          ctx.moveTo(px + dotR, py)
          ctx.arc(px, py, dotR, 0, Math.PI * 2)
        }
      })
      ctx.fill()
      ctx.globalAlpha = 1
    }

    if (settings.decorationStyle === 'inverted') {
      drawFloraliaDots(floralia.outsideDots, 0.28)
      ctx.fillStyle    = CANVAS_BG
      ctx.globalAlpha  = 1
      ctx.textBaseline = 'middle'
      ctx.textAlign    = 'center'
      floralia.glyphs.forEach(({ char, fontSizeNorm, cxNorm, cyNorm }) => {
        ctx.font = `${fontSizeNorm * fScale}px Floralia`
        ctx.fillText(char, offX + cxNorm * fScale, offY + cyNorm * fScale)
      })
      ctx.textAlign    = 'left'
      ctx.textBaseline = 'top'
    } else {
      drawFloraliaDots(floralia.insideDots, 0.35)
    }

    if (rotAngle !== 0) ctx.restore()
  }

  // ── Card (16:9 landscape, 93.5% canvas width, centred)
  const cW = Math.round(cw * 0.935)
  const cH = Math.round(cW / 1.778)
  const cX = Math.round((cw - cW) / 2)
  const cY = Math.round((ch - cH) / 2)
  const s  = cW / 1009.778  // scale vs Figma 1080×1080 reference

  // Card background
  ctx.fillStyle = CARD_BG
  ctx.fillRect(cX, cY, cW, cH)

  // ── Green border (inset by ~10.5px per side in 1080×1080)
  const bInsetX = Math.round((1009.778 - 988.741) / 2 * s)
  const bInsetY = Math.round((568      - 546.963) / 2 * s)
  ctx.strokeStyle = CARD_GREEN
  ctx.lineWidth   = Math.max(1, 2.104 * s)
  ctx.strokeRect(cX + bInsetX, cY + bInsetY, cW - bInsetX * 2, cH - bInsetY * 2)
  ctx.lineWidth = 1

  // ── Paper-fastener notches (left/right, centred vertically)
  const nW = Math.round(48.911 * s)
  const nH = Math.round(23.667 * s)
  ctx.fillStyle   = '#f0f5f2'
  ctx.strokeStyle = '#dce6e1'
  ctx.lineWidth   = Math.max(1, 1.578 * s)
  // left notch — centred at (81.52, 338.7) in card coords, tab rotated 90°
  const lnCx = cX + Math.round(81.52  * s), lnCy = cY + Math.round(338.7  * s)
  ctx.fillRect  (lnCx - nH / 2, lnCy - nW / 2, nH, nW)
  ctx.strokeRect(lnCx - nH / 2, lnCy - nW / 2, nH, nW)
  // right notch
  const rnCx = cX + Math.round(939.83 * s), rnCy = cY + Math.round(327.13 * s)
  ctx.fillRect  (rnCx - nH / 2, rnCy - nW / 2, nH, nW)
  ctx.strokeRect(rnCx - nH / 2, rnCy - nW / 2, nH, nW)
  ctx.lineWidth = 1

  // ── AirOps logo (top centre)
  const logoH   = Math.round(28.513 * s)
  const logoW   = Math.round(88.881 * s)
  const logoBmp = buildLogo(CARD_TEXT, Math.round(logoH * dpr))
  const logoX   = Math.round(cX + (cW - logoW) / 2)
  const logoY   = Math.round(cY + 35.27 * s)
  ctx.fillStyle = CARD_BG
  ctx.fillRect(logoX, logoY, logoW, logoH)
  ctx.drawImage(logoBmp, logoX, logoY, logoW, logoH)

  // ── Typography scale
  const scriptSz = Math.round(42.07 * s)
  const titleSz  = Math.round(82    * s)
  const nameSz   = Math.round(50.49 * s)
  const bodySz   = Math.round(16.83 * s)
  const bodyLH   = Math.round(bodySz * 1.4)

  const tcx = Math.round(cX + cW / 2)  // horizontal centre

  ctx.textBaseline = 'top'
  ctx.textAlign    = 'center'
  ctx.letterSpacing = '0px'

  // ── "the certification of"  (Monsieur La Doulaise)
  const yCert = Math.round(cY + 68 * s)
  ctx.font      = `${scriptSz}px ${script}`
  ctx.fillStyle = CARD_TEXT
  ctx.fillText('the certification of', tcx, yCert)

  // ── "Content Engineering"  (Serrif VF)
  const yCE = Math.round(cY + 90 * s)
  ctx.font         = `400 ${titleSz}px ${serif}`
  ctx.letterSpacing = `${(-titleSz * 0.015).toFixed(2)}px`
  ctx.fillStyle    = CARD_TEXT
  ctx.fillText('Content Engineering', tcx, yCE)
  ctx.letterSpacing = '0px'

  // ── "is hereby conferred to"  (Monsieur La Doulaise)
  // Hard-anchored to Figma content group top (252.44 - group_half ≈ 174px from card top)
  const yConferred = Math.round(cY + 174 * s)
  ctx.font      = `${scriptSz}px ${script}`
  ctx.fillStyle = CARD_TEXT
  ctx.fillText('is hereby conferred to', tcx, yConferred)

  // ── [Firstname Lastname]  (Serrif VF)
  const yName = yConferred + Math.round(scriptSz * 0.75 + 4.207 * s)
  ctx.font         = `400 ${nameSz}px ${serif}`
  ctx.letterSpacing = `${(-nameSz * 0.02).toFixed(2)}px`
  ctx.fillStyle    = CARD_TEXT
  ctx.fillText(`${certFirstName} ${certLastName}`, tcx, yName)
  ctx.letterSpacing = '0px'

  // ── Body text — "With admiration" (bold) + paragraph (Saans)
  const yBody   = yName + Math.round(nameSz * 1.15 + 12.622 * s)
  const bodyMaxW = Math.round(745.763 * s)

  ctx.font = `700 ${bodySz}px ${sans}`
  const boldPrefix = 'With admiration '
  const boldW = ctx.measureText(boldPrefix).width

  ctx.font = `400 ${bodySz}px ${sans}`
  const bodyFull = 'for your creative excellence and hunger for mastery, for building content that is thoughtful, scalable, and brilliantly engineered, and for pushing the frontier of what\'s possible.'
  const words = bodyFull.split(' ')
  const bodyLines = []
  let line = ''
  for (const word of words) {
    const test  = line ? `${line} ${word}` : word
    const avail = bodyMaxW - (bodyLines.length === 0 ? boldW : 0)
    if (ctx.measureText(test).width > avail) { bodyLines.push(line); line = word }
    else line = test
  }
  if (line) bodyLines.push(line)

  // First line: bold prefix + rest
  ctx.textAlign = 'left'
  const bx = Math.round(tcx - (boldW + ctx.measureText(bodyLines[0] ?? '').width) / 2)
  ctx.font = `700 ${bodySz}px ${sans}`
  ctx.fillText(boldPrefix, bx, yBody)
  ctx.font = `400 ${bodySz}px ${sans}`
  ctx.fillText(bodyLines[0] ?? '', bx + boldW, yBody)
  // Remaining lines (centred)
  ctx.textAlign = 'center'
  for (let i = 1; i < bodyLines.length; i++) {
    ctx.fillText(bodyLines[i], tcx, yBody + i * bodyLH)
  }

  // ── Bottom ornament line with diamond accents
  const ornY  = Math.round(cY + 488.85 * s)
  const ornX1 = Math.round(cX + 102.56 * s)
  const ornX2 = Math.round(cX + (102.56 + 807.559) * s)
  const ornCx = Math.round((ornX1 + ornX2) / 2)
  ctx.strokeStyle = CARD_GREEN
  ctx.lineWidth   = Math.max(1, s)
  ctx.globalAlpha = 0.7
  ctx.beginPath(); ctx.moveTo(ornX1, ornY); ctx.lineTo(ornX2, ornY); ctx.stroke()
  ctx.globalAlpha = 1
  ctx.lineWidth   = 1
  const dSz = Math.max(3, Math.round(5 * s))
  ;[ornCx - Math.round(120 * s), ornCx - Math.round(60 * s),
    ornCx, ornCx + Math.round(60 * s), ornCx + Math.round(120 * s)].forEach((dx, i) => {
    ctx.globalAlpha = i === 2 ? 1 : 0.6
    fillDiamond(ctx, dx, ornY, i === 2 ? dSz : Math.round(dSz * 0.6), CARD_GREEN)
  })
  ctx.globalAlpha = 1

  // ── Signature "Alex Halliday"  (Mrs Saint Delafield in green)
  const sigSz = Math.round(55.11 * s)
  ctx.font      = `${sigSz}px ${sigFnt}`
  ctx.fillStyle = CARD_GREEN
  ctx.textAlign = 'center'
  ctx.fillText('Alex Halliday', cX + Math.round(251.39 * s), cY + Math.round(403.39 * s))
  // "CEO, AirOps"
  const ceoSz = Math.round(16.83 * s)
  ctx.font      = `400 ${ceoSz}px ${sans}`
  ctx.fillStyle = CARD_TEXT
  ctx.fillText('CEO, AirOps', cX + Math.round(243.77 * s), cY + Math.round(460.66 * s))

  // ── AirOps University Seal
  const sealSz = Math.round(184.6 * s)
  const sealCx = Math.round(cX + (412.85 + 184.6 / 2) * s)
  const sealCy = Math.round(cY + (343.96 + 184.6 / 2) * s)
  drawSeal(ctx, sealCx, sealCy, sealSz, sans, serif)

  // ── Cohort / Completion date (bottom right)
  const cohortSz = Math.round(16.83 * s)
  const dateSz   = Math.round(21.04 * s)
  const cohortCx = Math.round(cX + (661.09 + 90) * s)
  ctx.textAlign  = 'center'
  ctx.font       = `400 ${cohortSz}px ${sans}`
  ctx.fillStyle  = CARD_TEXT
  ctx.fillText('Cohort I', cohortCx, cY + Math.round(417.06 * s))
  ctx.font = `400 ${dateSz}px ${serif}`
  ctx.fillText('2025', cohortCx, cY + Math.round((417.06 + cohortSz * 1.4) * s))

  // ── Decorative vine strips (left and right)
  drawVineStrip(ctx,
    Math.round(cX + 58.9 * s),
    Math.round(cY + 112.29 * s),
    Math.round(cY + (112.29 + 347.637) * s),
    s)
  drawVineStrip(ctx,
    Math.round(cX + 915 * s),
    Math.round(cY + 63.64 * s),
    Math.round(cY + (63.64 + 337.907) * s),
    s)

  ctx.textAlign    = 'left'
  ctx.textBaseline = 'top'
  ctx.letterSpacing = '0px'
}
