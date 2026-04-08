const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const aiRoute = require('./routes/ai.js')
const reportsRoute = require('./routes/reports.js')
const draftsRoute = require('./routes/drafts.js')

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5001

app.use(cors())
app.use(express.json())
app.use('/ai', aiRoute)
app.use('/api/reports', reportsRoute)
app.use('/api/drafts', draftsRoute)

app.get('/', (req, res) => {
  res.send('Backend is running')
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
