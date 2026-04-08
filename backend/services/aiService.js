const { GoogleGenerativeAI } = require('@google/generative-ai')

function getGeminiModel() {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    const error = new Error('GEMINI_API_KEY is missing in environment variables.')
    error.code = 'MISSING_GEMINI_API_KEY'
    throw error
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  return genAI.getGenerativeModel({
    model: 'gemini-flash-latest',
    generationConfig: {
      temperature: 0.35,
      maxOutputTokens: 420,
    },
  })
}

const METRIC_LABELS = {
  carbonEmissions: 'Carbon Emissions',
  revenue: 'Revenue',
  renewableEnergy: 'Renewable Energy (%)',
  waterUsage: 'Water Usage',
  wasteRecycling: 'Waste Recycling (%)',
  employeeSatisfaction: 'Employee Satisfaction (%)',
  attritionRate: 'Attrition Rate (%)',
  genderDiversity: 'Gender Diversity (%)',
  workplaceIncidents: 'Workplace Incidents',
  csrSpending: 'CSR Spending (%)',
  boardIndependence: 'Board Independence (%)',
  womenOnBoard: 'Women on Board (%)',
  ceoPayRatio: 'CEO Pay Ratio',
  fraudCases: 'Fraud Cases',
  transparencyScore: 'Transparency Score (%)',
}

const ENVIRONMENTAL_KEYS = ['environmentalScore', 'carbonEmissions', 'revenue', 'renewableEnergy', 'waterUsage', 'wasteRecycling']
const SOCIAL_KEYS = ['socialScore', 'employeeSatisfaction', 'attritionRate', 'genderDiversity', 'workplaceIncidents', 'csrSpending']
const GOVERNANCE_KEYS = ['governanceScore', 'boardIndependence', 'womenOnBoard', 'ceoPayRatio', 'fraudCases', 'transparencyScore']

function formatValue(value) {
  if (value === null || value === undefined || value === '') return 'Not provided'
  if (typeof value === 'number' && Number.isFinite(value)) return Number.isInteger(value) ? String(value) : value.toFixed(2)
  return String(value)
}

function formatMetricSection(title, keys, inputData) {
  const lines = keys.map((key) => `- ${METRIC_LABELS[key] || key}: ${formatValue(inputData?.[key])}`)
  return [`${title}:`, ...lines, ''].join('\n')
}

function buildPrompt(inputData) {
  const industry = inputData?.industry || 'Not provided'
  const role = inputData?.role || 'Not provided'

  return [
    'Analyze the following ESG data:',
    '',
    formatMetricSection('Environmental', ENVIRONMENTAL_KEYS, inputData),
    formatMetricSection('Social', SOCIAL_KEYS, inputData),
    formatMetricSection('Governance', GOVERNANCE_KEYS, inputData),
    'Context:',
    `Industry: ${industry}`,
    `Role: ${role}`,
    '',
    'Return JSON only:',
    '{"quickInsights":[],"insights":[],"recommendations":[]}',
    '',
    '1. Key Insights (max 6)',
    '2. Recommendations (max 5)',
    '',
    'Rules:',
    '- quickInsights: max 3 items, one-line high-level summaries.',
    '- insights: 4-6 detailed items, each 2-3 lines max, reference actual metrics and explain why.',
    '- recommendations: 3-5 practical actions tied to weakest metrics.',
    '- Compare metric relationships across pillars and note imbalances, risks, and strengths.',
    '- No repetition',
    '- No filler language or ESG definitions.',
    '- quickInsights must not duplicate insights text.',
    '',
  ].join('\n')
}

