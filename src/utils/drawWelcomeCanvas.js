import { buildLogo, wrapText } from './drawCanvas.js'

const PALETTE = {
  green:  { base: '#eef9f3', glow: [0, 255, 100],   ink: '#002910', accent: '#057a28', dot: 'rgba(212,232,218,0.6)', stipple: '#80CC9F' },
  pink:   { base: '#fff7ff', glow: [254, 160, 220], ink: '#3a092c', accent: '#c54b9b', dot: 'rgba(231,200,228,0.5)',  stipple: '#CC86C0' },
  indigo: { base: '#f5f6ff', glow: [140, 140, 255], ink: '#0f0f57', accent: '#1b1b8f', dot: 'rgba(200,200,240,0.55)', stipple: '#8080CC' },
  red:    { base: '#fff0f0', glow: [255, 160, 160], ink: '#331010', accent: '#802828', dot: 'rgba(232,200,200,0.55)', stipple: '#CC8080' },
  yellow: { base: '#fdfff3', glow: [238, 255, 140], ink: '#242603', accent: '#586605', dot: 'rgba(220,230,160,0.55)', stipple: '#B8BD30' },
  purple: { base: '#f8f7ff', glow: [180, 150, 230], ink: '#2a084d', accent: '#5a3480', dot: 'rgba(220,210,240,0.55)', stipple: '#9F80CC' },
  teal:   { base: '#f2fcff', glow: [150, 220, 235], ink: '#0a3945', accent: '#196c80', dot: 'rgba(200,225,232,0.55)', stipple: '#7AB5C0' },
}

function paintBackground(ctx, cw, ch, palette) {
  ctx.fillStyle = palette.base
  ctx.fillRect(0, 0, cw, ch)

  const [r, g, b] = palette.glow
  const grad = ctx.createRadialGradient(cw / 2, ch + 100, 0, cw / 2, ch + 100, ch * 0.85)
  grad.addColorStop(0,    `rgba(${r},${g},${b},0.55)`)
  grad.addColorStop(0.15, `rgba(${r},${g},${b},0.4)`)
  grad.addColorStop(0.30, `rgba(${r},${g},${b},0.25)`)
  grad.addColorStop(0.50, `rgba(${r},${g},${b},0.12)`)
  grad.addColorStop(0.70, `rgba(${r},${g},${b},0.05)`)
  grad.addColorStop(1.0,  `rgba(${r},${g},${b},0)`)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, cw, ch)
}

function paintPattern(ctx, cw, ch, pattern, palette) {
  if (pattern === 'none') return

  if (pattern === 'lines') {
    ctx.save()
    ctx.strokeStyle = palette.dot
    ctx.lineWidth = 0.6
    const spacing = 18
    ctx.beginPath()
    for (let i = -ch; i < cw + ch; i += spacing) {
      ctx.moveTo(i, 0)
      ctx.lineTo(i + ch, ch)
    }
    ctx.stroke()
    ctx.restore()
    return
  }

  // default: dots
  const dotSpacing = 24
  const dotR = 0.8
  ctx.fillStyle = palette.dot
  ctx.beginPath()
  for (let x = dotSpacing / 2; x < cw; x += dotSpacing) {
    for (let y = dotSpacing / 2; y < ch; y += dotSpacing) {
      ctx.moveTo(x + dotR, y)
      ctx.arc(x, y, dotR, 0, Math.PI * 2)
    }
  }
  ctx.fill()
}

