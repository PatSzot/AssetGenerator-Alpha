import { useState, useCallback, useEffect, useRef } from 'react'
import Sidebar from './components/Sidebar'
import CanvasPreview from './components/CanvasPreview'
import SplashScreen from './components/SplashScreen'
import { loadFonts } from './utils/loadFonts'
import { drawCanvas } from './utils/drawCanvas'
import { drawTwitterCanvas } from './utils/drawTwitterCanvas'
import { drawRichQuoteCanvas } from './utils/drawRichQuoteCanvas'
import { drawTitleCardCanvas } from './utils/drawTitleCardCanvas'
import { drawCertificateCanvas } from './utils/drawCertificateCanvas'
import { drawIJoinedCanvas } from './utils/drawIJoinedCanvas'
import { generateFleuronFontDots } from './utils/drawFleurons'
import './App.css'

// ── Batch export helpers
function parseSheetCsvUrl(raw) {
  const url = raw.trim()
  // Already a published-to-web CSV URL
  if (url.includes('output=csv') || url.includes('tqx=out:csv')) return url
  // Standard share URL — convert to published CSV export
  const idMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)
  if (!idMatch) return null
  const id = idMatch[1]
  const gidMatch = url.match(/[#&?]gid=(\d+)/)
  const gid = gidMatch ? gidMatch[1] : '0'
  return `https://docs.google.com/spreadsheets/d/${id}/pub?gid=${gid}&single=true&output=csv`
}

function parseCsvNames(csv) {
  return csv
    .split('\n')
    .slice(1)
    .map(row => row.split(',')[0].replace(/^"|"$/g, '').trim())
    .filter(Boolean)
}

const DEFAULT_SETTINGS = {
  templateType:     'quote',
  quote:            '\u201CThe most successful marketing teams in the AI era will be those who build content for how the internet actually works.\u201D',
  firstName:        'Nicole',
  lastName:         'Baer',
  roleCompany:      'CMO, Carta',
  ctaText:          'See AirOps in Action',
  colorMode:        'green',
  showCTA:          false,
  dims:             { w: 1080, h: 1080 },
  tweetText:        'Giving AI to sales and marketing teams is easy. Giving AI to the operating layer of revenue is hard, that\'s why AirOps will quietly create more enterprise value than most flashy AI tools.',
  tweetAuthorName:  'Sushil Krishna',
  tweetAuthorHandle:'@ksushil7',
  tweetDate:        '2:47 AM · Feb 24, 2026',
  tweetProfileImage: null,
  showFloralia:       false,
  // Rich Quote template
  richQuoteText:    '\u201CThe most successful marketing teams in the AI era will be those who build content for how the internet actually works.\u201D',
  richFirstName:    'Nicole',
  richLastName:     'Baer',
  richRoleCompany:  'CMO, Carta',
  richProfileImage:  null,
  richCompanyLogo:   null,
  richFlip:          false,
  // Certificate
  certFullName:      'Firstname Lastname',
  batchSheetUrl:     '',
  // Title Card
  tcEyebrow:         'Deadline extended',
  tcShowEyebrow:     true,
  tcSerifTitle:      'Submit your',
  tcShowSerifTitle:  true,
  tcSansTitle:       'workflow',
  tcShowSansTitle:   true,
  tcEmphasizeSans:   true,
  tcSubheadline:     'Friday @7pm EST',
  tcShowSubheadline: true,
  tcBody:            '\u201CLLM-sourced traffic has better time-to-conversions and sessions-to-conversions than organic traffic from Google.\u201D',
  tcShowBody:        false,
  tcShowLogo:        false,
  tcCTAText:         'See AirOps in Action',
  tcShowCTA:         false,
  decorationStyle:    'fill',
  decorationRotation: 0,
  // I Joined template
  ijMode:            'night',
  ijName:            'Nicole Baer',
  ijRole:            'Marketing Strategist',
  ijShowHiring:      true,
  ijProfileImage:    null,
}

export default function App() {
  const [settings, setSettings]             = useState(DEFAULT_SETTINGS)
  const [fontsReady, setFontsReady]         = useState(false)
  const [uiMode, setUiMode]                 = useState('light')
  const [showSplash, setShowSplash]         = useState(true)
  const [batchExporting, setBatchExporting] = useState(false)
  const [highlightStrokes, setHighlightStrokes] = useState([])
  const [highlightActive, setHighlightActive]   = useState(false)

  const profileImageRef      = useRef(null)
  const richProfileImageRef  = useRef(null)
  const richCompanyLogoRef   = useRef(null)
  const certImageRef         = useRef(null)
  const ijProfileImageRef    = useRef(null)
  const floraliaDotsRef      = useRef([])
  const [floraliaReady, setFloraliaReady] = useState(0)

  useEffect(() => {
    loadFonts()
      .then(() => setFontsReady(true))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!fontsReady) return
    floraliaDotsRef.current = generateFleuronFontDots()
    setFloraliaReady(v => v + 1)
  }, [fontsReady])

  // Preload default Rich Quote + I Joined images from public folder
  useEffect(() => {
    const portrait = new Image()
    portrait.onload = () => {
      richProfileImageRef.current = portrait
      ijProfileImageRef.current   = portrait
      setSettings(prev => ({ ...prev, richProfileImage: '/GTMGen-NicoleBaerPortrait.jpg', ijProfileImage: '/GTMGen-NicoleBaerPortrait.jpg' }))
    }
    portrait.src = '/GTMGen-NicoleBaerPortrait.jpg'

    const logo = new Image()
    logo.onload = () => {
      richCompanyLogoRef.current = logo
      setSettings(prev => ({ ...prev, richCompanyLogo: '/GTMGen-carta_logo.svg.svg' }))
    }
    logo.src = '/GTMGen-carta_logo.svg.svg'
  }, [])

  // Preload certificate background image
  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      certImageRef.current = img
      setSettings(prev => ({ ...prev }))
    }
    img.src = '/GTMGen-Certificate.jpg'
  }, [])

  const update = useCallback((key, value) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value }
      // Rich Quote and Quote Block don't support dark modes — reset if switching to them
      if (key === 'templateType' && ['quote', 'richquote'].includes(value) && next.colorMode.startsWith('dark-')) {
        next.colorMode = next.colorMode.replace('dark-', '')
      }
      // Certificate only supports 1080×1080 and 1080×1920 — reset to square if switching to it
      if (key === 'templateType' && value === 'certificate') {
        const { w, h } = next.dims
        const valid = (w === 1080 && (h === 1080 || h === 1920))
        if (!valid) next.dims = { w: 1080, h: 1080 }
      }
      // I Joined is fixed to 1920×1080
      if (key === 'templateType' && value === 'ijoined') {
        next.dims = { w: 1920, h: 1080 }
      }
      return next
    })
  }, [])

  const handleRefleuron = useCallback(() => {
    if (!fontsReady) return
    floraliaDotsRef.current = generateFleuronFontDots()
    setSettings(prev => ({ ...prev, showFloralia: true }))
    setFloraliaReady(v => v + 1)
  }, [fontsReady])

  const handleProfileImageChange = useCallback((dataUrl) => {
    if (!dataUrl) {
      profileImageRef.current = null
      update('tweetProfileImage', null)
      return
    }
    const img = new Image()
    img.onload = () => {
      profileImageRef.current = img
      update('tweetProfileImage', dataUrl)
    }
    img.src = dataUrl
  }, [update])

  const handleRichProfileImageChange = useCallback((dataUrl) => {
    if (!dataUrl) { richProfileImageRef.current = null; update('richProfileImage', null); return }
    const img = new Image()
    img.onload = () => { richProfileImageRef.current = img; update('richProfileImage', dataUrl) }
    img.src = dataUrl
  }, [update])

  const handleRichCompanyLogoChange = useCallback((dataUrl) => {
    if (!dataUrl) { richCompanyLogoRef.current = null; update('richCompanyLogo', null); return }
    const img = new Image()
    img.onload = () => { richCompanyLogoRef.current = img; update('richCompanyLogo', dataUrl) }
    img.src = dataUrl
  }, [update])

  const handleIJProfileImageChange = useCallback((dataUrl) => {
    if (!dataUrl) { ijProfileImageRef.current = null; update('ijProfileImage', null); return }
    const img = new Image()
    img.onload = () => { ijProfileImageRef.current = img; update('ijProfileImage', dataUrl) }
    img.src = dataUrl
  }, [update])

  const draw = useCallback((canvas, s) => {
    if (s.templateType === 'twitter')          drawTwitterCanvas(canvas, s, fontsReady, profileImageRef.current, floraliaDotsRef.current)
    else if (s.templateType === 'richquote')   drawRichQuoteCanvas(canvas, s, fontsReady, richProfileImageRef.current, richCompanyLogoRef.current)
    else if (s.templateType === 'titlecard')   drawTitleCardCanvas(canvas, s, fontsReady, floraliaDotsRef.current)
    else if (s.templateType === 'certificate') drawCertificateCanvas(canvas, s, fontsReady, floraliaDotsRef.current, certImageRef.current)
    else if (s.templateType === 'ijoined')     drawIJoinedCanvas(canvas, s, fontsReady, ijProfileImageRef.current, floraliaDotsRef.current)
    else                                       drawCanvas(canvas, s, fontsReady)

    // Replay highlight strokes on top (quote block only)
    if (highlightStrokes.length > 0 && s.templateType === 'quote') {
      const ctx = canvas.getContext('2d')
      ctx.save()
      ctx.globalCompositeOperation = 'multiply'
      ctx.strokeStyle = 'rgba(255, 213, 0, 0.72)'
      ctx.lineWidth   = 42
      ctx.lineCap     = 'round'
      ctx.lineJoin    = 'round'
      highlightStrokes.forEach(pts => {
        if (pts.length < 2) return
        ctx.beginPath()
        ctx.moveTo(pts[0].x, pts[0].y)
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
        ctx.stroke()
      })
      ctx.restore()
    }
  }, [fontsReady, floraliaReady, highlightStrokes]) // eslint-disable-line react-hooks/exhaustive-deps

  const exportJpeg = useCallback((w, h, filename) => {
    const ew = w ?? settings.dims.w
    const eh = h ?? settings.dims.h
    const s  = { ...settings, dims: { w: ew, h: eh } }
    const ec = document.createElement('canvas')
    draw(ec, s)
    const prefix = settings.templateType === 'twitter'      ? 'airops-tweet'
      : settings.templateType === 'richquote'               ? 'airops-richquote'
      : settings.templateType === 'titlecard'               ? 'airops-titlecard'
      : settings.templateType === 'certificate'             ? 'airops-certificate'
      : settings.templateType === 'ijoined'                 ? 'airops-ijoined'
      : 'airops-quote'
    const modeTag = settings.templateType === 'ijoined' ? settings.ijMode : settings.colorMode
    const a = document.createElement('a')
    a.download = filename ?? `${prefix}-${modeTag}-${ew}x${eh}.jpg`
    a.href = ec.toDataURL('image/jpeg', 0.95)
    a.click()
  }, [settings, draw])

  const exportAll = useCallback(() => {
    const presets = [
      [1080, 1080, 'sq'],
      [1080, 1350, 'p45'],
      [1080, 1920, 's916'],
      [1920, 1080, 'l169'],
    ]
    const prefix = settings.templateType === 'twitter'      ? 'airops-tweet'
      : settings.templateType === 'richquote'               ? 'airops-richquote'
      : settings.templateType === 'titlecard'               ? 'airops-titlecard'
      : settings.templateType === 'certificate'             ? 'airops-certificate'
      : 'airops-quote'
    presets.forEach(([w, h, label], i) => {
      setTimeout(
        () => exportJpeg(w, h, `${prefix}-${settings.colorMode}-${label}-${w}x${h}.jpg`),
        i * 350,
      )
    })
  }, [exportJpeg, settings.colorMode, settings.templateType])

  const handleStrokeComplete  = useCallback((pts) => setHighlightStrokes(prev => [...prev, pts]), [])
  const handleUndoStroke      = useCallback(() => setHighlightStrokes(prev => prev.slice(0, -1)), [])
  const handleClearStrokes    = useCallback(() => setHighlightStrokes([]), [])
  const handleToggleHighlight = useCallback(() => setHighlightActive(v => !v), [])

  const handleBatchExport = useCallback(async () => {
    const csvUrl = parseSheetCsvUrl(settings.batchSheetUrl ?? '')
    if (!csvUrl) { alert('Please enter a valid Google Sheets URL.'); return }

    setBatchExporting(true)
    try {
      const res = await fetch(csvUrl)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const text = await res.text()
      const names = parseCsvNames(text)
      if (names.length === 0) { alert('No names found. Make sure Column A has names starting from row 2.'); return }

      const JSZip = (await import('jszip')).default
      const zip   = new JSZip()

      for (const name of names) {
        const s  = { ...settings, certFullName: name }
        const ec = document.createElement('canvas')
        draw(ec, s)
        const base64 = ec.toDataURL('image/jpeg', 0.95).split(',')[1]
        zip.file(`certificate-${name.replace(/[^a-zA-Z0-9]/g, '-')}.jpg`, base64, { base64: true })
      }

      const blob = await zip.generateAsync({ type: 'blob' })
      const a    = document.createElement('a')
      a.download = 'certificates.zip'
      a.href     = URL.createObjectURL(blob)
      a.click()
      URL.revokeObjectURL(a.href)
    } catch (e) {
      alert('Could not fetch the sheet. Make sure it is published to web as CSV (File → Share → Publish to web → CSV).')
    } finally {
      setBatchExporting(false)
    }
  }, [settings, draw])

  return (
    <div className={`app${uiMode === 'light' ? ' light' : ''}`}>
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
      <Sidebar
        settings={settings}
        update={update}
        fontsReady={fontsReady}
        onExport={exportJpeg}
        onExportAll={exportAll}
        uiMode={uiMode}
        onToggleUiMode={() => setUiMode(m => m === 'dark' ? 'light' : 'dark')}
        onProfileImageChange={handleProfileImageChange}
        onRichProfileImageChange={handleRichProfileImageChange}
        onRichCompanyLogoChange={handleRichCompanyLogoChange}
        onIJProfileImageChange={handleIJProfileImageChange}
        onRefleuron={handleRefleuron}
        onBatchExport={handleBatchExport}
        batchExporting={batchExporting}
        highlightActive={highlightActive}
        highlightStrokes={highlightStrokes}
        onToggleHighlight={handleToggleHighlight}
        onUndoStroke={handleUndoStroke}
        onClearStrokes={handleClearStrokes}
      />
      <CanvasPreview
        settings={settings}
        fontsReady={fontsReady}
        draw={draw}
        highlightStrokes={highlightStrokes}
        highlightActive={highlightActive}
        onStrokeComplete={handleStrokeComplete}
      />
    </div>
  )
}
