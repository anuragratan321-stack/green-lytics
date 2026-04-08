import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion as Motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Download, LayoutDashboard, Leaf, Lightbulb, Pencil, Save, ShieldCheck, Sparkles, Trash2, Users } from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'
import MetricCard from '../components/MetricCard'
import InsightsModal from '../components/reports/InsightsModal'
import PageTransition from '../components/PageTransition'
import { calculateESGEngine, getBenchmarkText, getMetricScore, getRatingLabel, sanitizeESGMetrics } from '../utils/esgEngine'
import { ESG_INPUT_STORAGE_KEY, clearESGInputDraft, getESGInputStore } from '../utils/esgInput'
import { getAIInsights } from '../services/api'
import { createReport, fetchReportById, fetchReports, updateReport } from '../services/reportsApi'
import { removeCurrentDraft } from '../services/draftsApi'
import { downloadReportPdf } from '../services/reportExportService'
import { createReportModel } from '../utils/reportModel'

const USER_STORAGE_KEY = 'greenlytics_user'
const VIEW_MODE_STORAGE_KEY = 'greenlytics_analysis_view_mode'
const AI_INSIGHTS_CACHE_KEY = 'greenlytics_ai_insights_cache'
const MAX_AI_INSIGHTS = 3
const INDUSTRY_OPTIONS = ['IT / Tech', 'Manufacturing', 'Finance', 'Healthcare', 'Logistics', 'Energy']

