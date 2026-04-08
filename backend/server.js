const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const aiRoute = require('./routes/ai.js')
const reportsRoute = require('./routes/reports.js')
const draftsRoute = require('./routes/drafts.js')

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5001
const NODE_ENV = process.env.NODE_ENV || 'development'
const corsOriginRaw = process.env.CORS_ORIGIN || ''
const defaultAllowedOrigins = ['http://localhost:3000', 'http://localhost:5173', 'https://green-lytics.vercel.app']
const envAllowedOrigins = corsOriginRaw
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)
const allowedOrigins = Array.from(new Set([...defaultAllowedOrigins, ...envAllowedOrigins]))

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      callback(null, true)
      return
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true)
      return
    }

    callback(new Error('CORS not allowed'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id'],
}

app.use(cors(corsOptions))
app.options(/.*/, cors(corsOptions))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

if (NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`)
    next()
  })
}

app.use('/api/reports', reportsRoute)
app.use('/api/drafts', draftsRoute)
app.use('/ai', aiRoute)

app.get('/', (req, res) => {
  res.send('Backend is running')
})

app.use((error, req, res, next) => {
  console.error('Server Error:', error.message)
  res.status(500).json({ error: error.message || 'Something went wrong.' })
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} (${NODE_ENV})`)
})
