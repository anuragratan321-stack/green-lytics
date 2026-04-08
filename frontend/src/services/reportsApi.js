import { getCurrentUser } from './auth'

const REPORTS_API_BASE = 'http://localhost:5001/api/reports'

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

async function parseResponse(response, fallbackMessage) {
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(payload?.error || fallbackMessage)
  }
  return payload
}

export async function fetchReports() {
  const headers = await withUserHeaders()
  const response = await fetch(REPORTS_API_BASE, { headers })
  return parseResponse(response, 'Failed to fetch reports.')
}

export async function fetchReportById(id) {
  if (!id) throw new Error('Report id is required.')
  const headers = await withUserHeaders()
  const response = await fetch(`${REPORTS_API_BASE}/${encodeURIComponent(id)}`, { headers })
  return parseResponse(response, 'Failed to fetch report.')
}

export async function createReport(payload) {
  const headers = await withUserHeaders()
  const response = await fetch(REPORTS_API_BASE, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })
  return parseResponse(response, 'Failed to create report.')
}

export async function updateReport(id, payload) {
  if (!id) throw new Error('Report id is required.')
  const headers = await withUserHeaders()
  const response = await fetch(`${REPORTS_API_BASE}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(payload),
  })
  return parseResponse(response, 'Failed to update report.')
}

export async function removeReport(id) {
  if (!id) throw new Error('Report id is required.')
  const headers = await withUserHeaders()
  const response = await fetch(`${REPORTS_API_BASE}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers,
  })
  return parseResponse(response, 'Failed to delete report.')
}
