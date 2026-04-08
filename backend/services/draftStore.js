const fs = require('fs/promises')
const path = require('path')
const { randomUUID } = require('crypto')

const DATA_DIR = path.join(__dirname, '..', 'data')
const DATA_FILE = path.join(DATA_DIR, 'drafts.json')

async function ensureDraftFile() {
  await fs.mkdir(DATA_DIR, { recursive: true })
  try {
    await fs.access(DATA_FILE)
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify([]), 'utf8')
  }
}

async function readDrafts() {
  await ensureDraftFile()
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

async function writeDrafts(drafts) {
  await ensureDraftFile()
  await fs.writeFile(DATA_FILE, JSON.stringify(drafts, null, 2), 'utf8')
}

function normalizeDraftPayload(payload = {}) {
  const now = new Date().toISOString()
  return {
    inputs: payload.inputs && typeof payload.inputs === 'object' ? payload.inputs : {},
    metadata: payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : {},
    updatedAt: now,
  }
}

async function getCurrentDraft(userId) {
  const drafts = await readDrafts()
  return drafts.find((item) => item.userId === userId && item.status === 'active') || null
}

async function createDraft(userId, payload) {
  const drafts = await readDrafts()
  const existingIndex = drafts.findIndex((item) => item.userId === userId && item.status === 'active')
  const now = new Date().toISOString()
  const next = {
    _id: randomUUID(),
    userId,
    status: 'active',
    createdAt: now,
    ...normalizeDraftPayload(payload),
  }

  if (existingIndex >= 0) {
    drafts[existingIndex] = { ...drafts[existingIndex], ...next, _id: drafts[existingIndex]._id, createdAt: drafts[existingIndex].createdAt }
  } else {
    drafts.push(next)
  }

  await writeDrafts(drafts)
  return existingIndex >= 0 ? drafts[existingIndex] : next
}

async function updateDraft(userId, id, payload) {
  const drafts = await readDrafts()
  const index = drafts.findIndex((item) => item.userId === userId && item._id === id && item.status === 'active')
  if (index < 0) return null

  drafts[index] = {
    ...drafts[index],
    ...normalizeDraftPayload(payload),
  }

  await writeDrafts(drafts)
  return drafts[index]
}

async function deleteCurrentDraft(userId) {
  const drafts = await readDrafts()
  const next = drafts.filter((item) => !(item.userId === userId && item.status === 'active'))
  if (next.length === drafts.length) return false
  await writeDrafts(next)
  return true
}

module.exports = {
  getCurrentDraft,
  createDraft,
  updateDraft,
  deleteCurrentDraft,
}
