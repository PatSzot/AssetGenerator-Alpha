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

// Normalise a Google Sheets share/edit URL to its published CSV export URL.
// Any other URL is returned as-is (raw CSV links, AirOps exports, etc.)
function normaliseSheetUrl(raw) {
  const url = raw.trim()
  if (!url) return null
  if (url.includes('output=csv') || url.includes('tqx=out:csv')) return url
  const idMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)
  if (!idMatch) return url  // return raw URL unchanged
  const id = idMatch[1]
  const gidMatch = url.match(/[#&?]gid=(\d+)/)
  const gid = gidMatch ? gidMatch[1] : '0'
  return `https://docs.google.com/spreadsheets/d/${id}/pub?gid=${gid}&single=true&output=csv`
}

// Parse a single CSV line respecting quoted fields
function parseCsvLine(line) {
  const cols = []
  let cur = ''
  let inQ = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') { inQ = !inQ }
    else if (c === ',' && !inQ) { cols.push(cur); cur = '' }
    else { cur += c }
  }
  cols.push(cur)
  return cols.map(c => c.trim())
}

// Parse CSV into rows of { firstName, lastName, cohortDate }
// Looks for columns by name (case-insensitive, partial match)
function parseCsvRows(csv) {
  const lines = csv.split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length < 2) return []

  const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase())
  const findCol = (...names) => {
    for (const name of names) {
      const i = headers.findIndex(h => h.includes(name))
      if (i !== -1) return i
    }
    return -1
  }

  const firstIdx = findCol('first name', 'firstname', 'first')
  const lastIdx  = findCol('last name',  'lastname',  'last')
  const dateIdx  = findCol('cohort date', 'graduation date', 'date', 'cohort')

  return lines.slice(1).map(line => {
    const cols = parseCsvLine(line)
    const get  = i => (i !== -1 ? cols[i] ?? '' : '')
    return {
      firstName:  get(firstIdx),
      lastName:   get(lastIdx),
      cohortDate: get(dateIdx),
    }
  }).filter(r => r.firstName || r.lastName)
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
  certFullName:       'Firstname Lastname',
  certCohortLevel:    'Content Engineering',
  certGraduationDate: 'March 2026',
  batchSheetUrl:      '',
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
  const [settings, setSettings]       = useState(DEFAULT_SETTINGS)
  const [fontsReady, setFontsReady]   = useState(false)
  const [uiMode, setUiMode]           = useState('light')
  const [showSplash, setShowSplash]   = useState(true)
  const [batchExporting, setBatchExporting] = useState(false)
  const [batchRows, setBatchRows]     = useState(null)   // null=not fetched, []|[...]=fetched
  const [batchFetching, setBatchFetching] = useState(false)

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
      // Certificate only supports 1080×1080 and 1920×1080 — reset to square if switching to it
      if (key === 'templateType' && value === 'certificate') {
        const { w, h } = next.dims
        const valid = (w === 1080 && h === 1080) || (w === 1920 && h === 1080)
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
  }, [fontsReady, floraliaReady]) // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleFetchBatch = useCallback(async () => {
    const url = normaliseSheetUrl(settings.batchSheetUrl ?? '')
    if (!url) { alert('Please enter a CSV URL.'); return }
    setBatchFetching(true)
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const rows = parseCsvRows(await res.text())
      setBatchRows(rows)
    } catch (e) {
      alert('Could not fetch the CSV. Make sure the URL is publicly accessible.')
      setBatchRows(null)
    } finally {
      setBatchFetching(false)
    }
  }, [settings.batchSheetUrl])

  const handleBatchExport = useCallback(async () => {
    if (!batchRows?.length) return
    setBatchExporting(true)
    try {
      const JSZip = (await import('jszip')).default
      const zip   = new JSZip()

      for (const row of batchRows) {
        const fullName = [row.firstName, row.lastName].filter(Boolean).join(' ')
        const s = {
          ...settings,
          certFullName:       fullName || 'Firstname Lastname',
          certGraduationDate: row.cohortDate || settings.certGraduationDate,
        }
        const ec = document.createElement('canvas')
        draw(ec, s)
        const base64 = ec.toDataURL('image/jpeg', 0.95).split(',')[1]
        zip.file(`certificate-${fullName.replace(/[^a-zA-Z0-9]/g, '-')}.jpg`, base64, { base64: true })
      }

      const blob = await zip.generateAsync({ type: 'blob' })
      const a    = document.createElement('a')
      a.download = 'certificates.zip'
      a.href     = URL.createObjectURL(blob)
      a.click()
      URL.revokeObjectURL(a.href)
    } catch (e) {
      alert('Export failed: ' + e.message)
    } finally {
      setBatchExporting(false)
    }
  }, [batchRows, settings, draw])

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
        onFetchBatch={handleFetchBatch}
        batchFetching={batchFetching}
        batchRows={batchRows}
        onBatchExport={handleBatchExport}
        batchExporting={batchExporting}
      />
      <CanvasPreview
        settings={settings}
        fontsReady={fontsReady}
        draw={draw}
      />
    </div>
  )
}
