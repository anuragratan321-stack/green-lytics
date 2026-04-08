import { getCurrentUser, waitForSessionUser } from './auth'
import { requestJson } from './http'

async function resolveUserId() {
  const sessionUser = await waitForSessionUser({ timeoutMs: 3200, intervalMs: 120 }).catch(() => null)
  if (sessionUser?.id) return sessionUser.id

  const currentUser = await getCurrentUser().catch(() => null)
  if (currentUser?.id) return currentUser.id

  return ''
}

async function withUserHeaders() {
  const userId = await resolveUserId()
  if (!userId) throw new Error('You must be logged in to access drafts.')
  if (import.meta.env.DEV) {
    console.debug('[draftsApi] using user id', userId)
  }
  return {
    'Content-Type': 'application/json',
    'x-user-id': userId,
  }
}

export async function getCurrentDraft() {
  try {
    const headers = await withUserHeaders()
    return await requestJson('/api/drafts/current', { headers }, 'Failed to fetch current draft.')
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch current draft.')
  }
}

export async function createDraft(payload) {
  try {
    const headers = await withUserHeaders()
    return await requestJson(
      '/api/drafts',
      {
        method: 'POST',
        headers,
        body: JSON.stringify(payload || {}),
      },
      'Failed to create draft.',
    )
  } catch (error) {
    throw new Error(error.message || 'Failed to create draft.')
  }
}

export async function updateDraft(id, payload) {
  try {
    const headers = await withUserHeaders()
    return await requestJson(
      `/api/drafts/${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload || {}),
      },
      'Failed to update draft.',
    )
  } catch (error) {
    throw new Error(error.message || 'Failed to update draft.')
  }
}

export async function saveCurrentDraft(payload) {
  const current = await getCurrentDraft().catch(() => null)
  if (current?._id) return updateDraft(current._id, payload)
  return createDraft(payload)
}

export async function removeCurrentDraft() {
  try {
    const headers = await withUserHeaders()
    return await requestJson(
      '/api/drafts/current',
      { method: 'DELETE', headers },
      'Failed to delete current draft.',
    )
  } catch (error) {
    throw new Error(error.message || 'Failed to delete current draft.')
  }
}
