import { buildLogo, wrapText } from './drawCanvas.js'

// ── Fixed CED color tokens (dark mode only)
const C = {
  bg:            '#00210d',
  photoBg:       '#002910',   // inner photo bg
  photoFrameBg:  '#000d05',   // outer photo frame
  photoBorder:   '#002910',   // speaker photo border (dark)
  text:          '#dfeae3',   // speaker name / role
  ctaText:       '#f8fffb',   // date, badge text
  titleColor:    '#ffffff',   // main headline
  logoColor:     '#dfeae3',   // AirOps logo tint
  badgeDot:      '#e8272a',
  badgeBorder:   '#dfeae3',
}

// ── Vertical guide lines at x=pad and x=cw-pad
function drawGuideLines(ctx, cw, ch, pad) {
  ctx.strokeStyle = 'rgba(255,255,255,0.07)'
  ctx.lineWidth   = 1.5
  const hw = 0.75
  ctx.beginPath()
  ctx.moveTo(pad - hw, 0); ctx.lineTo(pad - hw, ch)
  ctx.moveTo(cw - pad + hw, 0); ctx.lineTo(cw - pad + hw, ch)
  ctx.stroke()
  ctx.lineWidth = 2
}

// ── CED Logo: "Content" in Saraband + "Engineering Dept." in Saans #00ff64
// Dimensions at 1920px: 846×72px (fixed, not scaled by canvas)
function drawCEDLogo(ctx, x, y, saraband, sans) {
  const contentSz = 72
  const edSz      = 71

  ctx.textBaseline  = 'top'
  ctx.fillStyle     = '#00ff64'

  ctx.font          = `400 ${contentSz}px ${saraband}`
  ctx.letterSpacing = '0px'
  ctx.fillText('Content', x, y)
  const contentW = ctx.measureText('Content').width

  ctx.font          = `400 ${edSz}px ${sans}`
  ctx.letterSpacing = '0.71px'
  ctx.fillText(' Engineering Dept.', x + contentW, y + (contentSz - edSz) * 0.5)
  ctx.letterSpacing = '0px'
}

// ── WebinarBadge pill
function drawBadge(ctx, x, y, eyebrow, mono) {
  const h       = 58
  const dotR    = 9.5
  const dotPadX = 16
  const textX   = 51
  const fontSize = 32
  const bw      = 1.364

  ctx.font          = `500 ${fontSize}px ${mono}`
  ctx.letterSpacing = '1.92px'
  const textW = ctx.measureText(eyebrow).width
  ctx.letterSpacing = '0px'
  const w = textX + textW + dotPadX

  ctx.fillStyle = C.bg
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 8); ctx.fill()

  ctx.strokeStyle = C.badgeBorder
  ctx.lineWidth   = bw
  ctx.beginPath(); ctx.roundRect(x + bw / 2, y + bw / 2, w - bw, h - bw, 7); ctx.stroke()
  ctx.lineWidth = 2

  ctx.fillStyle = C.badgeDot
  ctx.beginPath(); ctx.arc(x + dotPadX + dotR, y + h / 2, dotR, 0, Math.PI * 2); ctx.fill()

  ctx.fillStyle     = C.ctaText
  ctx.font          = `500 ${fontSize}px ${mono}`
  ctx.letterSpacing = '1.92px'
  ctx.textBaseline  = 'middle'
  ctx.fillText(eyebrow, x + textX, y + h / 2)
  ctx.letterSpacing = '0px'
  ctx.textBaseline  = 'top'

  return w
}

// ── Speaker photo (screen blend over dark bg)
function drawSpeakerPhoto(ctx, x, y, w, h, img) {
  ctx.fillStyle = C.photoBg
  ctx.fillRect(x, y, w, h)
  if (!img) return
  const overscan = 4
  const s  = Math.max((w + overscan * 2) / (img.naturalWidth || 1),
                      (h + overscan * 2) / (img.naturalHeight || 1))
  const iw = img.naturalWidth  * s
  const ih = img.naturalHeight * s
  ctx.save()
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip()
  ctx.globalCompositeOperation = 'screen'
  ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih)
  ctx.globalCompositeOperation = 'source-over'
  ctx.restore()
}

