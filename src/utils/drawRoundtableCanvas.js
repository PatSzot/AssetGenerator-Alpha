import { buildLogo, wrapText } from './drawCanvas.js'
import { WELCOME_PALETTE, paintWelcomeBackground, paintWelcomePattern, paintWelcomeDecoration } from './welcomePalette.js'

export function drawRoundtableCanvas(canvas, settings, fontsReady, profileImage, floralia) {
  const cw = 1080, ch = 1080
  const dpr = settings.dpr ?? 2
  canvas.width  = cw * dpr
  canvas.height = ch * dpr
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)

  const palette = WELCOME_PALETTE[settings.rtColor] ?? WELCOME_PALETTE.green
  const pattern = settings.rtPattern ?? 'dots'

  if (!fontsReady) {
    ctx.fillStyle = palette.base
    ctx.fillRect(0, 0, cw, ch)
    return
  }

  const serif = "'Serrif VF', Georgia, serif"
  const sans  = "'Saans', 'Helvetica Neue', sans-serif"

  paintWelcomeBackground(ctx, cw, ch, palette)
  paintWelcomePattern(ctx, cw, ch, pattern, palette)
  paintWelcomeDecoration(ctx, cw, ch, palette, settings, floralia)

  // ── Layout constants
  const lineX1   = 41
  const lineX2   = 1037
  const contentW = lineX2 - lineX1              // 996
  const centerX  = lineX1 + contentW / 2        // 539

  // ── Vertical border lines
  ctx.strokeStyle = palette.ink
  ctx.lineWidth   = 1.2
  ctx.beginPath()
  ctx.moveTo(lineX1, 0); ctx.lineTo(lineX1, ch)
  ctx.moveTo(lineX2, 0); ctx.lineTo(lineX2, ch)
  ctx.stroke()

  // ── AirOps logo (centered)
  const logoH   = 72
  const logoW   = Math.round(784 * logoH / 252)   // ≈224
  const logoY   = 126
  const logoBmp = buildLogo(palette.ink, Math.round(logoH * dpr))
  ctx.drawImage(logoBmp, Math.round(centerX - logoW / 2), logoY, logoW, logoH)

  // ── Title text (large serif)
  const titleY    = logoY + logoH + 104            // 302
  const titleSize = 194
  ctx.font          = `400 ${titleSize}px ${serif}`
  ctx.fillStyle     = palette.ink
  ctx.letterSpacing = '-3.88px'
  ctx.textBaseline  = 'top'
  ctx.textAlign     = 'center'
  ctx.fillText(settings.rtTitle || 'Roundtable', centerX, titleY)
  ctx.textAlign     = 'left'
  ctx.letterSpacing = '0px'

  // ── Bottom section: photo + name/role
  const titleH   = Math.round(titleSize * 0.94)   // ≈182
  const bottomY  = titleY + titleH + 104           // ≈588
  const sectionW = 995
  const sectionX = Math.round(centerX - sectionW / 2)
  const photoSz  = 373
  const photoX   = sectionX
  const photoY   = bottomY

  // Photo container
  const bw  = 1.217
  const pad = 9.325
  const inX = photoX + bw + pad
  const inY = photoY + bw + pad
  const inW = photoSz - 2 * (bw + pad)            // ≈352
  const inH = inW

  // Border
  ctx.strokeStyle = palette.ink
  ctx.lineWidth   = bw
  ctx.strokeRect(photoX + bw / 2, photoY + bw / 2, photoSz - bw, photoSz - bw)

  // Dark background
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

  // ── Name
  const textGap  = 24
  const textX    = photoX + photoSz + textGap
  const textMaxW = sectionW - photoSz - textGap

  const name = settings.rtName || 'Ali McCarty'
  ctx.font          = `500 64px ${sans}`
  ctx.fillStyle     = palette.ink
  ctx.letterSpacing = '-1.28px'
  ctx.textBaseline  = 'top'
  const nameLines = wrapText(ctx, name, textMaxW)
  const nameLH    = 64 * 1.2
  nameLines.forEach((line, i) => ctx.fillText(line, textX, photoY + i * nameLH))

  // ── Role & Company
  const roleY = photoY + nameLines.length * nameLH + 16
  ctx.font          = `400 44px ${sans}`
  ctx.letterSpacing = '-0.88px'
  const roleLH = 44 * 1.2

  const roleText     = settings.rtRoleCompany || 'VP of Strategy\nNew Business Expansion,\nAirOps'
  const roleRawLines = roleText.split('\n')
  let allRoleLines   = []
  roleRawLines.forEach(line => {
    allRoleLines = allRoleLines.concat(wrapText(ctx, line, textMaxW))
  })
  allRoleLines.forEach((line, i) => ctx.fillText(line, textX, roleY + i * roleLH))

  ctx.letterSpacing = '0px'
}

