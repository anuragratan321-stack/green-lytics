const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const aiRoute = require('./routes/ai.js')
const reportsRoute = require('./routes/reports.js')
const draftsRoute = require('./routes/drafts.js')

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5001
const allowedOrigins = ['http://localhost:3000', 'http://localhost:5173', 'https://green-lytics.vercel.app']

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true)

      if (allowedOrigins.includes(origin)) {
        return callback(null, true)
      }

      return callback(new Error('Not allowed by CORS'))
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id'],
  }),
)
app.options('*', cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use((req, res, next) => {
  console.log('Incoming request:', req.method, req.url, req.headers.origin)
  next()
})

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
