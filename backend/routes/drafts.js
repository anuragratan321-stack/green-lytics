const express = require('express')
const { createDraft, deleteCurrentDraft, getCurrentDraft, updateDraft } = require('../services/draftStore')

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

router.get('/current', async (req, res) => {
  try {
    const userId = requireUserId(req, res)
    if (!userId) return
    const draft = await getCurrentDraft(userId)
    return res.json(draft || null)
  } catch (error) {
    console.error('GET /api/drafts/current error:', error)
    return res.status(500).json({ error: 'Failed to fetch current draft.' })
  }
})

router.post('/', async (req, res) => {
  try {
    const userId = requireUserId(req, res)
    if (!userId) return
    const draft = await createDraft(userId, req.body)
    return res.status(201).json(draft)
  } catch (error) {
    console.error('POST /api/drafts error:', error)
    return res.status(500).json({ error: 'Failed to create draft.' })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const userId = requireUserId(req, res)
    if (!userId) return
    const draft = await updateDraft(userId, req.params.id, req.body)
    if (!draft) return res.status(404).json({ error: 'Draft not found.' })
    return res.json(draft)
  } catch (error) {
    console.error('PUT /api/drafts/:id error:', error)
    return res.status(500).json({ error: 'Failed to update draft.' })
  }
})

router.delete('/current', async (req, res) => {
  try {
    const userId = requireUserId(req, res)
    if (!userId) return
    const deleted = await deleteCurrentDraft(userId)
    return res.json({ success: deleted })
  } catch (error) {
    console.error('DELETE /api/drafts/current error:', error)
    return res.status(500).json({ error: 'Failed to delete current draft.' })
  }
})

module.exports = router
