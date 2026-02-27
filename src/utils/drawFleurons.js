// ── Per-mode accent colour for the decoration dots
export const STIPPLE_COLORS = {
  'green':       '#80CC9F',
  'pink':        '#CC86C0',
  'yellow':      '#B8BD30',
  'blue':        '#8080CC',
  'dark-green':  '#70D494',
  'dark-pink':   '#D470C4',
  'dark-yellow': '#C0C040',
  'dark-blue':   '#9090D8',
}

// ── Fleuron font fill — render Floralia glyphs to an offscreen canvas,
//    sample filled pixels on a regular grid, return normalised [0,1] coords.
//    Must be called AFTER fonts are loaded (Floralia added to document.fonts).
export function generateFleuronFontDots() {
  const SIZE = 2000
  const oc  = document.createElement('canvas')
  oc.width  = SIZE
  oc.height = SIZE
  const ctx = oc.getContext('2d')

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, SIZE, SIZE)
  ctx.fillStyle    = '#000000'
  ctx.textBaseline = 'middle'
  ctx.textAlign    = 'center'

  const CHARS     = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numGlyphs = 1 + Math.floor(Math.random() * 2)  // 1 or 2

  for (let g = 0; g < numGlyphs; g++) {
    const char     = CHARS[Math.floor(Math.random() * CHARS.length)]
    const fontSize = numGlyphs === 1
      ? 1500 + Math.random() * 400   // 1500–1900 px for single glyph
      : 900  + Math.random() * 300   // 900–1200 px for paired glyphs
    ctx.font = `${fontSize}px Floralia`
    const cx = numGlyphs === 1
      ? SIZE * (0.4  + (Math.random() - 0.5) * 0.2)
      : SIZE * (0.28 + Math.random() * 0.44)
    const cy = numGlyphs === 1
      ? SIZE * (0.4  + (Math.random() - 0.5) * 0.2)
      : SIZE * (0.28 + Math.random() * 0.44)
    ctx.fillText(char, cx, cy)
  }

  const { data, width, height } = ctx.getImageData(0, 0, SIZE, SIZE)
  const dots = []
  const step = Math.round(SIZE * 0.006)  // 0.006 normalised spacing

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const idx = (y * width + x) * 4
      if (data[idx] < 128) {  // dark pixel = inside glyph shape
        dots.push({ x: x / width, y: y / height })
      }
    }
  }

  return dots
}