// ── Partner logo (recolored to C.text)
function drawPartnerLogo(ctx, logoImg, x, y, maxW, maxH) {
  if (!logoImg) return
  const nw = logoImg.naturalWidth  || 300
  const nh = logoImg.naturalHeight || 100
  const s  = Math.min(maxW / nw, maxH / nh, 1)
  const lw = Math.round(nw * s)
  const lh = Math.round(nh * s)
  const off = document.createElement('canvas')
  off.width = lw; off.height = lh
  const oc = off.getContext('2d')
  oc.drawImage(logoImg, 0, 0, lw, lh)
  oc.globalCompositeOperation = 'source-atop'
  oc.fillStyle = C.text
  oc.fillRect(0, 0, lw, lh)
  ctx.drawImage(off, x, y + Math.round((maxH - lh) / 2))
}

// ── AirOps logo
function drawAirOpsLogo(ctx, x, y, logoH, dpr) {
  const logoW = Math.round(784 * logoH / 252)
  const bmp   = buildLogo(C.logoColor, Math.round(logoH * dpr))
  ctx.fillStyle = C.bg
  ctx.fillRect(x, y, logoW, logoH)
  ctx.drawImage(bmp, x, y, logoW, logoH)
}

// ── Speaker block (photo frame + name + role + optional partner logo)
function drawSpeakerBlock(ctx, x, y, w, name, role, img, logoImg, nameSz, roleSz, sans) {
  const bw      = 1.5
  const pad     = 8
  const gap     = 16

  const photoSide = w

  // Outer frame bg
  ctx.fillStyle = C.photoFrameBg
  ctx.fillRect(x, y, photoSide, photoSide)

  // Border
  ctx.strokeStyle = C.photoBorder
  ctx.lineWidth   = bw
  ctx.strokeRect(x + bw / 2, y + bw / 2, photoSide - bw, photoSide - bw)

  const innerSide = photoSide - pad * 2 - bw * 2
  drawSpeakerPhoto(ctx, x + pad + bw, y + pad + bw, innerSide, innerSide, img)

  let ty = y + photoSide + gap
  const nameLH = Math.round(nameSz * 1.2)
  const roleLH = Math.round(roleSz * 1.2)

  ctx.fillStyle     = C.text
  ctx.font          = `500 ${nameSz}px ${sans}`
  ctx.letterSpacing = `-${(nameSz * 0.02).toFixed(2)}px`
  ctx.textBaseline  = 'top'
  ctx.fillText(name, x, ty, w)
  ty += nameLH + 8

  ctx.font          = `400 ${roleSz}px ${sans}`
  ctx.letterSpacing = `-${(roleSz * 0.02).toFixed(2)}px`
  const roleLines = wrapText(ctx, role, w)
  roleLines.forEach((line, i) => ctx.fillText(line, x, ty + i * roleLH))
  ty += roleLines.length * roleLH

  if (logoImg) drawPartnerLogo(ctx, logoImg, x, ty + 12, w * 0.7, 44)
  ctx.letterSpacing = '0px'
}

// ── Multi-line date block
function dateLines(date) { return date.replace(/\\n/g, '\n').split('\n') }

function drawDate(ctx, date, x, y, maxW, sans, align = 'right') {
  const fontSize = 40
  const lh       = fontSize * 1.2
  const lines    = dateLines(date)
  ctx.font          = `400 ${fontSize}px ${sans}`
  ctx.letterSpacing = '-0.8px'
  ctx.fillStyle     = C.ctaText
  ctx.textBaseline  = 'top'
  ctx.textAlign     = align
  const tx = align === 'right' ? x + maxW : x
  lines.forEach((line, i) => ctx.fillText(line, tx, y + i * lh))
  ctx.textAlign     = 'left'
  ctx.letterSpacing = '0px'
  return lines.length * lh
}