function readJSON(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function toNumber(value) {
  if (value === '' || value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function formatValue(value, suffix = '') {
  const numeric = toNumber(value)
  if (numeric === null) return 'Skipped'
  return `${numeric}${suffix}`
}

function buildDefaultReportName(dateValue = new Date()) {
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return 'ESG Report'
  const datePart = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const timePart = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
  return `ESG Report - ${datePart}, ${timePart}`
}

function normalizeInsightLine(value) {
  return String(value || '')
    .replace(/^[-*•\d.)\s]+/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function dedupeInsightLines(items = []) {
  const seen = new Set()
  const output = []

  for (const item of items) {
    const normalized = normalizeInsightLine(item)
    if (!normalized) continue
    const key = normalized.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    output.push(normalized)
  }

  return output
}

function getInsightTone(text = '') {
  const value = String(text || '').toLowerCase()
  const riskKeywords = ['low', 'weak', 'risk', 'gap', 'declin', 'below target', 'poor']
  const positiveKeywords = ['strong', 'improv', 'stable', 'resilien', 'strength', 'performing well']

  if (riskKeywords.some((keyword) => value.includes(keyword))) {
    return {
      icon: AlertTriangle,
      iconClass: 'text-amber-600 dark:text-amber-400',
      containerClass: 'border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/25',
    }
  }

  if (positiveKeywords.some((keyword) => value.includes(keyword))) {
    return {
      icon: CheckCircle2,
      iconClass: 'text-emerald-600 dark:text-emerald-400',
      containerClass: 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/25',
    }
  }

  return {
    icon: Sparkles,
    iconClass: 'text-sky-600 dark:text-sky-400',
    containerClass: 'border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950',
  }
}

function buildAIInsightPayload({ report, store, industry = '', role = '' }) {
  const environmental = store?.environmental?.values || {}
  const social = store?.social?.values || {}
  const governance = store?.governance?.values || {}

  return {
    environmentalScore: report?.E_score ?? null,
    socialScore: report?.S_score ?? null,
    governanceScore: report?.G_score ?? null,
    totalScore: report?.ESG_score ?? null,
    carbonEmissions: toNumber(environmental.carbonEmissions),
    revenue: toNumber(environmental.revenue),
    renewableEnergy: toNumber(environmental.renewableEnergy),
    waterUsage: toNumber(environmental.waterUsage),
    wasteRecycling: toNumber(environmental.wasteRecycling),
    employeeSatisfaction: toNumber(social.employeeSatisfaction),
    attritionRate: toNumber(social.attritionRate),
    genderDiversity: toNumber(social.genderDiversity),
    workplaceIncidents: toNumber(social.workplaceIncidents),
    csrSpending: toNumber(social.csrSpending),
    boardIndependence: toNumber(governance.boardIndependence),
    womenOnBoard: toNumber(governance.womenOnBoard),
    ceoPayRatio: toNumber(governance.ceoPayRatio),
    fraudCases: toNumber(governance.fraudCases),
    transparencyScore: toNumber(governance.transparencyScore),
    industry: industry || null,
    role: role || null,
  }
}

function buildSupabaseSaveSignature({ report, store }) {
  try {
    return JSON.stringify({
      environmentalScore: report?.E_score ?? null,
      socialScore: report?.S_score ?? null,
      governanceScore: report?.G_score ?? null,
      totalScore: report?.ESG_score ?? null,
      input: store,
    })
  } catch {
    return null
  }
}

function deriveRowsFromInputs(inputStore = {}) {
  const environmental = inputStore.environmental?.values || {}
  const social = inputStore.social?.values || {}
  const governance = inputStore.governance?.values || {}
  const envSkipped = inputStore.environmental?.skipped || {}
  const socialSkipped = inputStore.social?.skipped || {}
  const govSkipped = inputStore.governance?.skipped || {}

  const filteredEnvironmentalRaw = {
    carbonEmissions: envSkipped.carbonEmissions ? '' : environmental.carbonEmissions,
    revenue: envSkipped.revenue ? '' : environmental.revenue,
    revenueCurrency: environmental.revenueCurrency || '₹',
    renewableEnergy: envSkipped.renewableEnergy ? '' : environmental.renewableEnergy,
    waterUsage: envSkipped.waterUsage ? '' : environmental.waterUsage,
    wasteRecycling: envSkipped.wasteRecycling ? '' : environmental.wasteRecycling,
  }

  const filteredSocialRaw = {
    employeeSatisfaction: socialSkipped.employeeSatisfaction ? '' : social.employeeSatisfaction,
    attritionRate: socialSkipped.attritionRate ? '' : social.attritionRate,
    genderDiversity: socialSkipped.genderDiversity ? '' : social.genderDiversity,
    workplaceIncidents: socialSkipped.workplaceIncidents ? '' : social.workplaceIncidents,
    csrSpending: socialSkipped.csrSpending ? '' : social.csrSpending,
  }

  const filteredGovernanceRaw = {
    boardIndependence: govSkipped.boardIndependence ? '' : governance.boardIndependence,
    womenOnBoard: govSkipped.womenOnBoard ? '' : governance.womenOnBoard,
    ceoPayRatio: govSkipped.ceoPayRatio ? '' : governance.ceoPayRatio,
    fraudCases: govSkipped.fraudCases ? '' : governance.fraudCases,
    transparencyScore: govSkipped.transparencyScore ? '' : governance.transparencyScore,
  }

  const sanitized = sanitizeESGMetrics({
    environmental: filteredEnvironmentalRaw,
    social: filteredSocialRaw,
    governance: filteredGovernanceRaw,
  })
  const filteredEnvironmental = sanitized.environmental
  const filteredSocial = sanitized.social
  const filteredGovernance = sanitized.governance

  const emissions = toNumber(filteredEnvironmental.carbonEmissions)
  const revenue = toNumber(filteredEnvironmental.revenue)
  const intensity = emissions !== null && revenue !== null && revenue > 0 ? emissions / revenue : null

  const environmentalRows = [
    {
      key: 'emissionsIntensity',
      label: 'Emissions Intensity',
      valueText: intensity === null ? 'Skipped' : Number(intensity).toFixed(4),
      benchmark: getBenchmarkText('emissionsIntensity'),
      score: getMetricScore('emissionsIntensity', intensity),
    },
    {
      key: 'renewableEnergy',
      label: 'Renewable Energy Usage',
      valueText: formatValue(filteredEnvironmental.renewableEnergy, '%'),
      benchmark: getBenchmarkText('renewableEnergy'),
      score: getMetricScore('renewableEnergy', filteredEnvironmental.renewableEnergy),
    },
    {
      key: 'waterUsage',
      label: 'Water Usage',
      valueText: formatValue(filteredEnvironmental.waterUsage),
      benchmark: getBenchmarkText('waterUsage'),
      score: getMetricScore('waterUsage', filteredEnvironmental.waterUsage),
    },
    {
      key: 'wasteRecycling',
      label: 'Waste Recycling',
      valueText: formatValue(filteredEnvironmental.wasteRecycling, '%'),
      benchmark: getBenchmarkText('wasteRecycling'),
      score: getMetricScore('wasteRecycling', filteredEnvironmental.wasteRecycling),
    },
  ].map((item) => {
    const assessment = getStatus(item.score)
    return { ...item, status: assessment.label, assessment, explanation: makeExplanation({ ...item, assessment }) }
  })

  const socialRows = [
    {
      key: 'employeeSatisfaction',
      label: 'Employee Satisfaction',
      valueText: formatValue(filteredSocial.employeeSatisfaction, '%'),
      benchmark: getBenchmarkText('employeeSatisfaction'),
      score: getMetricScore('employeeSatisfaction', filteredSocial.employeeSatisfaction),
    },
    {
      key: 'attritionRate',
      label: 'Attrition Rate',
      valueText: formatValue(filteredSocial.attritionRate, '%'),
      benchmark: getBenchmarkText('attritionRate'),
      score: getMetricScore('attritionRate', filteredSocial.attritionRate),
    },
    {
      key: 'genderDiversity',
      label: 'Gender Diversity',
      valueText: formatValue(filteredSocial.genderDiversity, '%'),
      benchmark: getBenchmarkText('genderDiversity'),
      score: getMetricScore('genderDiversity', filteredSocial.genderDiversity),
    },
    {
      key: 'workplaceIncidents',
      label: 'Workplace Incidents',
      valueText: formatValue(filteredSocial.workplaceIncidents),
      benchmark: getBenchmarkText('workplaceIncidents'),
      score: getMetricScore('workplaceIncidents', filteredSocial.workplaceIncidents),
    },
    {
      key: 'csrSpending',
      label: 'CSR Spending',
      valueText: formatValue(filteredSocial.csrSpending, '%'),
      benchmark: getBenchmarkText('csrSpending'),
      score: getMetricScore('csrSpending', filteredSocial.csrSpending),
    },
  ].map((item) => {
    const assessment = getStatus(item.score)
    return { ...item, status: assessment.label, assessment, explanation: makeExplanation({ ...item, assessment }) }
  })

  const governanceRows = [
    {
      key: 'boardIndependence',
      label: 'Board Independence',
      valueText: formatValue(filteredGovernance.boardIndependence, '%'),
      benchmark: getBenchmarkText('boardIndependence'),
      score: getMetricScore('boardIndependence', filteredGovernance.boardIndependence),
    },
    {
      key: 'womenOnBoard',
      label: 'Women on Board',
      valueText: formatValue(filteredGovernance.womenOnBoard, '%'),
      benchmark: getBenchmarkText('womenOnBoard'),
      score: getMetricScore('womenOnBoard', filteredGovernance.womenOnBoard),
    },
    {
      key: 'ceoPayRatio',
      label: 'CEO Pay Ratio',
      valueText: formatValue(filteredGovernance.ceoPayRatio),
      benchmark: getBenchmarkText('ceoPayRatio'),
      score: getMetricScore('ceoPayRatio', filteredGovernance.ceoPayRatio),
    },
    {
      key: 'fraudCases',
      label: 'Fraud Cases',
      valueText: formatValue(filteredGovernance.fraudCases),
      benchmark: getBenchmarkText('fraudCases'),
      score: getMetricScore('fraudCases', filteredGovernance.fraudCases),
    },
    {
      key: 'transparencyScore',
      label: 'Transparency Score',
      valueText: formatValue(filteredGovernance.transparencyScore, '%'),
      benchmark: getBenchmarkText('transparencyScore'),
      score: getMetricScore('transparencyScore', filteredGovernance.transparencyScore),
    },
  ].map((item) => {
    const assessment = getStatus(item.score)
    return { ...item, status: assessment.label, assessment, explanation: makeExplanation({ ...item, assessment }) }
  })

  return { environmentalRows, socialRows, governanceRows }
}

function mapStoredReport(row) {
  const environmentalScore = toNumber(row?.scores?.environmental ?? row?.environmental_score)
  const socialScore = toNumber(row?.scores?.social ?? row?.social_score)
  const governanceScore = toNumber(row?.scores?.governance ?? row?.governance_score)
  const totalScore = toNumber(row?.scores?.total ?? row?.total_score)
  const rating = row?.data?.report?.rating || getRatingLabel(totalScore, 'overall')

  const fallbackRows = deriveRowsFromInputs(row?.inputs || {})
  const storedEnvironmentalRows = Array.isArray(row?.data?.breakdown?.environmental) ? row.data.breakdown.environmental : []
  const storedSocialRows = Array.isArray(row?.data?.breakdown?.social) ? row.data.breakdown.social : []
  const storedGovernanceRows = Array.isArray(row?.data?.breakdown?.governance) ? row.data.breakdown.governance : []

  return {
    id: row?._id || row?.id || `${row?.createdAt || row?.created_at || Date.now()}`,
    createdAt: row?.createdAt || row?.created_at || '',
    industry: row?.industry || row?.data?.user?.industry || row?.data?.industry || null,
    aiInsightsText:
      typeof row?.data?.aiInsights === 'string'
        ? row.data.aiInsights
        : Array.isArray(row?.data?.aiStructured?.insights)
          ? row.data.aiStructured.insights.join('\n')
          : '',
    aiRecommendations: Array.isArray(row?.data?.aiRecommendations)
      ? row.data.aiRecommendations
      : Array.isArray(row?.data?.aiStructured?.recommendations)
        ? row.data.aiStructured.recommendations
        : [],
    aiQuickInsights: Array.isArray(row?.data?.aiQuickInsights)
      ? row.data.aiQuickInsights
      : Array.isArray(row?.data?.aiStructured?.quickInsights)
        ? row.data.aiStructured.quickInsights
        : [],
    rows: {
      environmental: storedEnvironmentalRows.length ? storedEnvironmentalRows : fallbackRows.environmentalRows,
      social: storedSocialRows.length ? storedSocialRows : fallbackRows.socialRows,
      governance: storedGovernanceRows.length ? storedGovernanceRows : fallbackRows.governanceRows,
    },
    report: {
      E_score: environmentalScore,
      S_score: socialScore,
      G_score: governanceScore,
      ESG_score: totalScore,
      rating,
    },
    raw: row,
  }
}

function MiniTrend({ points }) {
  if (!Array.isArray(points) || points.length < 2) return null
  const width = 240
  const height = 56
  const values = points.map((value) => Math.max(0, Math.min(100, Number(value) || 0)))
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const d = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width
      const y = height - ((value - min) / range) * (height - 8) - 4
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(' ')

  const last = values[values.length - 1]
  const prev = values[values.length - 2]
  const improving = last >= prev

  return (
    <div className='rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950'>
      <div className='mb-2 flex items-center justify-between text-xs'>
        <span className='text-zinc-600 dark:text-zinc-300'>Recent ESG Trend</span>
        <span className={improving ? 'font-semibold text-emerald-600 dark:text-emerald-400' : 'font-semibold text-rose-600 dark:text-rose-400'}>
          {improving ? 'Improving' : 'Declining'}
        </span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className='h-14 w-full'>
        <path d={d} fill='none' stroke={improving ? 'rgb(16 185 129)' : 'rgb(244 63 94)'} strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
      </svg>
    </div>
  )
}

function getStatus(score) {
  const label = getRatingLabel(score, 'metric')
  if (label === 'Insufficient Data') {
    return {
      label: 'No data',
      message: 'Insufficient data for reliable assessment.',
      badgeClass: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
      barClass: 'bg-zinc-400',
    }
  }
  if (label === 'Excellent') {
    return {
      label: 'Excellent',
      message: 'Excellent performance',
      badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
      barClass: 'bg-emerald-500',
    }
  }
  if (label === 'Good') {
    return {
      label: 'Good',
      message: 'Good, but can be improved',
      badgeClass: 'bg-lime-100 text-lime-800 dark:bg-lime-900/40 dark:text-lime-300',
      barClass: 'bg-lime-500',
    }
  }
  if (label === 'Average') {
    return {
      label: 'Average',
      message: 'Needs improvement',
      badgeClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
      barClass: 'bg-yellow-500',
    }
  }
  if (label === 'Poor') {
    return {
      label: 'Poor',
      message: 'Needs improvement',
      badgeClass: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
      barClass: 'bg-orange-500',
    }
  }
  return {
    label: 'Critical issue',
    message: 'Critical issue',
    badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
    barClass: 'bg-rose-500',
  }
}

function makeExplanation({ label, valueText, benchmark, assessment, best, worst }) {
  if (valueText === 'Skipped') return `${label} was skipped. Add this metric for a more accurate benchmark comparison.`

  const directionHint =
    Number.isFinite(best) && Number.isFinite(worst)
      ? best < worst
        ? 'Lower values are better for this metric.'
        : 'Higher values are better for this metric.'
      : ''

  return `Your ${label.toLowerCase()} is ${valueText}. Benchmark target is ${benchmark}. ${assessment.message}.${directionHint ? ` ${directionHint}` : ''}`
}

function getIndustryAverage(industry) {
  const defaults = { ESG: 62, E: 60, S: 63, G: 64 }
  const table = {
    IT: { ESG: 72, E: 70, S: 74, G: 71 },
    'IT / Tech': { ESG: 72, E: 70, S: 74, G: 71 },
    Manufacturing: { ESG: 58, E: 54, S: 60, G: 59 },
    Finance: { ESG: 70, E: 67, S: 72, G: 71 },
    Healthcare: { ESG: 64, E: 61, S: 66, G: 65 },
    Logistics: { ESG: 56, E: 52, S: 58, G: 57 },
    Energy: { ESG: 50, E: 46, S: 53, G: 54 },
  }
  return table[industry] || defaults
}

function RadarChart({ values }) {
  const size = 220
  const center = size / 2
  const radius = 78
  const angleStep = (Math.PI * 2) / 3

  const getPoint = (value, index) => {
    const angle = -Math.PI / 2 + angleStep * index
    const pointRadius = (Math.max(0, Math.min(100, value)) / 100) * radius
    return {
      x: center + Math.cos(angle) * pointRadius,
      y: center + Math.sin(angle) * pointRadius,
    }
  }

  const points = [values.E ?? 0, values.S ?? 0, values.G ?? 0].map((value, index) => getPoint(value, index))
  const polygon = points.map((point) => `${point.x},${point.y}`).join(' ')
  const axisLabels = ['E', 'S', 'G']

  return (
    <div className='mx-auto w-full max-w-[260px]'>
      <svg viewBox={`0 0 ${size} ${size}`} className='h-auto w-full'>
        {[1, 2, 3, 4].map((ring) => {
          const ringRadius = (radius * ring) / 4
          const ringPoints = [0, 1, 2]
            .map((index) => {
              const angle = -Math.PI / 2 + angleStep * index
              return `${center + Math.cos(angle) * ringRadius},${center + Math.sin(angle) * ringRadius}`
            })
            .join(' ')
          return <polygon key={ring} points={ringPoints} fill='none' stroke='rgb(161 161 170 / 0.35)' strokeWidth='1' />
        })}

        {[0, 1, 2].map((index) => {
          const angle = -Math.PI / 2 + angleStep * index
          return (
            <line
              key={index}
              x1={center}
              y1={center}
              x2={center + Math.cos(angle) * radius}
              y2={center + Math.sin(angle) * radius}
              stroke='rgb(161 161 170 / 0.45)'
              strokeWidth='1'
            />
          )
        })}

        <polygon points={polygon} fill='rgb(34 197 94 / 0.28)' stroke='rgb(34 197 94)' strokeWidth='2' />

        {points.map((point, index) => (
          <g key={axisLabels[index]}>
            <circle cx={point.x} cy={point.y} r='3.8' fill='rgb(21 128 61)' />
            <text
              x={center + Math.cos(-Math.PI / 2 + angleStep * index) * (radius + 18)}
              y={center + Math.sin(-Math.PI / 2 + angleStep * index) * (radius + 18)}
              textAnchor='middle'
              dominantBaseline='middle'
              className='fill-zinc-500 text-[10px] font-semibold'
            >
              {axisLabels[index]}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

function PillarSection({ title, icon, open, onToggle, score, rows }) {
  const IconComponent = icon
  return (
    <Card>
      <button type='button' onClick={onToggle} className='flex w-full items-center justify-between gap-4 text-left'>
        <div className='flex items-center gap-3'>
          <span className='inline-flex rounded-xl bg-zinc-100 p-2 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200'>
            <IconComponent size={18} />
          </span>
          <div>
            <h3 className='text-xl font-bold text-zinc-900 dark:text-white'>{title}</h3>
            <p className='text-sm text-zinc-600 dark:text-zinc-300'>Pillar score: {Number.isFinite(score) ? score : '--'}</p>
          </div>
        </div>
        {open ? <ChevronUp size={18} className='text-zinc-500' /> : <ChevronDown size={18} className='text-zinc-500' />}
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <Motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            className='mt-5 overflow-hidden'
          >
            <div className='grid gap-4 md:grid-cols-2'>
              {rows.map((row) => (
                <MetricCard key={row.key} row={row} />
              ))}
            </div>
          </Motion.div>
        ) : null}
      </AnimatePresence>
    </Card>
  )
}

function Analysis() {
  const { id: analysisId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const hasRequestedAIRef = useRef(false)
  const [openSections, setOpenSections] = useState({ E: true, S: false, G: false })
  const [comparisonMode, setComparisonMode] = useState(false)
  const [viewMode, setViewMode] = useState(() => localStorage.getItem(VIEW_MODE_STORAGE_KEY) || 'advanced')
  const [aiQuickInsights, setAiQuickInsights] = useState([])
  const [aiInsights, setAiInsights] = useState([])
  const [aiRecommendations, setAiRecommendations] = useState([])
  const [isAiInsightsLoading, setIsAiInsightsLoading] = useState(false)
  const [aiInsightsError, setAiInsightsError] = useState('')
  const [isInsightsModalOpen, setIsInsightsModalOpen] = useState(false)
  const [showReportSaved, setShowReportSaved] = useState(false)
  const [reportSaveError, setReportSaveError] = useState('')
  const [isSavingReport, setIsSavingReport] = useState(false)
  const [previousReports, setPreviousReports] = useState([])
  const [isHistoryLoading, setIsHistoryLoading] = useState(true)
  const [historyError, setHistoryError] = useState('')
  const [selectedReportId, setSelectedReportId] = useState(null)
  const [loadedBundle, setLoadedBundle] = useState(null)
  const [selectedIndustry, setSelectedIndustry] = useState('')

  const { user, store, report, environmentalRows, socialRows, governanceRows } = useMemo(() => {
    const userData = readJSON(USER_STORAGE_KEY) || {}
    const inputStore = getESGInputStore()
    const environmental = inputStore.environmental?.values || {}
    const social = inputStore.social?.values || {}
    const governance = inputStore.governance?.values || {}
    const envSkipped = inputStore.environmental?.skipped || {}
    const socialSkipped = inputStore.social?.skipped || {}
    const govSkipped = inputStore.governance?.skipped || {}

    const filteredEnvironmentalRaw = {
      carbonEmissions: envSkipped.carbonEmissions ? '' : environmental.carbonEmissions,
      revenue: envSkipped.revenue ? '' : environmental.revenue,
      revenueCurrency: environmental.revenueCurrency || '₹',
      renewableEnergy: envSkipped.renewableEnergy ? '' : environmental.renewableEnergy,
      waterUsage: envSkipped.waterUsage ? '' : environmental.waterUsage,
      wasteRecycling: envSkipped.wasteRecycling ? '' : environmental.wasteRecycling,
    }
    const filteredSocialRaw = {
      employeeSatisfaction: socialSkipped.employeeSatisfaction ? '' : social.employeeSatisfaction,
      attritionRate: socialSkipped.attritionRate ? '' : social.attritionRate,
      genderDiversity: socialSkipped.genderDiversity ? '' : social.genderDiversity,
      workplaceIncidents: socialSkipped.workplaceIncidents ? '' : social.workplaceIncidents,
      csrSpending: socialSkipped.csrSpending ? '' : social.csrSpending,
    }
    const filteredGovernanceRaw = {
      boardIndependence: govSkipped.boardIndependence ? '' : governance.boardIndependence,
      womenOnBoard: govSkipped.womenOnBoard ? '' : governance.womenOnBoard,
      ceoPayRatio: govSkipped.ceoPayRatio ? '' : governance.ceoPayRatio,
      fraudCases: govSkipped.fraudCases ? '' : governance.fraudCases,
      transparencyScore: govSkipped.transparencyScore ? '' : governance.transparencyScore,
    }

    const sanitized = sanitizeESGMetrics({
      environmental: filteredEnvironmentalRaw,
      social: filteredSocialRaw,
      governance: filteredGovernanceRaw,
    })
    const filteredEnvironmental = sanitized.environmental
    const filteredSocial = sanitized.social
    const filteredGovernance = sanitized.governance

    const scoreReport = calculateESGEngine({
      industry: userData.industry,
      companySize: userData.companySize,
      name: userData.name,
      environmental: filteredEnvironmental,
      social: filteredSocial,
      governance: filteredGovernance,
    })

    const emissions = toNumber(filteredEnvironmental.carbonEmissions)
    const revenue = toNumber(filteredEnvironmental.revenue)
    const intensity = emissions !== null && revenue !== null && revenue > 0 ? emissions / revenue : null

    const eRows = [
      {
        key: 'emissionsIntensity',
        label: 'Emissions Intensity',
        valueText: intensity === null ? 'Skipped' : Number(intensity).toFixed(4),
        benchmark: getBenchmarkText('emissionsIntensity'),
        score: getMetricScore('emissionsIntensity', intensity),
        suggestionTarget: 'Reduce emissions intensity toward 50% of your current baseline',
      },
      {
        key: 'renewableEnergy',
        label: 'Renewable Energy Usage',
        valueText: formatValue(filteredEnvironmental.renewableEnergy, '%'),
        benchmark: getBenchmarkText('renewableEnergy'),
        score: getMetricScore('renewableEnergy', filteredEnvironmental.renewableEnergy),
        suggestionTarget: 'Increase renewable energy to 50%',
      },
      {
        key: 'waterUsage',
        label: 'Water Usage',
        valueText: formatValue(filteredEnvironmental.waterUsage),
        benchmark: getBenchmarkText('waterUsage'),
        score: getMetricScore('waterUsage', filteredEnvironmental.waterUsage),
        suggestionTarget: 'Reduce water usage by 20%',
      },
      {
        key: 'wasteRecycling',
        label: 'Waste Recycling',
        valueText: formatValue(filteredEnvironmental.wasteRecycling, '%'),
        benchmark: getBenchmarkText('wasteRecycling'),
        score: getMetricScore('wasteRecycling', filteredEnvironmental.wasteRecycling),
        suggestionTarget: 'Increase waste recycling to 65%',
      },
    ].map((item) => {
      const assessment = getStatus(item.score)
      return { ...item, status: assessment.label, assessment, explanation: makeExplanation({ ...item, assessment }) }
    })

    const sRows = [
      {
        key: 'employeeSatisfaction',
        label: 'Employee Satisfaction',
        valueText: formatValue(filteredSocial.employeeSatisfaction, '%'),
        benchmark: getBenchmarkText('employeeSatisfaction'),
        score: getMetricScore('employeeSatisfaction', filteredSocial.employeeSatisfaction),
        suggestionTarget: 'Raise employee satisfaction above 75%',
      },
      {
        key: 'attritionRate',
        label: 'Attrition Rate',
        valueText: formatValue(filteredSocial.attritionRate, '%'),
        benchmark: getBenchmarkText('attritionRate'),
        score: getMetricScore('attritionRate', filteredSocial.attritionRate),
        suggestionTarget: 'Reduce attrition by 3-5 percentage points',
      },
      {
        key: 'genderDiversity',
        label: 'Gender Diversity',
        valueText: formatValue(filteredSocial.genderDiversity, '%'),
        benchmark: getBenchmarkText('genderDiversity'),
        score: getMetricScore('genderDiversity', filteredSocial.genderDiversity),
        suggestionTarget: 'Move gender diversity closer to 50%',
      },
      {
        key: 'workplaceIncidents',
        label: 'Workplace Incidents',
        valueText: formatValue(filteredSocial.workplaceIncidents),
        benchmark: getBenchmarkText('workplaceIncidents'),
        score: getMetricScore('workplaceIncidents', filteredSocial.workplaceIncidents),
        suggestionTarget: 'Lower workplace incidents with quarterly safety programs',
      },
      {
        key: 'csrSpending',
        label: 'CSR Spending',
        valueText: formatValue(filteredSocial.csrSpending, '%'),
        benchmark: getBenchmarkText('csrSpending'),
        score: getMetricScore('csrSpending', filteredSocial.csrSpending),
        suggestionTarget: 'Increase CSR spending to 2%',
      },
    ].map((item) => {
      const assessment = getStatus(item.score)
      return { ...item, status: assessment.label, assessment, explanation: makeExplanation({ ...item, assessment }) }
    })

    const gRows = [
      {
        key: 'boardIndependence',
        label: 'Board Independence',
        valueText: formatValue(filteredGovernance.boardIndependence, '%'),
        benchmark: getBenchmarkText('boardIndependence'),
        score: getMetricScore('boardIndependence', filteredGovernance.boardIndependence),
        suggestionTarget: 'Improve board independence to 65%+',
      },
      {
        key: 'womenOnBoard',
        label: 'Women on Board',
        valueText: formatValue(filteredGovernance.womenOnBoard, '%'),
        benchmark: getBenchmarkText('womenOnBoard'),
        score: getMetricScore('womenOnBoard', filteredGovernance.womenOnBoard),
        suggestionTarget: 'Increase women on board to at least 35%',
      },
      {
        key: 'ceoPayRatio',
        label: 'CEO Pay Ratio',
        valueText: formatValue(filteredGovernance.ceoPayRatio),
        benchmark: getBenchmarkText('ceoPayRatio'),
        score: getMetricScore('ceoPayRatio', filteredGovernance.ceoPayRatio),
        suggestionTarget: 'Reduce CEO pay ratio through compensation balancing',
      },
      {
        key: 'fraudCases',
        label: 'Fraud Cases',
        valueText: formatValue(filteredGovernance.fraudCases),
        benchmark: getBenchmarkText('fraudCases'),
        score: getMetricScore('fraudCases', filteredGovernance.fraudCases),
        suggestionTarget: 'Drive fraud cases to zero with stronger controls',
      },
      {
        key: 'transparencyScore',
        label: 'Transparency Score',
        valueText: formatValue(filteredGovernance.transparencyScore, '%'),
        benchmark: getBenchmarkText('transparencyScore'),
        score: getMetricScore('transparencyScore', filteredGovernance.transparencyScore),
        suggestionTarget: 'Increase disclosure quality to 80%+',
      },
    ].map((item) => {
      const assessment = getStatus(item.score)
      return { ...item, status: assessment.label, assessment, explanation: makeExplanation({ ...item, assessment }) }
    })

    return {
      user: userData,
      store: inputStore,
      report: scoreReport,
      environmentalRows: eRows,
      socialRows: sRows,
      governanceRows: gRows,
    }
  }, [])

  const activeReport = loadedBundle?.report || report
  const activeRows = useMemo(
    () => ({
      environmental:
        Array.isArray(loadedBundle?.rows?.environmental) && loadedBundle.rows.environmental.length
          ? loadedBundle.rows.environmental
          : environmentalRows,
      social: Array.isArray(loadedBundle?.rows?.social) && loadedBundle.rows.social.length ? loadedBundle.rows.social : socialRows,
      governance:
        Array.isArray(loadedBundle?.rows?.governance) && loadedBundle.rows.governance.length ? loadedBundle.rows.governance : governanceRows,
    }),
    [environmentalRows, governanceRows, loadedBundle, socialRows],
  )

  useEffect(() => {
    if (selectedIndustry) return
    setSelectedIndustry(loadedBundle?.industry || user?.industry || INDUSTRY_OPTIONS[0])
  }, [loadedBundle?.industry, selectedIndustry, user?.industry])

  const industryAverage = useMemo(() => getIndustryAverage(selectedIndustry || user?.industry), [selectedIndustry, user?.industry])
  const riskAlerts = useMemo(() => {
    return [...activeRows.environmental, ...activeRows.social, ...activeRows.governance]
      .filter((item) => item.status === 'Critical issue')
      .slice(0, 6)
      .map((item) => `${item.label}: ${item.explanation}`)
  }, [activeRows])
  const hasDataQualityIssue = Boolean(report?.metadata?.hasDataQualityIssue)
  const analysisSignature = useMemo(() => buildSupabaseSaveSignature({ report, store }), [report, store])

  useEffect(() => {
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode)
  }, [viewMode])

  useEffect(() => {
    if (hasRequestedAIRef.current) return
    hasRequestedAIRef.current = true

    const fetchInsights = async () => {
      const cacheKey = `sig:${analysisSignature || 'current'}`
      const existingCache = readJSON(AI_INSIGHTS_CACHE_KEY) || {}
      const cached = existingCache[cacheKey]
      if (Array.isArray(cached?.insights) || Array.isArray(cached?.recommendations) || Array.isArray(cached?.quickInsights)) {
        setAiQuickInsights(dedupeInsightLines(Array.isArray(cached?.quickInsights) ? cached.quickInsights : []))
        setAiInsights(dedupeInsightLines(Array.isArray(cached?.insights) ? cached.insights : []))
        setAiRecommendations(dedupeInsightLines(Array.isArray(cached?.recommendations) ? cached.recommendations : []))
        return
      }

      if (typeof cached === 'string' && cached.trim()) {
        const legacyInsights = cached
          .split('\n')
          .map((line) => line.replace(/^[-*•\d.)\s]+/, '').trim())
          .filter(Boolean)
        setAiQuickInsights(dedupeInsightLines(legacyInsights.slice(0, 3)))
        setAiInsights(dedupeInsightLines(legacyInsights))
        setAiRecommendations([])
        return
      }

      setIsAiInsightsLoading(true)
      setAiInsightsError('')

      try {
        const payload = buildAIInsightPayload({
          report,
          store,
          industry: loadedBundle?.industry || user?.industry || '',
          role: user?.role || loadedBundle?.raw?.role || '',
        })
        const aiResult = await getAIInsights(payload)
        const nextQuickInsights = dedupeInsightLines(Array.isArray(aiResult?.quickInsights) ? aiResult.quickInsights : [])
        const nextInsights = dedupeInsightLines(Array.isArray(aiResult?.insights) ? aiResult.insights : [])
        const nextRecommendations = dedupeInsightLines(Array.isArray(aiResult?.recommendations) ? aiResult.recommendations : [])
        setAiQuickInsights(nextQuickInsights)
        setAiInsights(nextInsights)
        setAiRecommendations(nextRecommendations)
        localStorage.setItem(
          AI_INSIGHTS_CACHE_KEY,
          JSON.stringify({
            ...existingCache,
            [cacheKey]: {
              quickInsights: nextQuickInsights,
              insights: nextInsights,
              recommendations: nextRecommendations,
            },
          }),
        )
      } catch {
        setAiQuickInsights([])
        setAiInsights([])
        setAiRecommendations([])
        setAiInsightsError('Unable to generate AI insights right now. Please try again shortly.')
      } finally {
        setIsAiInsightsLoading(false)
      }
    }

    fetchInsights()
  }, [analysisSignature, loadedBundle?.industry, loadedBundle?.raw?.role, report, store, user?.industry, user?.role])

  useEffect(() => {
    ;(async () => {
      setIsHistoryLoading(true)
      setHistoryError('')
      try {
        const reports = await fetchReports()
        setPreviousReports(reports.map(mapStoredReport))
      } catch (error) {
        setHistoryError(error.message || 'Unable to load report history.')
        setPreviousReports([])
      } finally {
        setIsHistoryLoading(false)
      }
    })()
  }, [])

  useEffect(() => {
    if (!analysisId || location.state?.fromEdit) return

    ;(async () => {
      try {
        const report = await fetchReportById(analysisId)
        const mapped = mapStoredReport(report)
        setSelectedReportId(mapped.id)
        setLoadedBundle(mapped)
      } catch {
        // Keep local computed report as fallback when direct fetch fails.
      }
    })()
  }, [analysisId, location.state?.fromEdit])

  const normalizedScore = Math.max(0, Math.min(100, activeReport.ESG_score ?? 0))
  const meterRadius = 62
  const meterCircumference = 2 * Math.PI * meterRadius
  const meterOffset = meterCircumference * (1 - normalizedScore / 100)

  const scoreColor =
    activeReport.rating === 'Excellent'
      ? '#10b981'
      : activeReport.rating === 'Good'
        ? '#22c55e'
        : activeReport.rating === 'Average'
          ? '#f97316'
          : '#ef4444'

  const pillarBars = [
    { label: 'Environmental', value: activeReport.E_score ?? 0, color: 'bg-emerald-500' },
    { label: 'Social', value: activeReport.S_score ?? 0, color: 'bg-sky-500' },
    { label: 'Governance', value: activeReport.G_score ?? 0, color: 'bg-violet-500' },
  ]
  const activeInsightsList = useMemo(
    () => {
      const items = loadedBundle?.aiInsightsText
        ? loadedBundle.aiInsightsText
            .split('\n')
            .map((line) => line.replace(/^[-*•\d.)\s]+/, '').trim())
            .filter(Boolean)
        : Array.isArray(aiInsights)
          ? aiInsights
          : []

      return dedupeInsightLines(items)
    },
    [aiInsights, loadedBundle?.aiInsightsText],
  )
  const activeQuickInsights = useMemo(
    () =>
      dedupeInsightLines(
        Array.isArray(loadedBundle?.aiQuickInsights) && loadedBundle.aiQuickInsights.length
          ? loadedBundle.aiQuickInsights
          : aiQuickInsights,
      ),
    [aiQuickInsights, loadedBundle?.aiQuickInsights],
  )
  const activeRecommendations = useMemo(
    () =>
      dedupeInsightLines(
        Array.isArray(loadedBundle?.aiRecommendations) && loadedBundle.aiRecommendations.length ? loadedBundle.aiRecommendations : aiRecommendations,
      ),
    [aiRecommendations, loadedBundle?.aiRecommendations],
  )
  const unifiedReportModel = useMemo(
    () =>
      createReportModel({
        _id: loadedBundle?.id || analysisId || `analysis-${Date.now()}`,
        reportName: loadedBundle?.raw?.reportName || buildDefaultReportName(),
        createdAt: loadedBundle?.createdAt || new Date().toISOString(),
        industry: loadedBundle?.industry || user?.industry || '',
        role: user?.role || loadedBundle?.raw?.role || '',
        scores: {
          environmental: activeReport?.E_score ?? 0,
          social: activeReport?.S_score ?? 0,
          governance: activeReport?.G_score ?? 0,
          total: activeReport?.ESG_score ?? 0,
        },
        quickInsights: activeQuickInsights,
        insights: activeInsightsList,
        recommendations: activeRecommendations,
        data: {
          aiQuickInsights: activeQuickInsights,
          aiInsights: activeInsightsList.join('\n'),
          aiRecommendations: activeRecommendations,
          aiStructured: {
            quickInsights: activeQuickInsights,
            insights: activeInsightsList,
            recommendations: activeRecommendations,
          },
        },
      }),
    [activeInsightsList, activeQuickInsights, activeRecommendations, activeReport, analysisId, loadedBundle, user?.industry, user?.role],
  )
  const aiInsightItems = useMemo(() => (unifiedReportModel.insights || []).slice(0, 4), [unifiedReportModel.insights])
  const recommendationItems = useMemo(() => (unifiedReportModel.recommendations || []).slice(0, 3), [unifiedReportModel.recommendations])
  const quickSummaryItems = useMemo(() => (unifiedReportModel.quickInsights || []).slice(0, 3), [unifiedReportModel.quickInsights])
  const pillarSummaryCards = useMemo(
    () => [
      { key: 'E', label: 'Environmental', value: activeReport?.E_score ?? 0 },
      { key: 'S', label: 'Social', value: activeReport?.S_score ?? 0 },
      { key: 'G', label: 'Governance', value: activeReport?.G_score ?? 0 },
    ],
    [activeReport?.E_score, activeReport?.G_score, activeReport?.S_score],
  )
  const isViewingSavedReport = Boolean(analysisId) && !location.state?.fromEdit
  const isDraftAnalysis = !isViewingSavedReport

  const handleSaveReport = async () => {
    setIsSavingReport(true)
    setReportSaveError('')

    try {
      const payload = {
        reportName: loadedBundle?.raw?.reportName || buildDefaultReportName(),
        industry: user?.industry || '',
        role: user?.role || '',
        companySize: user?.companySize || '',
        region: user?.region || '',
        scores: {
          environmental: report?.E_score ?? 0,
          social: report?.S_score ?? 0,
          governance: report?.G_score ?? 0,
          total: report?.ESG_score ?? 0,
        },
        inputs: store,
        data: {
          reportName: loadedBundle?.raw?.reportName || buildDefaultReportName(),
          report,
          breakdown: {
            environmental: environmentalRows,
            social: socialRows,
            governance: governanceRows,
          },
          aiInsights: (unifiedReportModel.insights || []).join('\n'),
          aiQuickInsights: unifiedReportModel.quickInsights || [],
          aiRecommendations: unifiedReportModel.recommendations || [],
          aiStructured: {
            quickInsights: unifiedReportModel.quickInsights || [],
            insights: unifiedReportModel.insights || [],
            recommendations: unifiedReportModel.recommendations || [],
          },
        },
      }

      const saved = analysisId ? await updateReport(analysisId, payload) : await createReport(payload)
      await removeCurrentDraft().catch(() => {})
      clearESGInputDraft()

      const mapped = mapStoredReport(saved)
      setPreviousReports((prev) => {
        const next = [mapped, ...prev.filter((item) => item.id !== mapped.id)]
        return next.slice(0, 10)
      })
      setShowReportSaved(true)
      setTimeout(() => setShowReportSaved(false), 2200)

      const nextId = saved?._id || analysisId
      if (nextId) {
        navigate(`/analysis/${nextId}`, { replace: true })
      } else {
        navigate('/reports', { replace: true })
      }
    } catch (error) {
      setReportSaveError(error?.message || 'Unable to save report to backend.')
    } finally {
      setIsSavingReport(false)
    }
  }

  const handleDiscardDraft = async () => {
    await removeCurrentDraft().catch(() => {})
    clearESGInputDraft()
    navigate('/dashboard')
  }

  const handleDownloadReport = async () => {
    await downloadReportPdf({
      _id: unifiedReportModel.id,
      reportName: unifiedReportModel.name,
      createdAt: unifiedReportModel.date,
      industry: unifiedReportModel.industry,
      role: unifiedReportModel.role,
      scores: {
        total: unifiedReportModel.esgScore,
        environmental: unifiedReportModel.environmental,
        social: unifiedReportModel.social,
        governance: unifiedReportModel.governance,
      },
      insights: unifiedReportModel.insights,
      quickInsights: unifiedReportModel.quickInsights,
      recommendations: unifiedReportModel.recommendations,
      data: {
        aiInsights: (unifiedReportModel.insights || []).join('\n'),
        aiQuickInsights: unifiedReportModel.quickInsights || [],
        aiRecommendations: unifiedReportModel.recommendations || [],
        aiStructured: {
          quickInsights: unifiedReportModel.quickInsights || [],
          insights: unifiedReportModel.insights || [],
          recommendations: unifiedReportModel.recommendations || [],
        },
      },
    })
  }

  return (
    <PageTransition>
      <section className='mx-auto w-full max-w-5xl px-4 py-16 md:px-6'>
        <div className='mb-6 max-w-3xl'>
          <h1 className='text-2xl font-semibold text-zinc-900 dark:text-white'>ESG Analysis Result</h1>
          {isDraftAnalysis ? (
            <>
              <p className='mt-1 text-sm font-medium text-amber-700 dark:text-amber-300'>Analysis not saved yet</p>
              <p className='mt-1 text-xs text-zinc-500 dark:text-zinc-400'>Save this analysis to add it to your reports.</p>
            </>
          ) : null}
          {hasDataQualityIssue ? (
            <div className='mt-2 inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200'>
              Data Quality Issue
            </div>
          ) : null}
          <div className='mt-4 flex items-center gap-3'>
            <div className='inline-flex rounded-xl border border-gray-200 bg-gray-100 p-1 dark:border-zinc-700 dark:bg-zinc-800'>
              {[
                { key: 'simple', label: 'Simple' },
                { key: 'advanced', label: 'Advanced' },
              ].map((mode) => (
                <Motion.button
                  key={mode.key}
                  type='button'
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setViewMode(mode.key)}
                  className={
                    'relative rounded-lg px-3 py-1.5 text-xs font-semibold transition ' +
                    (viewMode === mode.key
                      ? 'text-white'
                      : 'text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-100')
                  }
                >
                  {viewMode === mode.key ? (
                    <Motion.span
                      layoutId='analysis-view-mode-pill'
                      className='absolute inset-0 z-0 rounded-lg bg-black'
                      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                    />
                  ) : null}
                  <span className='relative z-10'>{mode.label}</span>
                </Motion.button>
              ))}
            </div>

            <div className='mx-2 h-6 w-px bg-gray-300 dark:bg-zinc-700' />

            <Motion.button
              type='button'
              role='switch'
              aria-checked={comparisonMode}
              whileTap={{ scale: 0.97 }}
              onClick={() => setComparisonMode((prev) => !prev)}
              className='inline-flex items-center gap-2 text-sm font-medium text-gray-700 transition hover:text-black dark:text-zinc-200 dark:hover:text-white'
            >
              <span>Industry comparision</span>
              <span className={'relative h-5 w-10 rounded-full transition-colors ' + (comparisonMode ? 'bg-black' : 'bg-gray-300 dark:bg-zinc-700')}>
                <Motion.span
                  animate={{ x: comparisonMode ? 20 : 0 }}
                  transition={{ type: 'spring', stiffness: 340, damping: 26 }}
                  className='absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white'
                />
              </span>
            </Motion.button>
          </div>
        </div>

        <div className='grid gap-6 lg:grid-cols-[1.1fr_1fr]'>
          <div>
            <Motion.div key={selectedReportId || 'current-live'} initial={{ opacity: 0.6, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}>
              <Card>
              <div className='mt-5 grid items-center gap-6 md:grid-cols-[auto_1fr]'>
              <div className='flex justify-center'>
                <div className='relative h-40 w-40'>
                  <svg className='h-40 w-40 -rotate-90' viewBox='0 0 160 160'>
                    <circle cx='80' cy='80' r={meterRadius} fill='none' stroke='rgba(161,161,170,0.25)' strokeWidth='14' />
                    <Motion.circle
                      cx='80'
                      cy='80'
                      r={meterRadius}
                      fill='none'
                      stroke={scoreColor}
                      strokeWidth='14'
                      strokeLinecap='round'
                      strokeDasharray={meterCircumference}
                      initial={{ strokeDashoffset: meterCircumference }}
                      animate={{ strokeDashoffset: meterOffset }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </svg>
                  <div className='absolute inset-0 flex flex-col items-center justify-center text-center'>
                    <p className='text-4xl font-extrabold text-zinc-900 dark:text-white'>{activeReport.ESG_score ?? '--'}</p>
                    <p className='text-xs text-zinc-500 dark:text-zinc-400'>ESG Score</p>
                  </div>
                </div>
              </div>

              <div>
                <p className='text-sm text-zinc-600 dark:text-zinc-300'>
                  {user.name ? `Welcome, ${user.name}.` : 'Welcome.'} Your current rating is{' '}
                  <span className='font-semibold text-zinc-900 dark:text-white'>{activeReport.rating}</span>.
                </p>

                <div className='mt-5 space-y-3'>
                  {pillarBars.map((bar) => (
                    <div key={bar.label}>
                      <div className='mb-1 flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-300'>
                        <span>{bar.label}</span>
                        <span>{Number.isFinite(bar.value) ? bar.value : '--'}</span>
                      </div>
                      <div className='h-2.5 rounded-full bg-zinc-200 dark:bg-zinc-800'>
                        <div className={`${bar.color} h-full rounded-full`} style={{ width: `${Math.max(4, Math.min(100, bar.value))}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

              <div className='mt-7 flex flex-wrap gap-3'>
                {isDraftAnalysis ? (
                  <>
                    <Button type='button' onClick={handleSaveReport} disabled={isSavingReport} className='inline-flex items-center gap-2'>
                      <Save size={16} />
                      {isSavingReport ? 'Saving...' : 'Save Report'}
                    </Button>
                    <Button
                      type='button'
                      onClick={() =>
                        navigate('/esg-input/environmental', {
                          state: {
                            reportId: loadedBundle?.id || analysisId || null,
                            reportInputs: loadedBundle?.raw?.inputs || store,
                          },
                        })
                      }
                      className='inline-flex items-center gap-2 bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100'
                    >
                      <Pencil size={16} />
                      Edit Inputs
                    </Button>
                    <Button type='button' onClick={handleDiscardDraft} className='inline-flex items-center gap-2 bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100'>
                      <Trash2 size={16} />
                      Discard Draft
                    </Button>
                  </>
                ) : (
                  <>
                    <div className='flex w-full flex-wrap gap-3'>
                      <Button type='button' onClick={() => navigate('/dashboard')} className='inline-flex items-center gap-2'>
                        <LayoutDashboard size={16} />
                        Back to Dashboard
                      </Button>
                      <Button
                        type='button'
                        onClick={() =>
                          navigate('/esg-input/environmental', {
                            state: {
                              reportId: loadedBundle?.id || analysisId || null,
                              reportInputs: loadedBundle?.raw?.inputs || store,
                            },
                          })
                        }
                        className='inline-flex items-center gap-2 bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100'
                      >
                        <Pencil size={16} />
                        Edit Inputs
                      </Button>
                    </div>

                    <Button
                      type='button'
                      onClick={handleDownloadReport}
                      className='inline-flex w-full items-center justify-center gap-2'
                    >
                      <Download size={16} />
                      Download ESG Report
                    </Button>
                  </>
                )}
              </div>

              <div className='mt-5 rounded-2xl bg-zinc-100/80 p-4 dark:bg-zinc-800/50'>
                <p className='text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400'>Quick Insights</p>
                <div className='mt-3 space-y-2'>
                  {quickSummaryItems.length ? (
                    quickSummaryItems.map((insight, index) => {
                      const tone = getInsightTone(insight)
                      const ToneIcon = tone.icon
                      return (
                        <div key={`${insight}-${index}`} className='flex items-start gap-2.5'>
                          <ToneIcon size={14} className={`mt-1 shrink-0 ${tone.iconClass}`} />
                          <p className='text-sm leading-6 text-zinc-700 dark:text-zinc-200'>{insight}</p>
                        </div>
                      )
                    })
                  ) : (
                    <p className='text-sm text-zinc-600 dark:text-zinc-300'>Insights will appear after analysis generation completes.</p>
                  )}
                </div>
              </div>

              <div className='mt-4 grid gap-3 sm:grid-cols-3'>
                {pillarSummaryCards.map((pillar) => {
                  const status = getStatus(pillar.value)
                  const barWidth = Math.max(4, Math.min(100, pillar.value))
                  return (
                    <div
                      key={pillar.key}
                      className='rounded-2xl border border-zinc-200 bg-white p-3 transition duration-200 hover:-translate-y-0.5 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-500'
                    >
                      <p className='text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400'>{pillar.label}</p>
                      <p className='mt-1 text-xl font-bold text-zinc-900 dark:text-white'>{pillar.value}</p>
                      <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${status.badgeClass}`}>{status.label}</span>
                      <div className='mt-3 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700'>
                        <div className={`h-full rounded-full ${status.barClass}`} style={{ width: `${barWidth}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>

              {showReportSaved ? <p className='mt-3 text-xs text-zinc-500 dark:text-zinc-400'>Report saved</p> : null}
              {reportSaveError ? <p className='mt-2 text-xs text-rose-600 dark:text-rose-400'>{reportSaveError}</p> : null}
              </Card>
            </Motion.div>
          </div>

          <Card title='AI Insights' description='Concise observations about your current ESG strengths and weaknesses.'>
            <div className='mt-4 space-y-3'>
              {isAiInsightsLoading ? (
                <div className='space-y-3'>
                  <p className='text-sm text-zinc-600 dark:text-zinc-300'>Generating AI insights...</p>
                  {[0, 1, 2].map((index) => (
                    <div
                      key={`ai-skeleton-${index}`}
                      className='rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950'
                    >
                      <div className='animate-pulse space-y-2'>
                        <div className='h-3 w-5/6 rounded bg-zinc-200 dark:bg-zinc-800' />
                        <div className='h-3 w-2/3 rounded bg-zinc-200 dark:bg-zinc-800' />
                      </div>
                    </div>
                  ))}
                </div>
              ) : aiInsightItems.length ? (
                aiInsightItems.map((insight, index) => {
                  const tone = getInsightTone(insight)
                  const ToneIcon = tone.icon
                  return (
                    <div
                      key={`${insight}-${index}`}
                      className={`flex items-start gap-3 rounded-xl border p-3 ${tone.containerClass}`}
                    >
                      <ToneIcon size={16} className={`mt-0.5 ${tone.iconClass}`} />
                      <p className='text-sm leading-6 text-zinc-700 dark:text-zinc-200'>{insight}</p>
                    </div>
                  )
                })
              ) : (
                <p className='text-sm text-zinc-600 dark:text-zinc-300'>
                  {aiInsightsError || 'Not enough context available to generate AI insights.'}
                </p>
              )}
            </div>

            <div className='mt-5 border-t border-zinc-200 pt-4 dark:border-zinc-800'>
              <h3 className='text-sm font-semibold text-zinc-900 dark:text-white'>Recommendations</h3>
              <div className='mt-3 space-y-2'>
                {recommendationItems.map((item, index) => (
                  <div
                    key={`${item}-${index}`}
                    className='flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-200'
                  >
                    <Lightbulb size={15} className='mt-0.5 shrink-0 text-sky-600 dark:text-sky-300' />
                    <span className='leading-6'>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className='mt-4'>
              <Button type='button' onClick={() => setIsInsightsModalOpen(true)} className='bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100'>
                View Full Insights
              </Button>
            </div>
          </Card>
        </div>

        <InsightsModal
          open={isInsightsModalOpen}
          onClose={() => setIsInsightsModalOpen(false)}
          insights={unifiedReportModel.insights || []}
          recommendations={unifiedReportModel.recommendations || []}
        />

        <div className='mt-6 grid gap-6 lg:grid-cols-2'>
          <div>
            <Card title='Radar Chart' description='Pillar shape comparison for Environmental, Social, and Governance.'>
              <div className='mt-4'>
                <RadarChart values={{ E: activeReport.E_score, S: activeReport.S_score, G: activeReport.G_score }} />
              </div>
            </Card>
          </div>

          <Card title='Previous Reports' description='Click a report to load its ESG result.'>
            <div className='mt-4 space-y-2'>
              <MiniTrend points={previousReports.slice(0, 10).map((item) => item.report.ESG_score).filter((value) => Number.isFinite(value))} />
              {isHistoryLoading ? (
                <p className='text-sm text-zinc-600 dark:text-zinc-300'>Loading reports...</p>
              ) : previousReports.length ? (
                previousReports.map((item) => (
                  <Motion.button
                    key={item.id}
                    type='button'
                    onClick={() => {
                      setSelectedReportId(item.id)
                      setLoadedBundle(item)
                    }}
                    whileHover={{ scale: 1.01, y: -1 }}
                    transition={{ type: 'spring', stiffness: 250, damping: 20 }}
                    className={
                      'w-full rounded-xl border px-3 py-2 text-left text-sm transition ' +
                      (selectedReportId === item.id
                        ? 'border-zinc-900 bg-zinc-100 dark:border-zinc-100 dark:bg-zinc-800'
                        : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900')
                    }
                  >
                    <div className='flex items-center justify-between'>
                      <span className='text-zinc-600 dark:text-zinc-300'>{new Date(item.createdAt).toLocaleString()}</span>
                      <span className='font-semibold text-zinc-900 dark:text-white'>
                        {item.report.ESG_score ?? '--'} ({item.report.rating})
                      </span>
                    </div>
                  </Motion.button>
                ))
              ) : (
                <p className='text-sm text-zinc-600 dark:text-zinc-300'>{historyError || 'No reports saved yet.'}</p>
              )}
            </div>
          </Card>
        </div>

        {comparisonMode ? (
          <div className='mx-auto mt-6 w-full max-w-4xl'>
            <Card
              title='Industry Comparison'
              description={`Comparing your scores with ${(selectedIndustry || user?.industry || 'industry').toString()} average.`}
              className='rounded-2xl border border-zinc-200 p-6 shadow-sm dark:border-zinc-800'
            >
              <div className='mb-4 max-w-xs'>
                <label className='mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300'>Industry</label>
                <select
                  value={selectedIndustry}
                  onChange={(event) => setSelectedIndustry(event.target.value)}
                  className='w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white'
                >
                  {INDUSTRY_OPTIONS.map((industry) => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </select>
              </div>
              <div className='mt-4 space-y-4'>
                {[
                  { label: 'ESG', you: activeReport.ESG_score ?? 0, avg: industryAverage.ESG },
                  { label: 'E', you: activeReport.E_score ?? 0, avg: industryAverage.E },
                  { label: 'S', you: activeReport.S_score ?? 0, avg: industryAverage.S },
                  { label: 'G', you: activeReport.G_score ?? 0, avg: industryAverage.G },
                ].map((row) => {
                  const delta = Number((row.you - row.avg).toFixed(1))
                  const isBetter = delta >= 0
                  return (
                    <div key={row.label} className='space-y-2'>
                      <div className='flex items-center justify-between text-sm'>
                        <span className='font-medium text-zinc-900 dark:text-white'>{row.label}</span>
                        <div className='flex items-center gap-2'>
                          <span className='text-xs text-zinc-600 dark:text-zinc-300'>
                            {row.you} vs {row.avg}
                          </span>
                          <span
                            className={
                              'text-xs font-semibold ' +
                              (isBetter ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')
                            }
                          >
                            {isBetter ? '+' : ''}
                            {delta}
                          </span>
                        </div>
                      </div>
                      <div className='space-y-1 px-1'>
                        <div className='h-2 rounded-full bg-zinc-200 dark:bg-zinc-800'>
                          <div className='h-full rounded-full bg-zinc-900 dark:bg-white' style={{ width: `${Math.max(4, Math.min(100, row.you))}%` }} />
                        </div>
                        <div className='h-2 rounded-full bg-zinc-200 dark:bg-zinc-800'>
                          <div className='h-full rounded-full bg-zinc-400 dark:bg-zinc-500' style={{ width: `${Math.max(4, Math.min(100, row.avg))}%` }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>
        ) : null}

        {riskAlerts.length ? (
          <div className='mt-6'>
            <Card title='Risk Alerts' description='Critical issues that need attention first.'>
              <div className='mt-4 space-y-2'>
                {riskAlerts.map((alert) => (
                  <div key={alert} className='rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200'>
                    {alert}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        ) : null}

        {viewMode === 'advanced' ? (
          <div className='mt-8 space-y-6'>
            <div>
              <PillarSection
                title='Environmental Insights'
                icon={Leaf}
                open={openSections.E}
                onToggle={() => setOpenSections((prev) => ({ ...prev, E: !prev.E }))}
                score={activeReport.E_score}
                rows={activeRows.environmental}
              />
            </div>

            <div>
              <PillarSection
                title='Social Insights'
                icon={Users}
                open={openSections.S}
                onToggle={() => setOpenSections((prev) => ({ ...prev, S: !prev.S }))}
                score={activeReport.S_score}
                rows={activeRows.social}
              />
            </div>

            <div>
              <PillarSection
                title='Governance Insights'
                icon={ShieldCheck}
                open={openSections.G}
                onToggle={() => setOpenSections((prev) => ({ ...prev, G: !prev.G }))}
                score={activeReport.G_score}
                rows={activeRows.governance}
              />
            </div>
          </div>
        ) : null}

      </section>
    </PageTransition>
  )
}

export default Analysis
