import { useState, useCallback, useEffect, useRef } from 'react'
import Sidebar from './components/Sidebar'
import CanvasPreview from './components/CanvasPreview'
import { loadFonts } from './utils/loadFonts'
import { drawCanvas } from './utils/drawCanvas'
import { drawTwitterCanvas } from './utils/drawTwitterCanvas'
import { generateAllFleuronCanvases } from './utils/drawFleurons'
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

  // Load the fleuron PNG once, then derive one recoloured + transparent
  // offscreen canvas per colour mode via pixel manipulation.
  // HTMLCanvasElement is drawn with ctx.drawImage — no taint, no async img.complete issues.
  useEffect(() => {
    const TINTS = {
      'green':       [128, 204, 159],
      'pink':        [204, 134, 192],
      'yellow':      [188, 191,  53],
      'blue':        [128, 128, 204],
      'dark-green':  [112, 212, 148],
      'dark-pink':   [212, 112, 196],
      'dark-yellow': [196, 196,  64],
      'dark-blue':   [144, 144, 216],
    }
    const src = new Image()
    src.onload = () => {
      const w = src.naturalWidth, h = src.naturalHeight
      // Draw source onto a canvas to read pixels
      const srcCanvas = document.createElement('canvas')
      srcCanvas.width = w; srcCanvas.height = h
      const sctx = srcCanvas.getContext('2d')
      sctx.drawImage(src, 0, 0)
      const srcPixels = sctx.getImageData(0, 0, w, h).data

      Object.entries(TINTS).forEach(([mode, [tr, tg, tb]]) => {
        const oc   = document.createElement('canvas')
        oc.width = w; oc.height = h
        const oct  = oc.getContext('2d')
        const od   = oct.createImageData(w, h)
        const data = od.data
        for (let i = 0; i < srcPixels.length; i += 4) {
          const brightness = (srcPixels[i] + srcPixels[i+1] + srcPixels[i+2]) / 3
          const ink = 1 - brightness / 255   // 0 = white, 1 = full dot
          if (ink < 0.04) {
            data[i+3] = 0                    // transparent
          } else {
            data[i]   = tr
            data[i+1] = tg
            data[i+2] = tb
            data[i+3] = Math.min(255, Math.round(ink * 300))
          }
        }
        oct.putImageData(od, 0, 0)
        fleuronImagesRef.current[mode] = oc
      })
      setFleuronReady(v => v + 1)
    }
    src.src = '/GTMGen-Fleuron.png'
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

  const handleRandomize = useCallback(() => {
    fleuronImagesRef.current = generateAllFleuronCanvases()
    setSettings(prev => ({ ...prev, showFleuron: true }))
    setFleuronReady(v => v + 1)
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
        onRandomize={handleRandomize}
      />
      <CanvasPreview
        settings={settings}
        fontsReady={fontsReady}
        draw={draw}
      />
    </div>
  )
}
