const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors')
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

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true)
    }

    const normalizedOrigin = normalizeOrigin(origin)
    if (allowedOriginsSet.has(normalizedOrigin)) {
      return callback(null, true)
    }

    console.warn('Blocked CORS origin:', origin)
    return callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'X-User-Id'],
}

app.use(cors(corsOptions))
app.options(/.*/, cors(corsOptions))

app.use(express.json())

app.use('/api/reports', reportsRoute)
app.use('/api/drafts', draftsRoute)
app.use('/ai', aiRoute)

app.get('/', (req, res) => {
  res.send('Backend is running')
})

app.use((error, req, res, next) => {
  console.error('Server Error:', error.message)
  res.status(500).json({ error: error.message })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