function paintDecoration(ctx, cw, ch, palette, settings, floralia) {
  if (!settings.showFloralia || !floralia?.insideDots) return

  const scale    = Math.max(cw, ch) * 2.0
  const dotR     = Math.max(cw, ch) * 0.0022
  const stepNorm = 0.006

  // Anchor — top-right corner (above the title block, mirrors title card)
  const anchorX = cw * 0.97
  const anchorY = ch * 0.03
  const offX    = anchorX - scale / 2
  const offY    = anchorY - scale / 2
  const shiftX  = ((cw - 40 - offX) / scale) % stepNorm
  const shiftY  = ((40 - offY) / scale) % stepNorm

  const renderDots = (dots, alpha) => {
    ctx.fillStyle   = palette.stipple
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

  const renderGlyphs = () => {
    ctx.fillStyle    = palette.base
    ctx.textBaseline = 'middle'
    ctx.textAlign    = 'center'
    floralia.glyphs.forEach(({ char, fontSizeNorm, cxNorm, cyNorm }) => {
      ctx.font = `${fontSizeNorm * scale}px Floralia`
      ctx.fillText(char, offX + cxNorm * scale, offY + cyNorm * scale)
    })
    ctx.textAlign    = 'left'
    ctx.textBaseline = 'top'
  }

  if (settings.decorationStyle === 'inverted') {
    renderDots(floralia.outsideDots, 0.28)
    renderGlyphs()
  } else {
    renderDots(floralia.insideDots, 0.35)
  }
}

export function drawWelcomeCanvas(canvas, settings, fontsReady, profileImage, floralia) {
  const cw = 1080, ch = 1080
  const dpr = settings.dpr ?? 2
  canvas.width  = cw * dpr
  canvas.height = ch * dpr
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)

  const palette = PALETTE[settings.welcomeColor] ?? PALETTE.green
  const pattern = settings.welcomePattern ?? 'dots'

  if (!fontsReady) {
    ctx.fillStyle = palette.base
    ctx.fillRect(0, 0, cw, ch)
    return
  }

  const serif = "'Serrif VF', Georgia, serif"
  const sans  = "'Saans', 'Helvetica Neue', sans-serif"
  const mono  = "'Saans Mono', 'DM Mono', monospace"

  paintBackground(ctx, cw, ch, palette)
  paintPattern(ctx, cw, ch, pattern, palette)
  paintDecoration(ctx, cw, ch, palette, settings, floralia)

  // Layout constants
  const lineX1   = 41
  const lineX2   = 1037
  const contentW = lineX2 - lineX1
  const centerX  = lineX1 + contentW / 2

  // Vertical border lines
  ctx.strokeStyle = palette.ink
  ctx.lineWidth   = 1.2
  ctx.beginPath()
  ctx.moveTo(lineX1, 0); ctx.lineTo(lineX1, ch)
  ctx.moveTo(lineX2, 0); ctx.lineTo(lineX2, ch)
  ctx.stroke()

  // "WELCOME TO" eyebrow
  const welcomeText = (settings.welcomeWelcomeText || 'WELCOME TO').toUpperCase()
  const welcomeY    = 110
  const welcomeSize = 28
  ctx.font          = `500 ${welcomeSize}px ${mono}`
  ctx.fillStyle     = palette.accent
  ctx.letterSpacing = '1.68px'
  ctx.textBaseline  = 'top'
  ctx.textAlign     = 'center'
  ctx.fillText(welcomeText, centerX, welcomeY)
  ctx.letterSpacing = '0px'

  // AirOps logo (centered, below WELCOME TO)
  const logoH   = 72
  const logoW   = Math.round(784 * logoH / 252)
  const logoY   = welcomeY + welcomeSize + 36
  const logoBmp = buildLogo(palette.ink, Math.round(logoH * dpr))
  ctx.drawImage(logoBmp, Math.round(centerX - logoW / 2), logoY, logoW, logoH)

  // Title text (large serif)
  const titleY    = logoY + logoH + 80
  const titleSize = 194
  ctx.font          = `400 ${titleSize}px ${serif}`
  ctx.fillStyle     = palette.ink
  ctx.letterSpacing = '-3.88px'
  ctx.textBaseline  = 'top'
  ctx.textAlign     = 'center'
  ctx.fillText(settings.welcomeTitle || 'Welcome', centerX, titleY)
  ctx.textAlign     = 'left'
  ctx.letterSpacing = '0px'

  // Bottom section: photo + name/title
  const titleH   = Math.round(titleSize * 0.94)
  const bottomY  = titleY + titleH + 78
  const sectionW = 995
  const sectionX = Math.round(centerX - sectionW / 2)
  const photoSz  = 373
  const photoX   = sectionX
  const photoY   = bottomY

  const bw  = 1.217
  const pad = 9.325
  const inX = photoX + bw + pad
  const inY = photoY + bw + pad
  const inW = photoSz - 2 * (bw + pad)
  const inH = inW

  // Border
  ctx.strokeStyle = palette.ink
  ctx.lineWidth   = bw
  ctx.strokeRect(photoX + bw / 2, photoY + bw / 2, photoSz - bw, photoSz - bw)

  // Dark background inside photo box
  ctx.fillStyle = palette.ink
  ctx.fillRect(inX, inY, inW, inH)

  // Stippled portrait (screen blend, aspect-fill)
  if (profileImage) {
    ctx.save()
    ctx.beginPath()
    ctx.rect(inX, inY, inW, inH)
    ctx.clip()
    const s  = Math.max(inW / (profileImage.naturalWidth || 1),
                        inH / (profileImage.naturalHeight || 1))
    const iw = profileImage.naturalWidth  * s
    const ih = profileImage.naturalHeight * s
    ctx.globalCompositeOperation = 'screen'
    ctx.drawImage(profileImage,
      inX + (inW - iw) / 2, inY + (inH - ih) / 2, iw, ih)
    ctx.globalCompositeOperation = 'source-over'
    ctx.restore()
  }

  // Name
  const textGap  = 24
  const textX    = photoX + photoSz + textGap
  const textMaxW = sectionW - photoSz - textGap

  const name = settings.welcomeName || 'Ali McCarty'
  ctx.font          = `500 64px ${sans}`
  ctx.fillStyle     = palette.ink
  ctx.letterSpacing = '-1.28px'
  ctx.textBaseline  = 'top'
  const nameLines = wrapText(ctx, name, textMaxW)
  const nameLH    = 64 * 1.2
  nameLines.forEach((line, i) => ctx.fillText(line, textX, photoY + i * nameLH))

  // Title (job title only, no company)
  const roleY = photoY + nameLines.length * nameLH + 16
  ctx.font          = `400 44px ${sans}`
  ctx.letterSpacing = '-0.88px'
  const roleLH = 44 * 1.2

  const roleText  = settings.welcomeRole || 'VP of Strategy'
  const roleLines = wrapText(ctx, roleText, textMaxW)
  roleLines.forEach((line, i) => ctx.fillText(line, textX, roleY + i * roleLH))

  ctx.letterSpacing = '0px'
}
