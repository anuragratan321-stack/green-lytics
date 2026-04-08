const express = require('express')
const dotenv = require('dotenv')
const aiRoute = require('./routes/ai.js')
const reportsRoute = require('./routes/reports.js')
const draftsRoute = require('./routes/drafts.js')

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5001
const allowedOrigins = ['http://localhost:3000', 'http://localhost:5173', 'https://green-lytics.vercel.app']

app.use(
  (req, res, next) => {
    const origin = req.headers.origin

    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin)
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    // Note: x-user-id is required by reports/drafts endpoints.
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id')
    res.setHeader('Access-Control-Allow-Credentials', 'true')

    if (req.method === 'OPTIONS') {
      return res.sendStatus(200)
    }

    console.log('Incoming request:', req.method, req.url, req.headers.origin)
    next()
  },
)

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
