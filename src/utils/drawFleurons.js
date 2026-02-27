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
// spacing = 0.013 → D ≈ 5900 dots / unit²
const D = 5900

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
  const steps  = Math.floor(size / 0.012)
  let sx = cx - (size / 2) * Math.cos(angle)
  let sy = cy - (size / 2) * Math.sin(angle)
  let sa = angle + (Math.random() - 0.5) * 0.4
  let leafIdx  = 0

  for (let i = 0; i < steps; i++) {
    sa += (Math.random() - 0.5) * 0.1
    sx += Math.cos(sa) * 0.012
    sy += Math.sin(sa) * 0.012
    makeDot(dots, sx, sy)
    if (Math.random() < 0.45) makeDot(dots, sx + (Math.random() - 0.5) * 0.009, sy + (Math.random() - 0.5) * 0.009)

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

  const steps = Math.floor(len / 0.012)
  for (let i = 0; i <= steps; i++) {
    const t  = i / steps
    const bx = (1-t)*(1-t)*x1 + 2*(1-t)*t*ctrlX + t*t*x2
    const by = (1-t)*(1-t)*y1 + 2*(1-t)*t*ctrlY + t*t*y2
    if (Math.random() < 0.82) makeDot(dots, bx, by)
    if (Math.random() < 0.32) makeDot(dots, bx + (Math.random()-0.5)*0.009, by + (Math.random()-0.5)*0.009)
  }
}

// ── Main entry — generate a random botanical stipple composition.
//    Returns dot positions normalised to [0, 1].
export function generateFleuronDots() {
  const dots  = []
  const nodes = []

  const numElements = 5 + Math.floor(Math.random() * 4)   // 5–8

  for (let i = 0; i < numElements; i++) {
    // Bias some elements toward edges / corners for natural overflow
    const edgeBias = Math.random() < 0.42
    const x = edgeBias
      ? (Math.random() < 0.5 ? 0.04 + Math.random() * 0.2 : 0.76 + Math.random() * 0.2)
      : 0.12 + Math.random() * 0.76
    const y = edgeBias
      ? (Math.random() < 0.5 ? 0.04 + Math.random() * 0.2 : 0.76 + Math.random() * 0.2)
      : 0.12 + Math.random() * 0.76
    nodes.push({ x, y })

    const type = Math.random()
    const size = 0.09 + Math.random() * 0.1

    if (type < 0.4) {
      flowerHead(dots, x, y, size)
    } else if (type < 0.82) {
      leafSpray(dots, x, y, Math.random() * Math.PI, size * 2.2)
    } else {
      circleCluster(dots, x, y, size * 0.55)   // berry cluster
    }
  }

  // Connect nearby nodes with vines
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
