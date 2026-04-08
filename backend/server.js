const express = require('express')
const dotenv = require('dotenv')
const aiRoute = require('./routes/ai.js')
const reportsRoute = require('./routes/reports.js')
const draftsRoute = require('./routes/drafts.js')

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5001
const allowedOrigins = ['http://localhost:3000', 'http://localhost:5173', 'https://green-lytics.vercel.app']
const envAllowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)
const allAllowedOrigins = [...allowedOrigins, ...envAllowedOrigins]

function normalizeOrigin(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\/+$/, '')
}

const allowedOriginsSet = new Set(allAllowedOrigins.map(normalizeOrigin))

function isAllowedOrigin(origin) {
  if (!origin) return true
  const normalized = normalizeOrigin(origin)
  if (allowedOriginsSet.has(normalized)) return true
  // Allow Vercel preview deployments for the same project.
  return /^https:\/\/green-lytics(?:-[a-z0-9-]+)?\.vercel\.app$/i.test(origin)
}

app.use((req, res, next) => {
  console.log('Incoming request:', req.method, req.url, req.headers.origin || 'no-origin')
  next()
})

app.use((req, res, next) => {
  const origin = req.headers.origin
  const allowed = isAllowedOrigin(origin)

  if (origin && allowed) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id, X-User-Id')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  if (req.method === 'OPTIONS') {
    if (!allowed) {
      return res.status(403).json({ error: 'Not allowed by CORS' })
    }
    return res.sendStatus(204)
  }

  if (origin && !allowed) {
    console.warn('Blocked CORS origin:', origin)
    return res.status(403).json({ error: 'Not allowed by CORS' })
  }

  return next()
})

app.use(express.json())

app.get('/', (req, res) => {
  res.send('Backend is working ✅')
})

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'green-lytics-backend' })
})

app.use('/api/reports', reportsRoute)
app.use('/api/drafts', draftsRoute)
app.use('/ai', aiRoute)

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

app.use((error, req, res, next) => {
  console.error('Server Error:', error.message)
  res.status(500).json({ error: error.message })
})

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error)
})

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
})

app.listen(PORT, () => {
  console.log('Server running on port', PORT)
})
