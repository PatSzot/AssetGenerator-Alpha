import { STIPPLE_COLORS } from './drawFleurons.js'

const CARD_TEXT    = '#002910'
const CANVAS_BG    = '#000d05'
const COHORT_COLOR = '#008c44'

export function drawCertificateCanvas(canvas, settings, fontsReady, floralia, certImage) {
  const {
    dims,
    colorMode          = 'green',
    certFullName       = 'Firstname Lastname',
    certCohortLevel    = '',
    certGraduationDate = '',
  } = settings

  const { w: cw, h: ch } = dims
  const dpr    = settings.dpr ?? 1
  const isLand = cw > ch

  canvas.width  = cw * dpr
  canvas.height = ch * dpr

  const ctx = canvas.getContext('2d')
  if (dpr !== 1) ctx.scale(dpr, dpr)

  const serif = fontsReady ? "'Serrif VF', Georgia, serif" : 'Georgia, serif'

  // Background
  ctx.fillStyle = CANVAS_BG
  ctx.fillRect(0, 0, cw, ch)

  // Decoration
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
    const accent   = STIPPLE_COLORS[colorMode] ?? STIPPLE_COLORS['green']
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
      ctx.fillStyle    = CANVAS_BG
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

  // ── Certificate composite geometry
  // Reference: Figma 1080×1080 composite = 1011.115 × 568.752, centered
  //            Figma 1920×1080 composite = 1612.004 × 906.752, left: 50%, top: 87px
  let cX, cY, cW, cH
  if (isLand) {
    cH = Math.round(ch * (906.752 / 1080))   // 839.6% of canvas height
    cW = Math.round(cH * (1612.004 / 906.752)) // 16:9 aspect
    cX = Math.round((cw - cW) / 2)
    cY = Math.round(ch * (87 / 1080))         // top padding from Figma
  } else {
    cW = Math.round(cw * (1011.115 / 1080))   // 93.6% of canvas width
    cH = Math.round(cW * (568.752 / 1011.115))
    cX = Math.round((cw - cW) / 2)
    cY = Math.round((ch - cH) / 2)
  }

  // Scale factor relative to Figma 1080×1080 composite (1011.115px wide)
  const s = cW / 1011.115

  // Center vertical guideline (full canvas height, drawn before image)
  ctx.strokeStyle = '#008c44'
  ctx.lineWidth   = 2
  ctx.beginPath()
  ctx.moveTo(cw / 2, 0)
  ctx.lineTo(cw / 2, ch)
  ctx.stroke()
  ctx.lineWidth = 1

  // Draw certificate image
  if (certImage) {
    ctx.drawImage(certImage, cX, cY, cW, cH)
  } else {
    ctx.fillStyle = '#f8fffb'
    ctx.fillRect(cX, cY, cW, cH)
  }

  // ── Name — centered, Serrif VF, color:#002910, dual text shadow
  // Figma 1080×1080 reference: fontSize=50.56, top=223.3, letterSpacing=-1.0112
  // Shadow: 2.733 2.733 5.466 white  AND  -2.733 2.283 2.954 rgba(0,0,0,0.15)
  const nameSz = Math.round(50.56 * s)
  const nameX  = cX + cW / 2
  const nameY  = cY + Math.round(223.3 * s)

  ctx.font          = `400 ${nameSz}px ${serif}`
  ctx.letterSpacing = `${(-1.0112 * s).toFixed(2)}px`
  ctx.textBaseline  = 'top'
  ctx.textAlign     = 'center'
  ctx.fillStyle     = CARD_TEXT

  // White shadow pass
  ctx.shadowColor   = 'white'
  ctx.shadowBlur    = 5.466 * s
  ctx.shadowOffsetX = 2.733 * s
  ctx.shadowOffsetY = 2.733 * s
  ctx.fillText(certFullName, nameX, nameY)

  // Dark shadow pass
  ctx.shadowColor   = 'rgba(0,0,0,0.15)'
  ctx.shadowBlur    = 2.954 * s
  ctx.shadowOffsetX = -2.733 * s
  ctx.shadowOffsetY = 2.283 * s
  ctx.fillText(certFullName, nameX, nameY)

  // Clear shadows
  ctx.shadowColor   = 'transparent'
  ctx.shadowBlur    = 0
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0

  // ── Cohort Level + Graduation Date — right-side, Serrif VF, color:#008c44
  // Figma 1080×1080 reference: fontSize=21.06, centerX=730.74, tops=382.62 / 463.53
  if (certCohortLevel || certGraduationDate) {
    const subSz = Math.round(21.06 * s)
    const subX  = cX + Math.round(730.74 * s)

    ctx.font          = `400 ${subSz}px ${serif}`
    ctx.letterSpacing = '0px'
    ctx.fillStyle     = COHORT_COLOR
    ctx.textBaseline  = 'top'
    ctx.textAlign     = 'center'

    if (certCohortLevel) {
      ctx.fillText(certCohortLevel, subX, cY + Math.round(382.62 * s))
    }

    if (certGraduationDate) {
      ctx.fillText(certGraduationDate, subX, cY + Math.round(463.53 * s))
    }
  }

  // Reset
  ctx.textAlign     = 'left'
  ctx.textBaseline  = 'top'
  ctx.letterSpacing = '0px'
}
