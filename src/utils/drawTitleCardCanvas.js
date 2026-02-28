import { MODES, buildLogo, wrapText } from './drawCanvas.js'

// Per-mode accent for eyebrow pill border + text (var(--color-3) equivalent)
const EYEBROW_ACCENT = {
  green:  '#008c44',
  pink:   '#8c0044',
  yellow: '#7a7200',
  blue:   '#0014a8',
}

// Dark variants — same values as drawTwitterCanvas for consistency
const DARK_MODES = {
  'dark-green':  { bg: '#0f2412', lineColor: 'rgba(0,210,80,1)',    logoColor: '#e8f5ee' },
  'dark-pink':   { bg: '#230a1e', lineColor: 'rgba(210,0,160,1)',   logoColor: '#f5e8f2' },
  'dark-yellow': { bg: '#1c1d03', lineColor: 'rgba(190,190,0,1)',   logoColor: '#f5f5e0' },
  'dark-blue':   { bg: '#0f0f5a', lineColor: 'rgba(100,100,255,1)', logoColor: '#e5e5ff' },
}

// ── Main renderer
export function drawTitleCardCanvas(canvas, settings, fontsReady) {
  const {
    colorMode, dims,
    tcEyebrow         = 'Offer ends today',
    tcShowEyebrow     = true,
    tcSerifTitle      = 'Serif Title',
    tcShowSerifTitle  = true,
    tcSansTitle       = 'Sans Title',
    tcShowSansTitle   = true,
    tcSubheadline     = 'Subheadline/Details',
    tcShowSubheadline = true,
    tcBody            = '"LLM-sourced traffic has better time-to-conversions and sessions-to-conversions than organic traffic from Google."',
    tcShowBody        = true,
    tcCTAText         = 'See AirOps in Action',
    tcShowCTA         = true,
    tcShowLogo        = true,
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

  const isDark = colorMode in DARK_MODES
  const M      = MODES[isDark ? colorMode.replace('dark-', '') : colorMode] ?? MODES['green']
  const TM     = isDark ? DARK_MODES[colorMode] : M

  // Resolved per-element colours
  const bg          = TM.bg
  const lineColor   = isDark ? TM.lineColor   : M.lineColor
  const logoColor   = isDark ? TM.logoColor   : M.text
  const textColor   = isDark ? TM.logoColor   : M.text
  const eyebrowBg   = isDark ? TM.bg          : '#ffffff'
  const eyebrowBd   = isDark ? TM.lineColor   : (EYEBROW_ACCENT[colorMode.replace('dark-', '')] ?? EYEBROW_ACCENT['green'])
  const eyebrowTxt  = eyebrowBd

  // ── Background
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, cw, ch)

  // ── Guidelines — two vertical lines at x=40 and x=cw-40
  const guideX = 40
  ctx.strokeStyle = lineColor
  ctx.lineWidth   = 2
  ctx.beginPath(); ctx.moveTo(guideX,      0); ctx.lineTo(guideX,      ch); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(cw - guideX, 0); ctx.lineTo(cw - guideX, ch); ctx.stroke()

  // ── Logo (top center)
  const logoH    = isStory ? 80 : 56
  const logoW    = Math.round(784 * logoH / 252)
  const logoBmp  = buildLogo(logoColor, Math.round(logoH * dpr))
  const logoPadT = isStory ? 360 : guideX
  const logoX    = Math.round((cw - logoW) / 2)
  const logoY    = logoPadT
  if (tcShowLogo) {
    ctx.fillStyle = bg
    ctx.fillRect(logoX, logoY, logoW, logoH)
    ctx.drawImage(logoBmp, logoX, logoY, logoW, logoH)
  }

  // ── CTA zone geometry (used for text group centering regardless of visibility)
  const ctaH    = 104
  const ctaR    = ctaH / 2
  const ctaPadB = isStory ? 520 : guideX
  const ctaBotY = ch - ctaPadB
  const ctaTopY = ctaBotY - ctaH

  // ── Typography scale (varies by format)
  const serifSz = isLand ? 148 : 112
  const sansSz  = isLand ? 144 : 108
  const serifLH = serifSz * 1.08
  const sansLH  = sansSz  * 1.08
  const subSz   = 40
  const subLH   = subSz   * 1.14

  // Eyebrow pill geometry
  const eyebrowSz   = 28
  const eyebrowPadX = 16
  const eyebrowPadY = 8
  const eyebrowH    = Math.round(eyebrowSz * 1.3 + eyebrowPadY * 2)  // ≈52px

  // Body text wrap — capped at 1000px to match Figma (w-[1000px])
  const bodyMaxW   = Math.min(1000, cw - guideX * 2)
  ctx.font         = `400 ${subSz}px ${sans}`
  ctx.letterSpacing = '0px'
  const bodyLines  = wrapText(ctx, tcBody, bodyMaxW)
  const bodyTotalH = bodyLines.length * subLH

  // ── Build visible sections and compute total text-group height
  const GAP_SECTION = 24  // gap-[24px] between eyebrow / title / sub
  const GAP_SUB     = 8   // gap-[8px] between subheadline and body

  const sections = []

  if (tcShowEyebrow) {
    sections.push({ type: 'eyebrow', h: eyebrowH })
  }
  if (tcShowSerifTitle || tcShowSansTitle) {
    let h = 0
    if (tcShowSerifTitle && tcShowSansTitle) {
      // Paired: serif advances by font-size only (no leading) so the two sit as one title block
      h = serifSz + sansLH
    } else if (tcShowSerifTitle) {
      h = serifLH
    } else {
      h = sansLH
    }
    sections.push({ type: 'title', h })
  }
  if (tcShowSubheadline || tcShowBody) {
    let h = 0
    if (tcShowSubheadline) h += subLH
    if (tcShowBody)        h += bodyTotalH
    if (tcShowSubheadline && tcShowBody) h += GAP_SUB
    sections.push({ type: 'sub', h })
  }

  const totalGroupH = sections.reduce((a, s) => a + s.h, 0)
    + Math.max(0, sections.length - 1) * GAP_SECTION

  // Center the text group between logo bottom and CTA top (or bottom pad if no CTA)
  const zoneTop = tcShowLogo ? logoY + logoH : logoPadT
  const zoneBot = tcShowCTA ? ctaTopY : ch - ctaPadB
  let ty = Math.round((zoneTop + zoneBot) / 2 - totalGroupH / 2)

  // ── Draw text sections
  ctx.textBaseline = 'top'

  for (let i = 0; i < sections.length; i++) {
    if (i > 0) ty += GAP_SECTION

    const sec = sections[i]

    if (sec.type === 'eyebrow') {
      const pillText = tcEyebrow.toUpperCase()
      ctx.font         = `500 ${eyebrowSz}px ${mono}`
      ctx.letterSpacing = '1.68px'
      const ewTW    = ctx.measureText(pillText).width
      const ewPillW = ewTW + eyebrowPadX * 2
      const ewPillX = Math.round((cw - ewPillW) / 2)

      // Pill: bg + border
      ctx.fillStyle   = eyebrowBg
      ctx.strokeStyle = eyebrowBd
      ctx.lineWidth   = 1.5
      ctx.beginPath()
      ctx.roundRect(ewPillX, ty, ewPillW, eyebrowH, 8)
      ctx.fill()
      ctx.stroke()
      // Restore guide stroke
      ctx.strokeStyle = lineColor
      ctx.lineWidth   = 2

      ctx.fillStyle    = eyebrowTxt
      ctx.textBaseline = 'middle'
      ctx.textAlign    = 'center'
      ctx.fillText(pillText, cw / 2, ty + eyebrowH / 2)
      ctx.textAlign    = 'left'
      ctx.textBaseline = 'top'
      ctx.letterSpacing = '0px'

      ty += eyebrowH
    }

    if (sec.type === 'title') {
      ctx.textAlign = 'center'
      if (tcShowSerifTitle) {
        ctx.fillStyle    = textColor
        ctx.font         = `400 ${serifSz}px ${serif}`
        ctx.letterSpacing = `${(-serifSz * 0.02).toFixed(2)}px`
        ctx.fillText(tcSerifTitle, cw / 2, ty)
        // When paired with sans, advance by font-size only (no leading) for a tight title block
        ty += tcShowSansTitle ? serifSz : serifLH
      }
      if (tcShowSansTitle) {
        ctx.fillStyle    = textColor
        ctx.font         = `400 ${sansSz}px ${sans}`
        ctx.letterSpacing = `${(-sansSz * 0.02).toFixed(2)}px`
        ctx.fillText(tcSansTitle, cw / 2, ty)
        ty += sansLH
      }
      ctx.textAlign    = 'left'
      ctx.letterSpacing = '0px'
    }

    if (sec.type === 'sub') {
      ctx.textAlign = 'center'
      if (tcShowSubheadline) {
        ctx.fillStyle    = textColor
        ctx.font         = `600 ${subSz}px ${sans}`
        ctx.letterSpacing = '0px'
        ctx.fillText(tcSubheadline, cw / 2, ty)
        ty += subLH
        if (tcShowBody) ty += GAP_SUB
      }
      if (tcShowBody) {
        ctx.fillStyle    = textColor
        ctx.font         = `400 ${subSz}px ${sans}`
        ctx.letterSpacing = '0px'
        bodyLines.forEach((line, idx) => ctx.fillText(line, cw / 2, ty + idx * subLH))
        ty += bodyTotalH
      }
      ctx.textAlign = 'left'
    }
  }

  // ── CTA pill (centered, bottom zone)
  if (tcShowCTA) {
    ctx.font         = `600 40px ${sans}`
    ctx.letterSpacing = '0px'
    const ctaTW    = ctx.measureText(tcCTAText).width
    const ctaPillW = ctaTW + 96   // px-48 each side
    const ctaPillX = Math.round((cw - ctaPillW) / 2)

    ctx.fillStyle = '#00ff64'
    ctx.beginPath()
    ctx.roundRect(ctaPillX, ctaTopY, ctaPillW, ctaH, ctaR)
    ctx.fill()

    ctx.fillStyle    = M.ctaText  // always the dark base-mode tone — readable on #00ff64
    ctx.textBaseline = 'middle'
    ctx.textAlign    = 'center'
    ctx.fillText(tcCTAText, cw / 2, ctaTopY + ctaH / 2)
    ctx.textAlign    = 'left'
    ctx.textBaseline = 'top'
  }
}
