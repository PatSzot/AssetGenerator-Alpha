/**
 * Template registry — single source of truth for /api/templates and /api/screenshot.
 *
 * Each entry describes:
 *   id              — slug matching the URL path (`/quote`, `/richquote`, etc.)
 *   label           — human label
 *   description     — what this template is for (used by Betty's Claude tool)
 *   fields          — settings keys this template uses, with types and descriptions
 *   colorModes      — allowed `colorMode` values (or `ijMode` / `welcomeColor` for those templates)
 *   colorModeKey    — which settings key drives color (default: `colorMode`)
 *   dimensions      — allowed { w, h, label } presets
 *   defaultDims     — fallback dims if caller doesn't specify
 *   variants        — optional sub-style enum (e.g. certificate.classic vs award)
 *   variantKey      — settings key that selects the variant
 *   needsImages     — image fields this template uses (for documentation)
 */

const STANDARD_DIMS = [
  { w: 1080, h: 1080, label: '1:1 square' },
  { w: 1080, h: 1350, label: '4:5 portrait' },
  { w: 1080, h: 1920, label: '9:16 story' },
  { w: 1920, h: 1080, label: '16:9 landscape' },
]

const PAPER_MODES = ['green', 'pink', 'yellow', 'blue', 'teal']
const PAPER_AND_DARK = [...PAPER_MODES, 'dark-green', 'dark-pink', 'dark-yellow', 'dark-blue']

// NOTE: This registry currently ships only templates that render correctly
// through the Satori /api/render endpoint. Puppeteer-based templates
// (certificate, ijoined, webinar, roundtable, welcome) are temporarily
// removed until the headless-Chromium path is stable on Vercel.

export const TEMPLATES = [
  {
    id: 'quote',
    label: 'Quote Card',
    description:
      'Simple quote card for testimonials and standalone quotes. No headshot. Use for press pulls or anonymous quotes.',
    fields: {
      quote:       { type: 'string', required: true, description: 'The quote text (include curly quotes if you want them shown).' },
      firstName:   { type: 'string', description: 'First name of the person quoted.' },
      lastName:    { type: 'string', description: 'Last name of the person quoted.' },
      roleCompany: { type: 'string', description: 'Job title and company, e.g. "CMO, Carta".' },
      ctaText:     { type: 'string', description: 'Optional call-to-action text.' },
      showCTA:     { type: 'boolean', description: 'Whether to display the CTA.' },
    },
    colorModes: PAPER_MODES,
    dimensions: STANDARD_DIMS,
    defaultDims: { w: 1080, h: 1080 },
  },
  {
    id: 'richquote',
    label: 'Rich Quote (Customer Story)',
    description:
      'Customer story card with a stippled headshot, company logo, name, role, and quote. Use for case studies, customer features, and storytelling moments where you have a photo.',
    fields: {
      richQuoteText:   { type: 'string', required: true, description: 'The quote text.' },
      richFirstName:   { type: 'string', required: true, description: 'First name.' },
      richLastName:    { type: 'string', description: 'Last name.' },
      richRoleCompany: { type: 'string', description: 'Job title and company, e.g. "VP Marketing, Webflow".' },
      richProfileImage:{ type: 'image',  description: 'Headshot (data URL). Betty stipples it server-side first.' },
      richCompanyLogo: { type: 'image',  description: 'Company logo (data URL or path).' },
      richFlip:        { type: 'boolean', description: 'Flip layout left/right.' },
    },
    colorModes: PAPER_MODES,
    dimensions: STANDARD_DIMS,
    defaultDims: { w: 1080, h: 1080 },
    needsImages: ['headshot', 'company logo'],
  },
  {
    id: 'titlecard',
    label: 'Title Card',
    description:
      'Title / headline / announcement card. Eyebrow label, serif + sans title pair, optional subhead and body. Use for social headers, event announcements, branded title slides.',
    fields: {
      tcEyebrow:         { type: 'string',  description: 'Small uppercase label above the headline.' },
      tcShowEyebrow:     { type: 'boolean', description: 'Show eyebrow.' },
      tcSerifTitle:      { type: 'string',  required: true, description: 'Line 1 of headline (serif).' },
      tcShowSerifTitle:  { type: 'boolean', description: 'Show serif title line.' },
      tcSansTitle:       { type: 'string',  description: 'Line 2 of headline (sans).' },
      tcShowSansTitle:   { type: 'boolean', description: 'Show sans title line.' },
      tcEmphasizeSans:   { type: 'boolean', description: 'Highlight sans line with pill background.' },
      tcSubheadline:     { type: 'string',  description: 'Subheadline / dateline.' },
      tcShowSubheadline: { type: 'boolean', description: 'Show subheadline.' },
      tcBody:            { type: 'string',  description: 'Optional body copy.' },
      tcShowBody:        { type: 'boolean', description: 'Show body copy.' },
      tcCTAText:         { type: 'string',  description: 'CTA text.' },
      tcShowCTA:         { type: 'boolean', description: 'Show CTA.' },
      tcShowLogo:        { type: 'boolean', description: 'Show AirOps logo.' },
    },
    colorModes: PAPER_AND_DARK,
    dimensions: STANDARD_DIMS,
    defaultDims: { w: 1080, h: 1080 },
  },
  {
    id: 'twitter',
    label: 'Tweet Card',
    description:
      'Tweet/X post screenshot card with author photo, handle, and date. Use for sharing tweets as branded social posts.',
    fields: {
      tweetText:        { type: 'string', required: true, description: 'Tweet body text.' },
      tweetAuthorName:  { type: 'string', description: 'Display name.' },
      tweetAuthorHandle:{ type: 'string', description: 'Handle including @ symbol.' },
      tweetDate:        { type: 'string', description: 'Date/time string as shown in the tweet.' },
      tweetProfileImage:{ type: 'image',  description: 'Stippled author headshot (data URL).' },
    },
    colorModes: PAPER_AND_DARK,
    dimensions: STANDARD_DIMS,
    defaultDims: { w: 1080, h: 1080 },
    needsImages: ['author headshot'],
  },
  {
    id: 'dataviz',
    label: 'Data Visualization',
    description:
      'Chart / data viz card: bar, line, pie, table, ranked list, or stat card. Use for showcasing numbers, trends, comparisons, and benchmarks.',
    fields: {
      type:     { type: 'enum', values: ['bar', 'line', 'pie', 'table', 'ranked', 'stat'], required: true, description: 'Chart type. bar=vertical bars; line=line chart with fill; ranked=horizontal ranking bars; stat=single big metric; table=data table; pie=pie chart.' },
      title:    { type: 'string', description: 'Chart headline.' },
      subtitle: { type: 'string', description: 'Source / attribution line.' },
      subcopy:  { type: 'string', description: 'Body copy below the title.' },
      data:     { type: 'string', required: true, description: 'Chart data. For bar/line/ranked/pie: "Label: Value" pairs, one per line. For stat: "Value: 42%\\nLabel: Conversion Rate\\nSub: vs 28%". For table: CSV with header row.' },
      layout:   { type: 'enum', values: ['standard', 'split'], description: 'Layout. standard=full width chart, split=two-column stat panel + chart. Default: standard.' },
    },
    colorModes: ['light', 'dark', 'lime', 'midnight'],
    dimensions: STANDARD_DIMS,
    defaultDims: { w: 1080, h: 1080 },
  },
]

export const TEMPLATE_IDS = TEMPLATES.map(t => t.id)
export const TEMPLATE_BY_ID = Object.fromEntries(TEMPLATES.map(t => [t.id, t]))

export function getTemplate(id) {
  return TEMPLATE_BY_ID[id] || null
}