function sanitizeLine(value = '') {
  return String(value)
    .replace(/^[-*•\d.)\s]+/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function dedupeLines(items = []) {
  const seen = new Set()
  const output = []

  for (const item of items) {
    const normalized = sanitizeLine(item)
    if (!normalized) continue
    const key = normalized.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    output.push(normalized)
  }

  return output
}

function normalizeForCompare(text = '') {
  return sanitizeLine(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
}

function isNearDuplicate(a = '', b = '') {
  const left = normalizeForCompare(a)
  const right = normalizeForCompare(b)
  if (!left || !right) return false
  if (left === right) return true

  const minLength = Math.min(left.length, right.length)
  if (minLength >= 24 && (left.includes(right) || right.includes(left))) return true

  const leftTokens = new Set(left.split(' ').filter(Boolean))
  const rightTokens = new Set(right.split(' ').filter(Boolean))
  if (!leftTokens.size || !rightTokens.size) return false
  const intersection = [...leftTokens].filter((token) => rightTokens.has(token)).length
  const union = new Set([...leftTokens, ...rightTokens]).size
  const score = union ? intersection / union : 0
  return score >= 0.8
}

function dedupeNearDuplicateLines(items = [], exclude = []) {
  const output = []
  for (const item of items) {
    const normalized = sanitizeLine(item)
    if (!normalized) continue
    const isDuplicate = [...exclude, ...output].some((existing) => isNearDuplicate(existing, normalized))
    if (!isDuplicate) output.push(normalized)
  }
  return output
}

function limitWords(text = '', maxWords = 40) {
  const tokens = sanitizeLine(text).split(' ').filter(Boolean)
  if (tokens.length <= maxWords) return tokens.join(' ')
  return `${tokens.slice(0, maxWords).join(' ')}.`
}

function extractJsonPayload(text = '') {
  const trimmed = String(text || '').trim()
  if (!trimmed) return null

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim()
  }

  const firstBrace = trimmed.indexOf('{')
  const lastBrace = trimmed.lastIndexOf('}')
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null
  }

  return trimmed.slice(firstBrace, lastBrace + 1)
}

function parseBulletsFromSection(text = '', marker = '') {
  const startIndex = text.toUpperCase().indexOf(marker.toUpperCase())
  if (startIndex === -1) return []
  const sectionText = text.slice(startIndex + marker.length)
  return sectionText
    .split('\n')
    .map((line) => sanitizeLine(line))
    .filter(Boolean)
}

function parseStructuredResponse(text = '') {
  const fallback = { quickInsights: [], insights: [], recommendations: [] }
  const jsonPayload = extractJsonPayload(text)

  if (jsonPayload) {
    try {
      const parsed = JSON.parse(jsonPayload)
      const insights = dedupeNearDuplicateLines(Array.isArray(parsed?.insights) ? parsed.insights : [])
        .map((item) => limitWords(item, 42))
        .slice(0, 6)
      const recommendations = dedupeNearDuplicateLines(Array.isArray(parsed?.recommendations) ? parsed.recommendations : [])
        .map((item) => limitWords(item, 30))
        .slice(0, 5)
      const quickInsights = dedupeNearDuplicateLines(Array.isArray(parsed?.quickInsights) ? parsed.quickInsights : [], insights)
        .map((item) => limitWords(item, 18))
        .slice(0, 3)

      return { quickInsights, insights, recommendations }
    } catch {
      // Fallback to a softer parser below.
    }
  }

  const insights = dedupeNearDuplicateLines(parseBulletsFromSection(text, 'INSIGHTS:'))
    .map((item) => limitWords(item, 42))
    .slice(0, 6)
  const recommendations = dedupeNearDuplicateLines(parseBulletsFromSection(text, 'RECOMMENDATIONS:'))
    .map((item) => limitWords(item, 30))
    .slice(0, 5)
  const quickInsights = dedupeNearDuplicateLines(parseBulletsFromSection(text, 'QUICK INSIGHTS:'), insights)
    .map((item) => limitWords(item, 18))
    .slice(0, 3)

  if (!insights.length && !recommendations.length && !quickInsights.length) return fallback
  return { quickInsights, insights, recommendations }
}

