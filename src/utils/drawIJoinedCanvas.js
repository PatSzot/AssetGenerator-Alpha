import { buildLogo } from './drawCanvas.js'

// ── Per-mode palette (5 AirOps brand variants)
const IJ_MODES = {
  night:  { bg: '#000d05', text: '#ffffff', logoColor: '#ffffff', frameBorder: '#008c44', hiringColor: '#00ff64' },
  forest: { bg: '#002910', text: '#ffffff', logoColor: '#ffffff', frameBorder: '#008c44', hiringColor: '#00ff64' },
  green:  { bg: '#008c44', text: '#ffffff', logoColor: '#ffffff', frameBorder: '#dfeae3', hiringColor: '#00ff64' },
  mint:   { bg: '#dfeae3', text: '#002910', logoColor: '#002910', frameBorder: '#008c44', hiringColor: '#008c44' },
  paper:  { bg: '#f8fffb', text: '#002910', logoColor: '#002910', frameBorder: '#008c44', hiringColor: '#008c44' },
}

// Photo frame bg — near-dark green base so lighter blend lifts highlights through cleanly
const PHOTO_BG = '#002910'

export const IJ_MODE_LABELS = {
  night:  'Night',
  forest: 'Forest',
  green:  'Green',
  mint:   'Mint',
  paper:  'Paper',
}

