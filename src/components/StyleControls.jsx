const QUOTE_FONTS = [
  'Georgia',
  'Playfair Display',
  'Merriweather',
  'Lora',
  'Times New Roman',
]

const AUTHOR_FONTS = [
  'Inter',
  'Helvetica Neue',
  'Arial',
  'Montserrat',
  'Raleway',
]

function ColorField({ label, colorKey, hexKey, settings, update }) {
  return (
    <div className="field">
      <label>{label}</label>
      <div className="color-row">
        <input
          type="color"
          value={settings[colorKey]}
          onChange={e => update(colorKey, e.target.value)}
        />
        <input
          type="text"
          value={settings[colorKey]}
          onChange={e => {
            if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) update(colorKey, e.target.value)
          }}
          maxLength={7}
        />
      </div>
    </div>
  )
}

export default function StyleControls({ settings, update }) {
  return (
    <>
      {/* ── Background ── */}
      <div className="panel">
        <div className="panel-header">Background</div>
        <div className="panel-body">

          <div className="field">
            <label>Type</label>
            <div className="seg-control">
              {['solid', 'gradient'].map(t => (
                <button
                  key={t}
                  className={settings.bgType === t ? 'active' : ''}
                  onClick={() => update('bgType', t)}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {settings.bgType === 'solid' ? (
            <ColorField label="Color" colorKey="bgColor" settings={settings} update={update} />
          ) : (
            <>
              <ColorField label="Gradient Start" colorKey="bgGradientStart" settings={settings} update={update} />
              <ColorField label="Gradient End" colorKey="bgGradientEnd" settings={settings} update={update} />
              <div className="field">
                <label>Angle: {settings.bgGradientAngle}°</label>
                <input
                  type="range"
                  min={0}
                  max={360}
                  value={settings.bgGradientAngle}
                  onChange={e => update('bgGradientAngle', Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#4f46e5' }}
                />
              </div>
            </>
          )}

        </div>
      </div>

      {/* ── Quote Text ── */}
      <div className="panel">
        <div className="panel-header">Quote Text</div>
        <div className="panel-body">

          <div className="field">
            <label>Font Family</label>
            <select value={settings.quoteFont} onChange={e => update('quoteFont', e.target.value)}>
              {QUOTE_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          <div className="field-row">
            <div className="field">
              <label>Size (px)</label>
              <input
                type="number"
                min={20}
                max={120}
                value={settings.quoteFontSize}
                onChange={e => update('quoteFontSize', Number(e.target.value))}
              />
            </div>
            <div className="field">
              <label>Style</label>
              <div className="seg-control">
                {['normal', 'italic'].map(s => (
                  <button
                    key={s}
                    className={settings.quoteStyle === s ? 'active' : ''}
                    onClick={() => update('quoteStyle', s)}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <ColorField label="Text Color" colorKey="quoteColor" settings={settings} update={update} />

          <div className="field">
            <label>Alignment</label>
            <div className="seg-control">
              {['left', 'center'].map(a => (
                <button
                  key={a}
                  className={settings.quoteAlign === a ? 'active' : ''}
                  onClick={() => update('quoteAlign', a)}
                >
                  {a.charAt(0).toUpperCase() + a.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="toggle-row">
            <span>Show Quotation Marks</span>
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.showQuotationMarks}
                onChange={e => update('showQuotationMarks', e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
          </div>

        </div>
      </div>

      {/* ── Author ── */}
      <div className="panel">
        <div className="panel-header">Author</div>
        <div className="panel-body">

          <div className="field">
            <label>Font Family</label>
            <select value={settings.authorFont} onChange={e => update('authorFont', e.target.value)}>
              {AUTHOR_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          <div className="field">
            <label>Font Size (px)</label>
            <input
              type="number"
              min={14}
              max={60}
              value={settings.authorFontSize}
              onChange={e => update('authorFontSize', Number(e.target.value))}
            />
          </div>

          <ColorField label="Text Color" colorKey="authorColor" settings={settings} update={update} />

        </div>
      </div>

      {/* ── Accent ── */}
      <div className="panel">
        <div className="panel-header">Accent</div>
        <div className="panel-body">

          <ColorField label="Accent Color" colorKey="accentColor" settings={settings} update={update} />

          <div className="toggle-row">
            <span>Show Accent Line</span>
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.showAccentLine}
                onChange={e => update('showAccentLine', e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
          </div>

        </div>
      </div>

      {/* ── Layout ── */}
      <div className="panel">
        <div className="panel-header">Layout</div>
        <div className="panel-body">
          <div className="field">
            <label>Padding (px): {settings.padding}</label>
            <input
              type="range"
              min={20}
              max={200}
              value={settings.padding}
              onChange={e => update('padding', Number(e.target.value))}
              style={{ width: '100%', accentColor: '#4f46e5' }}
            />
          </div>
        </div>
      </div>
    </>
  )
}
