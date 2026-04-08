function toNumber(value) {
  if (value === '' || value === null || value === undefined) return null
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function clamp0to100(value) {
  return clamp(value, 0, 100)
}

function round1(value) {
  return Number(value.toFixed(1))
}

function lerp(input, inMin, inMax, outMin, outMax) {
  if (inMax === inMin) return outMax
  const t = (input - inMin) / (inMax - inMin)
  return outMin + t * (outMax - outMin)
}

function scoreHigher(value, { excellent, good, average, cap = null }) {
  const numeric = toNumber(value)
  if (numeric === null) return null
  const capped = cap === null ? numeric : Math.min(numeric, cap)

  if (capped >= excellent) {
    const highCap = cap ?? excellent * 1.5
    return clamp0to100(lerp(capped, excellent, highCap, 85, 100))
  }
  if (capped >= good) {
    return clamp0to100(lerp(capped, good, excellent, 65, 85))
  }
  if (capped >= average) {
    return clamp0to100(lerp(capped, average, good, 45, 65))
  }
  return clamp0to100(lerp(Math.max(0, capped), 0, average, 25, 45))
}

function scoreHigherWithCritical(value, { excellent, good, average, critical, cap = null }) {
  const numeric = toNumber(value)
  if (numeric === null) return null
  const capped = cap === null ? numeric : Math.min(numeric, cap)

  if (capped >= excellent) {
    const highCap = cap ?? excellent * 1.5
    return clamp0to100(lerp(capped, excellent, highCap, 85, 100))
  }
  if (capped >= good) return clamp0to100(lerp(capped, good, excellent, 65, 85))
  if (capped >= average) return clamp0to100(lerp(capped, average, good, 45, 65))
  if (capped >= critical) return clamp0to100(lerp(capped, critical, average, 25, 45))
  return clamp0to100(lerp(Math.max(0, capped), 0, critical, 0, 25))
}

function scoreLower(value, { excellent, good, average, cap = null }) {
  const numeric = toNumber(value)
  if (numeric === null) return null
  const capped = cap === null ? numeric : Math.min(numeric, cap)

  if (capped <= excellent) {
    return clamp0to100(lerp(capped, 0, excellent, 100, 85))
  }
  if (capped <= good) {
    return clamp0to100(lerp(capped, excellent, good, 85, 65))
  }
  if (capped <= average) {
    return clamp0to100(lerp(capped, good, average, 65, 45))
  }
  const highCap = cap ?? average * 3
  return clamp0to100(lerp(Math.min(capped, highCap), average, highCap, 45, 25))
}

function scoreLowerWithCritical(value, { excellent, good, average, critical, cap = null }) {
  const numeric = toNumber(value)
  if (numeric === null) return null
  const capped = cap === null ? numeric : Math.min(numeric, cap)

  if (capped <= excellent) return clamp0to100(lerp(capped, 0, excellent, 100, 85))
  if (capped <= good) return clamp0to100(lerp(capped, excellent, good, 85, 65))
  if (capped <= average) return clamp0to100(lerp(capped, good, average, 65, 45))
  if (capped <= critical) return clamp0to100(lerp(capped, average, critical, 45, 25))
  const highCap = cap ?? critical * 3
  return clamp0to100(lerp(Math.min(capped, highCap), critical, highCap, 25, 0))
}

function scoreGenderParity(value) {
  const numeric = toNumber(value)
  if (numeric === null) return null
  const safeValue = clamp(numeric, 0, 100)
  const distance = Math.abs(safeValue - 50)

  if (distance <= 5) {
    return clamp0to100(lerp(distance, 0, 5, 100, 85))
  }
  if (distance <= 10) {
    return clamp0to100(lerp(distance, 5, 10, 85, 65))
  }
  if (distance <= 20) {
    return clamp0to100(lerp(distance, 10, 20, 65, 45))
  }
  return clamp0to100(lerp(Math.min(distance, 50), 20, 50, 45, 25))
}

const METRIC_RULES = {
  emissionsIntensity: {
    benchmarkText: '0-1 Excellent, 1-5 Good, 5-10 Average, 10-20 Poor, >20 Critical (lower is better)',
    suggestionTarget: 'Reduce emissions intensity to 1 or lower',
    score: (value) => scoreLowerWithCritical(value, { excellent: 1, good: 5, average: 10, critical: 20, cap: 100 }),
  },
  renewableEnergy: {
    benchmarkText: '70%+ Excellent, 50-70 Good, 30-50 Average, <30 Poor',
    suggestionTarget: 'Increase renewable energy to 70%+',
    score: (value) => scoreHigher(value, { excellent: 70, good: 50, average: 30, cap: 100 }),
  },
  waterUsage: {
    benchmarkText: '<500 Excellent, 500-1500 Good, 1500-3000 Average, 3000-8000 Poor, >8000 Critical (lower is better)',
    suggestionTarget: 'Reduce water usage below 1500',
    score: (value) => scoreLowerWithCritical(value, { excellent: 500, good: 1500, average: 3000, critical: 8000, cap: 50000 }),
  },
  wasteRecycling: {
    benchmarkText: '70%+ Excellent, 50-70 Good, 30-50 Average, 10-30 Poor, <10 Critical',
    suggestionTarget: 'Increase recycling to 70%+',
    score: (value) => scoreHigherWithCritical(value, { excellent: 70, good: 50, average: 30, critical: 10, cap: 100 }),
  },
  employeeSatisfaction: {
    benchmarkText: '85%+ Excellent, 70-84 Good, 50-69 Average, 25-49 Poor, <25 Critical',
    suggestionTarget: 'Raise employee satisfaction to 85%+',
    score: (value) => scoreHigherWithCritical(value, { excellent: 85, good: 70, average: 50, critical: 25, cap: 100 }),
  },
  attritionRate: {
    benchmarkText: '<8 Excellent, 8-15 Good, 15-25 Average, 25-35 Poor, >35 Critical (lower is better)',
    suggestionTarget: 'Reduce attrition rate below 15%',
    score: (value) => scoreLowerWithCritical(value, { excellent: 8, good: 15, average: 25, critical: 35, cap: 100 }),
  },
  genderDiversity: {
    benchmarkText: '45-55 Excellent, 40-44 or 56-60 Good, 30-39 or 61-70 Average, <30 or >70 Poor (closest to 50% is best)',
    suggestionTarget: 'Move gender diversity closer to 50%',
    score: scoreGenderParity,
  },
  workplaceIncidents: {
    benchmarkText: '0-2 Excellent, 3-8 Good, 9-15 Average, 16-20 Poor, >20 Critical (lower is better)',
    suggestionTarget: 'Reduce incidents to 2 or fewer',
    score: (value) => scoreLowerWithCritical(value, { excellent: 2, good: 8, average: 15, critical: 20, cap: 200 }),
  },
  csrSpending: {
    benchmarkText: '5%+ Excellent, 2-4.9 Good, 1-1.9 Average, 0.1-0.9 Poor, 0 Critical',
    suggestionTarget: 'Increase CSR spending to 2%+',
    score: (value) => {
      const numeric = toNumber(value)
      if (numeric === null) return null
      if (numeric === 0) return 0
      return scoreHigher(value, { excellent: 5, good: 2, average: 1, cap: 100 })
    },
  },
  boardIndependence: {
    benchmarkText: '70%+ Excellent, 50-69 Good, 30-49 Average, 20-29 Poor, <20 Critical',
    suggestionTarget: 'Increase board independence to 70%+',
    score: (value) => scoreHigherWithCritical(value, { excellent: 70, good: 50, average: 30, critical: 20, cap: 100 }),
  },
  womenOnBoard: {
    benchmarkText: '40%+ Excellent, 30-39 Good, 20-29 Average, 10-19 Poor, <10 Critical',
    suggestionTarget: 'Increase women on board to 40%+',
    score: (value) => scoreHigherWithCritical(value, { excellent: 40, good: 30, average: 20, critical: 10, cap: 100 }),
  },
  ceoPayRatio: {
    benchmarkText: '<50 Excellent, 50-100 Good, 100-200 Average, >200 Poor (lower is better)',
    suggestionTarget: 'Reduce CEO pay ratio below 100',
    score: (value) => scoreLower(value, { excellent: 50, good: 100, average: 200, cap: 1000 }),
  },
  fraudCases: {
    benchmarkText: '0 Excellent, 1-2 Good, 3-5 Poor, >5 Critical (lower is better)',
    suggestionTarget: 'Reduce fraud cases to 0',
    score: (value) => {
      const numeric = toNumber(value)
      if (numeric === null) return null
      if (numeric <= 0) return 100
      if (numeric <= 2) return clamp0to100(lerp(numeric, 1, 2, 89, 70))
      if (numeric <= 5) return clamp0to100(lerp(numeric, 3, 5, 49, 30))
      return clamp0to100(lerp(Math.min(numeric, 50), 6, 50, 29, 0))
    },
  },
  transparencyScore: {
    benchmarkText: '80%+ Excellent, 60-79 Good, 40-59 Average, 20-39 Poor, <20 Critical',
    suggestionTarget: 'Increase transparency score to 80%+',
    score: (value) => scoreHigherWithCritical(value, { excellent: 80, good: 60, average: 40, critical: 20, cap: 100 }),
  },
}

export function getBenchmarkText(metricKey) {
  return METRIC_RULES[metricKey]?.benchmarkText ?? 'Benchmark unavailable'
}

export function getMetricScore(metricKey, value) {
  const scorer = METRIC_RULES[metricKey]?.score
  if (!scorer) return null
  return scorer(value)
}

export function getRatingLabel(score, mode = 'overall') {
  const numeric = toNumber(score)
  if (numeric === null) return 'Insufficient Data'

  if (mode === 'metric') {
    if (numeric >= 85) return 'Excellent'
    if (numeric >= 65) return 'Good'
    if (numeric >= 45) return 'Average'
    if (numeric >= 25) return 'Poor'
    return 'Critical issue'
  }

  if (numeric >= 80) return 'Excellent'
  if (numeric >= 60) return 'Good'
  if (numeric >= 40) return 'Average'
  return 'Poor'
}

export function getSuggestions({ metrics = [], pillarScores = {}, anomalies = [] } = {}) {
  const hasLowMetric = metrics.some((metric) => Number.isFinite(metric.score) && metric.score < 50)
  const hasLowPillar = Object.values(pillarScores).some((score) => Number.isFinite(score) && score < 70)
  const hasAnomaly = anomalies.length > 0
  if (!hasLowMetric && !hasLowPillar && !hasAnomaly) return []

  const worstMetricSuggestions = metrics
    .filter((metric) => Number.isFinite(metric.score))
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((metric) => {
      const target = METRIC_RULES[metric.key]?.suggestionTarget || 'Improve this metric to benchmark target'
      const benchmark = METRIC_RULES[metric.key]?.benchmarkText || 'benchmark target'
      const uplift = Math.max(3, Math.round((70 - metric.score) / 5))
      return `${target} (${benchmark}) to improve score by +${uplift}`
    })

  const anomalySuggestions = anomalies.map((anomaly) => {
    if (anomaly.key === 'emissionsZeroWithRevenue') return 'Verify carbon emissions data; zero emissions with non-zero revenue is suspicious.'
    if (anomaly.key === 'waterUsageZero') return 'Review water usage reporting; zero water usage is likely incomplete data.'
    if (anomaly.key === 'recyclingZeroCritical') return 'Set waste recycling above 0% immediately to avoid critical ESG risk.'
    return 'Review data quality for flagged anomalies before final ESG decisions.'
  })

  return [...worstMetricSuggestions, ...anomalySuggestions].slice(0, 5)
}

function averageDefined(values) {
  const valid = values.filter((value) => Number.isFinite(value))
  if (!valid.length) return null
  return valid.reduce((sum, value) => sum + value, 0) / valid.length
}

function applyPillarPenalty(baseScore, metricScores) {
  if (!Number.isFinite(baseScore)) return null
  const weakCount = metricScores.filter((score) => {
    const label = getRatingLabel(score, 'metric')
    return label === 'Poor' || label === 'Critical issue'
  }).length
  if (weakCount < 3) return baseScore
  return clamp0to100(baseScore * 0.9)
}

function weightedAverageWithMissing(valuesWithWeights) {
  let weightedSum = 0
  let weightSum = 0
  valuesWithWeights.forEach(({ value, weight }) => {
    if (Number.isFinite(value)) {
      weightedSum += value * weight
      weightSum += weight
    }
  })
  if (!weightSum) return null
  return weightedSum / weightSum
}

function sanitizeEnvironmental(environmental = {}) {
  const emissions = toNumber(environmental.carbonEmissions)
  const revenue = toNumber(environmental.revenue)
  const revenueCurrency = environmental.revenueCurrency || '₹'
  const renewableEnergy = toNumber(environmental.renewableEnergy)
  const waterUsage = toNumber(environmental.waterUsage)
  const wasteRecycling = toNumber(environmental.wasteRecycling)
  const currencyRateToUSD = {
    $: 1,
    USD: 1,
    '₹': 83,
    INR: 83,
    '€': 1.08,
    EUR: 1.08,
  }
  const rate = currencyRateToUSD[revenueCurrency] || 1
  const normalizedRevenue = revenue === null ? null : revenue / rate

  return {
    carbonEmissions: emissions === null ? null : clamp(emissions, 0, 1000000000),
    revenue: normalizedRevenue === null ? null : clamp(normalizedRevenue, 0, 1000000000000),
    revenueCurrency,
    renewableEnergy: renewableEnergy === null ? null : clamp(renewableEnergy, 0, 100),
    waterUsage: waterUsage === null ? null : clamp(waterUsage, 0, 1000000000),
    wasteRecycling: wasteRecycling === null ? null : clamp(wasteRecycling, 0, 100),
  }
}

function sanitizeSocial(social = {}) {
  const employeeSatisfaction = toNumber(social.employeeSatisfaction)
  const attritionRate = toNumber(social.attritionRate)
  const genderDiversity = toNumber(social.genderDiversity)
  const workplaceIncidents = toNumber(social.workplaceIncidents)
  const csrSpending = toNumber(social.csrSpending)

  return {
    employeeSatisfaction: employeeSatisfaction === null ? null : clamp(employeeSatisfaction, 0, 100),
    attritionRate: attritionRate === null ? null : clamp(attritionRate, 0, 100),
    genderDiversity: genderDiversity === null ? null : clamp(genderDiversity, 0, 100),
    workplaceIncidents: workplaceIncidents === null ? null : clamp(workplaceIncidents, 0, 1000000),
    csrSpending: csrSpending === null ? null : clamp(csrSpending, 0, 100),
  }
}

function sanitizeGovernance(governance = {}) {
  const boardIndependence = toNumber(governance.boardIndependence)
  const womenOnBoard = toNumber(governance.womenOnBoard)
  const ceoPayRatio = toNumber(governance.ceoPayRatio)
  const fraudCases = toNumber(governance.fraudCases)
  const transparencyScore = toNumber(governance.transparencyScore)

  return {
    boardIndependence: boardIndependence === null ? null : clamp(boardIndependence, 0, 100),
    womenOnBoard: womenOnBoard === null ? null : clamp(womenOnBoard, 0, 100),
    ceoPayRatio: ceoPayRatio === null ? null : clamp(ceoPayRatio, 0, 500),
    fraudCases: fraudCases === null ? null : clamp(fraudCases, 0, 1000000),
    transparencyScore: transparencyScore === null ? null : clamp(transparencyScore, 0, 100),
  }
}

export function sanitizeESGMetrics({ environmental = {}, social = {}, governance = {} } = {}) {
  return {
    environmental: sanitizeEnvironmental(environmental),
    social: sanitizeSocial(social),
    governance: sanitizeGovernance(governance),
  }
}

function buildInsights({ E_score, S_score, G_score, ESG_score, industry, name }) {
  const insights = []
  if (Number.isFinite(E_score) && E_score < 70) insights.push(`Environmental performance is below expected benchmark for ${industry || 'your sector'}.`)
  if (Number.isFinite(S_score) && S_score < 70) insights.push('Social performance needs additional focus on people and safety metrics.')
  if (Number.isFinite(G_score) && G_score < 70) insights.push('Governance indicators need reinforcement in compliance and transparency.')
  if (Number.isFinite(ESG_score) && ESG_score >= 80) insights.push(`${name || 'Your company'} is showing strong ESG maturity.`)
  if (!insights.length) insights.push('No major risks detected from available inputs.')
  return insights
}

export function normalize(value, best, worst) {
  const numeric = toNumber(value)
  const bestNum = toNumber(best)
  const worstNum = toNumber(worst)
  if (numeric === null || bestNum === null || worstNum === null) return null
  if (bestNum === worstNum) return 100
  const raw =
    bestNum < worstNum
      ? ((worstNum - numeric) / (worstNum - bestNum)) * 100
      : ((numeric - worstNum) / (bestNum - worstNum)) * 100
  return clamp0to100(raw)
}

export function calculateESGEngine({ industry, companySize, name, environmental = {}, social = {}, governance = {} } = {}) {
  const sanitized = sanitizeESGMetrics({ environmental, social, governance })
  const emissions = toNumber(sanitized.environmental.carbonEmissions)
  const revenue = toNumber(sanitized.environmental.revenue)
  const intensity = emissions !== null && revenue !== null && revenue > 0 ? emissions / revenue : null

  const anomalies = []
  if (emissions === 0 && revenue !== null && revenue > 0) {
    anomalies.push({ key: 'emissionsZeroWithRevenue', metric: 'emissionsIntensity', pillar: 'E', severity: 'suspicious' })
  }
  if (toNumber(sanitized.environmental.waterUsage) === 0) {
    anomalies.push({ key: 'waterUsageZero', metric: 'waterUsage', pillar: 'E', severity: 'suspicious' })
  }
  if (toNumber(sanitized.environmental.wasteRecycling) === 0) {
    anomalies.push({ key: 'recyclingZeroCritical', metric: 'wasteRecycling', pillar: 'E', severity: 'critical' })
  }

  const metricScores = {
    emissionsIntensity: getMetricScore('emissionsIntensity', intensity),
    renewableEnergy: getMetricScore('renewableEnergy', sanitized.environmental.renewableEnergy),
    waterUsage: getMetricScore('waterUsage', sanitized.environmental.waterUsage),
    wasteRecycling: getMetricScore('wasteRecycling', sanitized.environmental.wasteRecycling),
    employeeSatisfaction: getMetricScore('employeeSatisfaction', sanitized.social.employeeSatisfaction),
    attritionRate: getMetricScore('attritionRate', sanitized.social.attritionRate),
    genderDiversity: getMetricScore('genderDiversity', sanitized.social.genderDiversity),
    workplaceIncidents: getMetricScore('workplaceIncidents', sanitized.social.workplaceIncidents),
    csrSpending: getMetricScore('csrSpending', sanitized.social.csrSpending),
    boardIndependence: getMetricScore('boardIndependence', sanitized.governance.boardIndependence),
    womenOnBoard: getMetricScore('womenOnBoard', sanitized.governance.womenOnBoard),
    ceoPayRatio: getMetricScore('ceoPayRatio', sanitized.governance.ceoPayRatio),
    fraudCases: getMetricScore('fraudCases', sanitized.governance.fraudCases),
    transparencyScore: getMetricScore('transparencyScore', sanitized.governance.transparencyScore),
  }

  const suspiciousMetricKeys = new Set(anomalies.filter((item) => item.severity === 'suspicious').map((item) => item.metric))
  Object.keys(metricScores).forEach((key) => {
    if (!Number.isFinite(metricScores[key])) return
    if (suspiciousMetricKeys.has(key)) {
      metricScores[key] = clamp0to100(metricScores[key] - 20)
    }
  })

  const E_score = averageDefined([
    metricScores.emissionsIntensity,
    metricScores.renewableEnergy,
    metricScores.waterUsage,
    metricScores.wasteRecycling,
  ])
  const S_score = averageDefined([
    metricScores.employeeSatisfaction,
    metricScores.attritionRate,
    metricScores.genderDiversity,
    metricScores.workplaceIncidents,
    metricScores.csrSpending,
  ])
  const G_score = averageDefined([
    metricScores.boardIndependence,
    metricScores.womenOnBoard,
    metricScores.ceoPayRatio,
    metricScores.fraudCases,
    metricScores.transparencyScore,
  ])

  const penalizedEBase = applyPillarPenalty(E_score, [
    metricScores.emissionsIntensity,
    metricScores.renewableEnergy,
    metricScores.waterUsage,
    metricScores.wasteRecycling,
  ])
  const penalizedSBase = applyPillarPenalty(S_score, [
    metricScores.employeeSatisfaction,
    metricScores.attritionRate,
    metricScores.genderDiversity,
    metricScores.workplaceIncidents,
    metricScores.csrSpending,
  ])
  const penalizedGBase = applyPillarPenalty(G_score, [
    metricScores.boardIndependence,
    metricScores.womenOnBoard,
    metricScores.ceoPayRatio,
    metricScores.fraudCases,
    metricScores.transparencyScore,
  ])

  const hasCriticalE = ['emissionsIntensity', 'renewableEnergy', 'waterUsage', 'wasteRecycling'].some(
    (key) => getRatingLabel(metricScores[key], 'metric') === 'Critical issue',
  )
  const hasCriticalS = ['employeeSatisfaction', 'attritionRate', 'genderDiversity', 'workplaceIncidents', 'csrSpending'].some(
    (key) => getRatingLabel(metricScores[key], 'metric') === 'Critical issue',
  )
  const hasCriticalG = ['boardIndependence', 'womenOnBoard', 'ceoPayRatio', 'fraudCases', 'transparencyScore'].some(
    (key) => getRatingLabel(metricScores[key], 'metric') === 'Critical issue',
  )

  const penalizedE = hasCriticalE ? Math.min(40, penalizedEBase ?? 40) : penalizedEBase
  const penalizedS = hasCriticalS ? Math.min(40, penalizedSBase ?? 40) : penalizedSBase
  const penalizedG = hasCriticalG ? Math.min(40, penalizedGBase ?? 40) : penalizedGBase

  const weighted = weightedAverageWithMissing([
    { value: penalizedE, weight: 0.4 },
    { value: penalizedS, weight: 0.3 },
    { value: penalizedG, weight: 0.3 },
  ])

  const rawESG = Number.isFinite(weighted) ? round1(weighted) : null
  const ESG_score = anomalies.length ? Math.min(60, rawESG ?? 60) : rawESG
  const rating = getRatingLabel(ESG_score, 'overall')
  const insights = buildInsights({ E_score: penalizedE, S_score: penalizedS, G_score: penalizedG, ESG_score, industry, name })

  return {
    E_score: Number.isFinite(penalizedE) ? round1(penalizedE) : null,
    S_score: Number.isFinite(penalizedS) ? round1(penalizedS) : null,
    G_score: Number.isFinite(penalizedG) ? round1(penalizedG) : null,
    ESG_score,
    rating,
    insights,
    metricScores,
    metadata: {
      industry,
      companySize,
      revenueValid: revenue !== null && revenue > 0,
      anomalies,
      hasDataQualityIssue: anomalies.length > 0,
    },
  }
}
