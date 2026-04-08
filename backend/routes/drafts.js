const express = require('express')
const { createDraft, deleteCurrentDraft, getCurrentDraft, updateDraft } = require('../services/draftStore')

const router = express.Router()

function getUserId(req) {
  return req.headers['x-user-id'] || req.query.userId || req.body?.userId || ''
}

router.get('/current', async (req, res) => {
  try {
    const userId = getUserId(req)
    if (!userId) return res.status(400).json({ error: 'Missing user id.' })
    const draft = await getCurrentDraft(String(userId))
    return res.json(draft || null)
  } catch (error) {
    console.error('GET /api/drafts/current error:', error)
    return res.status(500).json({ error: 'Failed to fetch current draft.' })
  }
})

router.post('/', async (req, res) => {
  try {
    const userId = getUserId(req)
    if (!userId) return res.status(400).json({ error: 'Missing user id.' })
    const draft = await createDraft(String(userId), req.body)
    return res.status(201).json(draft)
  } catch (error) {
    console.error('POST /api/drafts error:', error)
    return res.status(500).json({ error: 'Failed to create draft.' })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const userId = getUserId(req)
    if (!userId) return res.status(400).json({ error: 'Missing user id.' })
    const draft = await updateDraft(String(userId), req.params.id, req.body)
    if (!draft) return res.status(404).json({ error: 'Draft not found.' })
    return res.json(draft)
  } catch (error) {
    console.error('PUT /api/drafts/:id error:', error)
    return res.status(500).json({ error: 'Failed to update draft.' })
  }
})

router.delete('/current', async (req, res) => {
  try {
    const userId = getUserId(req)
    if (!userId) return res.status(400).json({ error: 'Missing user id.' })
    const deleted = await deleteCurrentDraft(String(userId))
    return res.json({ success: deleted })
  } catch (error) {
    console.error('DELETE /api/drafts/current error:', error)
    return res.status(500).json({ error: 'Failed to delete current draft.' })
  }
})

module.exports = router
