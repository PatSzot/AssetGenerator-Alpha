import { buildLogo, wrapText } from './drawCanvas.js'

export function drawRoundtableCanvas(canvas, settings, fontsReady, profileImage) {
  const cw = 1080, ch = 1080
  const dpr = settings.dpr ?? 2
  canvas.width  = cw * dpr
  canvas.height = ch * dpr
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)

  if (!fontsReady) {
    ctx.fillStyle = '#eef9f3'
    ctx.fillRect(0, 0, cw, ch)
    return
  }

  const serif = "'Serrif VF', Georgia, serif"
  const sans  = "'Saans', 'Helvetica Neue', sans-serif"

  // ── 1. Background: pale green base + radial green glow from bottom
  ctx.fillStyle = '#eef9f3'
  ctx.fillRect(0, 0, cw, ch)

  const grad = ctx.createRadialGradient(cw / 2, ch + 100, 0, cw / 2, ch + 100, ch * 0.85)
  grad.addColorStop(0,    'rgba(0,255,100,0.55)')
  grad.addColorStop(0.15, 'rgba(60,254,136,0.4)')
  grad.addColorStop(0.30, 'rgba(119,252,172,0.25)')
  grad.addColorStop(0.50, 'rgba(179,251,207,0.12)')
  grad.addColorStop(0.70, 'rgba(238,249,243,0.05)')
  grad.addColorStop(1.0,  'rgba(238,249,243,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, cw, ch)

  // ── 2. Dot grid (24px spacing, 0.8px dots)
  const dotSpacing = 24
  const dotR = 0.8
  ctx.fillStyle = 'rgba(212,232,218,0.6)'
  ctx.beginPath()
  for (let x = dotSpacing / 2; x < cw; x += dotSpacing) {
    for (let y = dotSpacing / 2; y < ch; y += dotSpacing) {
      ctx.moveTo(x + dotR, y)
      ctx.arc(x, y, dotR, 0, Math.PI * 2)
    }
  }
  ctx.fill()

  // ── Layout constants
  const lineX1   = 41
  const lineX2   = 1037
  const contentW = lineX2 - lineX1              // 996
  const centerX  = lineX1 + contentW / 2        // 539

  // ── 3. Vertical border lines
  ctx.strokeStyle = '#002910'
  ctx.lineWidth   = 1.2
  ctx.beginPath()
  ctx.moveTo(lineX1, 0); ctx.lineTo(lineX1, ch)
  ctx.moveTo(lineX2, 0); ctx.lineTo(lineX2, ch)
  ctx.stroke()

  // ── 4. AirOps logo (centered)
  const logoH   = 72
  const logoW   = Math.round(784 * logoH / 252)   // ≈224
  const logoY   = 126
  const logoBmp = buildLogo('#002910', Math.round(logoH * dpr))
  ctx.drawImage(logoBmp, Math.round(centerX - logoW / 2), logoY, logoW, logoH)

  // ── 5. Title text (large serif)
  const titleY    = logoY + logoH + 104            // 302
  const titleSize = 194
  ctx.font          = `400 ${titleSize}px ${serif}`
  ctx.fillStyle     = '#002910'
  ctx.letterSpacing = '-3.88px'
  ctx.textBaseline  = 'top'
  ctx.textAlign     = 'center'
  ctx.fillText(settings.rtTitle || 'Roundtable', centerX, titleY)
  ctx.textAlign     = 'left'
  ctx.letterSpacing = '0px'

  // ── 6. Bottom section: photo + name/role
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
  ctx.strokeStyle = '#002910'
  ctx.lineWidth   = bw
  ctx.strokeRect(photoX + bw / 2, photoY + bw / 2, photoSz - bw, photoSz - bw)

  // Dark background
  ctx.fillStyle = '#002910'
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

  // ── 7. Name
  const textGap  = 24
  const textX    = photoX + photoSz + textGap
  const textMaxW = sectionW - photoSz - textGap

  const name = settings.rtName || 'Ali McCarty'
  ctx.font          = `500 64px ${sans}`
  ctx.fillStyle     = '#002910'
  ctx.letterSpacing = '-1.28px'
  ctx.textBaseline  = 'top'
  const nameLines = wrapText(ctx, name, textMaxW)
  const nameLH    = 64 * 1.2
  nameLines.forEach((line, i) => ctx.fillText(line, textX, photoY + i * nameLH))

  // ── 8. Role & Company
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