// ── Auto-size main title to fit
function sizeMainTitle(ctx, text, maxW, maxH, maxFontSize, minFontSize, font) {
  for (let f = maxFontSize; f >= minFontSize; f -= 2) {
    ctx.font          = `500 ${f}px ${font}`
    ctx.letterSpacing = `-${(f * 0.02).toFixed(2)}px`
    const lines   = wrapText(ctx, text, maxW)
    const totalH  = lines.length * f * 0.94
    if (totalH <= maxH) return { lines, fontSize: f }
  }
  ctx.font          = `500 ${minFontSize}px ${font}`
  ctx.letterSpacing = `-${(minFontSize * 0.02).toFixed(2)}px`
  return { lines: wrapText(ctx, text, maxW), fontSize: minFontSize }
}

// ── CED title block: CED logo + main headline
function drawCEDTitleBlock(ctx, x, y, w, mainTitle, mainFont, saraband, sans) {
  // CED logo (fixed 72px tall)
  drawCEDLogo(ctx, x, y, saraband, sans)
  y += 72 + 24   // logo height + gap

  // Auto-size main title
  const { lines, fontSize: mainSz } = sizeMainTitle(ctx, mainTitle, w, 9999, 130, 36, mainFont)
  const mainLH = mainSz * 0.94
  ctx.font          = `500 ${mainSz}px ${mainFont}`
  ctx.letterSpacing = `-${(mainSz * 0.02).toFixed(2)}px`
  ctx.fillStyle     = C.titleColor
  ctx.textBaseline  = 'top'
  lines.forEach((line, i) => ctx.fillText(line, x, y + i * mainLH))
  ctx.letterSpacing = '0px'
  y += lines.length * mainLH

  return y
}

// ─────────────────────────────────────────────
// ── PORTRAIT / SQUARE / STORY layout (1080-wide)
// ─────────────────────────────────────────────
function drawPortraitLayout(ctx, cw, ch, pad, padTop, padBottom, settings, speakers, serif, sans, mono, saraband, dpr) {
  const {
    wbMainTitle = 'Playbook topic for conversation.',
    wbDate      = 'Thursday, December 3rd\n1:00 PM EST',
    wbEyebrow   = 'WEBINAR',
  } = settings
  const n = speakers.length

  const innerX = pad
  const innerY = padTop
  const innerW = cw - pad * 2
  const logoH  = 48
  const innerH = ch - padTop - padBottom

  // Badge + date row
  const badgeW = drawBadge(ctx, innerX, innerY, wbEyebrow, mono)
  const dateFontH = 40 * 1.2 * dateLines(wbDate).length
  const dateBoxX  = innerX + badgeW + 16
  const dateBoxW  = innerW - badgeW - 16
  drawDate(ctx, wbDate, dateBoxX, innerY + (58 - dateFontH) / 2, dateBoxW, sans)

  const headerH = 96
  const logoY   = innerY + innerH - logoH
  // For CED: always use serif (1-speaker) or sans (2+ speakers)
  const mainFont = n === 1 ? serif : sans

  if (n === 1) {
    const sp       = speakers[0]
    const contentY = innerY + headerH + 24

    // Title block
    drawCEDTitleBlock(ctx, innerX, contentY, innerW, wbMainTitle, mainFont, saraband, sans)

    // Speaker: small photo left + name/role right
    const speakerY  = contentY + 72 + 24 + Math.round(
      (() => {
        ctx.font = `500 130px ${mainFont}`
        const ls  = wrapText(ctx, wbMainTitle, innerW)
        return ls.length * 130 * 0.94
      })()
    ) + 24
    const photoSz   = 320
    const bw        = 1.5

    ctx.fillStyle = C.photoFrameBg
    ctx.fillRect(innerX, speakerY, photoSz, photoSz)
    ctx.strokeStyle = C.photoBorder
    ctx.lineWidth   = bw
    ctx.strokeRect(innerX + bw / 2, speakerY + bw / 2, photoSz - bw, photoSz - bw)
    const ip = 8
    drawSpeakerPhoto(ctx, innerX + ip + bw, speakerY + ip + bw, photoSz - ip * 2 - bw * 2, photoSz - ip * 2 - bw * 2, sp.image)

    const textX  = innerX + photoSz + 24
    const textW  = innerW - photoSz - 24
    let ty       = speakerY
    const nameSz = Math.round(textW * 0.085)
    ctx.font          = `500 ${nameSz}px ${sans}`
    ctx.letterSpacing = `-${(nameSz * 0.02).toFixed(2)}px`
    ctx.fillStyle     = C.text
    ctx.textBaseline  = 'top'
    ctx.fillText(sp.name, textX, ty, textW)
    ty += Math.round(nameSz * 1.2) + 8
    const roleSz = Math.round(textW * 0.06)
    ctx.font          = `400 ${roleSz}px ${sans}`
    ctx.letterSpacing = `-${(roleSz * 0.02).toFixed(2)}px`
    const roleLines   = wrapText(ctx, sp.role, textW)
    roleLines.forEach((line, i) => ctx.fillText(line, textX, ty + i * Math.round(roleSz * 1.2)))
    ty += roleLines.length * Math.round(roleSz * 1.2) + 12
    if (sp.logo) drawPartnerLogo(ctx, sp.logo, textX, ty, textW * 0.65, 44)

  } else {
    // 2–4 speakers
    const blockGap = 16
    const blockW   = n === 2
      ? Math.round(innerW * 0.346)
      : Math.round((innerW - (n - 1) * blockGap) / n)
    const nameSz = Math.max(20, Math.round(blockW * 0.14))
    const roleSz = Math.max(14, Math.round(blockW * 0.10))

    const contentY     = innerY + headerH + 24
    drawCEDTitleBlock(ctx, innerX, contentY, innerW, wbMainTitle, mainFont, saraband, sans)

    // Compute titleBottomY
    ctx.font = `500 130px ${mainFont}`
    const titleLines = wrapText(ctx, wbMainTitle, innerW)
    const titleBottomY = contentY + 72 + 24 + titleLines.length * 130 * 0.94

    const speakerY = titleBottomY + 24
    speakers.forEach((sp, i) => {
      const bx = innerX + i * (blockW + blockGap)
      drawSpeakerBlock(ctx, bx, speakerY, blockW, sp.name, sp.role, sp.image, sp.logo, nameSz, roleSz, sans)
    })
  }

  drawAirOpsLogo(ctx, innerX, logoY, logoH, dpr)
  ctx.letterSpacing = '0px'
}

