import { MODES, buildLogo, wrapText } from './drawCanvas.js'
import { STIPPLE_COLORS } from './drawFleurons.js'

// Dark variants — bg is one visible step up from near-black, logo uses a light tint
const DARK_MODES = {
  'dark-green':  { bg: '#0f2412', lineColor: 'rgba(0,210,80,0.28)',   logoColor: '#e8f5ee' },
  'dark-pink':   { bg: '#230a1e', lineColor: 'rgba(210,0,160,0.28)',  logoColor: '#f5e8f2' },
  'dark-yellow': { bg: '#1c1d03', lineColor: 'rgba(190,190,0,0.28)',  logoColor: '#f5f5e0' },
  'dark-blue':   { bg: '#0f0f5a', lineColor: 'rgba(100,100,255,0.28)', logoColor: '#e5e5ff' },
}

const DARK_MODE_KEYS = new Set(Object.keys(DARK_MODES))

export function drawTwitterCanvas(canvas, settings, fontsReady, profileImage, floraliaDots) {
  const {
    colorMode,
    dims,
    tweetText         = '',
    tweetAuthorName   = '',
    tweetAuthorHandle = '',
    tweetDate         = '',
  } = settings
  const { w: cw, h: ch } = dims

  canvas.width  = cw
  canvas.height = ch

  const ctx  = canvas.getContext('2d')
  const isDark = DARK_MODE_KEYS.has(colorMode)
  // Content inside the white box always uses the light base colours
  const baseMode  = isDark ? colorMode.replace('dark-', '') : colorMode
  const M         = MODES[baseMode] || MODES['green']
  // Background, guides and logo use the dark variant when active
  const TM        = isDark ? DARK_MODES[colorMode] : M
  const bgColor   = TM.bg
  const lineColor = TM.lineColor
  const logoColor = isDark ? TM.logoColor : M.text

  const isLand  = cw > ch
  const isStory = ch > cw * 1.5

  const sans = fontsReady ? "'Saans', sans-serif"                : 'sans-serif'
  const mono = fontsReady ? "'Saans Mono', 'DM Mono', monospace" : 'monospace'

  // ── Same guide x-coordinates as quote template
  const guideX = 40
  const padY   = isStory ? 200 : 80

  const boxPadX  = isLand ? 52 : 64
  const boxPadY  = isLand ? 52 : 64
  const boxW     = cw - guideX * 2
  const contentW = boxW - boxPadX * 2

  // ── Background
  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, cw, ch)

  // ── Fleuron font fill (rendered at canvas resolution — always crisp)
  if (settings.showFloralia && floraliaDots?.length > 0) {
    const scale = Math.max(cw, ch) * 1.5
    const offX  = (cw - scale) / 2
    const offY  = (ch - scale) / 2
    const dotR  = Math.max(cw, ch) * 0.0022
    ctx.fillStyle  = STIPPLE_COLORS[colorMode] ?? STIPPLE_COLORS['green']
    ctx.globalAlpha = 0.35
    ctx.beginPath()
    floraliaDots.forEach(({ x, y }) => {
      const px = offX + x * scale
      const py = offY + y * scale
      if (px > -dotR && px < cw + dotR && py > -dotR && py < ch + dotR) {
        ctx.moveTo(px + dotR, py)
        ctx.arc(px, py, dotR, 0, Math.PI * 2)
      }
    })
    ctx.fill()
    ctx.globalAlpha = 1
  }

  // ── Placeholder when nothing entered
  if (!tweetText.trim() && !tweetAuthorName.trim()) {
    ctx.font = `500 ${isLand ? 40 : 52}px ${sans}`
    ctx.letterSpacing = '0px'
    ctx.fillStyle = dark ? logoColor : M.pillText
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'
    ctx.fillText('Enter tweet content to preview', cw / 2, ch / 2)
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    return
  }

  const authorName   = tweetAuthorName
  const authorHandle = tweetAuthorHandle.startsWith('@')
    ? tweetAuthorHandle
    : tweetAuthorHandle ? `@${tweetAuthorHandle}` : ''
  const initials = authorName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'

  // ── Sizes
  const nameSz    = isLand ? 36 : 46
  const handleSz  = isLand ? 24 : 30
  const avatarSz  = Math.round(nameSz * 1.15 + handleSz)
  const dateSz    = isLand ? 18 : 22
  const logoH     = 56

  const gapAuthorText = isStory ? 48 : 36
  const gapTextDate   = isStory ? 40 : 32
  const gapBoxFooter  = isLand  ? 48 : 56

  const authorH = avatarSz
  const dateH   = tweetDate ? dateSz * 1.4 : 0
  const dateGap = tweetDate ? gapTextDate   : 0

  // ── Available height for tweet text
  // Non-story: logo bottom is at ch - guideX (40px), so reserve that space symmetrically for centering
  // Story: use padY-based constraint (unchanged)
  const footerReserve = isStory ? padY + logoH + gapBoxFooter : guideX + logoH + gapBoxFooter
  const textAvailH = ch - footerReserve * 2 - boxPadY * 2 - authorH - gapAuthorText - dateGap - dateH

  // ── Measure + wrap tweet text
  const BASE_T = isLand ? 52 : 68
  let tFont = BASE_T
  let tLines

  ctx.textBaseline = 'top'
  for (let f = BASE_T; f >= 28; f -= 1) {
    ctx.font = `500 ${f}px ${sans}`
    ctx.letterSpacing = '0px'
    tLines = wrapText(ctx, tweetText, contentW)
    if (tLines.length * f * 1.2 <= textAvailH) { tFont = f; break }
  }
  ctx.font = `500 ${tFont}px ${sans}`
  ctx.letterSpacing = '0px'
  tLines = wrapText(ctx, tweetText, contentW)
  const tLH  = tFont * 1.2
  const textH = tLines.length * tLH

  // ── Compute box dimensions
  const boxH = boxPadY + authorH + gapAuthorText + textH + dateGap + dateH + boxPadY
  // Story: shift box above centre to account for Instagram bottom UI chrome
  // All other formats: perfect vertical centre
  const vCenter  = isStory ? ch * 0.42 : ch * 0.5
  const boxY     = Math.round(vCenter - boxH / 2)
  const boxXC    = Math.round((cw - boxW) / 2)
  const contentX = boxXC + boxPadX

  // ── Draw white content box (centred)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(boxXC, boxY, boxW, boxH)

  // ── Guide lines drawn ON TOP of box so they're never interrupted
  ctx.strokeStyle = lineColor
  ctx.lineWidth = 1.5

  // Vertical guides (full canvas height — same x as quote template)
  ctx.beginPath(); ctx.moveTo(guideX, 0);        ctx.lineTo(guideX, ch);        ctx.stroke()
  ctx.beginPath(); ctx.moveTo(cw - guideX, 0);   ctx.lineTo(cw - guideX, ch);   ctx.stroke()

  // Horizontal guides at top and bottom of box (full canvas width, responsive to centred position)
  ctx.beginPath(); ctx.moveTo(0, boxY);        ctx.lineTo(cw, boxY);        ctx.stroke()
  ctx.beginPath(); ctx.moveTo(0, boxY + boxH); ctx.lineTo(cw, boxY + boxH); ctx.stroke()

  // ── Content inside box
  let y = boxY + boxPadY

  // Avatar circle
  const cx = contentX + avatarSz / 2
  const cy = y        + avatarSz / 2

  ctx.beginPath()
  ctx.arc(cx, cy, avatarSz / 2, 0, Math.PI * 2)
  ctx.fillStyle = M.pill
  ctx.fill()

  if (profileImage) {
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, avatarSz / 2, 0, Math.PI * 2)
    ctx.clip()
    ctx.drawImage(profileImage, contentX, y, avatarSz, avatarSz)
    ctx.restore()
  } else {
    ctx.font = `500 ${Math.round(avatarSz * 0.38)}px ${sans}`
    ctx.letterSpacing = '0px'
    ctx.fillStyle = M.pillText
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(initials, cx, cy)
    ctx.textAlign = 'left'
  }

  // Name + handle
  const nameX = contentX + avatarSz + 20
  const nameY = y + avatarSz / 2 - (nameSz * 1.15 + handleSz * 0.6) / 2

  ctx.font = `700 ${nameSz}px ${sans}`
  ctx.letterSpacing = '0px'
  ctx.fillStyle = M.text
  ctx.textBaseline = 'top'
  ctx.fillText(authorName, nameX, nameY)

  ctx.globalAlpha = 0.55
  ctx.font = `500 ${handleSz}px ${mono}`
  ctx.letterSpacing = '0.02em'
  ctx.fillStyle = M.pillText
  ctx.fillText(authorHandle, nameX, nameY + nameSz * 1.15)
  ctx.globalAlpha = 1

  y += authorH + gapAuthorText

  // Tweet text
  ctx.font = `500 ${tFont}px ${sans}`
  ctx.letterSpacing = '0px'
  ctx.fillStyle = M.text
  ctx.textBaseline = 'top'
  tLines.forEach((line, i) => ctx.fillText(line, contentX, y + i * tLH))
  y += textH + dateGap

  // Date / time
  if (tweetDate) {
    ctx.globalAlpha = 0.4
    ctx.font = `500 ${dateSz}px ${mono}`
    ctx.letterSpacing = '0.04em'
    ctx.fillStyle = M.text
    ctx.textBaseline = 'top'
    ctx.fillText(tweetDate, contentX, y)
    ctx.globalAlpha = 1
  }

  // ── Footer: AirOps logo (outside box, on brand background)
  // Non-story: logo bottom aligns with guide x (40px from edge), matching quote template
  // Story: 40px below the bottom edge of the white box
  const logoBmp = buildLogo(logoColor, logoH)
  const footerY = isStory ? boxY + boxH + 40 : ch - guideX - logoH
  ctx.drawImage(logoBmp, guideX, footerY)
}
