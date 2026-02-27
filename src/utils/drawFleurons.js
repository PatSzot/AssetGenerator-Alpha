// ── Per-mode accent colour for the stipple
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

// ── Target dot density: ~1 dot per (spacing)² of normalized [0,1] area.
// At 1.5× canvas scale (1620px for 1080p), spacing=0.005 → ~8px between dots.
// D = 1/0.005² = 40000
const D = 40000

function makeDot(dots, x, y) {
  if (x > 0.005 && x < 0.995 && y > 0.005 && y < 0.995) dots.push({ x, y })
}

// ── Round cluster (flower centres, berry bunches)
function circleCluster(dots, cx, cy, r) {
  const n = Math.ceil(D * Math.PI * r * r)
  for (let i = 0; i < n; i++) {
    const rad = Math.sqrt(Math.random()) * r
    const ang = Math.random() * Math.PI * 2
    makeDot(dots, cx + rad * Math.cos(ang), cy + rad * Math.sin(ang))
  }
}

// ── Natural leaf — bell-curve width profile, denser toward midrib
function leafCluster(dots, cx, cy, angle, len, wid) {
  const n = Math.ceil(D * len * wid * (Math.PI / 4) * 1.4)
  for (let i = 0; i < n; i++) {
    const t  = Math.random()
    const hw = (wid / 2) * Math.sin(t * Math.PI)
    const lx = (t - 0.5) * len
    const ly = (Math.random() * 2 - 1) * hw
    makeDot(dots,
      cx + lx * Math.cos(angle) - ly * Math.sin(angle),
      cy + lx * Math.sin(angle) + ly * Math.cos(angle),
    )
  }
}

// ── Flower head — central hub + radiating petals
function flowerHead(dots, cx, cy, size) {
  const petals = 4 + Math.floor(Math.random() * 4)   // 4–7
  circleCluster(dots, cx, cy, size * 0.22)
  for (let p = 0; p < petals; p++) {
    const a  = (p / petals) * Math.PI * 2 + (Math.random() - 0.5) * 0.5
    const pl = size * (0.42 + Math.random() * 0.28)
    const pw = pl  * (0.26 + Math.random() * 0.14)
    leafCluster(dots,
      cx + size * 0.33 * Math.cos(a),
      cy + size * 0.33 * Math.sin(a),
      a, pl, pw,
    )
  }
}

// ── Leaf spray — curved stem with alternating leaves branching off
function leafSpray(dots, cx, cy, angle, size) {
  const steps  = Math.floor(size / 0.007)
  let sx = cx - (size / 2) * Math.cos(angle)
  let sy = cy - (size / 2) * Math.sin(angle)
  let sa = angle + (Math.random() - 0.5) * 0.4
  let leafIdx  = 0

  for (let i = 0; i < steps; i++) {
    sa += (Math.random() - 0.5) * 0.1
    sx += Math.cos(sa) * 0.007
    sy += Math.sin(sa) * 0.007
    makeDot(dots, sx, sy)
    if (Math.random() < 0.45) makeDot(dots, sx + (Math.random() - 0.5) * 0.005, sy + (Math.random() - 0.5) * 0.005)

    // Alternating leaves every 4–6 steps
    if (i > 2 && i % (4 + Math.floor(Math.random() * 3)) === 0) {
      const side = leafIdx++ % 2 === 0 ? 1 : -1
      const la   = sa + side * (Math.PI / 2 + (Math.random() - 0.5) * 0.7)
      const ll   = size * (0.1 + Math.random() * 0.14)
      const lw   = ll   * (0.28 + Math.random() * 0.18)
      leafCluster(dots,
        sx + ll * 0.4 * Math.cos(la),
        sy + ll * 0.4 * Math.sin(la),
        la, ll, lw,
      )
    }
  }
  if (Math.random() < 0.65) circleCluster(dots, sx, sy, size * 0.055)
}

