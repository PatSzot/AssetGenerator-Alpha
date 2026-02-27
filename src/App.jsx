import { useState, useCallback, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import CanvasPreview from './components/CanvasPreview'
import { loadFonts } from './utils/loadFonts'
import { drawCanvas } from './utils/drawCanvas'
import { drawTwitterCanvas } from './utils/drawTwitterCanvas'
import './App.css'

const DEFAULT_SETTINGS = {
  templateType: 'quote',
  quote:        '"The most successful marketing teams in the AI era will be those who build content for how the internet actually works."',
  firstName:    'Nicole',
  lastName:     'Baer',
  roleCompany:  'CMO, Carta',
  ctaText:      'See AirOps in Action',
  colorMode:    'green',
  showCTA:      false,
  dims:         { w: 1080, h: 1080 },
  tweetData:    null,
}

export default function App() {
  const [settings, setSettings]     = useState(DEFAULT_SETTINGS)
  const [fontsReady, setFontsReady] = useState(false)
  const [uiMode, setUiMode]         = useState('light')
  const [tweetUrl, setTweetUrl]     = useState('')
  const [tweetFetching, setTweetFetching] = useState(false)
  const [tweetError, setTweetError] = useState('')

  useEffect(() => {
    loadFonts()
      .then(() => setFontsReady(true))
      .catch(() => {})
  }, [])

  const update = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }, [])

  const fetchTweet = useCallback(async () => {
    if (!tweetUrl.trim()) return
    setTweetFetching(true)
    setTweetError('')
    try {
      const res = await fetch(`/api/tweet?url=${encodeURIComponent(tweetUrl.trim())}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch tweet')
      update('tweetData', data)
    } catch (err) {
      setTweetError(err.message)
    } finally {
      setTweetFetching(false)
    }
  }, [tweetUrl, update])

  const draw = useCallback((canvas, s) => {
    if (s.templateType === 'twitter') drawTwitterCanvas(canvas, s, fontsReady)
    else drawCanvas(canvas, s, fontsReady)
  }, [fontsReady])

  const exportJpeg = useCallback((w, h, filename) => {
    const ew = w ?? settings.dims.w
    const eh = h ?? settings.dims.h
    const s  = { ...settings, dims: { w: ew, h: eh } }
    const ec = document.createElement('canvas')
    draw(ec, s)
    const prefix = settings.templateType === 'twitter' ? 'airops-tweet' : 'airops-quote'
    const a = document.createElement('a')
    a.download = filename ?? `${prefix}-${settings.colorMode}-${ew}x${eh}.jpg`
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
    const prefix = settings.templateType === 'twitter' ? 'airops-tweet' : 'airops-quote'
    presets.forEach(([w, h, label], i) => {
      setTimeout(
        () => exportJpeg(w, h, `${prefix}-${settings.colorMode}-${label}-${w}x${h}.jpg`),
        i * 350,
      )
    })
  }, [exportJpeg, settings.colorMode, settings.templateType])

  return (
    <div className={`app${uiMode === 'light' ? ' light' : ''}`}>
      <Sidebar
        settings={settings}
        update={update}
        fontsReady={fontsReady}
        onExport={exportJpeg}
        onExportAll={exportAll}
        uiMode={uiMode}
        onToggleUiMode={() => setUiMode(m => m === 'dark' ? 'light' : 'dark')}
        tweetUrl={tweetUrl}
        onTweetUrlChange={setTweetUrl}
        onFetchTweet={fetchTweet}
        tweetFetching={tweetFetching}
        tweetError={tweetError}
      />
      <CanvasPreview
        settings={settings}
        fontsReady={fontsReady}
        draw={draw}
      />
    </div>
  )
}
