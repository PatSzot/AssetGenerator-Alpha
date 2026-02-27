import { MODES, buildLogo, wrapText } from './drawCanvas.js'

export function drawTwitterCanvas(canvas, settings, fontsReady, profileImage) {
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

  const ctx = canvas.getContext('2d')
  const M   = MODES[colorMode]

  const isLand  = cw > ch
  const isStory = ch > cw * 1.5

  const sans = fontsReady ? "'Saans', sans-serif"                : 'sans-serif'
  const mono = fontsReady ? "'Saans Mono', 'DM Mono', monospace" : 'monospace'

  const pad    = 80
  const padY   = isStory ? 200 : pad
  const innerW = cw - pad * 2

  // ── Background
  ctx.fillStyle = M.bg
  ctx.fillRect(0, 0, cw, ch)

  // ── Guide lines
  ctx.strokeStyle = M.lineColor
  ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(pad, 0);      ctx.lineTo(pad, ch);      ctx.stroke()
  ctx.beginPath(); ctx.moveTo(cw - pad, 0); ctx.lineTo(cw - pad, ch); ctx.stroke()

  // ── Placeholder when nothing entered
  if (!tweetText.trim() && !tweetAuthorName.trim()) {
    ctx.font = `500 ${isLand ? 40 : 52}px ${sans}`
    ctx.letterSpacing = '0px'
    ctx.fillStyle = M.pillText
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
  const nameSz    = isLand ? 36  : 46
  const handleSz  = isLand ? 24  : 30
  const avatarSz  = Math.round(nameSz * 1.15 + handleSz)   // matches height of name + handle block
  const dateSz    = isLand ? 18  : 22
  const footerH   = 100

  const authorH       = avatarSz
  const dateH         = dateSz * 1.4
  const gapAuthorText = isStory ? 56 : 40
  const gapTextDate   = isStory ? 56 : 40
  const gapDateFooter = 32

  const availH = ch - padY * 2 - footerH - authorH - dateH - gapAuthorText - gapTextDate - gapDateFooter

  let y = padY

  // ── Author row (top)
  const cx = pad + avatarSz / 2
  const cy = y   + avatarSz / 2

  ctx.beginPath()
  ctx.arc(cx, cy, avatarSz / 2, 0, Math.PI * 2)
  ctx.fillStyle = M.pill
  ctx.fill()

  if (profileImage) {
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, avatarSz / 2, 0, Math.PI * 2)
    ctx.clip()
    ctx.drawImage(profileImage, pad, y, avatarSz, avatarSz)
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
  const nameX = pad + avatarSz + 20
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

  y += avatarSz + gapAuthorText

  // ── Tweet text — auto-shrink
  const BASE_T = isLand ? 52 : 68
  let tFont = BASE_T
  let tLines

  ctx.textBaseline = 'top'
  for (let f = BASE_T; f >= 28; f -= 1) {
    ctx.font = `500 ${f}px ${sans}`
    ctx.letterSpacing = '0px'
    tLines = wrapText(ctx, tweetText, innerW)
    if (tLines.length * f * 1.2 <= availH) { tFont = f; break }
  }

  ctx.font = `500 ${tFont}px ${sans}`
  ctx.letterSpacing = '0px'
  tLines = wrapText(ctx, tweetText, innerW)

  const tLH = tFont * 1.2
  ctx.fillStyle = M.text
  ctx.textBaseline = 'top'
  tLines.forEach((line, i) => ctx.fillText(line, pad, y + i * tLH))
  y += tLines.length * tLH + gapTextDate

  // ── Date / time (muted)
  if (tweetDate) {
    ctx.globalAlpha = 0.4
    ctx.font = `500 ${dateSz}px ${mono}`
    ctx.letterSpacing = '0.04em'
    ctx.fillStyle = M.text
    ctx.textBaseline = 'top'
    ctx.fillText(tweetDate, pad, y)
    ctx.globalAlpha = 1
  }

  // ── Footer: AirOps logo
  const logoH   = 56
  const logoBmp = buildLogo(M.text, logoH)
  const footerY = ch - padY - logoH
  ctx.drawImage(logoBmp, pad, footerY)
}