export function drawRoundtableEvergreenCanvas(canvas, settings, fontsReady, floralia) {
  const cw = 1080, ch = 1080
  const dpr = settings.dpr ?? 2
  canvas.width  = cw * dpr
  canvas.height = ch * dpr
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)

  const palette = WELCOME_PALETTE[settings.rtColor] ?? WELCOME_PALETTE.green
  const pattern = settings.rtPattern ?? 'dots'

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

  // ── Layout constants
  const lineX1   = 41
  const lineX2   = 1037
  const contentW = lineX2 - lineX1
  const centerX  = lineX1 + contentW / 2

  // ── Vertical border lines
  ctx.strokeStyle = palette.ink
  ctx.lineWidth   = 1.2
  ctx.beginPath()
  ctx.moveTo(lineX1, 0); ctx.lineTo(lineX1, ch)
  ctx.moveTo(lineX2, 0); ctx.lineTo(lineX2, ch)
  ctx.stroke()

  // ── AirOps logo (centered, larger than speaker variant)
  const logoH   = 104
  const logoW   = Math.round(784 * logoH / 252)
  const logoY   = 126
  const logoBmp = buildLogo(palette.ink, Math.round(logoH * dpr))
  ctx.drawImage(logoBmp, Math.round(centerX - logoW / 2), logoY, logoW, logoH)

  // ── Title — mixed serif/sans lines
  const titleSize = 180
  const titleLH   = Math.round(titleSize * 0.94)
  const titleY    = logoY + logoH + 66
  const maxTitleW = 939

  ctx.fillStyle     = palette.ink
  ctx.textBaseline  = 'top'
  ctx.textAlign     = 'center'
  ctx.letterSpacing = '-5.4px'

  // Line 1: serif (e.g. "Exclusive")
  const line1 = settings.rtEvSerifLine1 || 'Exclusive'
  ctx.font = `400 ${titleSize}px ${serif}`
  ctx.fillText(line1, centerX, titleY)

  // Line 2+: mixed sans + serif on each line
  const sansText  = settings.rtEvSansText  || 'Round Table'
  const serifText = settings.rtEvSerifLine2 || 'Series'

  // Render line 2 as "SansText SerifText" with mixed fonts
  const lineY2 = titleY + titleLH
  const fullLine2 = sansText + ' ' + serifText

  // Measure sans portion to position correctly
  ctx.font = `400 ${titleSize}px ${sans}`
  const sansMetrics = ctx.measureText(sansText + ' ')
  ctx.font = `400 ${titleSize}px ${serif}`
  const serifMetrics = ctx.measureText(serifText)
  const totalW = sansMetrics.width + serifMetrics.width

  // Check if line 2 needs to wrap (sans on one line, serif on next)
  if (totalW > maxTitleW) {
    // Sans line
    ctx.font = `400 ${titleSize}px ${sans}`
    ctx.fillText(sansText, centerX, lineY2)
    // Serif line
    ctx.font = `400 ${titleSize}px ${serif}`
    ctx.fillText(serifText, centerX, lineY2 + titleLH)
  } else {
    // Single line with mixed fonts, centered as a unit
    const startX = centerX - totalW / 2
    ctx.textAlign = 'left'
    ctx.font = `400 ${titleSize}px ${sans}`
    ctx.fillText(sansText + ' ', startX, lineY2)
    ctx.font = `400 ${titleSize}px ${serif}`
    ctx.fillText(serifText, startX + sansMetrics.width, lineY2)
  }

  // ── 6. Pill badge
  const pillText = (settings.rtEvPillText || 'FOR MARKETING LEADERS').toUpperCase()
  const pillFontSize = 41
  ctx.font          = `500 ${pillFontSize}px ${mono}`
  ctx.letterSpacing = '2.45px'
  ctx.textAlign     = 'center'
  ctx.textBaseline  = 'middle'

  const pillMetrics = ctx.measureText(pillText)
  const pillPadX    = 20
  const pillPadY    = 10
  const pillW       = pillMetrics.width + pillPadX * 2
  const pillH       = pillFontSize + pillPadY * 2
  // Position pill with gap below title block
  const titleBlockLines = totalW > maxTitleW ? 3 : 2
  const pillY = titleY + titleLH * titleBlockLines + 66
  const pillX = centerX - pillW / 2

  // Pill background + border
  const pillR = 10
  ctx.fillStyle   = palette.base
  ctx.strokeStyle = palette.accent
  ctx.lineWidth   = 1.74
  ctx.beginPath()
  ctx.roundRect(pillX, pillY, pillW, pillH, pillR)
  ctx.fill()
  ctx.stroke()

  // Pill text
  ctx.fillStyle = palette.accent
  ctx.fillText(pillText, centerX, pillY + pillH / 2)

  ctx.textAlign     = 'left'
  ctx.letterSpacing = '0px'
}
