export default function QuoteForm({ settings, update }) {
  return (
    <div className="panel">
      <div className="panel-header">Content</div>
      <div className="panel-body">

        <div className="field">
          <label htmlFor="quoteText">Quote</label>
          <textarea
            id="quoteText"
            value={settings.quoteText}
            onChange={e => update('quoteText', e.target.value)}
            placeholder="Enter your quote..."
            rows={4}
          />
        </div>

        <div className="field">
          <label htmlFor="authorName">Author Name</label>
          <input
            id="authorName"
            type="text"
            value={settings.authorName}
            onChange={e => update('authorName', e.target.value)}
            placeholder="Author name"
          />
        </div>

        <div className="field">
          <label htmlFor="authorTitle">Author Title <span style={{ color: '#4b5563' }}>(optional)</span></label>
          <input
            id="authorTitle"
            type="text"
            value={settings.authorTitle}
            onChange={e => update('authorTitle', e.target.value)}
            placeholder="e.g. CEO, Author, etc."
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="canvasWidth">Width (px)</label>
            <input
              id="canvasWidth"
              type="number"
              min={400}
              max={3000}
              step={10}
              value={settings.canvasWidth}
              onChange={e => update('canvasWidth', Number(e.target.value))}
            />
          </div>
          <div className="field">
            <label htmlFor="canvasHeight">Height (px)</label>
            <input
              id="canvasHeight"
              type="number"
              min={400}
              max={3000}
              step={10}
              value={settings.canvasHeight}
              onChange={e => update('canvasHeight', Number(e.target.value))}
            />
          </div>
        </div>

        <div className="field">
          <label>Preset Sizes</label>
          <div className="seg-control">
            {[
              { label: '1:1', w: 1080, h: 1080 },
              { label: '4:5', w: 1080, h: 1350 },
              { label: '16:9', w: 1920, h: 1080 },
              { label: '9:16', w: 1080, h: 1920 },
            ].map(({ label, w, h }) => (
              <button
                key={label}
                className={settings.canvasWidth === w && settings.canvasHeight === h ? 'active' : ''}
                onClick={() => { update('canvasWidth', w); update('canvasHeight', h) }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
