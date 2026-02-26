import { useState, useCallback, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import CanvasPreview from './components/CanvasPreview'
import { loadFonts } from './utils/loadFonts'
import { drawCanvas } from './utils/drawCanvas'
import './App.css'

const DEFAULT_SETTINGS = {
  quote:       '"The most successful marketing teams in the AI era will be those who build content for how the internet actually works."',
  firstName:   'Nicole',
  lastName:    'Baer',
  roleCompany: 'CMO, Carta',
  ctaText:     'See AirOps in Action',
  colorMode:   'green',
  showCTA:     true,
  dims:        { w: 1080, h: 1080 },
}

export default function App() {
  const [settings, setSettings]   = useState(DEFAULT_SETTINGS)
  const [fontsReady, setFontsReady] = useState(false)
  const [uiMode, setUiMode]         = useState('dark')

  useEffect(() => {
    loadFonts()
      .then(() => setFontsReady(true))
      .catch(() => { /* fonts failed — fall back to system fonts, already handled */ })
  }, [])

  const update = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }, [])

  // Export a single JPEG at the given dimensions
  const exportJpeg = useCallback((w, h, filename) => {
    const ew = w ?? settings.dims.w
    const eh = h ?? settings.dims.h
    const ec = document.createElement('canvas')
    drawCanvas(ec, { ...settings, dims: { w: ew, h: eh } }, fontsReady)
    const a = document.createElement('a')
    a.download = filename ?? `airops-quote-${settings.colorMode}-${ew}x${eh}.jpg`
    a.href = ec.toDataURL('image/jpeg', 0.95)
    a.click()
  }, [settings, fontsReady])

  // Export all 4 preset sizes with a staggered delay (avoids browser download throttle)
  const exportAll = useCallback(() => {
    const presets = [
      [1080, 1080, 'sq'],
      [1080, 1350, 'p45'],
      [1080, 1920, 's916'],
      [1920, 1080, 'l169'],
    ]
    presets.forEach(([w, h, label], i) => {
      setTimeout(
        () => exportJpeg(w, h, `airops-quote-${settings.colorMode}-${label}-${w}x${h}.jpg`),
        i * 350,
      )
    })
  }, [exportJpeg, settings.colorMode])

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
      />
      <CanvasPreview
        settings={settings}
        fontsReady={fontsReady}
      />
    </div>
  )
}
