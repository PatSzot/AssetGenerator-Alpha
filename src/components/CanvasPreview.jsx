import { useRef, useEffect, useState, useCallback } from 'react'
import { MODES } from '../utils/drawCanvas'
import { IJ_MODE_LABELS } from '../utils/drawIJoinedCanvas'
import './CanvasPreview.css'

const MODE_LABELS = {
  green: 'Green Paper', pink: 'Pink Paper', yellow: 'Yellow Paper', blue: 'Blue Paper',
  'dark-green': 'Dark Green', 'dark-pink': 'Dark Pink', 'dark-yellow': 'Dark Yellow', 'dark-blue': 'Dark Blue',
}
const TEMPLATE_LABELS = { quote: 'Quote Block', richquote: 'Rich Quote', titlecard: 'Title Card', twitter: 'Twitter Post', certificate: 'Certificate', ijoined: 'I Joined', webinar: 'Webinar', roundtable: 'Roundtable' }

const WEBINAR_CANVASES = [
  { w: 1920, h: 1080, label: '1920 × 1080' },
  { w: 1080, h: 1080, label: '1080 × 1080' },
  { w: 1080, h: 1350, label: '1080 × 1350' },
  { w: 1080, h: 1920, label: '1080 × 1920' },
  { w: 1920, h: 1080, label: 'Blog Graphic', isBlog: true },
]

const ZOOM_STEP = 0.05
const ZOOM_MIN  = 0.04
const ZOOM_MAX  = 1.0

