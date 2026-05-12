import { buildLogo } from './drawCanvas.js'
import { WELCOME_PALETTE, paintWelcomeBackground, paintWelcomePattern, paintWelcomeDecoration } from './welcomePalette.js'

export function drawWelcomeCanvas(canvas, settings, fontsReady, profileImage, floralia) {
  const cw = 1080, ch = 1080
  const dpr = settings.dpr ?? 2
  canvas.width  = cw * dpr
  canvas.height = ch * dpr
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)

  const palette = WELCOME_PALETTE[settings.welcomeColor] ?? WELCOME_PALETTE.green
  const pattern = settings.welcomePattern ?? 'dots'

  if (!fontsReady) {
    ctx.fillStyle = palette.base
    ctx.fillRect(0, 0, cw, ch)
    return
  }

  const serif = "'Serrif VF', Georgia, serif"
  const sans  = "'Saans', 'Helvetica Neue', sans-serif"
  const mono  = "'Saans Mono', 'DM Mono', monospace"

  paintWelcomeBackground(ctx, cw, ch, palette)
  paintWelcomePattern(ctx, cw, ch, pattern, palette)
  paintWelcomeDecoration(ctx, cw, ch, palette, settings, floralia)

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

  // Split name into first / last
  const fullName  = (settings.welcomeName || 'Ali McCarty').trim()
  const parts     = fullName.split(/\s+/)
  const firstName = parts[0] || ''
  const lastName  = parts.slice(1).join(' ')

  // First name — large serif, auto-shrink to fit
  const firstY        = logoY + logoH + 40
  let   firstSize     = 194
  const maxFirstW     = contentW - 80
  ctx.font            = `400 ${firstSize}px ${serif}`
  let firstMetrics    = ctx.measureText(firstName)
  if (firstMetrics.width > maxFirstW) {
    firstSize = Math.floor(firstSize * maxFirstW / firstMetrics.width)
    ctx.font  = `400 ${firstSize}px ${serif}`
  }
  ctx.fillStyle     = palette.ink
  ctx.letterSpacing = `${-firstSize * 0.02}px`
  ctx.textBaseline  = 'top'
  ctx.textAlign     = 'center'
  ctx.fillText(firstName, centerX, firstY)
  const firstH = Math.round(firstSize * 0.94)

  // Last name — sans 64px, centered below first name
  const lastSize = 64
  const lastY    = firstY + firstH + 14
  ctx.font          = `500 ${lastSize}px ${sans}`
  ctx.letterSpacing = '-1.28px'
  ctx.fillText(lastName, centerX, lastY)
  const lastH = lastName ? Math.round(lastSize * 1.2) : 0

  ctx.textAlign     = 'left'
  ctx.letterSpacing = '0px'

  // Photo box — centered below last name
  const photoSz  = 440
  const photoX   = Math.round(centerX - photoSz / 2)
  const photoY   = lastY + lastH + 32

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
}
