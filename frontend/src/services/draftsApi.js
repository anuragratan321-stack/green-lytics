import { getCurrentUser } from './auth'

const DRAFTS_API_BASE = 'http://localhost:5001/api/drafts'

async function withUserHeaders() {
  const user = await getCurrentUser().catch(() => null)
  if (!user?.id) throw new Error('You must be logged in to access drafts.')
  return {
    'Content-Type': 'application/json',
    'x-user-id': user.id,
  }
}

async function parseResponse(response, fallbackMessage) {
  const payload = await response.json().catch(() => null)
  if (!response.ok) throw new Error(payload?.error || fallbackMessage)
  return payload
}

export async function getCurrentDraft() {
  const headers = await withUserHeaders()
  const response = await fetch(`${DRAFTS_API_BASE}/current`, { headers })
  return parseResponse(response, 'Failed to fetch current draft.')
}

export async function createDraft(payload) {
  const headers = await withUserHeaders()
  const response = await fetch(DRAFTS_API_BASE, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload || {}),
  })
  return parseResponse(response, 'Failed to create draft.')
}

export async function updateDraft(id, payload) {
  const headers = await withUserHeaders()
  const response = await fetch(`${DRAFTS_API_BASE}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(payload || {}),
  })
  return parseResponse(response, 'Failed to update draft.')
}

export async function saveCurrentDraft(payload) {
  const current = await getCurrentDraft().catch(() => null)
  if (current?._id) return updateDraft(current._id, payload)
  return createDraft(payload)
}

export async function removeCurrentDraft() {
  const headers = await withUserHeaders()
  const response = await fetch(`${DRAFTS_API_BASE}/current`, { method: 'DELETE', headers })
  return parseResponse(response, 'Failed to delete current draft.')
}