export default function CanvasPreview({ settings, fontsReady, draw }) {
  // ── Single-canvas (non-webinar)
  const canvasRef    = useRef(null)
  const containerRef = useRef(null)
  const [scale, setScale] = useState(1)

  // ── Webinar multi-canvas
  const wbRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)]
  const [wbZoom, setWbZoom] = useState(null)   // null = auto-fit on first render

  const isWebinar = settings.templateType === 'webinar'

  // ── Auto-fit scale for single canvas
  const updateScale = useCallback(() => {
    if (!containerRef.current || isWebinar) return
    const { width, height } = containerRef.current.getBoundingClientRect()
    const maxW = width  - 48
    const maxH = height - 48
    const { w, h } = settings.dims
    setScale(Math.min(maxW / w, maxH / h, 1))
  }, [settings.dims, isWebinar])

  useEffect(() => {
    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [updateScale])

  // ── Auto-fit zoom for webinar multi-canvas
  const computeWbFit = useCallback(() => {
    if (!containerRef.current || !isWebinar) return
    const { height } = containerRef.current.getBoundingClientRect()
    const tallest = Math.max(...WEBINAR_CANVASES.map(c => c.h))  // 1920
    const fit = Math.min((height - 80) / tallest, ZOOM_MAX)
    setWbZoom(fit)
  }, [isWebinar])

  useEffect(() => {
    if (!isWebinar) return
    computeWbFit()
    window.addEventListener('resize', computeWbFit)
    return () => window.removeEventListener('resize', computeWbFit)
  }, [computeWbFit])

  // Reset zoom when switching to webinar
  useEffect(() => {
    if (isWebinar) setWbZoom(null)
  }, [isWebinar])


  // ── Draw single canvas
  useEffect(() => {
    if (isWebinar) return
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const { w, h } = settings.dims
    draw(canvas, { ...settings, dpr })
    canvas.style.width  = `${w}px`
    canvas.style.height = `${h}px`
  }, [settings, draw, isWebinar])

  // ── Draw all 5 webinar canvases
  useEffect(() => {
    if (!isWebinar) return
    WEBINAR_CANVASES.forEach(({ w, h, isBlog }, i) => {
      const canvas = wbRefs[i].current
      if (!canvas) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      draw(canvas, { ...settings, dims: { w, h }, wbIsBlog: !!isBlog, dpr })
      canvas.style.width  = `${w}px`
      canvas.style.height = `${h}px`
    })
  }, [settings, draw, isWebinar]) // eslint-disable-line react-hooks/exhaustive-deps

  const zoom     = wbZoom ?? 0.15
  const zoomPct  = Math.round(zoom * 100)
  const modeLabel = settings.templateType === 'ijoined'
    ? IJ_MODE_LABELS[settings.ijMode]
    : MODE_LABELS[settings.colorMode]

  // ── Shared toolbar
  const toolbar = (
    <div className="canvas-toolbar">
      <span className="tl">Preview</span>
      {!isWebinar && <span className="dbadge">{settings.dims.w} × {settings.dims.h}</span>}
      <span className="mbadge">{TEMPLATE_LABELS[settings.templateType]} · {modeLabel}</span>
      <span className={`fpill${fontsReady ? ' ready' : ''}`}>
        {fontsReady ? 'Fonts ready' : 'Loading fonts…'}
      </span>
      <svg className="toolbar-logo" viewBox="0 0 784 252" fill="none">
        <path d="M111.828 65.6415V88.4663C101.564 72.0112 85.627 61.9258 65.9084 61.9258C23.7703 61.9258 0 92.9782 0 134.647C0 176.581 24.0404 208.695 66.4487 208.695C86.1672 208.695 101.834 198.609 111.828 182.154V204.979H144.782V65.6415H111.828ZM72.9315 181.093C48.8911 181.093 35.1152 159.064 35.1152 134.647C35.1152 110.76 48.621 89.7933 73.4717 89.7933C94.0006 89.7933 111.558 104.391 111.558 134.116C111.558 163.31 94.8109 181.093 72.9315 181.093Z" fill="currentColor"/>
        <path d="M173.137 65.6494V204.987H208.252V65.6494H173.137Z" fill="currentColor"/>
        <path d="M272.998 100.141V65.6386H237.883V204.976H272.998V125.355C272.998 104.919 287.314 96.691 300.82 96.691C308.653 96.691 316.757 98.8143 321.079 100.407V63.25C298.119 63.25 279.211 76.7856 272.998 100.141Z" fill="currentColor"/>
        <path d="M329.629 108.115C329.629 151.377 359.882 182.163 403.371 182.163C447.13 182.163 477.115 151.377 477.115 108.115C477.115 65.6507 447.13 35.3945 403.371 35.3945C359.882 35.3945 329.629 65.6507 329.629 108.115ZM441.997 108.115C441.997 135.187 427.141 154.561 403.371 154.561C379.33 154.561 364.744 135.187 364.744 108.115C364.744 82.1058 379.33 63.2621 403.371 63.2621C427.141 63.2621 441.997 82.1058 441.997 108.115Z" fill="currentColor"/>
        <path d="M575.086 61.9258C554.557 61.9258 537.81 73.869 528.896 92.9782V65.6415H493.781V251.425H528.896V180.031C538.891 197.282 557.529 208.695 577.247 208.695C615.604 208.695 642.345 179.235 642.345 137.035C642.345 92.7128 614.523 61.9258 575.086 61.9258ZM568.874 182.685C545.374 182.685 528.896 163.31 528.896 135.708C528.896 107.31 545.374 87.4047 568.874 87.4047C591.293 87.4047 607.23 107.841 607.23 136.77C607.23 163.841 591.293 182.685 568.874 182.685Z" fill="currentColor"/>
        <path d="M653.555 156.675C653.555 181.889 676.244 208.695 721.624 208.695C767.274 208.695 783.751 182.42 783.751 161.983C783.751 130.666 746.205 125.092 721.084 120.315C704.066 117.395 693.262 115.007 693.262 105.452C693.262 94.5706 705.417 87.6701 718.383 87.6701C735.94 87.6701 742.693 99.6133 743.233 112.353H778.349C778.349 91.6511 763.492 61.9258 717.572 61.9258C677.865 61.9258 658.147 83.9544 658.147 107.575C658.147 141.282 696.233 144.732 721.354 149.509C735.94 152.163 748.636 155.348 748.636 165.699C748.636 176.05 736.21 182.95 722.975 182.95C710.549 182.95 688.67 176.05 688.67 156.675H653.555Z" fill="currentColor"/>
        <path d="M191.339 48.6576C176.921 48.6576 166.578 38.4949 166.578 24.6368C166.578 10.7786 176.921 0 191.339 0C205.13 0 216.1 10.7786 216.1 24.6368C216.1 38.4949 205.13 48.6576 191.339 48.6576Z" fill="currentColor"/>
      </svg>
    </div>
  )

  // ── Webinar multi-canvas view
  if (isWebinar) {
    return (
      <div className="canvas-area">
        {toolbar}
        <div className="canvas-wrap canvas-wrap-multi" ref={containerRef}>
          <div className="wb-canvas-row">
            {WEBINAR_CANVASES.map(({ w, h, label }, i) => (
              <div key={i} className="wb-canvas-col">
                <div
                  className="canvas-scaler"
                  style={{ width: w * zoom, height: h * zoom, flexShrink: 0 }}
                >
                  <canvas
                    ref={wbRefs[i]}
                    style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
                  />
                </div>
                <span className="wb-canvas-label">{label}</span>
              </div>
            ))}
          </div>
          <div className="zoom-controls">
            <button className="zoom-btn" onClick={() => setWbZoom(z => Math.max(ZOOM_MIN, (z ?? zoom) - ZOOM_STEP))}>−</button>
            <span className="zoom-pct">{zoomPct}%</span>
            <button className="zoom-btn" onClick={() => setWbZoom(z => Math.min(ZOOM_MAX, (z ?? zoom) + ZOOM_STEP))}>+</button>
            <button className="zoom-btn zoom-fit" onClick={computeWbFit} title="Fit">⊡</button>
          </div>
        </div>
      </div>
    )
  }

  // ── Single-canvas view (all other templates)
  const { w, h } = settings.dims
  return (
    <div className="canvas-area">
      {toolbar}
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
