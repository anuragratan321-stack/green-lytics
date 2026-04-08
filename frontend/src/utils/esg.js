function clampScore(value) {
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return 0
  return Math.max(0, Math.min(100, numeric))
}

export function getESGRating(score) {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Average'
  return 'Poor'
}

export function getESGStatusMeta(score) {
  if (score >= 81) {
    return {
      label: 'Excellent',
      meaning: 'Low risk and strong ESG performance.',
      color: 'green',
      textClass: 'text-emerald-700 dark:text-emerald-300',
      badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
      barClass: 'bg-emerald-500',
    }
  }
  if (score >= 61) {
    return {
      label: 'Normal',
      meaning: 'Healthy baseline with room to optimize.',
      color: 'green',
      textClass: 'text-green-700 dark:text-green-300',
      badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
      barClass: 'bg-green-500',
    }
  }
  if (score >= 41) {
    return {
      label: 'Medium',
      meaning: 'Moderate risk, should be improved soon.',
      color: 'orange',
      textClass: 'text-orange-700 dark:text-orange-300',
      badgeClass: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
      barClass: 'bg-orange-500',
    }
  }
  if (score >= 21) {
    return {
      label: 'Bad / Risky',
      meaning: 'High risk, immediate corrective actions advised.',
      color: 'red',
      textClass: 'text-red-700 dark:text-red-300',
      badgeClass: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
      barClass: 'bg-red-500',
    }
  }
  return {
    label: 'Critical',
    meaning: 'Severe ESG risk requiring urgent intervention.',
    color: 'red',
    textClass: 'text-rose-700 dark:text-rose-300',
    badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
    barClass: 'bg-rose-500',
  }
}

export function calculateESGScore(environmental, social, governance) {
  const e = clampScore(environmental)
  const s = clampScore(social)
  const g = clampScore(governance)

  // ESG formula (weighted average):
  // Final Score = (E * 0.4) + (S * 0.3) + (G * 0.3)
  return Number((e * 0.4 + s * 0.3 + g * 0.3).toFixed(1))
}
