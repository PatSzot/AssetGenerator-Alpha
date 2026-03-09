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
import { drawWebinarCanvas } from './utils/drawWebinarCanvas'
import { generateFleuronFontDots } from './utils/drawFleurons'
import './App.css'

// ── URL slug ↔ template type
const VALID_TEMPLATES = new Set(['quote', 'richquote', 'titlecard', 'twitter', 'certificate', 'ijoined', 'webinar'])

function templateFromPath() {
  const slug = window.location.pathname.replace(/^\//, '').toLowerCase()
  return VALID_TEMPLATES.has(slug) ? slug : 'quote'
}

// ── Hash-based pre-population
// Expected payload: { text, customerName, company, role, images: string[] }
function parseHashData() {
  const hash = window.location.hash
  if (!hash.startsWith('#')) return null
  try {
    const params = new URLSearchParams(hash.slice(1))
    const raw = params.get('data')
    if (!raw) return null
    // URLSearchParams turns + into spaces — restore for base64
    const b64 = raw.replace(/ /g, '+')
    // Support UTF-8 payloads (smart quotes, em dashes, etc.)
    return JSON.parse(decodeURIComponent(escape(atob(b64))))
  } catch {
    return null
  }
}

function ensureDataUrl(str) {
  if (!str) return null
  if (str.startsWith('data:')) return str
  return `data:image/jpeg;base64,${str}`
}


function applyHashPayload(base, payload) {
  if (!payload) return base
  const { text, customerName, company, role, images } = payload
  const next = { ...base }

  if (text) {
    next.quote         = text
    next.richQuoteText = text
    next.tweetText     = text
  }

  if (customerName) {
    const spaceIdx      = customerName.indexOf(' ')
    const firstName     = spaceIdx === -1 ? customerName : customerName.slice(0, spaceIdx)
    const lastName      = spaceIdx === -1 ? ''           : customerName.slice(spaceIdx + 1)
    next.firstName      = firstName
    next.lastName       = lastName
    next.richFirstName  = firstName
    next.richLastName   = lastName
    next.tweetAuthorName = customerName
    next.ijName         = customerName
    next.certFullName   = customerName
  }

  if (role || company) {
    const rc              = [role, company].filter(Boolean).join(', ')
    next.roleCompany      = rc
    next.richRoleCompany  = rc
    next.ijRole           = role ?? ''
  }

  if (payload.cohortLevel) next.certCohortLevel    = payload.cohortLevel
  if (payload.cohortDate)  next.certGraduationDate = payload.cohortDate

  if (images?.[0]) next.richProfileImage  = ensureDataUrl(images[0])
  if (images?.[0]) next.tweetProfileImage = ensureDataUrl(images[0])
  if (images?.[0]) next.ijProfileImage    = ensureDataUrl(images[0])
  if (images?.[1]) next.richCompanyLogo   = ensureDataUrl(images[1])

  return next
}

// ── Batch export helpers

// Parse an AirOps grid URL → { gridId, sheetId } or null
function parseAirOpsUrl(raw) {
  const m = raw.trim().match(/app\.airops\.com\/[^/]+\/grids\/(\d+)\/sheets\/(\d+)/)
  return m ? { gridId: m[1], sheetId: m[2] } : null
}

// Normalise a Google Sheets URL to its published CSV export URL; returns raw URL for anything else
function normaliseSheetUrl(raw) {
  const url = raw.trim()
  if (!url) return null
  const idMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)
  if (!idMatch) return url
  const id  = idMatch[1]
  const gid = (url.match(/[#&?]gid=(\d+)/) ?? [])[1] ?? '0'
  return `https://docs.google.com/spreadsheets/d/${id}/pub?gid=${gid}&single=true&output=csv`
}

// Parse JSON rows from AirOps API into { firstName, lastName, cohortDate }
function parseAirOpsRows(rows) {
  return rows.map(row => {
    const get = (...keys) => { for (const k of keys) if (row[k] != null) return String(row[k]).trim(); return '' }
    return {
      firstName:  get('First Name', 'first name', 'firstname'),
      lastName:   get('Last Name',  'last name',  'lastname'),
      cohortDate: get('Cohort Date', 'cohort date', 'graduation date'),
    }
  }).filter(r => r.firstName || r.lastName)
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
// Looks for columns by name — exact match first, then partial (case-insensitive)
function parseCsvRows(csv) {
  const lines = csv.split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length < 2) return []

  const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase())
  const findCol = (...names) => {
    for (const name of names) {
      const i = headers.findIndex(h => h === name)
      if (i !== -1) return i
    }
    for (const name of names) {
      const i = headers.findIndex(h => h.includes(name))
      if (i !== -1) return i
    }
    return -1
  }

  const firstIdx = findCol('first name', 'firstname', 'first')
  const lastIdx  = findCol('last name',  'lastname',  'last')
  const dateIdx  = findCol('cohort date', 'graduation date', 'date')

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
  dims:             { w: 1920, h: 1080 },
  tweetText:        'Giving AI to sales and marketing teams is easy. Giving AI to the operating layer of revenue is hard, that\'s why AirOps will quietly create more enterprise value than most flashy AI tools.',
  tweetAuthorName:  'Sushil Krishna',
  tweetAuthorHandle:'@ksushil7',
  tweetDate:        '2:47 AM · Feb 24, 2026',
  tweetProfileImage: null,
  showFloralia:       true,
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
  certCohortLevel:    'Intermediate',
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
  // Webinar template
  wbNumSpeakers:     1,
  wbEyebrow:         'WEBINAR',
  wbTitleClause:     'Stop blaming attribution:',
  wbMainTitle:       'Alignment is the only scoreboard that matters.',
  wbDate:            'Thursday, December 3rd\n1:00 PM EST',
  wbSpeaker1Name:    'Lily Ray',
  wbSpeaker1Role:    'VP, SEO Strategy & Research, Amsive',
  wbSpeaker1Image:   '/GTMGen-NicoleBaerPortrait.jpg',
  wbSpeaker1Logo:    null,
  wbSpeaker2Name:    'Speaker Two',
  wbSpeaker2Role:    'Title, Company',
  wbSpeaker2Image:   '/GTMGen-NicoleBaerPortrait.jpg',
  wbSpeaker2Logo:    null,
  wbSpeaker3Name:    'Speaker Three',
  wbSpeaker3Role:    'Title, Company',
  wbSpeaker3Image:   '/GTMGen-NicoleBaerPortrait.jpg',
  wbSpeaker3Logo:    null,
  wbSpeaker4Name:    'Speaker Four',
  wbSpeaker4Role:    'Title, Company',
  wbSpeaker4Image:   '/GTMGen-NicoleBaerPortrait.jpg',
  wbSpeaker4Logo:    null,
}

export default function App() {
  const hashPayloadRef = useRef(parseHashData())
  const [settings, setSettings]       = useState(() => applyHashPayload({ ...DEFAULT_SETTINGS, templateType: templateFromPath() }, hashPayloadRef.current))
  const [fontsReady, setFontsReady]   = useState(false)
  const [uiMode, setUiMode]           = useState('light')
  const [showSplash, setShowSplash]   = useState(() => window.location.pathname === '/' || window.location.pathname === '')
  const [batchExporting, setBatchExporting] = useState(false)
  const [batchRows, setBatchRows]         = useState(null)
  const [batchFetching, setBatchFetching] = useState(false)
  const [airopsApiKey, setAiropsApiKey]   = useState(() => localStorage.getItem('airops-api-key') ?? '')

  const profileImageRef      = useRef(null)
  const richProfileImageRef  = useRef(null)
  const richCompanyLogoRef   = useRef(null)
  const certImageRef         = useRef(null)
  const ijProfileImageRef    = useRef(null)
  const wbPhotoRefs          = useRef([null, null, null, null])
  const wbLogoRefs           = useRef([null, null, null, null])
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

  // Load images from hash payload and clear the hash
  useEffect(() => {
    const payload = hashPayloadRef.current
    if (!payload) return

    // Clear the hash so it doesn't persist on refresh
    window.history.replaceState(null, '', window.location.pathname + window.location.search)

    const { images } = payload
    if (!images?.length) return

    const src0 = ensureDataUrl(images[0])
    if (src0) {
      const img = new Image()
      img.onload = () => {
        richProfileImageRef.current = img
        ijProfileImageRef.current   = img
        profileImageRef.current     = img
        setSettings(prev => ({ ...prev, richProfileImage: src0, ijProfileImage: src0, tweetProfileImage: src0 }))
      }
      img.src = src0
    }

    const src1 = ensureDataUrl(images[1])
    if (src1) {
      const img = new Image()
      img.onload = () => {
        richCompanyLogoRef.current = img
        setSettings(prev => ({ ...prev, richCompanyLogo: src1 }))
      }
      img.src = src1
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Preload default Rich Quote + I Joined images from public folder
  // Skip if hash payload already provides those images
  useEffect(() => {
    const hashImages = hashPayloadRef.current?.images ?? []

    if (!hashImages[0]) {
      const portrait = new Image()
      portrait.onload = () => {
        richProfileImageRef.current = portrait
        ijProfileImageRef.current   = portrait
        wbPhotoRefs.current         = [portrait, portrait, portrait, portrait]
        setSettings(prev => ({
          ...prev,
          richProfileImage: '/GTMGen-NicoleBaerPortrait.jpg',
          ijProfileImage:   '/GTMGen-NicoleBaerPortrait.jpg',
          wbSpeaker1Image:  '/GTMGen-NicoleBaerPortrait.jpg',
          wbSpeaker2Image:  '/GTMGen-NicoleBaerPortrait.jpg',
          wbSpeaker3Image:  '/GTMGen-NicoleBaerPortrait.jpg',
          wbSpeaker4Image:  '/GTMGen-NicoleBaerPortrait.jpg',
        }))
      }
      portrait.src = '/GTMGen-NicoleBaerPortrait.jpg'
    }

    if (!hashImages[1]) {
      const logo = new Image()
      logo.onload = () => {
        richCompanyLogoRef.current = logo
        setSettings(prev => ({ ...prev, richCompanyLogo: '/GTMGen-carta_logo.svg.svg' }))
      }
      logo.src = '/GTMGen-carta_logo.svg.svg'
    }
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

  // Sync browser back/forward to templateType
  useEffect(() => {
    const onPop = () => setSettings(prev => ({ ...prev, templateType: templateFromPath() }))
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const update = useCallback((key, value) => {
    if (key === 'templateType') {
      window.history.pushState({}, '', value === 'quote' ? '/' : `/${value}`)
    }
    setSettings(prev => {
      const next = { ...prev, [key]: value }
      // Rich Quote and Quote Block don't support dark modes — reset if switching to them
      if (key === 'templateType' && ['quote', 'richquote', 'webinar'].includes(value) && next.colorMode.startsWith('dark-')) {
        next.colorMode = next.colorMode.replace('dark-', '')
      }
      // Certificate is fixed to 1920×1080
      if (key === 'templateType' && value === 'certificate') {
        next.dims = { w: 1920, h: 1080 }
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

  const handleWbPhotoChange = useCallback((idx, dataUrl) => {
    const key = `wbSpeaker${idx + 1}Image`
    if (!dataUrl) { wbPhotoRefs.current[idx] = null; update(key, null); return }
    const img = new Image()
    img.onload = () => { wbPhotoRefs.current[idx] = img; update(key, dataUrl) }
    img.src = dataUrl
  }, [update])

  const handleWbLogoChange = useCallback((idx, dataUrl) => {
    const key = `wbSpeaker${idx + 1}Logo`
    if (!dataUrl) { wbLogoRefs.current[idx] = null; update(key, null); return }
    const img = new Image()
    img.onload = () => { wbLogoRefs.current[idx] = img; update(key, dataUrl) }
    img.src = dataUrl
  }, [update])

  const draw = useCallback((canvas, s) => {
    if (s.templateType === 'twitter')          drawTwitterCanvas(canvas, s, fontsReady, profileImageRef.current, floraliaDotsRef.current)
    else if (s.templateType === 'richquote')   drawRichQuoteCanvas(canvas, s, fontsReady, richProfileImageRef.current, richCompanyLogoRef.current)
    else if (s.templateType === 'titlecard')   drawTitleCardCanvas(canvas, s, fontsReady, floraliaDotsRef.current)
    else if (s.templateType === 'certificate') drawCertificateCanvas(canvas, s, fontsReady, floraliaDotsRef.current, certImageRef.current)
    else if (s.templateType === 'ijoined')     drawIJoinedCanvas(canvas, s, fontsReady, ijProfileImageRef.current, floraliaDotsRef.current)
    else if (s.templateType === 'webinar')     drawWebinarCanvas(canvas, s, fontsReady, wbPhotoRefs.current, wbLogoRefs.current, floraliaDotsRef.current)
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
      : settings.templateType === 'webinar'                 ? 'airops-webinar'
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
      : settings.templateType === 'webinar'                 ? 'airops-webinar'
      : 'airops-quote'
    presets.forEach(([w, h, label], i) => {
      setTimeout(
        () => exportJpeg(w, h, `${prefix}-${settings.colorMode}-${label}-${w}x${h}.jpg`),
        i * 350,
      )
    })
  }, [exportJpeg, settings.colorMode, settings.templateType])

  const handleSetAiropsApiKey = useCallback((key) => {
    setAiropsApiKey(key)
    localStorage.setItem('airops-api-key', key)
  }, [])

  const handleFetchBatch = useCallback(async () => {
    const raw = settings.batchSheetUrl?.trim() ?? ''
    if (!raw) { alert('Please enter a URL.'); return }

    // ── AirOps grid URL path
    const airops = parseAirOpsUrl(raw)
    if (airops) {
      if (!airopsApiKey) { alert('Enter your AirOps API key first.'); return }
      setBatchFetching(true)
      try {
        const r = await fetch('/api/airops-grid', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...airops, apiKey: airopsApiKey }),
        })
        const data = await r.json()
        if (!r.ok) throw new Error((data.error ?? `HTTP ${r.status}`) + (data.detail ? '\n\n' + data.detail : ''))
        setBatchRows(parseAirOpsRows(data.rows ?? []))
      } catch (e) {
        alert('AirOps fetch failed: ' + e.message)
        setBatchRows(null)
      } finally {
        setBatchFetching(false)
      }
      return
    }

    // ── Generic CSV URL path
    const url = normaliseSheetUrl(raw)
    if (!url) { alert('Please enter a valid URL.'); return }
    setBatchFetching(true)
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setBatchRows(parseCsvRows(await res.text()))
    } catch (e) {
      alert('Could not fetch the CSV. Make sure the URL is publicly accessible.')
      setBatchRows(null)
    } finally {
      setBatchFetching(false)
    }
  }, [settings.batchSheetUrl, airopsApiKey])

  const handleBatchCsvUpload = useCallback((text) => {
    const rows = parseCsvRows(text)
    setBatchRows(rows)
  }, [])

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
        onWbPhotoChange={handleWbPhotoChange}
        onWbLogoChange={handleWbLogoChange}
        onRefleuron={handleRefleuron}
        onFetchBatch={handleFetchBatch}
        onBatchCsvUpload={handleBatchCsvUpload}
        batchFetching={batchFetching}
        batchRows={batchRows}
        airopsApiKey={airopsApiKey}
        onSetAiropsApiKey={handleSetAiropsApiKey}
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
