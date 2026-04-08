import { BACKEND_BASE_URL } from '../config/env'

function toAbsoluteUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${BACKEND_BASE_URL}${normalizedPath}`
}

export async function requestJson(path, options = {}, fallbackMessage = 'Request failed.') {
  if (!BACKEND_BASE_URL) {
    throw new Error('Backend URL is not configured. Set VITE_BACKEND_URL in frontend environment.')
  }

  const url = toAbsoluteUrl(path)

  try {
    const response = await fetch(url, options)
    const payload = await response.json().catch(() => null)
    if (!response.ok) {
      throw new Error(payload?.error || fallbackMessage)
    }
    return payload
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error(fallbackMessage)
  }
}
