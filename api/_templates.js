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
    id: 'certificate',
    label: 'Certificate',
    description:
      'AirOps course completion certificate. Fixed 1920×1080. Two variants: classic (course completion) and award (special award).',
    fields: {
      certStyle:          { type: 'enum', values: ['classic', 'award'], description: 'classic = course completion; award = special award certificate.' },
      certFullName:       { type: 'string', required: true, description: 'Recipient full name.' },
      certCohortLevel:    { type: 'enum', values: ['Beginner', 'Intermediate', 'Advanced'], description: 'Course level (classic only).' },
      certGraduationDate: { type: 'string', description: 'Graduation date string, e.g. "March 2026".' },
      saRecipient:        { type: 'string', description: 'Recipient name (award variant).' },
      saTrack:            { type: 'string', description: 'Track name (award variant).' },
      saCertTitle:        { type: 'string', description: 'Certificate title (award variant).' },
      saCertLevel:        { type: 'string', description: 'Certificate level (award variant).' },
      saDate:             { type: 'string', description: 'Date (award variant).' },
    },
    colorModes: PAPER_MODES,
    dimensions: [{ w: 1920, h: 1080, label: 'Landscape (fixed)' }],
    defaultDims: { w: 1920, h: 1080 },
    variants: ['classic', 'award'],
    variantKey: 'certStyle',
  },
  {
    id: 'ijoined',
    label: 'I Joined Announcement',
    description:
      'New-hire / "I joined AirOps" announcement card with stippled headshot. Fixed 1920×1080.',
    fields: {
      ijName:         { type: 'string', required: true, description: 'Person\'s full name.' },
      ijRole:         { type: 'string', description: 'Job title.' },
      ijMode:         { type: 'enum', values: ['night', 'day', 'sunrise'], description: 'Color treatment.' },
      ijShowHiring:   { type: 'boolean', description: 'Show "we\'re hiring" flag.' },
      ijProfileImage: { type: 'image',  description: 'Stippled headshot (data URL).' },
    },
    colorModes: ['night', 'day', 'sunrise'],
    colorModeKey: 'ijMode',
    dimensions: [{ w: 1920, h: 1080, label: 'Landscape (fixed)' }],
    defaultDims: { w: 1920, h: 1080 },
    needsImages: ['headshot'],
  },
  {
    id: 'webinar',
    label: 'Webinar Promo',
    description:
      'Webinar / event promo with 1–4 speakers, each with headshot + company logo. Two variants: regular (numbered layout) and ced (Content Engineering Day style).',
    fields: {
      wbStyle:        { type: 'enum', values: ['regular', 'ced'], description: 'Layout variant.' },
      wbNumSpeakers:  { type: 'integer', description: 'Speaker count (1–4).' },
      wbEyebrow:      { type: 'string', description: 'Eyebrow text, e.g. "WEBINAR" or "EVENT".' },
      wbTitleClause:  { type: 'string', description: 'First clause of the title.' },
      wbMainTitle:    { type: 'string', required: true, description: 'Main title text.' },
      wbDate:         { type: 'string', description: 'Date + time. Newline-separated for multi-line display.' },
      wbSpeaker1Name: { type: 'string', description: 'Speaker 1 name.' },
      wbSpeaker1Role: { type: 'string', description: 'Speaker 1 title + company.' },
      wbSpeaker1Image:{ type: 'image',  description: 'Speaker 1 headshot.' },
      wbSpeaker1Logo: { type: 'image',  description: 'Speaker 1 company logo.' },
      wbSpeaker2Name: { type: 'string', description: 'Speaker 2 name (if any).' },
      wbSpeaker2Role: { type: 'string', description: 'Speaker 2 role.' },
      wbSpeaker2Image:{ type: 'image',  description: 'Speaker 2 headshot.' },
      wbSpeaker2Logo: { type: 'image',  description: 'Speaker 2 logo.' },
      wbSpeaker3Name: { type: 'string', description: 'Speaker 3 name.' },
      wbSpeaker3Role: { type: 'string', description: 'Speaker 3 role.' },
      wbSpeaker3Image:{ type: 'image',  description: 'Speaker 3 headshot.' },
      wbSpeaker3Logo: { type: 'image',  description: 'Speaker 3 logo.' },
      wbSpeaker4Name: { type: 'string', description: 'Speaker 4 name.' },
      wbSpeaker4Role: { type: 'string', description: 'Speaker 4 role.' },
      wbSpeaker4Image:{ type: 'image',  description: 'Speaker 4 headshot.' },
      wbSpeaker4Logo: { type: 'image',  description: 'Speaker 4 logo.' },
    },
    colorModes: PAPER_AND_DARK,
    dimensions: STANDARD_DIMS,
    defaultDims: { w: 1920, h: 1080 },
    variants: ['regular', 'ced'],
    variantKey: 'wbStyle',
    needsImages: ['speaker headshots', 'company logos'],
  },
  {
    id: 'roundtable',
    label: 'Roundtable',
    description:
      'Roundtable event card. Two variants: speaker (single host with photo) and evergreen (no photo, series branding).',
    fields: {
      rtStyle:        { type: 'enum', values: ['speaker', 'evergreen'], description: 'Layout variant.' },
      rtColor:        { type: 'enum', values: PAPER_MODES, description: 'Color treatment.' },
      rtPattern:      { type: 'enum', values: ['dots', 'flora', 'none'], description: 'Background pattern.' },
      rtTitle:        { type: 'string', description: 'Event title text.' },
      rtName:         { type: 'string', description: 'Host name (speaker variant).' },
      rtRoleCompany:  { type: 'string', description: 'Host role + company (speaker variant). Newlines allowed.' },
      rtProfileImage: { type: 'image',  description: 'Stippled host headshot (speaker variant).' },
      rtEvSerifLine1: { type: 'string', description: 'Evergreen line 1 (serif).' },
      rtEvSansText:   { type: 'string', description: 'Evergreen middle text (sans).' },
      rtEvSerifLine2: { type: 'string', description: 'Evergreen line 2 (serif).' },
      rtEvPillText:   { type: 'string', description: 'Evergreen pill label text.' },
    },
    colorModes: PAPER_MODES,
    colorModeKey: 'rtColor',
    dimensions: [{ w: 1080, h: 1080, label: '1:1 square (fixed)' }],
    defaultDims: { w: 1080, h: 1080 },
    variants: ['speaker', 'evergreen'],
    variantKey: 'rtStyle',
    needsImages: ['host headshot (speaker variant)'],
  },
  {
    id: 'welcome',
    label: 'Welcome Graphic',
    description:
      'Welcome / new-teammate announcement with stippled photo and name. Fixed 1080×1080.',
    fields: {
      welcomeColor:        { type: 'enum', values: PAPER_MODES, description: 'Color treatment.' },
      welcomePattern:      { type: 'enum', values: ['dots', 'flora', 'none'], description: 'Background pattern.' },
      welcomeWelcomeText:  { type: 'string', description: 'Top label, default "WELCOME TO".' },
      welcomeTitle:        { type: 'string', description: 'Big serif word, default "Welcome".' },
      welcomeName:         { type: 'string', required: true, description: 'Person\'s full name.' },
      welcomeRole:         { type: 'string', description: 'Job title.' },
      welcomeProfileImage: { type: 'image',  description: 'Stippled headshot (data URL).' },
    },
    colorModes: PAPER_MODES,
    colorModeKey: 'welcomeColor',
    dimensions: [{ w: 1080, h: 1080, label: '1:1 square (fixed)' }],
    defaultDims: { w: 1080, h: 1080 },
    needsImages: ['headshot'],
  },
]

export const TEMPLATE_IDS = TEMPLATES.map(t => t.id)
export const TEMPLATE_BY_ID = Object.fromEntries(TEMPLATES.map(t => [t.id, t]))

export function getTemplate(id) {
  return TEMPLATE_BY_ID[id] || null
}
