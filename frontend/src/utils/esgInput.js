export const ESG_INPUT_STORAGE_KEY = 'draftAnalysis'

function createSectionFromFields(fields) {
  const values = {}
  const skipped = {}

  fields.forEach((field) => {
    values[field] = ''
    skipped[field] = false
  })

  return { values, skipped }
}

export function getESGInputStore() {
  try {
    const raw = localStorage.getItem(ESG_INPUT_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed
  } catch {
    return {}
  }
}

export function getESGSectionState(sectionKey, fields, options = {}) {
  const fallback = createSectionFromFields(fields)
  if (options.mode === 'create') return fallback

  const store = getESGInputStore()
  const section = store[sectionKey]

  if (!section || typeof section !== 'object') {
    return fallback
  }

  const values = { ...fallback.values, ...(section.values || {}) }
  const skipped = { ...fallback.skipped, ...(section.skipped || {}) }

  return { values, skipped }
}

export function setESGSectionState(sectionKey, state) {
  const store = getESGInputStore()
  localStorage.setItem(
    ESG_INPUT_STORAGE_KEY,
    JSON.stringify({
      ...store,
      [sectionKey]: state,
    }),
  )
}

export function clearESGInputDraft() {
  localStorage.removeItem(ESG_INPUT_STORAGE_KEY)
}
