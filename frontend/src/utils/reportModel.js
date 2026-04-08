function toNumber(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function formatDateTime(dateValue) {
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return 'Unknown date'
  const datePart = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const timePart = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
  return `${datePart} • ${timePart}`
}

function formatFileDate(dateValue) {
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return 'Unknown'
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${y}${m}${d}_${h}${min}`
}

function parseInsightText(value) {
  if (!value || typeof value !== 'string') return []
  return value
    .split('\n')
    .map((line) => line.replace(/^[-*•\d.)\s]+/, '').trim())
    .filter(Boolean)
}

function normalizeLine(value) {
  return String(value || '')
    .replace(/^[-*•\d.)\s]+/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function dedupeItems(items = []) {
  const seen = new Set()
  const output = []

  for (const item of items) {
    const normalized = normalizeLine(item)
    if (!normalized) continue
    const key = normalized.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    output.push(normalized)
  }

  return output
}

function resolveStatus(score) {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Average'
  return 'Poor'
}

function fallbackInsights(model) {
  const items = []

  if (model.environmental < 50) {
    items.push('Environmental performance is below target due to weak emissions and resource-efficiency controls.')
  } else if (model.environmental >= 75) {
    items.push('Environmental performance is a current strength and is supporting overall ESG stability.')
  } else {
    items.push('Environmental performance is moderate; focused energy and waste actions can lift the score.')
  }

  if (model.social < 50) {
    items.push('Social indicators suggest workforce and engagement risk, likely reducing organizational resilience.')
  } else if (model.social >= 75) {
    items.push('Social metrics are strong and indicate healthy people practices and stakeholder alignment.')
  } else {
    items.push('Social metrics are improving but remain mixed, with room to strengthen retention and diversity outcomes.')
  }

  if (model.governance < 50) {
    items.push('Governance results point to control and transparency gaps that can materially affect ESG confidence.')
  } else if (model.governance >= 75) {
    items.push('Governance is performing well, reinforcing accountability and consistent decision quality.')
  } else {
    items.push('Governance is stable but can be improved through stronger disclosure and board-level oversight metrics.')
  }

  return items.slice(0, 4)
}

function buildRecommendations(model) {
  const tips = []
  if (model.environmental < 60) tips.push('Prioritize emissions-intensity reduction and raise renewable energy in the next cycle.')
  if (model.social < 60) tips.push('Implement retention and engagement actions with monthly tracking of satisfaction and attrition.')
  if (model.governance < 60) tips.push('Strengthen governance controls through better board oversight and disclosure transparency.')
  if (model.esgScore >= 70) tips.push('Maintain current momentum by setting measurable ESG targets and publishing progress updates.')

  if (!tips.length) {
    tips.push('Set pillar-level improvement targets and review progress monthly to preserve score consistency.')
  }

  return dedupeItems(tips).slice(0, 4)
}

function buildQuickInsights(model, insights = []) {
  const quick = []
  if (model.environmental < 50) quick.push('Environmental performance is the main pressure area in this report.')
  if (model.social < 55) quick.push('Social indicators show moderate workforce and engagement risk.')
  if (model.governance >= 75) quick.push('Governance is currently stabilizing overall ESG performance.')
  if (model.governance - model.environmental >= 20) quick.push('Pillar imbalance detected: governance is strong while environmental execution lags.')
  if (Array.isArray(insights) && insights.length && quick.length < 2) {
    quick.push('Detailed insights highlight metric-level trade-offs across pillars.')
  }
  if (!quick.length) quick.push('Pillars are relatively balanced with targeted improvement opportunities.')
  return dedupeItems(quick).slice(0, 3)
}

function mergeWithFallback(primary = [], fallback = [], maxCount = 5) {
  const base = dedupeItems(primary)
  if (base.length >= maxCount) return base.slice(0, maxCount)
  const merged = dedupeItems([...base, ...fallback])
  return merged.slice(0, maxCount)
}

function getReportName(source, dateLabel) {
  const explicit = source?.reportName || source?.data?.reportName
  if (typeof explicit === 'string' && explicit.trim()) return explicit.trim()
  return `ESG Report - ${dateLabel.replace(' • ', ', ')}`
}

export function createReportModel(source = {}) {
  const createdAt = source?.createdAt || source?.date || source?.created_at || new Date().toISOString()
  const dateLabel = formatDateTime(createdAt)
  const insightsFromSource = [
    ...(Array.isArray(source?.insights) ? source.insights : []),
    ...(Array.isArray(source?.data?.aiStructured?.insights) ? source.data.aiStructured.insights : []),
    ...parseInsightText(source?.aiInsightsText),
    ...parseInsightText(source?.data?.aiInsights),
  ].filter(Boolean)
  const recommendationsFromSource = [
    ...(Array.isArray(source?.recommendations) ? source.recommendations : []),
    ...(Array.isArray(source?.data?.aiRecommendations) ? source.data.aiRecommendations : []),
    ...(Array.isArray(source?.data?.aiStructured?.recommendations) ? source.data.aiStructured.recommendations : []),
  ].filter(Boolean)
  const quickInsightsFromSource = [
    ...(Array.isArray(source?.quickInsights) ? source.quickInsights : []),
    ...(Array.isArray(source?.data?.aiQuickInsights) ? source.data.aiQuickInsights : []),
    ...(Array.isArray(source?.data?.aiStructured?.quickInsights) ? source.data.aiStructured.quickInsights : []),
  ].filter(Boolean)

  const model = {
    id: source?._id || source?.id || `${Date.now()}`,
    name: getReportName(source, dateLabel),
    date: createdAt,
    dateLabel,
    fileDate: formatFileDate(createdAt),
    esgScore: toNumber(source?.scores?.total ?? source?.total_score ?? source?.report?.ESG_score ?? source?.data?.report?.ESG_score),
    environmental: toNumber(source?.scores?.environmental ?? source?.environmental_score ?? source?.report?.E_score ?? source?.data?.report?.E_score),
    social: toNumber(source?.scores?.social ?? source?.social_score ?? source?.report?.S_score ?? source?.data?.report?.S_score),
    governance: toNumber(source?.scores?.governance ?? source?.governance_score ?? source?.report?.G_score ?? source?.data?.report?.G_score),
    industry: source?.industry || source?.data?.user?.industry || source?.data?.industry || '',
    role: source?.role || source?.data?.user?.role || '',
  }

  model.status = resolveStatus(model.esgScore)
  const fallbackInsightItems = fallbackInsights(model)
  const fallbackRecommendationItems = buildRecommendations(model)

  model.insights = mergeWithFallback(insightsFromSource, fallbackInsightItems, 6)
  if (model.insights.length < 4) {
    model.insights = mergeWithFallback(model.insights, fallbackInsightItems, 6)
  }

  model.recommendations = mergeWithFallback(recommendationsFromSource, fallbackRecommendationItems, 5)
  if (model.recommendations.length < 3) {
    model.recommendations = mergeWithFallback(model.recommendations, fallbackRecommendationItems, 5)
  }

  model.quickInsights = quickInsightsFromSource.length
    ? dedupeItems(quickInsightsFromSource).slice(0, 3)
    : buildQuickInsights(model, model.insights)
  if (model.quickInsights.length < 2) {
    model.quickInsights = buildQuickInsights(model, model.insights)
  }

  return model
}
