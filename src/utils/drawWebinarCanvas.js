import { MODES, buildLogo, wrapText } from './drawCanvas.js'
import { STIPPLE_COLORS } from './drawFleurons.js'

const DARK_MODES = {
  'dark-green':  { bg: '#0f2412', lineColor: 'rgba(0,210,80,1)',    logoColor: '#e8f5ee' },
  'dark-pink':   { bg: '#230a1e', lineColor: 'rgba(210,0,160,1)',   logoColor: '#f5e8f2' },
  'dark-yellow': { bg: '#1c1d03', lineColor: 'rgba(190,190,0,1)',   logoColor: '#f5f5e0' },
  'dark-blue':   { bg: '#0f0f5a', lineColor: 'rgba(100,100,255,1)', logoColor: '#e5e5ff' },
}

// ── WebinarBadge pill (green dot + eyebrow text)
function drawBadge(ctx, x, y, eyebrow, M, mono) {
  const h        = 58
  const dotR     = 9.5
  const dotPadX  = 16
  const textX    = 51
  const fontSize = 32
  const bw       = 1.5

  ctx.font         = `500 ${fontSize}px ${mono}`
  ctx.letterSpacing = '1.92px'
  const textW = ctx.measureText(eyebrow).width
  ctx.letterSpacing = '0px'
  const w = textX + textW + dotPadX

  // Background: canvas bg color (same shade as canvas — border defines the pill)
  ctx.fillStyle = M.canvasBg
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, 8)
  ctx.fill()

  // Border: mode accent
  ctx.strokeStyle = M.lineColor
  ctx.lineWidth   = bw
  ctx.beginPath()
  ctx.roundRect(x + bw / 2, y + bw / 2, w - bw, h - bw, 7)
  ctx.stroke()

  // Dot: red in light modes, accent in dark modes
  ctx.fillStyle = M.badgeDot
  ctx.beginPath()
  ctx.arc(x + dotPadX + dotR, y + h / 2, dotR, 0, Math.PI * 2)
  ctx.fill()

  // Text: dark CTA color (ctaText = dark in light, light in dark)
  ctx.fillStyle    = M.ctaText
  ctx.font         = `500 ${fontSize}px ${mono}`
  ctx.letterSpacing = '1.92px'
  ctx.textBaseline = 'middle'
  ctx.fillText(eyebrow, x + textX, y + h / 2)
  ctx.letterSpacing = '0px'
  ctx.textBaseline = 'top'

  return w
}

// ── Speaker photo box: dark bg + aspect-fill headshot with hard-light blend
function drawSpeakerPhoto(ctx, x, y, w, h, img, M) {
  ctx.fillStyle = M.photoBg
  ctx.fillRect(x, y, w, h)
  if (!img) return
  const overscan = 4
  const s  = Math.max((w + overscan * 2) / (img.naturalWidth || 1),
                      (h + overscan * 2) / (img.naturalHeight || 1))
  const iw = img.naturalWidth  * s
  const ih = img.naturalHeight * s
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, w, h)
  ctx.clip()
  ctx.globalCompositeOperation = 'screen'
  ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih)
  ctx.globalCompositeOperation = 'source-over'
  ctx.restore()
}

// ── Partner logo (recolored to M.text)
function drawPartnerLogo(ctx, logoImg, x, y, maxW, maxH, M) {
  if (!logoImg) return
  const nw = logoImg.naturalWidth  || 300
  const nh = logoImg.naturalHeight || 100
  const s  = Math.min(maxW / nw, maxH / nh, 1)
  const lw = Math.round(nw * s)
  const lh = Math.round(nh * s)
  const off = document.createElement('canvas')
  off.width  = lw
  off.height = lh
  const oc = off.getContext('2d')
  oc.drawImage(logoImg, 0, 0, lw, lh)
  oc.globalCompositeOperation = 'source-atop'
  oc.fillStyle = M.text
  oc.fillRect(0, 0, lw, lh)
  ctx.drawImage(off, x, y + Math.round((maxH - lh) / 2))
}

// ── AirOps logo
function drawAirOpsLogo(ctx, x, y, logoH, M, dpr) {
  const logoW = Math.round(784 * logoH / 252)
  const bmp   = buildLogo(M.text, Math.round(logoH * dpr))
  ctx.fillStyle = M.canvasBg
  ctx.fillRect(x, y, logoW, logoH)
  ctx.drawImage(bmp, x, y, logoW, logoH)
}

