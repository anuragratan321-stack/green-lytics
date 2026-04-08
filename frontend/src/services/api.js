const AI_INSIGHTS_URL = 'http://localhost:5001/ai/suggestions'

function normalizeLines(value) {
  if (!value || typeof value !== 'string') return []
  return value
    .split('\n')
    .map((line) => line.replace(/^[-*•\d.)\s]+/, '').trim())
    .filter(Boolean)
}

export async function getAIInsights(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Invalid input data. Expected an object.')
  }

  try {
    const response = await fetch(AI_INSIGHTS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    const payload = await response.json().catch(() => null)

    if (!response.ok) {
      const message = payload?.error || 'Failed to fetch AI insights.'
      throw new Error(message)
    }

    const insights = Array.isArray(payload?.insights) ? payload.insights.filter(Boolean) : normalizeLines(payload?.insights)
    const quickInsights = Array.isArray(payload?.quickInsights) ? payload.quickInsights.filter(Boolean) : normalizeLines(payload?.quickInsights)
    const recommendations = Array.isArray(payload?.recommendations)
      ? payload.recommendations.filter(Boolean)
      : normalizeLines(payload?.recommendations)

    if (!quickInsights.length && !insights.length && !recommendations.length) {
      throw new Error('Invalid response format from AI service.')
    }

    return {
      quickInsights,
      insights,
      recommendations,
      rawText: typeof payload?.rawText === 'string' ? payload.rawText : '',
      source: typeof payload?.source === 'string' ? payload.source : 'fallback',
    }
  } catch (error) {
    console.error('getAIInsights error:', error)
    throw new Error(error.message || 'Unable to get AI insights right now.')
  }
}