function buildFallbackInsights(inputData = {}) {
  const environmental = Number(inputData?.environmentalScore ?? 0)
  const social = Number(inputData?.socialScore ?? 0)
  const governance = Number(inputData?.governanceScore ?? 0)
  const renewableEnergy = Number(inputData?.renewableEnergy ?? 0)
  const attritionRate = Number(inputData?.attritionRate ?? 0)
  const transparency = Number(inputData?.transparencyScore ?? 0)

  const insights = []
  const recommendations = []
  const quickInsights = []

  if (environmental < 50) {
    insights.push('Environmental performance is below benchmark. Low renewable energy and emissions efficiency likely limit the pillar score and increase transition risk.')
    recommendations.push('Set a quarterly decarbonization roadmap with renewable-energy targets, emissions baselines, and owner-level accountability.')
    quickInsights.push('Environmental metrics are the main drag on overall ESG performance.')
  } else if (environmental >= 75) {
    insights.push('Environmental performance is a clear strength. Resource and emissions indicators are supporting stronger ESG resilience and consistency.')
    quickInsights.push('Environmental pillar is currently performing as a strength.')
  } else {
    insights.push('Environmental results are mid-range, indicating stable progress but limited upside without stronger energy and waste-efficiency programs.')
    quickInsights.push('Environmental performance is stable but not yet high-impact.')
  }

  if (social < 50) {
    insights.push('Social indicators show elevated workforce risk. Attrition, satisfaction, or safety trends may be constraining operational continuity and morale.')
    recommendations.push('Launch a retention and engagement plan with monthly pulse tracking for attrition, satisfaction, and safety outcomes.')
    quickInsights.push('Social metrics indicate workforce and engagement risk.')
  } else if (social >= 75) {
    insights.push('Social indicators are strong, suggesting balanced people outcomes and healthier stakeholder confidence across the organization.')
    quickInsights.push('Social pillar contributes positively to ESG momentum.')
  } else {
    insights.push('Social performance is mixed. The baseline is stable, but targeted improvements are needed to improve consistency and long-term outcomes.')
    quickInsights.push('Social performance is moderate with improvement opportunities.')
  }

  if (governance < 60) {
    insights.push('Governance score suggests oversight and transparency controls are not yet robust, increasing compliance and disclosure risk exposure.')
    recommendations.push('Strengthen governance cadence with board reviews, compliance checkpoints, and disclosure quality controls.')
    quickInsights.push('Governance controls need strengthening to reduce risk.')
  } else if (governance >= 80) {
    insights.push('Governance is a strength and likely offsets risk in other pillars through stronger oversight, policy discipline, and transparency practices.')
    quickInsights.push('Governance is a stabilizing strength for ESG performance.')
  } else {
    insights.push('Governance is generally stable, though accountability and transparency controls can be tightened to improve resilience.')
    quickInsights.push('Governance is stable with room for stronger controls.')
  }

  if (governance - environmental >= 20) {
    insights.push('A notable pillar imbalance exists: governance is outperforming environmental metrics, indicating execution strength but sustainability lag in operations.')
  }

  if (renewableEnergy > 0 && renewableEnergy < 30) {
    recommendations.push('Prioritize renewable procurement and efficiency retrofits to improve environmental intensity and reduce emissions exposure.')
  }

  if (attritionRate >= 15) {
    recommendations.push('Address high attrition through manager capability programs, career-pathing, and targeted retention interventions.')
  }

  if (transparency > 0 && transparency < 60) {
    recommendations.push('Improve transparency reporting quality with standardized ESG disclosures and a quarterly governance review process.')
  }

  if (recommendations.length < 3) {
    recommendations.push('Set pillar-level ESG targets with monthly checkpoints and publish progress against defined KPIs.')
  }

  const normalizedInsights = dedupeNearDuplicateLines(insights).map((item) => limitWords(item, 42)).slice(0, 6)
  const normalizedRecommendations = dedupeNearDuplicateLines(recommendations).map((item) => limitWords(item, 30)).slice(0, 5)
  const normalizedQuickInsights = dedupeNearDuplicateLines(quickInsights, normalizedInsights)
    .map((item) => limitWords(item, 18))
    .slice(0, 3)

  return {
    quickInsights: normalizedQuickInsights.length ? normalizedQuickInsights : normalizedInsights.slice(0, 3).map((item) => limitWords(item, 18)),
    insights: normalizedInsights,
    recommendations: normalizedRecommendations,
  }
}

async function generateInsights(inputData) {
  if (!inputData || typeof inputData !== 'object' || Array.isArray(inputData)) {
    const error = new Error('inputData must be a valid ESG data object.')
    error.code = 'INVALID_INPUT'
    throw error
  }

  try {
    const model = getGeminiModel()
    const prompt = buildPrompt(inputData)
    const result = await model.generateContent(prompt)
    const text = result?.response?.text?.()

    if (!text || !text.trim()) {
      throw new Error('Gemini returned an empty response.')
    }

    const parsed = parseStructuredResponse(text.trim())
    const fallback = buildFallbackInsights(inputData)

    return {
      quickInsights: parsed.quickInsights.length ? parsed.quickInsights : fallback.quickInsights,
      insights: parsed.insights.length ? parsed.insights : fallback.insights,
      recommendations: parsed.recommendations.length >= 3 ? parsed.recommendations : fallback.recommendations,
      rawText: text.trim(),
      source: 'gemini',
    }
  } catch (error) {
    console.error('Gemini insight generation failed:', error.message)
    const fallback = buildFallbackInsights(inputData)
    return {
      quickInsights: fallback.quickInsights,
      insights: fallback.insights,
      recommendations: fallback.recommendations,
      rawText: '',
      source: 'fallback',
    }
  }
}

module.exports = {
  generateInsights,
}
