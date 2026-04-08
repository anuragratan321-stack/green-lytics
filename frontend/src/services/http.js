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
  const requestOptions = {
    ...options,
    credentials: options.credentials ?? 'include',
  }

  try {
    if (import.meta.env.DEV) {
      console.debug('[http] request', requestOptions.method || 'GET', url)
    }
    const response = await fetch(url, requestOptions)
    const payload = await response.json().catch(() => null)
    if (import.meta.env.DEV) {
      console.debug('[http] response', response.status, url)
    }
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
