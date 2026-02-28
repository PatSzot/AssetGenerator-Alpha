import { STIPPLE_COLORS } from './drawFleurons.js'

const CARD_TEXT = '#002910'
const CANVAS_BG = '#000d05'

export function drawCertificateCanvas(canvas, settings, fontsReady, floralia, certImage) {
  const {
    dims,
    certFullName = 'Firstname Lastname',
  } = settings

  const { w: cw, h: ch } = dims
  const dpr = settings.dpr ?? 1

  canvas.width  = cw * dpr
  canvas.height = ch * dpr

  const ctx = canvas.getContext('2d')
  if (dpr !== 1) ctx.scale(dpr, dpr)

  const serif = fontsReady ? "'Serrif VF', Georgia, serif" : 'Georgia, serif'

  // Background
  ctx.fillStyle = CANVAS_BG
  ctx.fillRect(0, 0, cw, ch)

  // Floralia (identical to Twitter template, always green accent)
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

    // Draw all dots — no glyph mask, full grid coverage
    drawFloraliaDots([...floralia.insideDots, ...floralia.outsideDots], 0.35)

    if (rotAngle !== 0) ctx.restore()
  }

  // Card (16:9 landscape, 93.5% canvas width, centered)
  const cW = Math.round(cw * 0.935)
  const cH = Math.round(cW / 1.778)
  const cX = Math.round((cw - cW) / 2)
  const cY = Math.round((ch - cH) / 2)
  const s  = cW / 1009.778  // scale vs Figma 1080×1080 reference

  // Center vertical guide (full canvas height) — drawn before card image
  ctx.strokeStyle = 'rgba(0,210,80,1)'
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
