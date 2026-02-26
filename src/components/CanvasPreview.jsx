import { useRef, useEffect, useState, useCallback } from 'react'
import { drawCanvas, MODES } from '../utils/drawCanvas'
import './CanvasPreview.css'

const MODE_LABELS = { green: 'Green Paper', pink: 'Pink Paper', yellow: 'Yellow Paper' }

export default function CanvasPreview({ settings, fontsReady }) {
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

  // Redraw canvas whenever settings or font-readiness changes
  useEffect(() => {
    if (canvasRef.current) drawCanvas(canvasRef.current, settings, fontsReady)
  }, [settings, fontsReady])

  const { w, h } = settings.dims

  return (
    <div className="canvas-area">
      {/* Toolbar */}
      <div className="canvas-toolbar">
        <span className="tl">Preview</span>
        <span className="dbadge">{w} × {h}</span>
        <span className="mbadge">{MODE_LABELS[settings.colorMode]}</span>
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
