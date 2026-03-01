import { useRef } from 'react'
import { IJ_MODE_LABELS } from '../utils/drawIJoinedCanvas'
import './Sidebar.css'

const MODE_LABELS = {
  green:        'Green Paper',
  pink:         'Pink Paper',
  yellow:       'Yellow Paper',
  blue:         'Blue Paper',
  'dark-green': 'Dark Green',
  'dark-pink':  'Dark Pink',
  'dark-yellow':'Dark Yellow',
  'dark-blue':  'Dark Blue',
}

const TEMPLATES = [
  { value: 'quote',       label: 'Quote Block',  icon: '/Icon-BasicQuote.jpg'   },
  { value: 'richquote',   label: 'Rich Quote',   icon: '/Icon-RichQuote.jpg'    },
  { value: 'titlecard',   label: 'Title Card',   icon: '/Icon-TitleCard.jpg'    },
  { value: 'twitter',     label: 'Twitter Post', icon: '/Icon-Twitter.jpg'      },
  { value: 'certificate', label: 'Certificate',  icon: '/Icon-Certificate.jpg'  },
  { value: 'ijoined',     label: 'I Joined',     icon: '/Icon-IJoined.jpg'      },
]

const DIMS = [
  { w: 1080, h: 1080, label: '1080×1080', sub: 'Square' },
  { w: 1080, h: 1350, label: '1080×1350', sub: 'Portrait 4:5' },
  { w: 1080, h: 1920, label: '1080×1920', sub: 'Story 9:16' },
  { w: 1920, h: 1080, label: '1920×1080', sub: 'Landscape 16:9' },
]


