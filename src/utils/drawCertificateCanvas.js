import { STIPPLE_COLORS } from './drawFleurons.js'

const CARD_TEXT = '#002910'
const CANVAS_BG = '#000d05'

export function drawCertificateCanvas(canvas, settings, fontsReady, floralia, certImage) {
  const {
    dims,
    colorMode    = 'green',
    certFullName = 'Firstname Lastname',
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

  // Decoration — exact same logic as Twitter template
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

  // Card (16:9 landscape, 93.5% canvas width, centered)
  const cW = Math.round(cw * 0.935)
  const cH = Math.round(cW / 1.778)
  const cX = Math.round((cw - cW) / 2)
  const cY = Math.round((ch - cH) / 2)
  const s  = cW / 1009.778  // scale vs Figma 1080×1080 reference

  // Center vertical guide (full canvas height) — drawn before card image
  ctx.strokeStyle = '#008c44'
  ctx.lineWidth   = 2
  ctx.beginPath(); ctx.moveTo(cw / 2, 0); ctx.lineTo(cw / 2, ch); ctx.stroke()
  ctx.lineWidth   = 1

  // Draw certificate image (all design elements)
  if (certImage) {
    ctx.drawImage(certImage, cX, cY, cW, cH)
  } else {
    ctx.fillStyle = '#f8fffb'
    ctx.fillRect(cX, cY, cW, cH)
  }

  // Name overlay at Figma-matched position (210px from card top at 1× scale)
  const nameSz = Math.round(50.49 * s)
  const nameY  = cY + Math.round(210 * s)
  ctx.font         = `400 ${nameSz}px ${serif}`
  ctx.letterSpacing = `${(-nameSz * 0.02).toFixed(2)}px`
  ctx.fillStyle    = CARD_TEXT
  ctx.textBaseline = 'top'
  ctx.textAlign    = 'center'
  ctx.fillText(certFullName, cX + Math.round(cW / 2), nameY)

  ctx.textAlign    = 'left'
  ctx.textBaseline = 'top'
  ctx.letterSpacing = '0px'
}
