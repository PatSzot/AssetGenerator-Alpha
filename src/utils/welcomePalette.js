// Shared color palette + paint helpers used by the Welcome and Roundtable
// templates. Each entry drives the background base, radial-glow tone, ink
// (foreground text/border), accent (eyebrows/pills), pattern dot color, and
// fleuron stipple tint.

export const WELCOME_PALETTE = {
  green:  { base: '#eef9f3', glow: [0, 255, 100],   ink: '#002910', accent: '#057a28', dot: 'rgba(212,232,218,0.6)', stipple: '#80CC9F' },
  pink:   { base: '#fff7ff', glow: [254, 160, 220], ink: '#3a092c', accent: '#c54b9b', dot: 'rgba(231,200,228,0.5)',  stipple: '#CC86C0' },
  indigo: { base: '#f5f6ff', glow: [140, 140, 255], ink: '#0f0f57', accent: '#1b1b8f', dot: 'rgba(200,200,240,0.55)', stipple: '#8080CC' },
  red:    { base: '#fff0f0', glow: [255, 160, 160], ink: '#331010', accent: '#802828', dot: 'rgba(232,200,200,0.55)', stipple: '#CC8080' },
  yellow: { base: '#fdfff3', glow: [238, 255, 140], ink: '#242603', accent: '#586605', dot: 'rgba(220,230,160,0.55)', stipple: '#B8BD30' },
  purple: { base: '#f8f7ff', glow: [180, 150, 230], ink: '#2a084d', accent: '#5a3480', dot: 'rgba(220,210,240,0.55)', stipple: '#9F80CC' },
  teal:   { base: '#f2fcff', glow: [150, 220, 235], ink: '#0a3945', accent: '#196c80', dot: 'rgba(200,225,232,0.55)', stipple: '#7AB5C0' },
}

export function paintWelcomeBackground(ctx, cw, ch, palette) {
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

export function paintWelcomePattern(ctx, cw, ch, pattern, palette) {
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

export function paintWelcomeDecoration(ctx, cw, ch, palette, settings, floralia) {
  if (!settings.showFloralia || !floralia?.insideDots) return

  const scale    = Math.max(cw, ch) * 2.0
  const dotR     = Math.max(cw, ch) * 0.0022
  const stepNorm = 0.006

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
