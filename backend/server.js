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
const allowedOrigins = corsOriginRaw
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      callback(null, true)
      return
    }

    if (allowedOrigins.length === 0 && NODE_ENV !== 'production') {
      callback(null, true)
      return
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true)
      return
    }

    callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
}

app.use(cors(corsOptions))
app.use(express.json())

if (NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`)
    next()
  })
}

app.use('/ai', aiRoute)
app.use('/api/reports', reportsRoute)
app.use('/api/drafts', draftsRoute)

app.get('/', (req, res) => {
  res.send('Backend is running')
})

app.use((error, req, res, next) => {
  if (NODE_ENV !== 'production') {
    console.error('Unhandled server error:', error)
  }
  res.status(500).json({ error: 'Something went wrong.' })
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} (${NODE_ENV})`)
})