// ── Vine — dots along a curved (quadratic bezier) stem
function vine(dots, x1, y1, x2, y2) {
  const len = Math.hypot(x2 - x1, y2 - y1)
  if (len < 0.02) return
  const mx  = (x1 + x2) / 2
  const my  = (y1 + y2) / 2
  const nx  = -(y2 - y1) / len
  const ny  =  (x2 - x1) / len
  const bend = (Math.random() - 0.5) * len * 0.45
  const ctrlX = mx + nx * bend
  const ctrlY = my + ny * bend

  const steps = Math.floor(len / 0.007)
  for (let i = 0; i <= steps; i++) {
    const t  = i / steps
    const bx = (1-t)*(1-t)*x1 + 2*(1-t)*t*ctrlX + t*t*x2
    const by = (1-t)*(1-t)*y1 + 2*(1-t)*t*ctrlY + t*t*y2
    if (Math.random() < 0.82) makeDot(dots, bx, by)
    if (Math.random() < 0.32) makeDot(dots, bx + (Math.random()-0.5)*0.005, by + (Math.random()-0.5)*0.005)
  }
}

// ── Main entry — generate a random botanical stipple composition.
//    Returns dot positions normalised to [0, 1].
export function generateFleuronDots() {
  const dots  = []
  const nodes = []

  function place(x, y, type) {
    nodes.push({ x, y })
    const size = 0.09 + Math.random() * 0.1
    if      (type === 'flower') flowerHead(dots, x, y, size)
    else if (type === 'leaf')   leafSpray(dots, x, y, Math.random() * Math.PI, size * 2.2)
    else                        circleCluster(dots, x, y, size * 0.55)
  }

  // ── Guaranteed: 2–3 flower heads, one per quadrant so they're always spread out
  const QUADRANTS = [
    [0.08, 0.46, 0.08, 0.46],   // top-left
    [0.54, 0.92, 0.08, 0.46],   // top-right
    [0.08, 0.46, 0.54, 0.92],   // bottom-left
    [0.54, 0.92, 0.54, 0.92],   // bottom-right
  ]
  const numFlowers = 2 + Math.floor(Math.random() * 2)   // 2–3
  const quads = [...QUADRANTS].sort(() => Math.random() - 0.5)
  for (let i = 0; i < numFlowers; i++) {
    const [x0, x1, y0, y1] = quads[i]
    place(x0 + Math.random() * (x1 - x0), y0 + Math.random() * (y1 - y0), 'flower')
  }

  // ── Guaranteed: 1–2 leaf sprays anywhere on the canvas
  const numLeaves = 1 + Math.floor(Math.random() * 2)   // 1–2
  for (let i = 0; i < numLeaves; i++) {
    place(0.1 + Math.random() * 0.8, 0.1 + Math.random() * 0.8, 'leaf')
  }

  // ── Extra random elements (3–5) — edge-biased for natural overflow
  const numExtra = 3 + Math.floor(Math.random() * 3)
  for (let i = 0; i < numExtra; i++) {
    const edgeBias = Math.random() < 0.42
    const x = edgeBias
      ? (Math.random() < 0.5 ? 0.04 + Math.random() * 0.2 : 0.76 + Math.random() * 0.2)
      : 0.12 + Math.random() * 0.76
    const y = edgeBias
      ? (Math.random() < 0.5 ? 0.04 + Math.random() * 0.2 : 0.76 + Math.random() * 0.2)
      : 0.12 + Math.random() * 0.76
    const t = Math.random()
    place(x, y, t < 0.35 ? 'flower' : t < 0.75 ? 'leaf' : 'berry')
  }

  // ── Vine connections between nearby nodes
  nodes.forEach((n1, i) => {
    nodes.slice(i + 1).forEach(n2 => {
      const dist = Math.hypot(n2.x - n1.x, n2.y - n1.y)
      if (dist < 0.52 && Math.random() < 0.55) {
        vine(dots, n1.x, n1.y, n2.x, n2.y)
      }
    })
  })

  return dots
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

  const CHARS    = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
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
  const step = Math.round(SIZE * 0.006)  // 0.006 normalised spacing (~10 px at 1620 scale)

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
