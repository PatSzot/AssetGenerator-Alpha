import { useRef, useEffect, useState, useCallback } from 'react'
import { MODES } from '../utils/drawCanvas'
import { IJ_MODE_LABELS } from '../utils/drawIJoinedCanvas'
import './CanvasPreview.css'

const MODE_LABELS = {
  green: 'Green Paper', pink: 'Pink Paper', yellow: 'Yellow Paper', blue: 'Blue Paper',
  'dark-green': 'Dark Green', 'dark-pink': 'Dark Pink', 'dark-yellow': 'Dark Yellow', 'dark-blue': 'Dark Blue',
}
const TEMPLATE_LABELS = { quote: 'Quote Block', richquote: 'Rich Quote', titlecard: 'Title Card', twitter: 'Twitter Post', certificate: 'Certificate', ijoined: 'I Joined' }

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

  // Redraw at 2× buffer so physical pixels are 1:1 on retina screens.
  // dpr is passed via settings so draw functions scale the buffer and apply
  // ctx.scale() — all layout coords stay in 1× px, only the buffer grows.
  // Pin CSS size to original dims to keep layout correct.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const { w, h } = settings.dims
    draw(canvas, { ...settings, dpr })
    canvas.style.width  = `${w}px`
    canvas.style.height = `${h}px`
  }, [settings, draw])

  const { w, h } = settings.dims

  return (
    <div className="canvas-area">
      {/* Toolbar */}
      <div className="canvas-toolbar">
        <span className="tl">Preview</span>
        <span className="dbadge">{w} × {h}</span>
        <span className="mbadge">{TEMPLATE_LABELS[settings.templateType]} · {settings.templateType === 'ijoined' ? IJ_MODE_LABELS[settings.ijMode] : MODE_LABELS[settings.colorMode]}</span>
        <span className={`fpill${fontsReady ? ' ready' : ''}`}>
          {fontsReady ? 'Fonts ready' : 'Loading fonts…'}
        </span>
      </div>

      {/* Canvas display */}
      <div className="canvas-wrap" ref={containerRef}>
        <div
          className="canvas-scaler"
          style={{ width: w * scale, height: h * scale }}
        >
          <canvas
            ref={canvasRef}
            style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
          />
        </div>
      </div>
    </div>
  )
}
