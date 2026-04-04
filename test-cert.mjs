import { writeFileSync } from 'fs'
import handler from './api/certificate.js'

// Mock req/res
const req = {
  method: 'POST',
  body: {
    firstName:   'Jane',
    lastName:    'Doe',
    cohortDate:  'March 2026',
    cohortLevel: 'Intermediate',
  },
  query: {},
}

let statusCode
const headers = {}
let responseBuffer

const res = {
  setHeader: (k, v) => { headers[k] = v },
  status: (code) => { statusCode = code; return res },
  send: (buf) => { responseBuffer = buf },
  end: () => {},
  json: (obj) => { console.error('JSON response:', obj) },
}

// Point to Vite dev server
process.env.APP_URL = 'http://localhost:5173'
process.env.CHROMIUM_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

console.log('Generating certificate... (this takes ~15s)')
const start = Date.now()

await handler(req, res)

const elapsed = ((Date.now() - start) / 1000).toFixed(1)
console.log(`Done in ${elapsed}s — status ${statusCode}`)

if (responseBuffer) {
  const out = `${process.env.HOME}/Desktop/test-cert.jpg`
  writeFileSync(out, responseBuffer)
  console.log(`Saved to ${out}`)
} else {
  console.error('No image in response')
}