// ─────────────────────────────────────────────
// ── LANDSCAPE layout (1920×1080)
// ─────────────────────────────────────────────
function drawLandscapeLayout(ctx, cw, ch, pad, settings, speakers, serif, sans, mono, saraband, dpr) {
  const {
    wbMainTitle = 'Playbook topic for conversation.',
    wbDate      = 'Thursday, December 3rd\n1:00 PM EST',
    wbEyebrow   = 'WEBINAR',
  } = settings
  const n      = speakers.length
  const innerH = ch - pad * 2
  const logoH  = n >= 3 ? 56 : 48

  if (n === 1) {
    const leftW  = Math.round(cw * 0.625)
    const rightX = leftW + pad
    const rightW = cw - rightX - pad
    const photoSz = Math.min(rightW, innerH * 0.6)
    const sp = speakers[0]

    drawBadge(ctx, pad, pad, wbEyebrow, mono)
    if (sp.logo) drawPartnerLogo(ctx, sp.logo, pad + leftW - 300, pad, 280, 58)

    // Title block (badge gap + CED logo + headline, justify-between within left col)
    const titleY = pad + 80
    const titleW = leftW - pad
    drawCEDTitleBlock(ctx, pad, titleY, titleW, wbMainTitle, serif, saraband, sans)

    drawAirOpsLogo(ctx, pad, ch - pad - logoH, logoH, dpr)

    // Photo frame
    const bw = 2
    ctx.fillStyle   = C.photoFrameBg
    ctx.fillRect(rightX, pad, photoSz, photoSz)
    ctx.strokeStyle = C.photoBorder
    ctx.lineWidth   = bw
    ctx.strokeRect(rightX + bw / 2, pad + bw / 2, photoSz - bw, photoSz - bw)
    const ip = 8
    drawSpeakerPhoto(ctx, rightX + ip, pad + ip, photoSz - ip * 2, photoSz - ip * 2, sp.image)

    // Name + role
    const nameY  = pad + photoSz + 40
    const nameSz = 56
    ctx.font          = `500 ${nameSz}px ${sans}`
    ctx.letterSpacing = '-1.12px'
    ctx.fillStyle     = C.text
    ctx.textBaseline  = 'top'
    ctx.fillText(sp.name, rightX, nameY, rightW)
    const roleY  = nameY + Math.round(nameSz * 1.2) + 8
    const roleSz = 40
    ctx.font          = `400 ${roleSz}px ${sans}`
    ctx.letterSpacing = '-0.8px'
    const roleLines = wrapText(ctx, sp.role, rightW)
    roleLines.forEach((line, i) => ctx.fillText(line, rightX, roleY + i * Math.round(roleSz * 1.2)))

    // Date (left-aligned under speaker)
    const dateLinesArr = dateLines(wbDate)
    const dateSz = 40
    const dateLH = dateSz * 1.2
    const dateY  = ch - pad - dateLinesArr.length * dateLH
    ctx.font          = `400 ${dateSz}px ${sans}`
    ctx.letterSpacing = '-0.8px'
    ctx.fillStyle     = C.ctaText
    dateLinesArr.forEach((line, i) => ctx.fillText(line, rightX, dateY + i * dateLH))
    ctx.letterSpacing = '0px'

  } else if (n === 2) {
    const leftW      = Math.round(cw * 0.48)
    const speakersX  = leftW + pad
    const speakersW  = cw - speakersX - pad
    const gap        = 24
    const blockW     = Math.round((speakersW - gap) / 2)
    const nameSz     = Math.max(20, Math.round(blockW * 0.14))
    const roleSz     = Math.max(14, Math.round(blockW * 0.10))

    drawBadge(ctx, pad, pad, wbEyebrow, mono)

    const dateLineCount = dateLines(wbDate).length
    const dateH = dateLineCount * 40 * 1.2
    drawDate(ctx, wbDate, speakersX, ch - pad - dateH, 0, sans, 'left')

    const titleY = Math.round(ch * 0.2)
    const titleW = leftW - pad
    drawCEDTitleBlock(ctx, pad, titleY, titleW, wbMainTitle, sans, saraband, sans)

    drawAirOpsLogo(ctx, pad, ch - pad - logoH, logoH, dpr)

    speakers.forEach((sp, i) => {
      const bx = speakersX + i * (blockW + gap)
      drawSpeakerBlock(ctx, bx, pad, blockW, sp.name, sp.role, sp.image, sp.logo, nameSz, roleSz, sans)
    })

  } else {
    // 3–4 speakers: same dynamic sizing as regular
    const spGap        = 16
    const TITLE_SP_GAP = 24
    const TC_H         = 503
    const targetBlockH = ch - 2 * pad - TC_H - TITLE_SP_GAP
    const blockW       = Math.round((targetBlockH - 24) / 1.449)
    const nameSz       = Math.max(18, Math.round(blockW * 0.154))
    const roleSz       = Math.max(13, Math.round(blockW * 0.110))
    const nameLH       = Math.round(nameSz * 1.2)
    const roleLH       = Math.round(roleSz * 1.2)
    const spBlockH     = blockW + 16 + nameLH + 8 + roleLH * 2
    const spY          = ch - pad - spBlockH
    const spZoneW      = n * blockW + (n - 1) * spGap
    const spZoneX      = cw - pad - spZoneW

    drawBadge(ctx, pad, pad, wbEyebrow, mono)
    drawDate(ctx, wbDate, spZoneX, pad, spZoneW, sans)

    const TW        = cw - pad * 2
    const CLAUSE_SZ = 72
    const CLAUSE_LH = Math.round(CLAUSE_SZ * 0.94)
    // For CED: logo (72px) + 24px gap takes the place of the clause
    const logoBlockH  = 72 + 24
    const maxMainH    = TC_H - logoBlockH - 24
    const { lines: titleLines, fontSize: mainSz } =
      sizeMainTitle(ctx, wbMainTitle, TW, maxMainH, 130, 36, sans)
    const titleBlockH = logoBlockH + Math.round(titleLines.length * mainSz * 0.94)
    const titleY      = pad + TC_H - titleBlockH

    drawCEDTitleBlock(ctx, pad, titleY, TW, wbMainTitle, sans, saraband, sans)

    drawAirOpsLogo(ctx, pad, ch - pad - logoH, logoH, dpr)

    speakers.forEach((sp, i) => {
      drawSpeakerBlock(
        ctx, spZoneX + i * (blockW + spGap), spY, blockW,
        sp.name, sp.role, sp.image, sp.logo, nameSz, roleSz, sans,
      )
    })
  }
}