export function drawIJoinedCanvas(canvas, settings, fontsReady, profileImage) {
  const {
    dims,
    ijMode       = 'night',
    ijName       = 'Firstname Lastname',
    ijRole       = 'Role',
    ijShowHiring = true,
  } = settings

  const { w: cw, h: ch } = dims
  const dpr = settings.dpr ?? 1
  const s   = cw / 1920  // scale vs Figma 1920×1080 reference

  canvas.width  = cw * dpr
  canvas.height = ch * dpr

  const ctx = canvas.getContext('2d')
  if (dpr !== 1) ctx.scale(dpr, dpr)

  const M     = IJ_MODES[ijMode] ?? IJ_MODES.night
  const sans  = fontsReady ? "'Saans', sans-serif"                : 'sans-serif'
  const mono  = fontsReady ? "'Saans Mono', 'DM Mono', monospace" : 'monospace'
  const serif = fontsReady ? "'Serrif VF', Georgia, serif"        : 'Georgia, serif'

  // ── Background
  ctx.fillStyle = M.bg
  ctx.fillRect(0, 0, cw, ch)

  // ── Layout constants (Figma reference 1920×1080)
  const guideX    = Math.round(40   * s)
  const contentY  = Math.round(40   * s)
  const contentH  = Math.round(1006 * s)
  const colGap    = Math.round(32   * s)
  const colW      = Math.round(904  * s)   // (1840 − 32) / 2
  const leftColX  = guideX
  const rightColX = guideX + colW + colGap

  // ── Left column — "I joined" + logo (top)
  const ijTextSz = Math.round(192 * s)
  const ijLH     = Math.round(192 * 0.94 * s)   // line-height advance
  const logoH    = Math.round(191 * s)
  const logoW    = Math.round(logoH * 784 / 252)
  const logoGap  = Math.round(8 * s)
  const logoBmp  = buildLogo(M.logoColor, Math.round(logoH * dpr))

  ctx.textBaseline = 'top'
  ctx.textAlign    = 'left'
  ctx.fillStyle    = M.text
  ctx.font         = `400 ${ijTextSz}px ${sans}`
  ctx.letterSpacing = `${(-ijTextSz * 0.04).toFixed(2)}px`   // tracking −4%
  ctx.fillText('I joined', leftColX, contentY)
  ctx.letterSpacing = '0px'

  const logoY = contentY + ijLH + logoGap
  ctx.fillStyle = M.bg
  ctx.fillRect(leftColX, logoY, logoW, logoH)
  ctx.drawImage(logoBmp, leftColX, logoY, logoW, logoH)

  // ── Left column — name / role / hiring (bottom-aligned)
  const nameSz  = Math.round(72 * s)
  const nameLH  = Math.round(72 * 0.94 * s)
  const roleSz  = Math.round(72 * s)
  const roleLH  = Math.round(72 * 0.94 * s)
  const hireSz  = Math.round(40 * s)
  const hireLH  = Math.round(40 * 0.94 * s)
  const hireGap = Math.round(25 * s)            // Figma: gap-[24.773px]

  const contentBottom = contentY + contentH
  const hiringH       = ijShowHiring ? hireGap + hireLH : 0
  const bottomGroupH  = nameLH + roleLH + hiringH
  const bottomGroupY  = contentBottom - bottomGroupH

  // Name — Serrif VF
  ctx.fillStyle    = M.text
  ctx.font         = `400 ${nameSz}px ${serif}`
  ctx.letterSpacing = `${(-nameSz * 0.02).toFixed(2)}px`    // tracking −2%
  ctx.textBaseline = 'top'
  ctx.textAlign    = 'left'
  ctx.fillText(ijName, leftColX, bottomGroupY)
  ctx.letterSpacing = '0px'

  // Role — Saans
  ctx.font         = `400 ${roleSz}px ${sans}`
  ctx.letterSpacing = `${(-roleSz * 0.02).toFixed(2)}px`
  ctx.fillText(ijRole, leftColX, bottomGroupY + nameLH)
  ctx.letterSpacing = '0px'

  // (WE'RE HIRING) — Saans Mono Medium
  if (ijShowHiring) {
    ctx.font         = `500 ${hireSz}px ${mono}`
    ctx.letterSpacing = `${(-hireSz * 0.04).toFixed(2)}px`  // tracking −4%
    ctx.fillStyle    = M.hiringColor
    ctx.fillText("(WE'RE HIRING)", leftColX, bottomGroupY + nameLH + roleLH + hireGap)
    ctx.letterSpacing = '0px'
  }

  // ── Right column — photo frame
  const borderW = 3
  const pad     = Math.round(9 * s)   // Figma: p-[8.964px]
  const frameX  = rightColX
  const frameY  = contentY
  const frameW  = colW
  const frameH  = contentH

  // Border
  ctx.strokeStyle = M.frameBorder
  ctx.lineWidth   = borderW
  ctx.strokeRect(frameX + borderW / 2, frameY + borderW / 2, frameW - borderW, frameH - borderW)
  ctx.lineWidth = 1

  // Inner background
  const innerX = frameX + borderW + pad
  const innerY = frameY + borderW + pad
  const innerW = frameW - (borderW + pad) * 2
  const innerH = frameH - (borderW + pad) * 2

  // Inner background — per-mode near-dark base so lighter blend produces the right headshot depth
  ctx.fillStyle = PHOTO_BG
  ctx.fillRect(innerX, innerY, innerW, innerH)

  // Photo — aspect-fill with 4px overscan + hard-light blend (matches Figma)
  if (profileImage) {
    const overscan = 4
    const ps = Math.max(
      (innerW + overscan * 2) / (profileImage.naturalWidth  || 1),
      (innerH + overscan * 2) / (profileImage.naturalHeight || 1),
    )
    const iw = profileImage.naturalWidth  * ps
    const ih = profileImage.naturalHeight * ps
    ctx.save()
    ctx.beginPath()
    ctx.rect(innerX, innerY, innerW, innerH)
    ctx.clip()
    ctx.globalCompositeOperation = 'hard-light'
    ctx.drawImage(profileImage, innerX + (innerW - iw) / 2, innerY + (innerH - ih) / 2, iw, ih)
    ctx.globalCompositeOperation = 'source-over'
    ctx.restore()
  }

  // Reset
  ctx.textAlign    = 'left'
  ctx.textBaseline = 'top'
  ctx.letterSpacing = '0px'
}
