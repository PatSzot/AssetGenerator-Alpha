import { useState, useCallback, useEffect, useRef } from 'react'
import Sidebar from './components/Sidebar'
import CanvasPreview from './components/CanvasPreview'
import { loadFonts } from './utils/loadFonts'
import { drawCanvas } from './utils/drawCanvas'
import { drawTwitterCanvas } from './utils/drawTwitterCanvas'
import './App.css'

const DEFAULT_SETTINGS = {
  templateType:     'quote',
  quote:            '"The most successful marketing teams in the AI era will be those who build content for how the internet actually works."',
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
  showFleuron:      false,
}

export default function App() {
  const [settings, setSettings]     = useState(DEFAULT_SETTINGS)
  const [fontsReady, setFontsReady] = useState(false)
  const [uiMode, setUiMode]         = useState('light')

  const profileImageRef  = useRef(null)
  const fleuronImagesRef = useRef({})
  const [fleuronReady, setFleuronReady] = useState(0)

  useEffect(() => {
    loadFonts()
      .then(() => setFontsReady(true))
      .catch(() => {})
  }, [])

  // Preload the fleuron SVG in one tinted variant per colour mode.
  // Blob URLs are same-origin so canvas exports stay untainted.
  useEffect(() => {
    const TINTS = {
      'green':       '#80CC9F',
      'pink':        '#CC86C0',
      'yellow':      '#BCBF35',
      'blue':        '#8080CC',
      'dark-green':  '#70D494',
      'dark-pink':   '#D470C4',
      'dark-yellow': '#C4C240',
      'dark-blue':   '#9090D8',
    }
    fetch('/GTMGen-Fleuron.svg')
      .then(r => r.text())
      .then(svgText => {
        const entries = Object.entries(TINTS)
        let loaded = 0
        entries.forEach(([mode, color]) => {
          const colored = svgText.replaceAll('fill="#80CC9F"', `fill="${color}"`)
          const blob = new Blob([colored], { type: 'image/svg+xml' })
          const url  = URL.createObjectURL(blob)
          const img  = new Image()
          img.onload = () => {
            URL.revokeObjectURL(url)
            if (++loaded === entries.length) setFleuronReady(v => v + 1)
          }
          img.src = url
          fleuronImagesRef.current[mode] = img
        })
      })
      .catch(() => {})
  }, [])

  const update = useCallback((key, value) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value }
      // If switching back to quote, reset any dark colour mode to its light base
      if (key === 'templateType' && value === 'quote' && next.colorMode.startsWith('dark-')) {
        next.colorMode = next.colorMode.replace('dark-', '')
      }
      return next
    })
  }, [])

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

  const draw = useCallback((canvas, s) => {
    if (s.templateType === 'twitter') drawTwitterCanvas(canvas, s, fontsReady, profileImageRef.current, fleuronImagesRef.current)
    else drawCanvas(canvas, s, fontsReady)
  }, [fontsReady, fleuronReady]) // eslint-disable-line react-hooks/exhaustive-deps

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
        onProfileImageChange={handleProfileImageChange}
      />
      <CanvasPreview
        settings={settings}
        fontsReady={fontsReady}
        draw={draw}
      />
    </div>
  )
}
