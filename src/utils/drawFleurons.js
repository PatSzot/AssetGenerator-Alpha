// ── Colour tints — one per colour mode (RGB arrays)
export const FLEURON_TINTS = {
  'green':       [128, 204, 159],
  'pink':        [204, 134, 192],
  'yellow':      [188, 191,  53],
  'blue':        [128, 128, 204],
  'dark-green':  [112, 212, 148],
  'dark-pink':   [212, 112, 196],
  'dark-yellow': [196, 196,  64],
  'dark-blue':   [144, 144, 216],
}

// ── Canvas dimensions (matches original SVG viewBox)
const W = 987, H = 1000

// ── Generate an array of {x,y} dot positions for one random fleuron.
//    Algorithm: recursive branching vines + leaf clusters at nodes/tips.
export function generateFleuronDots() {
  const dots = []

  function dot(x, y) {
    if (x > 2 && x < W - 2 && y > 2 && y < H - 2) dots.push({ x, y })
  }

  // Dense elliptical leaf cluster at (cx, cy) oriented at angle
  function leafCluster(cx, cy, angle, size) {
    const n = Math.floor(40 + Math.random() * size * 120)
    for (let i = 0; i < n; i++) {
      const r  = Math.sqrt(Math.random())
      const th = Math.random() * Math.PI * 2
      const lx = r * size * 55 * Math.cos(th)
      const ly = r * size * 90 * Math.sin(th)
      dot(
        cx + lx * Math.cos(angle) - ly * Math.sin(angle) + (Math.random() - 0.5) * 5,
        cy + lx * Math.sin(angle) + ly * Math.cos(angle) + (Math.random() - 0.5) * 5,
      )
    }
  }

  // Recursive vine branch
  function growBranch(x, y, angle, depth, length) {
    if (depth > 3 || length < 20) return
    const steps = Math.floor(length / 7)
    let cx = x, cy = y, ca = angle

    for (let i = 0; i < steps; i++) {
      ca += (Math.random() - 0.5) * 0.28         // gentle organic curve
      cx += Math.cos(ca) * 11
      cy += Math.sin(ca) * 11

      // Core vine dot
      dot(cx, cy)
      // Second dot for vine width
      if (Math.random() < 0.55) dot(cx + (Math.random() - 0.5) * 9, cy + (Math.random() - 0.5) * 9)
      // Occasional stray dot (texture)
      if (Math.random() < 0.18) dot(cx + (Math.random() - 0.5) * 16, cy + (Math.random() - 0.5) * 16)

      // Spawn sub-branch
      if (depth < 3 && Math.random() < 0.036) {
        growBranch(
          cx, cy,
          ca + (Math.random() - 0.5) * Math.PI * 0.85,
          depth + 1,
          length * (0.32 + Math.random() * 0.42),
        )
      }

      // Inline leaf cluster along vine
      if (Math.random() < 0.022) {
        leafCluster(cx, cy, ca + (Math.random() - 0.5) * 0.6, 0.3 + Math.random() * 0.7)
      }
    }

    // Leaf cluster at branch tip (most branches end in a leaf)
    if (Math.random() < 0.78) {
      leafCluster(cx, cy, ca, 0.45 + Math.random() * 0.9)
    }
  }

  // ── Main stems
  const numStems = 3 + Math.floor(Math.random() * 4)   // 3–6
  for (let s = 0; s < numStems; s++) {
    // Bias start positions toward canvas edges for natural corner-to-corner flow
    const edgeBias = Math.random() < 0.55
    const sx = edgeBias
      ? (Math.random() < 0.5 ? Math.random() * 180 : W - Math.random() * 180)
      : Math.random() * W
    const sy = edgeBias
      ? (Math.random() < 0.5 ? Math.random() * 180 : H - Math.random() * 180)
      : Math.random() * H
    growBranch(sx, sy, Math.random() * Math.PI * 2, 0, 320 + Math.random() * 480)
  }

  return dots
}

// ── Render a dot array onto an offscreen canvas in a given RGB colour
export function renderFleuronToCanvas(dots, tr, tg, tb) {
  const oc  = document.createElement('canvas')
  oc.width  = W
  oc.height = H
  const ctx = oc.getContext('2d')
  ctx.fillStyle = `rgb(${tr},${tg},${tb})`

  // Batch all dots into a single path for performance
  ctx.beginPath()
  const R = 1.6
  dots.forEach(({ x, y }) => {
    ctx.moveTo(x + R, y)
    ctx.arc(x, y, R, 0, Math.PI * 2)
  })
  ctx.fill()

  return oc
}

// ── Generate one random dot layout and render all 8 colour variants
export function generateAllFleuronCanvases() {
  const dots   = generateFleuronDots()
  const result = {}
  Object.entries(FLEURON_TINTS).forEach(([mode, [tr, tg, tb]]) => {
    result[mode] = renderFleuronToCanvas(dots, tr, tg, tb)
  })
  return result
}
