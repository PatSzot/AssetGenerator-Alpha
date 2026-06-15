import { STIPPLE_COLORS } from './drawFleurons.js'

const CARD_TEXT    = '#002910'
const CANVAS_BG    = '#000d05'
const COHORT_COLOR = '#008c44'
const PROGRAM_BG   = {
  'aeo-analyst':     '#008c44',
  'systems-builder': '#03051A',
}

export function drawCertificateCanvas(canvas, settings, fontsReady, floralia, certImage, aeoBgImage) {
  const {
    dims,
    colorMode          = 'green',
    certFirstName      = 'Firstname',
    certLastName       = 'Lastname',
    certFullName       = 'Firstname Lastname',
    certCohortLevel    = '',
    certGraduationDate = '',
    certProgram        = '',
  } = settings

  const certDisplayName = [certFirstName, certLastName].filter(Boolean).join(' ') || certFullName

  const { w: cw, h: ch } = dims
  const dpr    = settings.dpr ?? 1
  const isLand = cw > ch

  canvas.width  = cw * dpr
  canvas.height = ch * dpr

  const ctx = canvas.getContext('2d')
  if (dpr !== 1) ctx.scale(dpr, dpr)

  const serif = fontsReady ? "'Serrif VF', Georgia, serif"        : 'Georgia, serif'
  const sans  = fontsReady ? "'Saans', sans-serif"                : 'sans-serif'
  const mono  = fontsReady ? "'Saans Mono', 'DM Mono', monospace" : 'monospace'

  const bg = PROGRAM_BG[certProgram] ?? CANVAS_BG

  // Background
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, cw, ch)
  if (aeoBgImage) ctx.drawImage(aeoBgImage, 0, 0, cw, ch)

  // ── Certificate composite geometry — 1080×1080 canvas, cert image centered (16:9 letterbox)
  const cW = Math.round(cw * 0.90)
  const cH = Math.round(cW * (1080 / 1920))
  const cX = Math.round((cw - cW) / 2)
  const cY = Math.round((ch - cH) / 2)

  // Scale factor relative to Figma 1080×1080 composite (1011.115px wide)
  const s = cW / 1011.115

  // Decoration — drawn over background, under cert image

  if (settings.showFloralia && floralia?.insideDots) {
    const rotAngle = ((settings.decorationRotation ?? 0) * Math.PI) / 180
    if (rotAngle !== 0) {
      ctx.save()
      ctx.translate(cw / 2, ch / 2)
      ctx.rotate(rotAngle)
      ctx.translate(-cw / 2, -ch / 2)
    }

    const guideX   = 40
    const scale    = Math.max(cw, ch) * 1.5
    const offX     = (cw - scale) / 2
    const offY     = (ch - scale) / 2
    const dotR     = Math.max(cw, ch) * (isLand ? 0.0016 : 0.0022)
    const accent   = certProgram === 'systems-builder' ? '#00A642' : (STIPPLE_COLORS[colorMode] ?? STIPPLE_COLORS['green'])
    const stepNorm = 0.006
    const shiftX   = ((guideX - offX) / scale) % stepNorm
    const shiftY   = ((guideX - offY) / scale) % stepNorm

    const drawDots = (dots, alpha) => {
      ctx.fillStyle   = accent
      ctx.globalAlpha = alpha
      ctx.beginPath()
      dots.forEach(({ x, y }) => {
        const px = offX + (x + shiftX) * scale
        const py = offY + (y + shiftY) * scale
        if (px > -dotR && px < cw + dotR && py > -dotR && py < ch + dotR) {
          ctx.moveTo(px + dotR, py)
          ctx.arc(px, py, dotR, 0, Math.PI * 2)
        }
      })
      ctx.fill()
      ctx.globalAlpha = 1
    }

    if (settings.decorationStyle === 'inverted') {
      drawDots(floralia.outsideDots, 0.28)
      ctx.fillStyle    = bg
      ctx.globalAlpha  = 1
      ctx.textBaseline = 'middle'
      ctx.textAlign    = 'center'
      floralia.glyphs.forEach(({ char, fontSizeNorm, cxNorm, cyNorm }) => {
        ctx.font = `${fontSizeNorm * scale}px Floralia`
        ctx.fillText(char, offX + cxNorm * scale, offY + cyNorm * scale)
      })
      ctx.textAlign    = 'left'
      ctx.textBaseline = 'top'
      ctx.globalAlpha  = 1
    } else {
      drawDots(floralia.insideDots, 0.35)
    }

    if (rotAngle !== 0) ctx.restore()
  }

  // Draw certificate image — top layer over decoration
  if (certImage) {
    ctx.drawImage(certImage, cX, cY, cW, cH)
  } else {
    ctx.fillStyle = '#f8fffb'
    ctx.fillRect(cX, cY, cW, cH)
  }

  // ── Name — centered, Saans Medium
  const nameSz = Math.round(50.56 * s)
  const nameX  = cX + cW / 2
  const nameY  = cY + Math.round(261 * s)

  ctx.font          = `400 ${nameSz}px ${serif}`
  ctx.letterSpacing = `${(-1.0112 * s).toFixed(2)}px`
  ctx.textBaseline  = 'top'
  ctx.textAlign     = 'center'
  ctx.fillStyle     = CARD_TEXT
  ctx.fillText(certDisplayName, nameX, nameY)

  ctx.letterSpacing = '0px'

  // ── Graduation Date — Saans Mono, full caps
  // Figma 1080×1080 reference: fontSize=21.06, centerX=730.74, top=463.53
  if (certGraduationDate) {
    const subSz = Math.round(21.06 * s)
    const subX  = cX + Math.round(730.74 * s) + 36

    ctx.font          = `500 ${subSz}px ${mono}`
    ctx.letterSpacing = '1px'
    ctx.fillStyle     = COHORT_COLOR
    ctx.textBaseline  = 'top'
    ctx.textAlign     = 'center'
    ctx.fillText(certGraduationDate.toUpperCase(), subX, cY + Math.round(463.53 * s) + 8)
    ctx.letterSpacing = '0px'
  }

  // Reset
  ctx.textAlign     = 'left'
  ctx.textBaseline  = 'top'
  ctx.letterSpacing = '0px'
}