// ─────────────────────────────────────────────
// ── BLOG GRAPHIC layout (photos only, no text)
// ─────────────────────────────────────────────
function drawBlogLayout(ctx, cw, ch, settings, speakers, mono) {
  const { wbEyebrow = 'WEBINAR' } = settings
  const n        = speakers.length
  const photoSz  = n === 1 ? 629 : n === 2 ? 629 : n === 3 ? 550 : 439
  const gap      = 16
  const groupW   = n * photoSz + (n - 1) * gap
  const startX   = Math.round((cw - groupW) / 2)
  const photoY   = Math.round((ch - photoSz) / 2) + 16
  const innerPad = Math.round(photoSz * 0.026)

  // Badge centred
  ctx.save()
  ctx.font          = `500 32px ${mono}`
  ctx.letterSpacing = '1.92px'
  const badgeW = 51 + ctx.measureText(wbEyebrow).width + 16
  ctx.restore()
  const badgeX = Math.round((cw - badgeW) / 2)
  drawBadge(ctx, badgeX, 152, wbEyebrow, mono)

  const bw = 2
  speakers.forEach((sp, i) => {
    const x = startX + i * (photoSz + gap)
    ctx.fillStyle   = C.photoFrameBg
    ctx.fillRect(x, photoY, photoSz, photoSz)
    ctx.strokeStyle = C.photoBorder
    ctx.lineWidth   = bw
    ctx.strokeRect(x + bw / 2, photoY + bw / 2, photoSz - bw, photoSz - bw)
    drawSpeakerPhoto(ctx, x + innerPad, photoY + innerPad,
      photoSz - innerPad * 2, photoSz - innerPad * 2, sp.image)
  })
}

