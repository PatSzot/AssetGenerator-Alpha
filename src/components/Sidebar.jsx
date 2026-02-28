import { useRef } from 'react'
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
  { value: 'quote',     label: 'Quote Block',  icon: '/Icon-BasicQuote.jpg'  },
  { value: 'richquote', label: 'Rich Quote',   icon: '/Icon-RichQuote.jpg'   },
  { value: 'titlecard', label: 'Title Card',   icon: '/Icon-TitleCard.jpg'   },
  { value: 'twitter',   label: 'Twitter Post', icon: '/Icon-Twitter.jpg'     },
]

const DIMS = [
  { w: 1080, h: 1080, label: '1080×1080', sub: 'Square' },
  { w: 1080, h: 1350, label: '1080×1350', sub: 'Portrait 4:5' },
  { w: 1080, h: 1920, label: '1080×1920', sub: 'Story 9:16' },
  { w: 1920, h: 1080, label: '1920×1080', sub: 'Landscape 16:9' },
]

function RotationDial({ value, onChange }) {
  const SIZE = 44, CENTER = 22, RADIUS = 16
  const angle = (value * Math.PI) / 180
  const dotX = CENTER + RADIUS * Math.sin(angle)
  const dotY = CENTER - RADIUS * Math.cos(angle)

  const handlePointerDown = (e) => {
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    const move = (ev) => {
      const dx = ev.clientX - (rect.left + CENTER)
      const dy = ev.clientY - (rect.top  + CENTER)
      let deg = Math.round(Math.atan2(dx, -dy) * 180 / Math.PI)
      if (deg < 0) deg += 360
      onChange(deg)
    }
    move(e)
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  return (
    <svg
      width={SIZE} height={SIZE}
      style={{ display: 'block', cursor: 'crosshair', userSelect: 'none', flexShrink: 0 }}
      onPointerDown={handlePointerDown}
    >
      <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke="currentColor" strokeOpacity={0.2} strokeWidth={1.5} />
      <line x1={CENTER} y1={CENTER} x2={dotX} y2={dotY} stroke="currentColor" strokeOpacity={0.4} strokeWidth={1.5} strokeLinecap="round" />
      <circle cx={dotX} cy={dotY} r={3.5} fill="currentColor" />
    </svg>
  )
}

export default function Sidebar({ settings, update, fontsReady, onExport, onExportAll, uiMode, onToggleUiMode, onProfileImageChange, onRichProfileImageChange, onRichCompanyLogoChange, onRefleuron }) {
  const { dims } = settings
  const fileInputRef        = useRef(null)
  const richPhotoInputRef   = useRef(null)
  const richLogoInputRef    = useRef(null)

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
        <svg className="sidebar-gtmgen" viewBox="0 0 622 112" fill="none">
          <path d="M52.8171 111.536C24.6681 111.536 -3.27838e-05 93.0726 -3.27838e-05 55.692C-3.27838e-05 20.5815 24.3654 -0.000465498 53.2711 -0.000465498C78.3932 -0.000465498 97.4619 13.9227 101.548 37.6828H82.4794C79.6039 24.2137 68.4049 15.436 53.1197 15.436C32.8404 15.436 17.8579 30.5699 17.8579 55.692C17.8579 79.4522 31.4783 95.9481 54.0278 95.9481C72.1884 95.9481 84.2954 84.295 85.0521 68.1018H49.7903V53.422H101.548V110.325H85.5061V94.2833C80.6633 104.423 67.3455 111.536 52.8171 111.536ZM137.053 110.325V16.6468H103.154V1.21024H188.508V16.6468H154.609V110.325H137.053ZM197.724 110.325V1.21024H219.668L251.903 74.912C256.14 84.5977 257.956 91.1052 257.956 91.1052C257.956 91.1052 259.621 84.5977 263.858 74.912L296.093 1.21024H317.281V110.325H299.726V47.3684C299.726 36.7748 300.331 29.9645 300.331 29.9645C300.331 29.9645 297.91 36.4721 293.823 46.1577L265.977 110.325H249.33L221.181 46.1577C216.943 36.4721 214.673 29.9645 214.673 29.9645C214.673 29.9645 215.127 36.7748 215.127 47.3684V110.325H197.724ZM389.425 111.536C381.152 111.536 373.434 110.325 366.271 107.904C359.208 105.381 353.003 101.8 347.656 97.1588C342.41 92.4168 338.273 86.7164 335.246 80.0575C332.32 73.3986 330.858 65.8317 330.858 57.3568C330.858 51.0006 331.766 44.9975 333.582 39.3475C335.499 33.5966 338.273 28.3503 341.905 23.6083C345.537 18.7655 349.977 14.5785 355.223 11.0472C360.469 7.51601 366.422 4.79191 373.081 2.87496C379.841 0.95801 387.256 -0.000465498 395.328 -0.000465498C400.271 -0.000465498 404.458 0.251765 407.889 0.756226C411.42 1.26069 414.447 1.81559 416.969 2.42094C419.592 2.92541 421.913 3.32898 423.931 3.63165C426.049 3.83344 428.118 3.6821 430.135 3.17764L433.768 34.8074H428.471C426.453 28.0476 423.628 22.6498 419.996 18.6142C416.465 14.5785 412.378 11.6526 407.737 9.83653C403.096 8.02047 398.254 7.11244 393.209 7.11244C388.063 7.11244 383.321 7.91957 378.983 9.53385C374.746 11.0472 371.013 13.2164 367.784 16.0414C364.556 18.8664 361.831 22.1958 359.612 26.0297C357.493 29.7627 355.828 33.9498 354.618 38.5908C353.508 43.131 352.953 47.8729 352.953 52.8166C352.953 59.5764 353.911 66.0335 355.828 72.1879C357.745 78.3424 360.469 83.841 364.001 88.6838C367.633 93.5266 371.921 97.3605 376.864 100.186C381.909 102.91 387.559 104.272 393.814 104.272C399.162 104.272 403.601 103.212 407.132 101.094C410.663 98.9748 413.186 96.5534 414.699 93.8293V73.8527C414.699 69.0098 413.135 65.5795 410.007 63.5616C406.88 61.5438 402.037 60.3835 395.479 60.0809V54.784H446.934V60.0809C443.1 60.3835 440.174 61.5942 438.156 63.713C436.239 65.8317 435.281 69.2116 435.281 73.8527V95.494C432.052 98.8235 427.966 101.699 423.023 104.12C418.18 106.441 412.832 108.257 406.981 109.569C401.23 110.88 395.378 111.536 389.425 111.536ZM489.36 111.536C481.793 111.536 475.083 109.972 469.232 106.844C463.38 103.616 458.84 99.1766 455.611 93.5266C452.484 87.8767 450.92 81.3187 450.92 73.8527C450.92 67.5973 451.929 61.9978 453.946 57.0541C456.065 52.1104 458.941 47.9233 462.573 44.493C466.306 40.9618 470.594 38.2881 475.436 36.4721C480.279 34.656 485.475 33.748 491.024 33.748C496.271 33.748 500.861 34.5551 504.796 36.1694C508.832 37.7837 512.161 40.0538 514.784 42.9796C517.509 45.9055 519.526 49.3358 520.838 53.2706C522.15 57.2054 522.704 61.5942 522.503 66.4371H466.81V60.5349H496.624C497.935 60.5349 499.045 60.2826 499.953 59.7782C500.861 59.2737 501.517 58.5675 501.921 57.6594C502.324 56.6505 502.526 55.4398 502.526 54.0273C502.526 50.0925 501.315 46.7126 498.894 43.8877C496.573 41.0627 493.345 39.6502 489.208 39.6502C486.383 39.6502 483.811 40.306 481.49 41.6176C479.17 42.8283 477.152 44.6443 475.436 47.0658C473.822 49.3863 472.511 52.2113 471.502 55.5407C470.594 58.7693 470.14 62.4518 470.14 66.5884C470.14 72.7428 471.199 78.2415 473.318 83.0843C475.436 87.9271 478.413 91.7106 482.247 94.4347C486.182 97.1588 490.873 98.5208 496.321 98.5208C501.87 98.5208 506.562 97.1083 510.396 94.2833C514.33 91.3575 517.155 87.4731 518.871 82.6303H524.167C522.351 92.0133 518.467 99.1766 512.514 104.12C506.562 109.064 498.843 111.536 489.36 111.536ZM559.871 50.2439C562.091 44.8966 565.572 40.8104 570.314 37.9855C575.157 35.1605 580.353 33.748 585.902 33.748C590.845 33.748 595.133 34.8074 598.765 36.9261C602.498 39.0448 605.374 42.0716 607.392 46.0064C609.41 49.8403 610.418 54.2796 610.418 59.3242V95.6454C610.418 98.1677 611.125 100.186 612.537 101.699C613.95 103.212 616.976 104.322 621.617 105.028V110.325H580.453V105.028C584.388 104.322 587.062 103.313 588.474 102.002C589.988 100.589 590.744 98.4704 590.744 95.6454V61.4429C590.744 56.6001 589.483 52.8671 586.961 50.2439C584.439 47.6207 581.008 46.3091 576.67 46.3091C574.249 46.3091 571.726 46.9649 569.103 48.2765C566.581 49.4872 564.412 51.4041 562.596 54.0273C560.779 56.5496 559.871 59.7782 559.871 63.713V95.6454C559.871 98.4704 560.628 100.589 562.142 102.002C563.655 103.313 566.379 104.322 570.314 105.028V110.325H528.998V105.028C533.539 104.322 536.515 103.313 537.927 102.002C539.441 100.589 540.197 98.4704 540.197 95.6454V51.7573C540.197 49.4367 539.592 47.6711 538.381 46.4604C537.171 45.2497 535.304 44.6443 532.782 44.6443H529.604V39.3475L554.575 34.202H559.871V50.2439Z" fill="currentColor"/>
        </svg>
      </div>

      {/* ── Body */}
      <div className="sidebar-body">

        {/* Template Type */}
        <div className="sec">Asset Type</div>
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
        </>}

        {/* Content — Title Card */}
        {settings.templateType === 'titlecard' && <>
          <div className="sec">Content</div>

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

          <div className="tog-row">
            <label>CTA</label>
            <label className="toggle">
              <input type="checkbox" checked={settings.tcShowCTA} onChange={e => update('tcShowCTA', e.target.checked)} />
              <div className="ttrack" /><div className="tthumb" />
            </label>
          </div>
          {settings.tcShowCTA && (
            <div className="field">
              <input type="text" value={settings.tcCTAText} onChange={e => update('tcCTAText', e.target.value)} />
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
              <div className="tog-row">
                <label>Rotate — {settings.decorationRotation ?? 0}°</label>
                <RotationDial
                  value={settings.decorationRotation ?? 0}
                  onChange={v => update('decorationRotation', v)}
                />
              </div>
              <button className="btn-all" onClick={onRefleuron} disabled={!fontsReady}>↻ Redecorate</button>
            </div>
          )}

          <div className="div" />
        </>}

        {/* Color Mode */}
        <div className="sec">Color Mode</div>
        {(() => {
          const modes = settings.templateType === 'twitter'
            ? ['green', 'pink', 'yellow', 'blue', 'dark-green', 'dark-pink', 'dark-yellow', 'dark-blue']
            : ['green', 'pink', 'yellow', 'blue']  // quote + richquote + titlecard: light modes only
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

        {/* Export Size */}
        <div className="sec">Export Size</div>
        <div className="dim-grid">
          {DIMS.map(({ w, h, label, sub }) => (
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
        <button className="btn-all" onClick={onExportAll}>↓ Export All 4 Sizes</button>

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
