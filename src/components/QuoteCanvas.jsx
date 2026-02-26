import { useRef, useEffect, useCallback } from 'react'
import './QuoteCanvas.css'

// Wrap text onto multiple lines within maxWidth, returns array of lines
function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ')
  const lines = []
  let current = ''

  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current)
      current = word
    } else {
      current = test
    }
  }
  if (current) lines.push(current)
  return lines
}

function drawCanvas(canvas, s) {
  const ctx = canvas.getContext('2d')
  const { canvasWidth: W, canvasHeight: H, padding: P } = s

  canvas.width = W
  canvas.height = H

  // ── Background ──
  if (s.bgType === 'gradient') {
    const angle = (s.bgGradientAngle * Math.PI) / 180
    const cx = W / 2, cy = H / 2
    const len = Math.sqrt(W * W + H * H) / 2
    const gx = ctx.createLinearGradient(
      cx - Math.cos(angle) * len,
      cy - Math.sin(angle) * len,
      cx + Math.cos(angle) * len,
      cy + Math.sin(angle) * len,
    )
    gx.addColorStop(0, s.bgGradientStart)
    gx.addColorStop(1, s.bgGradientEnd)
    ctx.fillStyle = gx
  } else {
    ctx.fillStyle = s.bgColor
  }
  ctx.fillRect(0, 0, W, H)

  // ── Content area bounds ──
  const contentX = P
  const contentW = W - P * 2

  // ── Quotation marks ──
  let quoteTopY = P
  const openMark = s.showQuotationMarks ? '\u201C' : ''
  const closeMark = s.showQuotationMarks ? '\u201D' : ''

  if (s.showQuotationMarks) {
    ctx.font = `${s.quoteStyle} ${s.quoteFontSize * 2.2}px ${s.quoteFont}, Georgia, serif`
    ctx.fillStyle = s.accentColor
    ctx.globalAlpha = 0.4
    ctx.textAlign = s.quoteAlign === 'center' ? 'center' : 'left'
    const markX = s.quoteAlign === 'center' ? W / 2 : contentX
    ctx.fillText(openMark, markX, P + s.quoteFontSize * 1.8)
    ctx.globalAlpha = 1
    quoteTopY = P + s.quoteFontSize * 1.0
  }

  // ── Quote body ──
  ctx.font = `${s.quoteStyle} ${s.quoteFontSize}px ${s.quoteFont}, Georgia, serif`
  ctx.fillStyle = s.quoteColor
  ctx.textAlign = s.quoteAlign === 'center' ? 'center' : 'left'
  ctx.textBaseline = 'top'

  const quoteLines = wrapText(ctx, s.quoteText, contentW)
  const lineHeight = s.quoteFontSize * 1.45
  let y = quoteTopY + s.quoteFontSize * 0.8

  const textX = s.quoteAlign === 'center' ? W / 2 : contentX

  for (const line of quoteLines) {
    ctx.fillText(line, textX, y)
    y += lineHeight
  }

  // Close quote mark
  if (s.showQuotationMarks) {
    ctx.font = `${s.quoteStyle} ${s.quoteFontSize * 2.2}px ${s.quoteFont}, Georgia, serif`
    ctx.fillStyle = s.accentColor
    ctx.globalAlpha = 0.4
    ctx.fillText(closeMark, textX, y - s.quoteFontSize * 0.5)
    ctx.globalAlpha = 1
    y += s.quoteFontSize * 0.8
  }

  // ── Accent line ──
  if (s.showAccentLine) {
    const lineY = y + 28
    ctx.beginPath()
    if (s.quoteAlign === 'center') {
      ctx.moveTo(W / 2 - 40, lineY)
      ctx.lineTo(W / 2 + 40, lineY)
    } else {
      ctx.moveTo(contentX, lineY)
      ctx.lineTo(contentX + 80, lineY)
    }
    ctx.strokeStyle = s.accentColor
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.stroke()
    y = lineY + 28
  } else {
    y += 28
  }

  // ── Author name ──
  ctx.font = `600 ${s.authorFontSize}px ${s.authorFont}, Inter, sans-serif`
  ctx.fillStyle = s.authorColor
  ctx.textAlign = s.quoteAlign === 'center' ? 'center' : 'left'
  ctx.textBaseline = 'top'
  ctx.fillText(s.authorName || '—', textX, y)

  // ── Author title ──
  if (s.authorTitle) {
    y += s.authorFontSize * 1.4
    ctx.font = `${s.authorFontSize * 0.78}px ${s.authorFont}, Inter, sans-serif`
    ctx.fillStyle = s.authorColor
    ctx.globalAlpha = 0.65
    ctx.fillText(s.authorTitle, textX, y)
    ctx.globalAlpha = 1
  }
}

export default function QuoteCanvas({ settings }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (canvasRef.current) drawCanvas(canvasRef.current, settings)
  }, [settings])

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `quote-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }, [])

  const handleCopy = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    try {
      canvas.toBlob(async (blob) => {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ])
      }, 'image/png')
    } catch {
      // ClipboardItem not supported in all browsers – fallback silently
    }
  }, [])

  const scale = Math.min(1, 560 / Math.max(settings.canvasWidth, settings.canvasHeight))

  return (
    <div className="canvas-wrapper">
      <div
        className="canvas-scaler"
        style={{
          width: settings.canvasWidth * scale,
          height: settings.canvasHeight * scale,
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        />
      </div>

      <div className="canvas-actions">
        <div className="canvas-size-label">
          {settings.canvasWidth} × {settings.canvasHeight}px
        </div>
        <button className="btn-action btn-copy" onClick={handleCopy}>
          Copy Image
        </button>
        <button className="btn-action btn-download" onClick={handleDownload}>
          Download PNG
        </button>
      </div>
    </div>
  )
}