// ─────────────────────────────────────────────
// ── MAIN EXPORT
// ─────────────────────────────────────────────
export function drawCEDCanvas(canvas, settings, fontsReady, speakerImages, speakerLogos) {
  const { dims, wbNumSpeakers = 1 } = settings
  const { w: cw, h: ch } = dims
  const dpr = settings.dpr ?? 1

  canvas.width  = cw * dpr
  canvas.height = ch * dpr

  const ctx = canvas.getContext('2d')
  if (dpr !== 1) ctx.scale(dpr, dpr)

  const isLand  = cw > ch
  const isStory = ch > cw * 1.5

  const serif   = fontsReady ? "'Serrif VF', Georgia, serif"         : 'Georgia, serif'
  const sans    = fontsReady ? "'Saans', sans-serif"                  : 'sans-serif'
  const mono    = fontsReady ? "'Saans Mono', 'DM Mono', monospace"   : 'monospace'
  const saraband = fontsReady ? "'Saraband', 'Serrif VF', serif"      : 'Georgia, serif'

  // Background
  ctx.fillStyle = C.bg
  ctx.fillRect(0, 0, cw, ch)

  // Vertical guide lines
  drawGuideLines(ctx, cw, ch, 40)

  const n = Math.max(1, Math.min(4, wbNumSpeakers))
  const speakers = Array.from({ length: n }, (_, i) => ({
    name:  settings[`wbSpeaker${i + 1}Name`] || `Speaker ${i + 1}`,
    role:  settings[`wbSpeaker${i + 1}Role`] || 'Title, Company',
    image: speakerImages[i] ?? null,
    logo:  speakerLogos[i]  ?? null,
  }))

  const pad       = 40
  const padTop    = isStory ? 240 : pad
  const padBottom = isStory ? 480 : pad

  ctx.textBaseline = 'top'

  if (settings.wbIsBlog) {
    drawBlogLayout(ctx, cw, ch, settings, speakers, mono)
  } else if (isLand) {
    drawLandscapeLayout(ctx, cw, ch, pad, settings, speakers, serif, sans, mono, saraband, dpr)
  } else {
    drawPortraitLayout(ctx, cw, ch, pad, padTop, padBottom, settings, speakers, serif, sans, mono, saraband, dpr)
  }
}