// ── Draw floralia dots
function drawFloralia(ctx, settings, cw, ch, isLand, M) {
  const floralia = settings._floralia
  if (!settings.showFloralia || !floralia?.insideDots) return

  const rotAngle = ((settings.decorationRotation ?? 0) * Math.PI) / 180
  if (rotAngle !== 0) {
    ctx.save()
    ctx.translate(cw / 2, ch / 2)
    ctx.rotate(rotAngle)
    ctx.translate(-cw / 2, -ch / 2)
  }

  const scale    = Math.max(cw, ch) * 1.5
  const offX     = (cw - scale) / 2
  const offY     = (ch - scale) / 2
  const dotR     = Math.max(cw, ch) * (isLand ? 0.0016 : 0.0022)
  const guideX   = 40
  const stepNorm = 0.006
  const shiftX   = ((guideX - offX) / scale) % stepNorm
  const shiftY   = ((guideX - offY) / scale) % stepNorm
  const accent   = STIPPLE_COLORS[settings.colorMode] ?? STIPPLE_COLORS['green']

  const drawDots = (dots, alpha) => {
    ctx.fillStyle   = accent
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

  if (settings.decorationStyle === 'inverted') {
    drawDots(floralia.outsideDots ?? floralia.insideDots, 0.28)
    ctx.fillStyle = M.canvasBg
    floralia.glyphs?.forEach(({ char, fontSizeNorm, cxNorm, cyNorm }) => {
      ctx.font = `${fontSizeNorm * scale}px Floralia`
      ctx.fillText(char, offX + cxNorm * scale, offY + cyNorm * scale)
    })
  } else {
    drawDots(floralia.insideDots, 0.35)
  }

  if (rotAngle !== 0) ctx.restore()
}

// ── Wrap date (may contain \n literal)
function dateLines(date) {
  return date.replace(/\\n/g, '\n').split('\n')
}

// ── Draw multi-line date/time block; align='right' anchors to x+maxW, 'left' anchors to x
function drawDate(ctx, date, x, y, maxW, sans, M, align = 'right') {
  const fontSize = 40
  const lh       = fontSize * 1.2
  const lines    = dateLines(date)
  ctx.font         = `400 ${fontSize}px ${sans}`
  ctx.letterSpacing = '-0.8px'
  ctx.fillStyle    = M.ctaText
  ctx.textBaseline = 'top'
  ctx.textAlign    = align
  const tx = align === 'right' ? x + maxW : x
  lines.forEach((line, i) => ctx.fillText(line, tx, y + i * lh))
  ctx.textAlign    = 'left'
  ctx.letterSpacing = '0px'
  return lines.length * lh
}

// ── Auto-size MainTitle to fit (w, maxH); returns { lines, fontSize }
function sizeMainTitle(ctx, text, maxW, maxH, maxFontSize, minFontSize, sans) {
  for (let f = maxFontSize; f >= minFontSize; f -= 2) {
    ctx.font         = `500 ${f}px ${sans}`
    ctx.letterSpacing = `-${(f * 0.02).toFixed(2)}px`
    const lines = wrapText(ctx, text, maxW)
    const totalH = lines.length * f * 0.94
    if (totalH <= maxH) return { lines, fontSize: f }
  }
  ctx.font         = `500 ${minFontSize}px ${sans}`
  ctx.letterSpacing = `-${(minFontSize * 0.02).toFixed(2)}px`
  return { lines: wrapText(ctx, text, maxW), fontSize: minFontSize }
}

// ── Draw title block (clause + main title), returns bottom y
function drawTitleBlock(ctx, x, y, w, titleClause, mainTitle, clauseSz, mainSz, M, serif, sans) {
  const clauseLH = clauseSz * 0.94
  const lk       = `-${(mainSz * 0.02).toFixed(2)}px`

  // Clause
  if (titleClause) {
    ctx.font         = `400 ${clauseSz}px ${serif}`
    ctx.letterSpacing = `-${(clauseSz * 0.04).toFixed(2)}px`
    ctx.fillStyle    = M.ctaText
    ctx.textBaseline = 'top'
    ctx.fillText(titleClause, x, y)
    y += clauseLH + 24
  }

  // Main title
  ctx.font         = `500 ${mainSz}px ${sans}`
  ctx.letterSpacing = lk
  const mainLines  = wrapText(ctx, mainTitle, w)
  const mainLH     = mainSz * 0.94
  ctx.fillStyle    = M.ctaText
  mainLines.forEach((line, i) => ctx.fillText(line, x, y + i * mainLH))
  ctx.letterSpacing = '0px'
  y += mainLines.length * mainLH

  return y
}

// ── SpeakerBlock: photo + name + role (for 2-4 speakers)
function drawSpeakerBlock(ctx, x, y, w, name, role, img, logoImg, nameSz, roleSz, sans, M) {
  const bw      = 1.5                    // border width (Figma: 1.5px lineColor)
  const pad     = 8                      // inner padding inside border
  const gap     = 16                     // gap between photo frame and text
  const logoH   = 32

  // Photo frame: full-width square with border
  const photoSide = w
  ctx.strokeStyle = M.lineColor
  ctx.lineWidth   = bw
  ctx.strokeRect(x + bw / 2, y + bw / 2, photoSide - bw, photoSide - bw)
  const innerSide = photoSide - pad * 2 - bw * 2
  drawSpeakerPhoto(ctx, x + pad + bw, y + pad + bw, innerSide, innerSide, img, M)

  // Text below photo
  let ty = y + photoSide + gap
  const nameLH = Math.round(nameSz * 1.2)
  const nameLK = `-${(nameSz * 0.02).toFixed(2)}px`
  const roleLK = `-${(roleSz * 0.02).toFixed(2)}px`
  const roleLH = Math.round(roleSz * 1.2)

  // Name
  ctx.fillStyle    = M.ctaText
  ctx.font         = `500 ${nameSz}px ${sans}`
  ctx.letterSpacing = nameLK
  ctx.textBaseline = 'top'
  ctx.fillText(name, x, ty, w)
  ty += nameLH + 8

  // Role
  ctx.font         = `400 ${roleSz}px ${sans}`
  ctx.letterSpacing = roleLK
  ctx.fillStyle    = M.ctaText
  const roleLines = wrapText(ctx, role, w)
  roleLines.forEach((line, i) => ctx.fillText(line, x, ty + i * roleLH))
  ty += roleLines.length * roleLH

  // Partner logo
  if (logoImg) {
    drawPartnerLogo(ctx, logoImg, x, ty + 12, w * 0.7, logoH, M)
  }

  ctx.letterSpacing = '0px'
}

// ─────────────────────────────────────────────
// ── PORTRAIT / SQUARE / STORY layout (1080-wide)
// ─────────────────────────────────────────────
function drawPortraitLayout(ctx, cw, ch, pad, padTop, padBottom, settings, speakers, M, serif, sans, mono, dpr) {
  const {
    wbTitleClause = 'Stop blaming attribution:',
    wbMainTitle   = 'Alignment is the only scoreboard that matters.',
    wbDate        = 'Thursday, December 3rd\n1:00 PM EST',
    wbEyebrow     = 'WEBINAR',
  } = settings
  const n = speakers.length

  const innerX = pad
  const innerY = padTop
  const innerW = cw - pad * 2
  const logoH  = 48
  const innerH = ch - padTop - padBottom  // available height

  // ── Badge
  const badgeW = drawBadge(ctx, innerX, innerY, wbEyebrow, M, mono)

  // ── Date (right-aligned)
  const dateFontH  = 40 * 1.2 * dateLines(wbDate).length
  const dateBoxX   = innerX + badgeW + 16
  const dateBoxW   = innerW - badgeW - 16
  drawDate(ctx, wbDate, dateBoxX, innerY + (58 - dateFontH) / 2, dateBoxW, sans, M)

  const headerH  = 96
  const clauseSz = Math.min(72, Math.round(cw * 0.067))
  const logoY    = innerY + innerH - logoH

  if (n === 1) {
    // ── 1 speaker: title flows, speaker block anchored below title
    const sp = speakers[0]

    const contentY = innerY + headerH + 24
    const { fontSize: mainSz } = sizeMainTitle(ctx, wbMainTitle, innerW, 9999, 130, 36, sans)
    const titleBottomY = drawTitleBlock(ctx, innerX, contentY, innerW, wbTitleClause, wbMainTitle, clauseSz, mainSz, M, serif, sans)

    const speakerY = titleBottomY + 24
    const photoSz  = 320
    const bw       = 1.5
    ctx.strokeStyle = M.lineColor
    ctx.lineWidth   = bw
    ctx.strokeRect(innerX + bw / 2, speakerY + bw / 2, photoSz - bw, photoSz - bw)
    const innerPad = 8
    drawSpeakerPhoto(ctx, innerX + innerPad, speakerY + innerPad,
      photoSz - innerPad * 2, photoSz - innerPad * 2, sp.image, M)

    const textX  = innerX + photoSz + 24
    const textW  = innerW - photoSz - 24
    let ty       = speakerY
    const nameSz = Math.round(textW * 0.085)
    ctx.font         = `500 ${nameSz}px ${sans}`
    ctx.letterSpacing = `-${(nameSz * 0.02).toFixed(2)}px`
    ctx.fillStyle    = M.ctaText
    ctx.textBaseline = 'top'
    ctx.fillText(sp.name, textX, ty, textW)
    ty += Math.round(nameSz * 1.2) + 8
    const roleSz = Math.round(textW * 0.06)
    ctx.font         = `400 ${roleSz}px ${sans}`
    ctx.letterSpacing = `-${(roleSz * 0.02).toFixed(2)}px`
    const roleLines  = wrapText(ctx, sp.role, textW)
    roleLines.forEach((line, i) => ctx.fillText(line, textX, ty + i * Math.round(roleSz * 1.2)))
    ty += roleLines.length * Math.round(roleSz * 1.2) + 12
    if (sp.logo) drawPartnerLogo(ctx, sp.logo, textX, ty, textW * 0.65, 44, M)

  } else {
    // ── 2-4 speakers: title flows into speakers (Figma justify-between: header / [title+speakers] / logo)
    const blockGap = 16
    const blockW   = n === 2 ? Math.round(innerW * 0.346) : Math.round((innerW - (n - 1) * blockGap) / n)
    const nameSz   = Math.max(20, Math.round(blockW * 0.14))
    const roleSz   = Math.max(14, Math.round(blockW * 0.10))

    const contentY     = innerY + headerH + 24
    const { fontSize: mainSz } = sizeMainTitle(ctx, wbMainTitle, innerW, 9999, 90, 36, sans)
    const titleBottomY = drawTitleBlock(ctx, innerX, contentY, innerW, wbTitleClause, wbMainTitle, clauseSz, mainSz, M, serif, sans)

    const speakerY = titleBottomY + 24
    speakers.forEach((sp, i) => {
      const bx = innerX + i * (blockW + blockGap)
      drawSpeakerBlock(ctx, bx, speakerY, blockW,
        sp.name, sp.role, sp.image, sp.logo, nameSz, roleSz, sans, M)
    })
  }

  // ── AirOps Logo
  drawAirOpsLogo(ctx, innerX, logoY, logoH, M, dpr)
  ctx.letterSpacing = '0px'
}

// ─────────────────────────────────────────────
// ── LANDSCAPE layout (1920×1080)
// ─────────────────────────────────────────────
function drawLandscapeLayout(ctx, cw, ch, pad, settings, speakers, M, serif, sans, mono, dpr) {
  const {
    wbTitleClause = 'Stop blaming attribution:',
    wbMainTitle   = 'Alignment is the only scoreboard that matters.',
    wbDate        = 'Thursday, December 3rd\n1:00 PM EST',
    wbEyebrow     = 'WEBINAR',
  } = settings
  const n = speakers.length

  const innerH = ch - pad * 2
  const logoH  = n >= 3 ? 56 : 48

  if (n === 1) {
    // ── Left column (badge, partner logo row, title, airops logo)
    const leftW   = Math.round(cw * 0.625)
    const rightX  = leftW + pad
    const rightW  = cw - rightX - pad
    const photoSz = Math.min(rightW, innerH * 0.6)

    const sp = speakers[0]

    // Badge (top left)
    drawBadge(ctx, pad, pad, wbEyebrow, M, mono)

    // Partner logo (top right of left col if present)
    if (sp.logo) {
      drawPartnerLogo(ctx, sp.logo, pad + leftW - 300, pad, 280, 58, M)
    }

    // Title block (left, middle)
    const titleY = pad + 80
    const titleW = leftW - pad
    const { fontSize: mainSz } = sizeMainTitle(ctx, wbMainTitle, titleW,
      ch - titleY - pad - logoH - 24, 130, 36, sans)
    drawTitleBlock(ctx, pad, titleY, titleW, wbTitleClause, wbMainTitle, 72, mainSz, M, serif, sans)

    // AirOps logo
    drawAirOpsLogo(ctx, pad, ch - pad - logoH, logoH, M, dpr)

    // Right: bordered photo square
    const bw = 2
    ctx.strokeStyle = M.lineColor
    ctx.lineWidth   = bw
    ctx.strokeRect(rightX + bw / 2, pad + bw / 2, photoSz - bw, photoSz - bw)
    const ip = 8
    drawSpeakerPhoto(ctx, rightX + ip, pad + ip, photoSz - ip * 2, photoSz - ip * 2, sp.image, M)

    // Name + role block below photo
    const nameY  = pad + photoSz + 40
    const nameSz = 56
    ctx.font         = `500 ${nameSz}px ${sans}`
    ctx.letterSpacing = '-1.12px'
    ctx.fillStyle    = M.text
    ctx.textBaseline = 'top'
    ctx.fillText(sp.name, rightX, nameY, rightW)
    const roleY = nameY + Math.round(nameSz * 1.2) + 8
    const roleSz = 40
    ctx.font         = `400 ${roleSz}px ${sans}`
    ctx.letterSpacing = '-0.8px'
    ctx.fillStyle    = M.ctaText
    const roleLines = wrapText(ctx, sp.role, rightW)
    roleLines.forEach((line, i) => ctx.fillText(line, rightX, roleY + i * Math.round(roleSz * 1.2)))

    // Date bottom-right
    const dateLinesArr = dateLines(wbDate)
    const dateSz = 40
    const dateLH = dateSz * 1.2
    const dateY  = ch - pad - dateLinesArr.length * dateLH
    ctx.font         = `400 ${dateSz}px ${sans}`
    ctx.letterSpacing = '-0.8px'
    ctx.fillStyle    = M.ctaText
    ctx.textAlign    = 'right'
    dateLinesArr.forEach((line, i) => ctx.fillText(line, cw - pad, dateY + i * dateLH))
    ctx.textAlign    = 'left'
    ctx.letterSpacing = '0px'

  } else if (n === 2) {
    // ── 2 speakers: side-by-side, speakers top-aligned on right
    const leftW     = Math.round(cw * 0.48)
    const speakersX = leftW + pad
    const speakersW = cw - speakersX - pad
    const gap       = 16
    const blockW    = Math.round((speakersW - gap) / 2)
    const nameSz    = Math.max(20, Math.round(blockW * 0.14))
    const roleSz    = Math.max(14, Math.round(blockW * 0.10))

    drawBadge(ctx, pad, pad, wbEyebrow, M, mono)

    // Date: bottom-left of speaker zone, left-aligned (Figma: left=1056, top=934)
    const dateLineCount = dateLines(wbDate).length
    const dateH = dateLineCount * 40 * 1.2
    drawDate(ctx, wbDate, speakersX, ch - pad - dateH, 0, sans, M, 'left')

    const titleY = Math.round(ch * 0.2)
    const titleW = leftW - pad
    const { fontSize: mainSz } = sizeMainTitle(ctx, wbMainTitle, titleW, (ch - titleY - pad) * 0.75, 130, 36, sans)
    drawTitleBlock(ctx, pad, titleY, titleW, wbTitleClause, wbMainTitle, 72, mainSz, M, serif, sans)

    drawAirOpsLogo(ctx, pad, ch - pad - logoH, logoH, M, dpr)

    speakers.forEach((sp, i) => {
      const bx = speakersX + i * (blockW + gap)
      drawSpeakerBlock(ctx, bx, pad, blockW,
        sp.name, sp.role, sp.image, sp.logo, nameSz, roleSz, sans, M)
    })

  } else {
    // ── 3-4 speakers (Figma node 2015:27424)
    // Layout: full-width title top-half, speakers bottom-right half
    // ─────────────────────────────────────────
    // Measurements from Figma (1920×1080, pad=40):
    //   TitleContainer: left=40, w=1840, h=503, justify-between (badge top / title bottom)
    //   Speakers:       left=972, w=908, top=603.92, gap=16

    const spGap         = 16
    const TITLE_SP_GAP  = 24
    const TC_H_REF      = 503  // same TC_H used by title block below

    // Target block height = space from title bottom to canvas bottom
    // spBlockH = ch - pad(top) - TC_H - TITLE_SP_GAP - pad(bottom)
    const targetBlockH  = ch - 2 * pad - TC_H_REF - TITLE_SP_GAP

    // Back-solve blockW: targetBlockH = blockW + gap(16) + nameLH + 8 + roleLH*2
    // nameLH ≈ blockW*0.185, roleLH ≈ blockW*0.132 → blockW ≈ (targetBlockH - 24) / 1.449
    const blockW    = Math.round((targetBlockH - 24) / 1.449)

    const nameSz    = Math.max(18, Math.round(blockW * 0.154))
    const roleSz    = Math.max(13, Math.round(blockW * 0.110))
    const nameLH    = Math.round(nameSz * 1.2)
    const roleLH    = Math.round(roleSz * 1.2)

    // Actual block height (may differ by 1-2px from target due to rounding)
    const spBlockH  = blockW + 16 + nameLH + 8 + roleLH * 2
    const spY       = ch - pad - spBlockH

    const spZoneW   = n * blockW + (n - 1) * spGap
    const spZoneX   = cw - pad - spZoneW

    // ── Badge (top-left)
    drawBadge(ctx, pad, pad, wbEyebrow, M, mono)

    // ── Date (top-right of speaker zone, right-aligned)
    drawDate(ctx, wbDate, spZoneX, pad, spZoneW, sans, M)

    // ── Title block: spans full inner width (cw - 2*pad = 1840)
    //    Positioned at bottom of a 503px top container (Figma justify-between)
    const TW          = cw - pad - pad               // = 1840 (full inner width)
    const CLAUSE_SZ   = 72
    const CLAUSE_LH   = Math.round(CLAUSE_SZ * 0.94) // ≈ 68
    const TC_H        = 503                           // Figma TitleContainer height
    const maxMainH    = TC_H - CLAUSE_LH - 24
    const { lines: titleLines, fontSize: mainSz } =
      sizeMainTitle(ctx, wbMainTitle, TW, maxMainH, 130, 36, sans)
    const titleBlockH = CLAUSE_LH + 24 + Math.round(titleLines.length * mainSz * 0.94)
    const titleY      = pad + TC_H - titleBlockH     // justify-between: pin title to bottom
    drawTitleBlock(ctx, pad, titleY, TW, wbTitleClause, wbMainTitle, CLAUSE_SZ, mainSz, M, serif, sans)

    // ── AirOps logo (bottom-left)
    drawAirOpsLogo(ctx, pad, ch - pad - logoH, logoH, M, dpr)

    // ── Speaker blocks (bottom-right)
    speakers.forEach((sp, i) => {
      drawSpeakerBlock(
        ctx, spZoneX + i * (blockW + spGap), spY, blockW,
        sp.name, sp.role, sp.image, sp.logo, nameSz, roleSz, sans, M,
      )
    })
  }
}

// ─────────────────────────────────────────────
// ── BLOG GRAPHIC layout (1920×1080, photos only)
// ─────────────────────────────────────────────
function getBadgeWidth(ctx, eyebrow, mono) {
  ctx.save()
  ctx.font         = `500 32px ${mono}`
  ctx.letterSpacing = '1.92px'
  const w = 51 + ctx.measureText(eyebrow).width + 16
  ctx.restore()
  return w
}

function drawBlogGraphicLayout(ctx, cw, ch, settings, speakers, C, mono, dpr) {
  const { wbEyebrow = 'WEBINAR' } = settings
  const n = speakers.length

  // Photo frame sizes (from Figma per speaker count)
  const photoSz = n === 1 ? 629 : n === 2 ? 629 : n === 3 ? 550 : 439
  const gap      = 16
  const groupW   = n * photoSz + (n - 1) * gap
  const startX   = Math.round((cw - groupW) / 2)
  const photoY   = Math.round((ch - photoSz) / 2) + 16   // slight down offset for badge
  const innerPad = Math.round(photoSz * 0.026)            // ~16px for 629, ~14px for 550

  // Badge — centered
  const badgeW = getBadgeWidth(ctx, wbEyebrow, mono)
  const badgeX = Math.round((cw - badgeW) / 2)
  drawBadge(ctx, badgeX, 152, wbEyebrow, C, mono)

  // Bordered photo frames
  const bw = 2
  speakers.forEach((sp, i) => {
    const x = startX + i * (photoSz + gap)
    ctx.strokeStyle = C.lineColor
    ctx.lineWidth   = bw
    ctx.strokeRect(x + bw / 2, photoY + bw / 2, photoSz - bw, photoSz - bw)
    drawSpeakerPhoto(ctx, x + innerPad, photoY + innerPad,
      photoSz - innerPad * 2, photoSz - innerPad * 2, sp.image, C)
  })
}

// ─────────────────────────────────────────────
// ── MAIN EXPORT
// ─────────────────────────────────────────────
export function drawWebinarCanvas(canvas, settings, fontsReady, speakerImages, speakerLogos, floraliaDots) {
  const {
    colorMode,
    dims,
    wbNumSpeakers = 1,
  } = settings

  const { w: cw, h: ch } = dims
  const dpr = settings.dpr ?? 1

  canvas.width  = cw * dpr
  canvas.height = ch * dpr

  const ctx = canvas.getContext('2d')
  if (dpr !== 1) ctx.scale(dpr, dpr)

  const isLand  = cw > ch
  const isStory = ch > cw * 1.5

  const serif = fontsReady ? "'Serrif VF', Georgia, serif"        : 'Georgia, serif'
  const sans  = fontsReady ? "'Saans', sans-serif"                : 'sans-serif'
  const mono  = fontsReady ? "'Saans Mono', 'DM Mono', monospace" : 'monospace'

  const isDark   = colorMode?.startsWith('dark-')
  const baseMode = isDark ? colorMode.replace('dark-', '') : colorMode
  const M        = MODES[baseMode] ?? MODES['green']
  const DM       = isDark ? DARK_MODES[colorMode] : null

  // Unified color token — same shape passed to all helpers
  const C = isDark ? {
    bg:       M.bg,
    canvasBg: DM.bg,
    lineColor: DM.lineColor,
    text:     DM.logoColor,
    ctaText:  DM.logoColor,
    photoBg:  DM.bg,
    pill:     DM.bg,
    pillText: DM.logoColor,
    badgeDot: '#e8272a',       // always red (Figma spec)
  } : {
    bg:       M.bg,
    canvasBg: M.pill,          // webinar uses M.pill as main bg (Figma color-2)
    lineColor: M.lineColor,
    text:     M.text,
    ctaText:  M.ctaText,
    photoBg:  M.ctaText,
    pill:     M.pill,
    pillText: M.pillText,
    badgeDot: '#e8272a',       // red dot in light modes (Figma spec)
  }

  // Background
  ctx.fillStyle = C.canvasBg
  ctx.fillRect(0, 0, cw, ch)

  // Floralia decoration (drawn before content)
  const settingsWithFloralia = { ...settings, _floralia: floraliaDots }
  drawFloralia(ctx, settingsWithFloralia, cw, ch, isLand, C)

  const n = Math.max(1, Math.min(4, wbNumSpeakers))
  const speakers = Array.from({ length: n }, (_, i) => ({
    name:  settings[`wbSpeaker${i + 1}Name`] || `Speaker ${i + 1}`,
    role:  settings[`wbSpeaker${i + 1}Role`] || 'Title, Company',
    image: speakerImages[i] ?? null,
    logo:  speakerLogos[i]  ?? null,
  }))

  const pad       = 40
  const padTop    = isStory ? 240 : pad
  const padBottom = isStory ? 360 : pad

  ctx.textBaseline = 'top'

  if (settings.wbIsBlog) {
    drawBlogGraphicLayout(ctx, cw, ch, settings, speakers, C, mono, dpr)
  } else if (isLand) {
    drawLandscapeLayout(ctx, cw, ch, pad, settings, speakers, C, serif, sans, mono, dpr)
  } else {
    drawPortraitLayout(ctx, cw, ch, pad, padTop, padBottom, settings, speakers, C, serif, sans, mono, dpr)
  }
}
