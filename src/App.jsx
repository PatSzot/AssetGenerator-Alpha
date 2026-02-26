import { useState, useCallback } from 'react'
import QuoteCanvas from './components/QuoteCanvas'
import QuoteForm from './components/QuoteForm'
import StyleControls from './components/StyleControls'
import './App.css'

const DEFAULT_STATE = {
  // Content
  quoteText: 'The best way to predict the future is to create it.',
  authorName: 'Peter Drucker',
  authorTitle: '',

  // Canvas dimensions
  canvasWidth: 1080,
  canvasHeight: 1080,

  // Background
  bgType: 'solid',          // 'solid' | 'gradient'
  bgColor: '#1a1a2e',
  bgGradientStart: '#1a1a2e',
  bgGradientEnd: '#16213e',
  bgGradientAngle: 135,

  // Quote text
  quoteFont: 'Georgia',
  quoteFontSize: 52,
  quoteColor: '#ffffff',
  quoteStyle: 'italic',     // 'normal' | 'italic'
  quoteAlign: 'center',     // 'left' | 'center'
  showQuotationMarks: true,

  // Author text
  authorFont: 'Inter',
  authorFontSize: 28,
  authorColor: '#a0a8c0',

  // Accent
  accentColor: '#e94560',
  showAccentLine: true,

  // Padding
  padding: 80,
}

export default function App() {
  const [settings, setSettings] = useState(DEFAULT_STATE)

  const update = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }, [])

  const reset = useCallback(() => setSettings(DEFAULT_STATE), [])

  return (
    <div className="app">
      <header className="app-header">
        <h1>Quote Asset Generator</h1>
        <p className="app-subtitle">Create shareable quote graphics for social media</p>
      </header>

      <main className="app-main">
        <aside className="app-sidebar">
          <QuoteForm settings={settings} update={update} />
          <StyleControls settings={settings} update={update} />
          <button className="btn-reset" onClick={reset}>Reset to Defaults</button>
        </aside>

        <section className="app-canvas-area">
          <QuoteCanvas settings={settings} />
        </section>
      </main>
    </div>
  )
}
