const express = require('express')
const { createReport, deleteReport, getReportById, getReportsByUser, updateReport } = require('../services/reportStore')

const router = express.Router()

function getUserId(req) {
  const fromHeader = req.headers['x-user-id']
  const fromQuery = req.query?.userId
  const fromBody = req.body?.userId
  const resolved = fromHeader || fromQuery || fromBody || ''
  return String(resolved).trim()
}

function requireUserId(req, res) {
  const userId = getUserId(req)
  if (!userId) {
    console.warn('Missing user id for request:', req.method, req.originalUrl)
    res.status(401).json({ error: 'Missing user id.' })
    return null
  }
  console.log('User ID used:', userId)
  return userId
}

function validateReportPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return 'Invalid payload.'
  if (!payload.scores || typeof payload.scores !== 'object') return 'scores is required.'
  const required = ['environmental', 'social', 'governance', 'total']
  const missing = required.some((key) => !Number.isFinite(Number(payload.scores[key])))
  if (missing) return 'scores must include environmental, social, governance, total.'
  return ''
}

router.get('/', async (req, res) => {
  try {
    const userId = requireUserId(req, res)
    if (!userId) return
    const reports = await getReportsByUser(userId)
    return res.json(reports)
  } catch (error) {
    console.error('GET /api/reports error:', error)
    return res.status(500).json({ error: 'Failed to fetch reports.' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const userId = requireUserId(req, res)
    if (!userId) return
    const report = await getReportById(userId, req.params.id)
    if (!report) return res.status(404).json({ error: 'Report not found.' })
    return res.json(report)
  } catch (error) {
    console.error('GET /api/reports/:id error:', error)
    return res.status(500).json({ error: 'Failed to fetch report.' })
  }
})

router.post('/', async (req, res) => {
  try {
    const userId = requireUserId(req, res)
    if (!userId) return
    const validationError = validateReportPayload(req.body)
    if (validationError) return res.status(400).json({ error: validationError })

    const created = await createReport(userId, req.body)
    return res.status(201).json(created)
  } catch (error) {
    console.error('POST /api/reports error:', error)
    return res.status(500).json({ error: 'Failed to create report.' })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const userId = requireUserId(req, res)
    if (!userId) return
    const validationError = validateReportPayload(req.body)
    if (validationError) return res.status(400).json({ error: validationError })

    const updated = await updateReport(userId, req.params.id, req.body)
    if (!updated) return res.status(404).json({ error: 'Report not found.' })
    return res.json(updated)
  } catch (error) {
    console.error('PUT /api/reports/:id error:', error)
    return res.status(500).json({ error: 'Failed to update report.' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const userId = requireUserId(req, res)
    if (!userId) return
    const deleted = await deleteReport(userId, req.params.id)
    if (!deleted) return res.status(404).json({ error: 'Report not found.' })
    return res.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/reports/:id error:', error)
    return res.status(500).json({ error: 'Failed to delete report.' })
  }
})

module.exports = router
