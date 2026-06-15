/* global Buffer, process */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

async function readJsonBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const raw = Buffer.concat(chunks).toString('utf8')
  return raw ? JSON.parse(raw) : {}
}

function createVercelLikeResponse(res) {
  return {
    setHeader: (key, value) => res.setHeader(key, value),
    status(code) {
      res.statusCode = code
      return this
    },
    send(body) {
      if (!res.statusCode) res.statusCode = 200
      res.end(body)
      return this
    },
    end() {
      if (!res.statusCode) res.statusCode = 200
      res.end()
      return this
    },
    json(body) {
      if (!res.statusCode) res.statusCode = 200
      if (!res.hasHeader('Content-Type')) res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(body))
      return this
    },
  }
}

function localApiRoutes() {
  return {
    name: 'local-api-routes',
    apply: 'serve',
    configureServer(server) {
      const route = (path, loadHandler) => {
        server.middlewares.use(path, async (req, res) => {
          try {
            const url = new URL(req.url || '/', `http://${req.headers.host}`)
            process.env.APP_URL ||= `http://${req.headers.host}`
            req.query = Object.fromEntries(url.searchParams.entries())
            req.body = req.method === 'POST' ? await readJsonBody(req) : {}
            const mod = await loadHandler()
            await mod.default(req, createVercelLikeResponse(res))
          } catch (error) {
            server.config.logger.error(error)
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: error.message }))
          }
        })
      }

      route('/api/api-key', () => import('./api/api-key.js'))
      route('/api/certificate', () => import('./api/certificate.js'))
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [localApiRoutes(), react()],
})
