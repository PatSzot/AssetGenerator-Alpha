import { useRef, useEffect, useState, useCallback } from 'react'
import { MODES } from '../utils/drawCanvas'
import './CanvasPreview.css'

const MODE_LABELS   = { green: 'Green Paper', pink: 'Pink Paper', yellow: 'Yellow Paper' }
const TEMPLATE_LABELS = { quote: 'Quote Block', twitter: 'Twitter Post' }

// Cap at 2× — avoids oversized canvases on 3× displays while still
// giving crisp output on standard retina screens.
const DPR = Math.min(window.devicePixelRatio || 1, 2)

export default function CanvasPreview({ settings, fontsReady, draw }) {
  const canvasRef    = useRef(null)
  const containerRef = useRef(null)
  const [scale, setScale] = useState(1)

  // Recompute display scale whenever container size or canvas dims change
  const updateScale = useCallback(() => {
    if (!containerRef.current) return
    const { width, height } = containerRef.current.getBoundingClientRect()
    const maxW = width  - 48
    const maxH = height - 48
    const { w, h } = settings.dims
    setScale(Math.min(maxW / w, maxH / h, 1))
  }, [settings.dims])

  useEffect(() => {
    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [updateScale])

  // Redraw canvas at DPR × dims so physical pixels are 1:1 on retina screens
  useEffect(() => {
    if (!canvasRef.current) return
    const { w, h } = settings.dims
    draw(canvasRef.current, { ...settings, dims: { w: w * DPR, h: h * DPR } })
  }, [settings, draw])

  const { w, h } = settings.dims

  return (
    <div className="canvas-area">
      {/* Toolbar */}
      <div className="canvas-toolbar">
        <span className="tl">Preview</span>
        <span className="dbadge">{w} × {h}</span>
        <span className="mbadge">{TEMPLATE_LABELS[settings.templateType]} · {MODE_LABELS[settings.colorMode]}</span>
        <span className={`fpill${fontsReady ? ' ready' : ''}`}>
          {fontsReady ? 'Fonts ready' : 'Loading fonts…'}
        </span>
      </div>

      {/* Canvas display — scale(scale/DPR) maps the DPR-scaled canvas back
          to the correct CSS pixel size in the container */}
      <div className="canvas-wrap" ref={containerRef}>
        <div
          className="canvas-scaler"
          style={{ width: w * scale, height: h * scale }}
        >
          <canvas
            ref={canvasRef}
            style={{ transform: `scale(${scale / DPR})`, transformOrigin: 'top left' }}
          />
        </div>
      </div>
    </div>
  )
}
