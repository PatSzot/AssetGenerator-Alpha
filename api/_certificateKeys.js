/* global Buffer, process */
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

const KEY_PREFIX = 'cecert_v1'
const DEFAULT_ADMIN_PASSWORD = 'contentengineering26'

function base64UrlEncode(value) {
  return Buffer.from(value).toString('base64url')
}

function base64UrlDecode(value) {
  return Buffer.from(value, 'base64url').toString('utf8')
}

function signPayload(payload, secret) {
  return createHmac('sha256', secret).update(payload).digest('base64url')
}

function safeEqual(a, b) {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

export function getAdminPassword() {
  return process.env.CERTIFICATE_ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD
}

function getSigningSecret() {
  return (
    process.env.CERTIFICATE_API_KEY_SECRET ||
    process.env.CERTIFICATE_API_KEY ||
    getAdminPassword()
  )
}

export function generateCertificateApiKey() {
  const createdAt = new Date().toISOString()
  const payload = base64UrlEncode(JSON.stringify({
    v: 1,
    id: randomBytes(12).toString('hex'),
    createdAt,
  }))
  const signature = signPayload(payload, getSigningSecret())

  return {
    apiKey: `${KEY_PREFIX}.${payload}.${signature}`,
    createdAt,
  }
}

export function verifyCertificateApiKey(apiKey) {
  if (!apiKey || typeof apiKey !== 'string') return false

  const staticKey = process.env.CERTIFICATE_API_KEY
  if (staticKey && safeEqual(apiKey, staticKey)) return true

  const [prefix, payload, signature] = apiKey.split('.')
  if (prefix !== KEY_PREFIX || !payload || !signature) return false

  const expectedSignature = signPayload(payload, getSigningSecret())
  if (!safeEqual(signature, expectedSignature)) return false

  try {
    const parsed = JSON.parse(base64UrlDecode(payload))
    return parsed?.v === 1 && typeof parsed.createdAt === 'string'
  } catch {
    return false
  }
}
