import { getCurrentUser } from './auth'
import { requestJson } from './http'

async function withUserHeaders() {
  const user = await getCurrentUser().catch(() => null)
  if (!user?.id) {
    throw new Error('You must be logged in to access reports.')
  }
  return {
    'Content-Type': 'application/json',
    'x-user-id': user.id,
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
