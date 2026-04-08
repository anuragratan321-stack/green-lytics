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
  if (!userId) {
    throw new Error('You must be logged in to access reports.')
  }
  if (import.meta.env.DEV) {
    console.debug('[reportsApi] using user id', userId)
  }
  return {
    'Content-Type': 'application/json',
    'x-user-id': userId,
  }
}

export async function fetchReports() {
  try {
    const headers = await withUserHeaders()
    return await requestJson('/api/reports', { headers }, 'Failed to fetch reports.')
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch reports.')
  }
}

export async function fetchReportById(id) {
  if (!id) throw new Error('Report id is required.')
  try {
    const headers = await withUserHeaders()
    return await requestJson(`/api/reports/${encodeURIComponent(id)}`, { headers }, 'Failed to fetch report.')
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch report.')
  }
}

export async function createReport(payload) {
  try {
    const headers = await withUserHeaders()
    return await requestJson(
      '/api/reports',
      {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      },
      'Failed to create report.',
    )
  } catch (error) {
    throw new Error(error.message || 'Failed to create report.')
  }
}

export async function updateReport(id, payload) {
  if (!id) throw new Error('Report id is required.')
  try {
    const headers = await withUserHeaders()
    return await requestJson(
      `/api/reports/${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      },
      'Failed to update report.',
    )
  } catch (error) {
    throw new Error(error.message || 'Failed to update report.')
  }
}

export async function removeReport(id) {
  if (!id) throw new Error('Report id is required.')
  try {
    const headers = await withUserHeaders()
    return await requestJson(
      `/api/reports/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
        headers,
      },
      'Failed to delete report.',
    )
  } catch (error) {
    throw new Error(error.message || 'Failed to delete report.')
  }
}