export default function Sidebar({ settings, update, fontsReady, onExport, onExportAll, uiMode, onToggleUiMode, onProfileImageChange, onRichProfileImageChange, onRichCompanyLogoChange, onIJProfileImageChange, onRefleuron }) {
  const { dims } = settings
  const fileInputRef        = useRef(null)
  const richPhotoInputRef   = useRef(null)
  const richLogoInputRef    = useRef(null)
  const ijPhotoInputRef     = useRef(null)

  return (
    <div className="sidebar">
      {/* ── Header */}
      <div className="sidebar-header">
        <svg className="sidebar-logo" viewBox="0 0 784 252" fill="none">
          <path d="M111.828 65.6415V88.4663C101.564 72.0112 85.627 61.9258 65.9084 61.9258C23.7703 61.9258 0 92.9782 0 134.647C0 176.581 24.0404 208.695 66.4487 208.695C86.1672 208.695 101.834 198.609 111.828 182.154V204.979H144.782V65.6415H111.828ZM72.9315 181.093C48.8911 181.093 35.1152 159.064 35.1152 134.647C35.1152 110.76 48.621 89.7933 73.4717 89.7933C94.0006 89.7933 111.558 104.391 111.558 134.116C111.558 163.31 94.8109 181.093 72.9315 181.093Z" fill="currentColor"/>
          <path d="M173.137 65.6494V204.987H208.252V65.6494H173.137Z" fill="currentColor"/>
          <path d="M272.998 100.141V65.6386H237.883V204.976H272.998V125.355C272.998 104.919 287.314 96.691 300.82 96.691C308.653 96.691 316.757 98.8143 321.079 100.407V63.25C298.119 63.25 279.211 76.7856 272.998 100.141Z" fill="currentColor"/>
          <path d="M329.629 108.115C329.629 151.377 359.882 182.163 403.371 182.163C447.13 182.163 477.115 151.377 477.115 108.115C477.115 65.6507 447.13 35.3945 403.371 35.3945C359.882 35.3945 329.629 65.6507 329.629 108.115ZM441.997 108.115C441.997 135.187 427.141 154.561 403.371 154.561C379.33 154.561 364.744 135.187 364.744 108.115C364.744 82.1058 379.33 63.2621 403.371 63.2621C427.141 63.2621 441.997 82.1058 441.997 108.115Z" fill="currentColor"/>
          <path d="M575.086 61.9258C554.557 61.9258 537.81 73.869 528.896 92.9782V65.6415H493.781V251.425H528.896V180.031C538.891 197.282 557.529 208.695 577.247 208.695C615.604 208.695 642.345 179.235 642.345 137.035C642.345 92.7128 614.523 61.9258 575.086 61.9258ZM568.874 182.685C545.374 182.685 528.896 163.31 528.896 135.708C528.896 107.31 545.374 87.4047 568.874 87.4047C591.293 87.4047 607.23 107.841 607.23 136.77C607.23 163.841 591.293 182.685 568.874 182.685Z" fill="currentColor"/>
          <path d="M653.555 156.675C653.555 181.889 676.244 208.695 721.624 208.695C767.274 208.695 783.751 182.42 783.751 161.983C783.751 130.666 746.205 125.092 721.084 120.315C704.066 117.395 693.262 115.007 693.262 105.452C693.262 94.5706 705.417 87.6701 718.383 87.6701C735.94 87.6701 742.693 99.6133 743.233 112.353H778.349C778.349 91.6511 763.492 61.9258 717.572 61.9258C677.865 61.9258 658.147 83.9544 658.147 107.575C658.147 141.282 696.233 144.732 721.354 149.509C735.94 152.163 748.636 155.348 748.636 165.699C748.636 176.05 736.21 182.95 722.975 182.95C710.549 182.95 688.67 176.05 688.67 156.675H653.555Z" fill="currentColor"/>
          <path d="M191.339 48.6576C176.921 48.6576 166.578 38.4949 166.578 24.6368C166.578 10.7786 176.921 0 191.339 0C205.13 0 216.1 10.7786 216.1 24.6368C216.1 38.4949 205.13 48.6576 191.339 48.6576Z" fill="currentColor"/>
        </svg>
        <div className="sidebar-gtmgen" role="img" aria-label="GTMGen" />
      </div>

      {/* ── Body */}
      <div className="sidebar-body">

        {/* Template Type */}
        <div className="sec" style={{ display: 'flex', justifyContent: 'space-between' }}>
          Asset Type
          <span style={{ fontFamily: "'Saans Mono', 'DM Mono', monospace" }}>{TEMPLATES.length}</span>
        </div>
        <div className="asset-picker">
          {TEMPLATES.map(t => (
            <button
              key={t.value}
              className={`asset-card${settings.templateType === t.value ? ' active' : ''}`}
              onClick={() => update('templateType', t.value)}
            >
              <div className="asset-card-img">
                <img src={t.icon} alt={t.label} draggable={false} />
              </div>
              <span className="asset-card-name">{t.label}</span>
            </button>
          ))}
        </div>

        <div className="div" />

        {/* Content — Quote Block */}
        {settings.templateType === 'quote' && <>
          <div className="sec">Content</div>

          <div className="field">
            <label>Quote</label>
            <textarea
              value={settings.quote}
              onChange={e => update('quote', e.target.value)}
            />
          </div>

          <div className="field">
            <label>First Name</label>
            <input type="text" value={settings.firstName} onChange={e => update('firstName', e.target.value)} />
          </div>

          <div className="field">
            <label>Last Name</label>
            <input type="text" value={settings.lastName} onChange={e => update('lastName', e.target.value)} />
          </div>

          <div className="field">
            <label>Role &amp; Company</label>
            <input type="text" value={settings.roleCompany} onChange={e => update('roleCompany', e.target.value)} />
          </div>

          <div className="field">
            <label>CTA Text</label>
            <input type="text" value={settings.ctaText} onChange={e => update('ctaText', e.target.value)} />
          </div>

          <div className="div" />

          <div className="sec">Options</div>
          <div className="tog-row">
            <label>Show CTA pill</label>
            <label className="toggle">
              <input type="checkbox" checked={settings.showCTA} onChange={e => update('showCTA', e.target.checked)} />
              <div className="ttrack" />
              <div className="tthumb" />
            </label>
          </div>

          <div className="div" />
        </>}

        {/* Content — Rich Quote Block */}
        {settings.templateType === 'richquote' && <>
          <div className="sec">Quote</div>

          <div className="field">
            <label>Quote Text</label>
            <textarea
              value={settings.richQuoteText}
              onChange={e => update('richQuoteText', e.target.value)}
            />
          </div>

          <div className="div" />

          <div className="sec">Speaker</div>

          <div className="field">
            <label>First Name</label>
            <input type="text" value={settings.richFirstName} onChange={e => update('richFirstName', e.target.value)} />
          </div>

          <div className="field">
            <label>Last Name</label>
            <input type="text" value={settings.richLastName} onChange={e => update('richLastName', e.target.value)} />
          </div>

          <div className="field">
            <label>Title &amp; Company</label>
            <input type="text" value={settings.richRoleCompany} onChange={e => update('richRoleCompany', e.target.value)} />
          </div>

          <div className="field">
            <label>Headshot Photo</label>
            <input
              ref={richPhotoInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={e => {
                const file = e.target.files?.[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = ev => onRichProfileImageChange(ev.target.result)
                reader.readAsDataURL(file)
                e.target.value = ''
              }}
            />
            <button className="btn-upload" onClick={() => richPhotoInputRef.current?.click()}>
              {settings.richProfileImage ? '↺ Replace Photo' : '↑ Upload Photo'}
            </button>
            {settings.richProfileImage && (
              <button className="btn-clear-photo" onClick={() => onRichProfileImageChange(null)}>
                ✕ Remove photo
              </button>
            )}
          </div>

          <div className="div" />

          <div className="sec">Company Logo</div>

          <div className="field">
            <label>Logo (SVG or PNG, black/dark version)</label>
            <input
              ref={richLogoInputRef}
              type="file"
              accept="image/svg+xml,image/png,image/*"
              style={{ display: 'none' }}
              onChange={e => {
                const file = e.target.files?.[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = ev => onRichCompanyLogoChange(ev.target.result)
                reader.readAsDataURL(file)
                e.target.value = ''
              }}
            />
            <button className="btn-upload" onClick={() => richLogoInputRef.current?.click()}>
              {settings.richCompanyLogo ? '↺ Replace Logo' : '↑ Upload Logo'}
            </button>
            {settings.richCompanyLogo && (
              <button className="btn-clear-photo" onClick={() => onRichCompanyLogoChange(null)}>
                ✕ Remove logo
              </button>
            )}
          </div>

          <div className="div" />

          <div className="tog-row">
            <label>Flip Layout</label>
            <label className="toggle">
              <input type="checkbox" checked={settings.richFlip ?? false} onChange={e => update('richFlip', e.target.checked)} />
              <div className="ttrack" /><div className="tthumb" />
            </label>
          </div>

          <div className="div" />
        </>}

        {/* Content — Title Card */}
        {settings.templateType === 'titlecard' && <>
          <div className="sec">Content</div>

          <div className="tog-row">
            <label>Logo &amp; CTA</label>
            <label className="toggle">
              <input type="checkbox" checked={settings.tcShowLogo} onChange={e => { update('tcShowLogo', e.target.checked); update('tcShowCTA', e.target.checked) }} />
              <div className="ttrack" /><div className="tthumb" />
            </label>
          </div>

          <div className="tog-row">
            <label>Eyebrow</label>
            <label className="toggle">
              <input type="checkbox" checked={settings.tcShowEyebrow} onChange={e => update('tcShowEyebrow', e.target.checked)} />
              <div className="ttrack" /><div className="tthumb" />
            </label>
          </div>
          {settings.tcShowEyebrow && (
            <div className="field">
              <input type="text" value={settings.tcEyebrow} onChange={e => update('tcEyebrow', e.target.value)} />
            </div>
          )}

          <div className="tog-row">
            <label>Serif Title</label>
            <label className="toggle">
              <input type="checkbox" checked={settings.tcShowSerifTitle} onChange={e => update('tcShowSerifTitle', e.target.checked)} />
              <div className="ttrack" /><div className="tthumb" />
            </label>
          </div>
          {settings.tcShowSerifTitle && (
            <div className="field">
              <input type="text" value={settings.tcSerifTitle} onChange={e => update('tcSerifTitle', e.target.value)} />
            </div>
          )}

          <div className="tog-row">
            <label>Sans Title</label>
            <label className="toggle">
              <input type="checkbox" checked={settings.tcShowSansTitle} onChange={e => update('tcShowSansTitle', e.target.checked)} />
              <div className="ttrack" /><div className="tthumb" />
            </label>
          </div>
          {settings.tcShowSansTitle && (
            <div className="field">
              <input type="text" value={settings.tcSansTitle} onChange={e => update('tcSansTitle', e.target.value)} />
            </div>
          )}
          {settings.tcShowSansTitle && (
            <div className="tog-row">
              <label>Emphasize Sans</label>
              <label className="toggle">
                <input type="checkbox" checked={settings.tcEmphasizeSans ?? false} onChange={e => update('tcEmphasizeSans', e.target.checked)} />
                <div className="ttrack" /><div className="tthumb" />
              </label>
            </div>
          )}

          <div className="tog-row">
            <label>Subheadline</label>
            <label className="toggle">
              <input type="checkbox" checked={settings.tcShowSubheadline} onChange={e => update('tcShowSubheadline', e.target.checked)} />
              <div className="ttrack" /><div className="tthumb" />
            </label>
          </div>
          {settings.tcShowSubheadline && (
            <div className="field">
              <input type="text" value={settings.tcSubheadline} onChange={e => update('tcSubheadline', e.target.value)} />
            </div>
          )}

          <div className="tog-row">
            <label>Body</label>
            <label className="toggle">
              <input type="checkbox" checked={settings.tcShowBody} onChange={e => update('tcShowBody', e.target.checked)} />
              <div className="ttrack" /><div className="tthumb" />
            </label>
          </div>
          {settings.tcShowBody && (
            <div className="field">
              <textarea value={settings.tcBody} onChange={e => update('tcBody', e.target.value)} />
            </div>
          )}

          {settings.tcShowCTA && (
            <div className="field">
              <label>CTA Text</label>
              <input type="text" value={settings.tcCTAText} onChange={e => update('tcCTAText', e.target.value)} />
            </div>
          )}

          <div className="div" />
          <div className="sec">Decoration</div>

          <div className="tog-row">
            <label>Decoration</label>
            <label className="toggle">
              <input type="checkbox" checked={settings.showFloralia} onChange={e => update('showFloralia', e.target.checked)} />
              <div className="ttrack" />
              <div className="tthumb" />
            </label>
          </div>
          {settings.showFloralia && (
            <div style={{ paddingLeft: 12 }}>
              <div className="tog-row">
                <label>Fill style — {settings.decorationStyle === 'inverted' ? 'Negative' : 'Positive'}</label>
                <label className="toggle">
                  <input type="checkbox" checked={settings.decorationStyle === 'inverted'} onChange={e => update('decorationStyle', e.target.checked ? 'inverted' : 'fill')} />
                  <div className="ttrack" />
                  <div className="tthumb" />
                </label>
              </div>
              <button className="btn-all" onClick={onRefleuron} disabled={!fontsReady}>↻ Redecorate</button>
            </div>
          )}

          <div className="div" />
        </>}

        {/* Content — Certificate */}
        {settings.templateType === 'certificate' && <>
          <div className="sec">Recipient</div>

          <div className="field">
            <label>Full Name</label>
            <input type="text" value={settings.certFullName} onChange={e => update('certFullName', e.target.value)} />
          </div>

          <div className="div" />
          <div className="sec">Decoration</div>

          <div className="tog-row">
            <label>Decoration</label>
            <label className="toggle">
              <input type="checkbox" checked={settings.showFloralia} onChange={e => update('showFloralia', e.target.checked)} />
              <div className="ttrack" />
              <div className="tthumb" />
            </label>
          </div>
          {settings.showFloralia && (
            <div style={{ paddingLeft: 12 }}>
              <div className="tog-row">
                <label>Fill style — {settings.decorationStyle === 'inverted' ? 'Negative' : 'Positive'}</label>
                <label className="toggle">
                  <input type="checkbox" checked={settings.decorationStyle === 'inverted'} onChange={e => update('decorationStyle', e.target.checked ? 'inverted' : 'fill')} />
                  <div className="ttrack" />
                  <div className="tthumb" />
                </label>
              </div>
              <button className="btn-all" onClick={onRefleuron} disabled={!fontsReady}>↻ Redecorate</button>
            </div>
          )}

          <div className="div" />
        </>}

        {/* Content — Twitter Post */}
        {settings.templateType === 'twitter' && <>
          <div className="sec">Tweet Content</div>

          <div className="field">
            <label>Tweet Text</label>
            <textarea
              value={settings.tweetText}
              onChange={e => update('tweetText', e.target.value)}
            />
          </div>

          <div className="div" />

          <div className="sec">Author</div>

          <div className="field">
            <label>Name</label>
            <input type="text" value={settings.tweetAuthorName} onChange={e => update('tweetAuthorName', e.target.value)} />
          </div>

          <div className="field">
            <label>Handle</label>
            <input type="text" placeholder="@username" value={settings.tweetAuthorHandle} onChange={e => update('tweetAuthorHandle', e.target.value)} />
          </div>

          <div className="field">
            <label>Profile Photo</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={e => {
                const file = e.target.files?.[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = ev => onProfileImageChange(ev.target.result)
                reader.readAsDataURL(file)
                e.target.value = ''
              }}
            />
            <button className="btn-upload" onClick={() => fileInputRef.current?.click()}>
              {settings.tweetProfileImage ? '↺ Replace Photo' : '↑ Upload Photo'}
            </button>
            {settings.tweetProfileImage && (
              <button className="btn-clear-photo" onClick={() => onProfileImageChange(null)}>
                ✕ Remove photo
              </button>
            )}
          </div>

          <div className="field">
            <label>Date &amp; Time</label>
            <input type="text" placeholder="2:47 AM · Feb 24, 2026" value={settings.tweetDate} onChange={e => update('tweetDate', e.target.value)} />
          </div>

          <div className="div" />

          <div className="sec">Options</div>
          <div className="tog-row">
            <label>Show CTA pill</label>
            <label className="toggle">
              <input type="checkbox" checked={settings.showCTA} onChange={e => update('showCTA', e.target.checked)} />
              <div className="ttrack" />
              <div className="tthumb" />
            </label>
          </div>
          {settings.showCTA && (
            <div className="field">
              <label>CTA Text</label>
              <input type="text" value={settings.ctaText} onChange={e => update('ctaText', e.target.value)} />
            </div>
          )}
          <div className="tog-row">
            <label>Decoration</label>
            <label className="toggle">
              <input type="checkbox" checked={settings.showFloralia} onChange={e => update('showFloralia', e.target.checked)} />
              <div className="ttrack" />
              <div className="tthumb" />
            </label>
          </div>
          {settings.showFloralia && (
            <div style={{ paddingLeft: 12 }}>
              <div className="tog-row">
                <label>Fill style — {settings.decorationStyle === 'inverted' ? 'Negative' : 'Positive'}</label>
                <label className="toggle">
                  <input type="checkbox" checked={settings.decorationStyle === 'inverted'} onChange={e => update('decorationStyle', e.target.checked ? 'inverted' : 'fill')} />
                  <div className="ttrack" />
                  <div className="tthumb" />
                </label>
              </div>
              <button className="btn-all" onClick={onRefleuron} disabled={!fontsReady}>↻ Redecorate</button>
            </div>
          )}

          <div className="div" />
        </>}

        {/* Content — I Joined */}
        {settings.templateType === 'ijoined' && <>
          <div className="sec">Content</div>

          <div className="field">
            <label>Full Name</label>
            <input type="text" value={settings.ijName} onChange={e => update('ijName', e.target.value)} />
          </div>

          <div className="field">
            <label>Role</label>
            <input type="text" value={settings.ijRole} onChange={e => update('ijRole', e.target.value)} />
          </div>

          <div className="tog-row">
            <label>(We're Hiring)</label>
            <label className="toggle">
              <input type="checkbox" checked={settings.ijShowHiring} onChange={e => update('ijShowHiring', e.target.checked)} />
              <div className="ttrack" /><div className="tthumb" />
            </label>
          </div>

          <div className="div" />
          <div className="sec">Photo</div>

          <div className="field">
            <input
              ref={ijPhotoInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={e => {
                const file = e.target.files?.[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = ev => onIJProfileImageChange(ev.target.result)
                reader.readAsDataURL(file)
                e.target.value = ''
              }}
            />
            <button className="btn-upload" onClick={() => ijPhotoInputRef.current?.click()}>
              {settings.ijProfileImage ? '↺ Replace Photo' : '↑ Upload Photo'}
            </button>
            {settings.ijProfileImage && (
              <button className="btn-clear-photo" onClick={() => onIJProfileImageChange(null)}>
                ✕ Remove photo
              </button>
            )}
          </div>

          <div className="div" />
          <div className="sec">Color Variant</div>

          <div className="mode-grid mode-grid-wide">
            {Object.entries(IJ_MODE_LABELS).map(([key, label]) => (
              <button
                key={key}
                className={`mode-btn mode-ij-${key}${settings.ijMode === key ? ' active' : ''}`}
                onClick={() => update('ijMode', key)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="div" />
          <div className="sec">Decoration</div>

          <div className="tog-row">
            <label>Decoration</label>
            <label className="toggle">
              <input type="checkbox" checked={settings.showFloralia} onChange={e => update('showFloralia', e.target.checked)} />
              <div className="ttrack" />
              <div className="tthumb" />
            </label>
          </div>
          {settings.showFloralia && (
            <div style={{ paddingLeft: 12 }}>
              <div className="tog-row">
                <label>Fill style — {settings.decorationStyle === 'inverted' ? 'Negative' : 'Positive'}</label>
                <label className="toggle">
                  <input type="checkbox" checked={settings.decorationStyle === 'inverted'} onChange={e => update('decorationStyle', e.target.checked ? 'inverted' : 'fill')} />
                  <div className="ttrack" />
                  <div className="tthumb" />
                </label>
              </div>
              <button className="btn-all" onClick={onRefleuron} disabled={!fontsReady}>↻ Redecorate</button>
            </div>
          )}

          <div className="div" />
        </>}

        {/* Color Mode — hidden for Certificate and I Joined (have their own palettes) */}
        {settings.templateType !== 'certificate' && settings.templateType !== 'ijoined' && <>
          <div className="sec">Color Mode</div>
          {(() => {
            const modes = ['twitter', 'titlecard'].includes(settings.templateType)
              ? ['green', 'pink', 'yellow', 'blue', 'dark-green', 'dark-pink', 'dark-yellow', 'dark-blue']
              : ['green', 'pink', 'yellow', 'blue']
            return (
              <div className="mode-grid mode-grid-wide">
                {modes.map(m => (
                  <button
                    key={m}
                    className={`mode-btn mode-${m}${settings.colorMode === m ? ' active' : ''}`}
                    onClick={() => update('colorMode', m)}
                  >
                    {MODE_LABELS[m].split(' ')[0]}<br />{MODE_LABELS[m].split(' ')[1]}
                  </button>
                ))}
              </div>
            )
          })()}
          <div className="div" />
        </>}

        {/* Export Size — Certificate: 1080×1080 / 1080×1920 only · I Joined: 1920×1080 only */}
        <div className="sec">Export Size</div>
        <div className="dim-grid">
          {DIMS
            .filter(({ w, h }) => {
              if (settings.templateType === 'certificate') return w === 1080 && (h === 1080 || h === 1920)
              if (settings.templateType === 'ijoined')    return w === 1920 && h === 1080
              return true
            })
            .map(({ w, h, label, sub }) => (
              <button
                key={label}
                className={`dim-btn${dims.w === w && dims.h === h ? ' active' : ''}`}
                onClick={() => update('dims', { w, h })}
              >
                {label}<span className="dim-sub">{sub}</span>
              </button>
            ))}
        </div>

        <div className="div" />

        <button className="btn-ex" onClick={() => onExport()}>↓ Export JPEG</button>
        {settings.templateType === 'certificate'
          ? <button className="btn-all" onClick={() => { onExport(1080, 1080); setTimeout(() => onExport(1080, 1920), 350) }}>↓ Export Both Sizes</button>
          : settings.templateType === 'ijoined'
          ? null
          : <button className="btn-all" onClick={onExportAll}>↓ Export All 4 Sizes</button>
        }

      </div>

      {/* ── Footer: theme toggle */}
      <div className="sidebar-footer">
        <div className="tog-row">
          <label>Light Mode</label>
          <label className="toggle">
            <input
              type="checkbox"
              checked={uiMode === 'light'}
              onChange={onToggleUiMode}
            />
            <div className="ttrack" />
            <div className="tthumb" />
          </label>
        </div>
      </div>
    </div>
  )
}
