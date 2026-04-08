import { useEffect, useMemo, useState } from 'react'
import { motion as Motion } from 'framer-motion'
import { Activity, BarChart3, FileText, Leaf, Plus, ShieldCheck, Sparkles, TrendingUp, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'
import InsightPanel from '../components/dashboard/InsightPanel'
import KpiCard from '../components/dashboard/KpiCard'
import TrendLineChart from '../components/dashboard/TrendLineChart'
import PageTransition from '../components/PageTransition'
import { getCurrentUser } from '../services/auth'
import { getCurrentDraft, removeCurrentDraft } from '../services/draftsApi'
import { getUserSetup } from '../services/db'
import { fetchReports } from '../services/reportsApi'
import { clearESGInputDraft } from '../utils/esgInput'
import { getRatingLabel } from '../utils/esgEngine'

const USER_STORAGE_KEY = 'greenlytics_user'

const industryAverageMap = {
  'IT / Tech': 72,
  Manufacturing: 58,
  Finance: 70,
  Healthcare: 64,
  Logistics: 56,
  Energy: 50,
}

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
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function formatDateLabel(dateString) {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return 'Unknown'
  return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatShortDate(dateString) {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return '--'
  return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short' })
}

function mapReport(row) {
  const esg = toNumber(row?.scores?.total ?? row?.total_score ?? row?.data?.report?.ESG_score)
  const environmental = toNumber(row?.scores?.environmental ?? row?.environmental_score ?? row?.data?.report?.E_score)
  const social = toNumber(row?.scores?.social ?? row?.social_score ?? row?.data?.report?.S_score)
  const governance = toNumber(row?.scores?.governance ?? row?.governance_score ?? row?.data?.report?.G_score)

  if (esg === null && environmental === null && social === null && governance === null) return null

  const date = row?.createdAt || row?.created_at || row?.data?.createdAt || new Date().toISOString()
  return {
    id: row?._id || row?.id || `report-${date}`,
    date,
    dateLabel: formatDateLabel(date),
    shortDate: formatShortDate(date),
    esg: esg ?? 0,
    environmental: environmental ?? 0,
    social: social ?? 0,
    governance: governance ?? 0,
    rating: row?.data?.report?.rating || getRatingLabel(esg, 'overall'),
    industry: row?.industry || row?.data?.user?.industry || row?.data?.industry || null,
    aiInsights: typeof row?.data?.aiInsights === 'string' ? row.data.aiInsights : '',
    raw: row,
  }
}

function getColorBucket(score) {
  if (!Number.isFinite(score)) return 'zinc'
  if (score >= 70) return 'green'
  if (score >= 45) return 'yellow'
  return 'red'
}

function getDelta(current, previous) {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return null
  return current - previous
}

function formatDelta(delta) {
  if (!Number.isFinite(delta)) return 'No prior report'
  return `${delta >= 0 ? '+' : ''}${delta.toFixed(1)} from last report`
}

function getRecentInsights(report, previous) {
  if (!report) return ['Run a new ESG analysis to generate insights.']

  const insights = []
  const emissionsDeltaHint = getDelta(report.environmental, previous?.environmental)
  if (Number.isFinite(emissionsDeltaHint) && emissionsDeltaHint < -4) {
    insights.push(`⚠️ Environmental score fell by ${Math.abs(emissionsDeltaHint).toFixed(1)} points since the prior report.`)
  } else if (Number.isFinite(emissionsDeltaHint) && emissionsDeltaHint > 3) {
    insights.push(`✅ Environmental score improved by ${emissionsDeltaHint.toFixed(1)} points with better sustainability performance.`)
  }

  if (report.governance >= 70) {
    insights.push('✅ Strong governance practices are currently supporting overall ESG resilience.')
  } else if (report.governance < 45) {
    insights.push('⚠️ Governance score is a risk area; strengthen board and transparency controls.')
  }

  if (report.social < 55) {
    insights.push('💡 Focus on retention and employee engagement to improve the social pillar quickly.')
  } else {
    insights.push('💡 Keep social momentum by tracking attrition, satisfaction, and diversity trends each cycle.')
  }

  return insights.slice(0, 3)
}

function metricLabel(metric) {
  if (metric === 'environmental') return 'Environmental'
  if (metric === 'social') return 'Social'
  if (metric === 'governance') return 'Governance'
  return 'ESG'
}

function Dashboard() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [reports, setReports] = useState([])
  const [selectedReportId, setSelectedReportId] = useState(null)
  const [selectedMetric, setSelectedMetric] = useState('esg')
  const [timeFilter, setTimeFilter] = useState('all')
  const [userName, setUserName] = useState('there')
  const [industry, setIndustry] = useState('Not selected')
  const [currentDraft, setCurrentDraft] = useState(null)

  useEffect(() => {
    let mounted = true

    ;(async () => {
      try {
        const [currentUser, setup, rows, draft] = await Promise.all([
          getCurrentUser().catch(() => null),
          getUserSetup().catch(() => null),
          fetchReports().catch(() => []),
          getCurrentDraft().catch(() => null),
        ])
        if (!mounted) return

        const mapped = Array.isArray(rows) ? rows.map(mapReport).filter(Boolean) : []

        const localUser = readJSON(USER_STORAGE_KEY) || {}
        const resolvedName = setup?.name || localUser?.name || (currentUser?.email ? currentUser.email.split('@')[0] : 'there')
        const resolvedIndustry = setup?.industry || localUser?.industry || 'Not selected'

        setUserName(resolvedName)
        setIndustry(resolvedIndustry)
        setReports(mapped)
        setSelectedReportId(mapped[0]?.id || null)
        setCurrentDraft(draft?._id ? draft : null)
      } finally {
        if (mounted) setIsLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [])

  const filteredReports = useMemo(() => {
    if (!reports.length) return []
    if (timeFilter === 'all') return reports

    const days = timeFilter === '7d' ? 7 : 30
    const threshold = Date.now() - days * 24 * 60 * 60 * 1000
    return reports.filter((item) => {
      const time = new Date(item.date).getTime()
      return Number.isFinite(time) && time >= threshold
    })
  }, [reports, timeFilter])

  const selectedReport = useMemo(() => filteredReports.find((item) => item.id === selectedReportId) || filteredReports[0] || reports[0] || null, [filteredReports, reports, selectedReportId])

  const selectedReportIndex = useMemo(() => reports.findIndex((item) => item.id === (selectedReport?.id || '')), [reports, selectedReport?.id])
  const previousReport = selectedReportIndex >= 0 ? reports[selectedReportIndex + 1] || null : null

  const chartPoints = useMemo(() => {
    const asc = [...filteredReports].reverse()
    return asc.map((item, index) => {
      const previous = asc[index - 1]
      return {
        id: item.id,
        value: toNumber(item[selectedMetric]) ?? 0,
        shortDate: item.shortDate,
        dateLabel: item.dateLabel,
        delta: getDelta(toNumber(item[selectedMetric]), toNumber(previous?.[selectedMetric])),
      }
    })
  }, [filteredReports, selectedMetric])

  const insights = useMemo(() => {
    if (selectedReport?.aiInsights) {
      const parsed = selectedReport.aiInsights
        .split('\n')
        .map((line) => line.replace(/^[-*•\d.)\s]+/, '').trim())
        .filter(Boolean)
      if (parsed.length) return parsed.slice(0, 3)
    }
    return getRecentInsights(selectedReport, previousReport)
  }, [previousReport, selectedReport])

  const benchmark = industryAverageMap[industry] ?? 62
  const benchmarkDelta = selectedReport ? (selectedReport.esg ?? 0) - benchmark : 0
  const benchmarkStatus = benchmarkDelta >= 0 ? 'Above average' : 'Below average'

  const kpis = [
    {
      key: 'esg',
      title: 'ESG Score',
      value: selectedReport ? selectedReport.esg.toFixed(1) : '--',
      status: selectedReport ? getRatingLabel(selectedReport.esg, 'overall') : 'No data',
      delta: formatDelta(getDelta(selectedReport?.esg, previousReport?.esg)),
      icon: TrendingUp,
      color: getColorBucket(selectedReport?.esg),
    },
    {
      key: 'environmental',
      title: 'Environmental',
      value: selectedReport ? selectedReport.environmental.toFixed(1) : '--',
      status: selectedReport ? getRatingLabel(selectedReport.environmental, 'metric') : 'No data',
      delta: formatDelta(getDelta(selectedReport?.environmental, previousReport?.environmental)),
      icon: Leaf,
      color: getColorBucket(selectedReport?.environmental),
    },
    {
      key: 'social',
      title: 'Social',
      value: selectedReport ? selectedReport.social.toFixed(1) : '--',
      status: selectedReport ? getRatingLabel(selectedReport.social, 'metric') : 'No data',
      delta: formatDelta(getDelta(selectedReport?.social, previousReport?.social)),
      icon: Users,
      color: getColorBucket(selectedReport?.social),
    },
    {
      key: 'governance',
      title: 'Governance',
      value: selectedReport ? selectedReport.governance.toFixed(1) : '--',
      status: selectedReport ? getRatingLabel(selectedReport.governance, 'metric') : 'No data',
      delta: formatDelta(getDelta(selectedReport?.governance, previousReport?.governance)),
      icon: ShieldCheck,
      color: getColorBucket(selectedReport?.governance),
    },
  ]

  if (isLoading) {
    return (
      <PageTransition>
        <section className='mx-auto w-full max-w-6xl px-6 py-14'>
          <div className='animate-pulse space-y-4'>
            <div className='h-12 rounded-2xl bg-zinc-200 dark:bg-zinc-800' />
            <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
              {[1, 2, 3, 4].map((key) => (
                <div key={key} className='h-36 rounded-2xl bg-zinc-200 dark:bg-zinc-800' />
              ))}
            </div>
            <div className='h-72 rounded-2xl bg-zinc-200 dark:bg-zinc-800' />
          </div>
        </section>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <section className='mx-auto w-full max-w-6xl px-6 py-10'>
        <div className='flex flex-col gap-4 md:flex-row md:items-end md:justify-between'>
          <div>
            <h1 className='text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white'>Welcome back, {userName} 👋</h1>
            <p className='mt-1 text-zinc-600 dark:text-zinc-300'>Here&apos;s your ESG performance overview</p>
          </div>
          <div className='flex items-center gap-2'>
            {currentDraft?._id ? (
              <Button type='button' onClick={() => navigate('/analysis/new')} className='inline-flex items-center gap-2'>
                <Sparkles size={16} />
                Resume Draft
              </Button>
            ) : (
              <Button type='button' onClick={() => navigate('/analysis/new')} className='inline-flex items-center gap-2'>
                <Plus size={16} />
                New Analysis
              </Button>
            )}
            <Button
              type='button'
              className='inline-flex items-center gap-2 bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100'
              onClick={() => navigate('/reports')}
            >
              <FileText size={16} />
              View Reports
            </Button>
          </div>
        </div>

        {currentDraft?._id ? (
          <Card className='mt-4' title='Continue your analysis' description='You have an unfinished draft analysis.'>
            <div className='mt-4 flex items-center gap-2'>
              <Button type='button' onClick={() => navigate('/analysis/new')} className='inline-flex items-center gap-2'>
                <Sparkles size={16} />
                Resume Draft
              </Button>
              <Button
                type='button'
                className='bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100'
                onClick={async () => {
                  await removeCurrentDraft().catch(() => {})
                  clearESGInputDraft()
                  setCurrentDraft(null)
                }}
              >
                Discard
              </Button>
            </div>
          </Card>
        ) : null}

        <div className='mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
          {kpis.map((item) => (
            <KpiCard key={item.key} title={item.title} value={item.value} status={item.status} deltaText={item.delta} icon={item.icon} color={item.color} />
          ))}
        </div>

        <div className='mt-6 grid gap-4 lg:grid-cols-3'>
          <Card className='lg:col-span-2' title='ESG Performance Over Time' description='Track score movement and click a point to inspect that report.' icon={Activity}>
            <div className='mt-4 flex flex-wrap items-center gap-2'>
              {['esg', 'environmental', 'social', 'governance'].map((metric) => (
                <button
                  key={metric}
                  type='button'
                  onClick={() => setSelectedMetric(metric)}
                  className={
                    'rounded-xl border px-3 py-1.5 text-xs font-medium transition ' +
                    (selectedMetric === metric
                      ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                      : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800')
                  }
                >
                  {metricLabel(metric)}
                </button>
              ))}

              <div className='ml-auto flex items-center gap-1'>
                {['7d', '30d', 'all'].map((filter) => (
                  <button
                    key={filter}
                    type='button'
                    onClick={() => setTimeFilter(filter)}
                    className={
                      'rounded-lg px-2.5 py-1 text-xs font-medium transition ' +
                      (timeFilter === filter
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700')
                    }
                  >
                    {filter.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className='mt-4'>
              {chartPoints.length >= 2 ? (
                <TrendLineChart data={chartPoints} selectedId={selectedReport?.id} onPointClick={setSelectedReportId} metricLabel={metricLabel(selectedMetric)} />
              ) : (
                <p className='rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-300'>
                  Add at least two reports to view trend analytics.
                </p>
              )}
            </div>
          </Card>

          <Card title='AI Insights' description='Actionable signals from your selected report.' icon={Sparkles}>
            <div className='mt-4'>
              <InsightPanel insights={insights} />
            </div>
          </Card>
        </div>

        <div className='mt-6 grid gap-4 lg:grid-cols-3'>
          <Card title='ESG Breakdown' description='Pillar-wise view for the selected report.' icon={BarChart3}>
            <div className='mt-4 space-y-3'>
              {[
                { key: 'Environmental', value: selectedReport?.environmental ?? 0, color: 'bg-emerald-500' },
                { key: 'Social', value: selectedReport?.social ?? 0, color: 'bg-sky-500' },
                { key: 'Governance', value: selectedReport?.governance ?? 0, color: 'bg-violet-500' },
              ].map((row) => (
                <div key={row.key}>
                  <div className='mb-1 flex items-center justify-between text-sm'>
                    <span className='text-zinc-700 dark:text-zinc-300'>{row.key}</span>
                    <span className='font-medium text-zinc-900 dark:text-white'>{row.value.toFixed(1)}</span>
                  </div>
                  <div className='h-2.5 rounded-full bg-zinc-200 dark:bg-zinc-700'>
                    <Motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(0, Math.min(100, row.value))}%` }} transition={{ duration: 0.45, ease: 'easeOut' }} className={`h-2.5 rounded-full ${row.color}`} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title='Industry Benchmark' description='Your score vs sector average.'>
            <div className='mt-4 space-y-3'>
              <div className='flex items-center justify-between text-sm'>
                <span className='text-zinc-600 dark:text-zinc-300'>Your Score</span>
                <span className='font-semibold text-zinc-900 dark:text-white'>{selectedReport?.esg?.toFixed(1) ?? '--'}</span>
              </div>
              <div className='flex items-center justify-between text-sm'>
                <span className='text-zinc-600 dark:text-zinc-300'>Industry Avg</span>
                <span className='font-semibold text-zinc-900 dark:text-white'>{benchmark.toFixed(1)}</span>
              </div>
              <p className={benchmarkDelta >= 0 ? 'text-sm font-medium text-emerald-600 dark:text-emerald-400' : 'text-sm font-medium text-rose-600 dark:text-rose-400'}>
                {benchmarkStatus} ({benchmarkDelta >= 0 ? '+' : ''}
                {benchmarkDelta.toFixed(1)})
              </p>
              <p className='text-xs text-zinc-500 dark:text-zinc-400'>Industry: {industry}</p>
            </div>
          </Card>

          <Card title='Recent Reports' description='Click to inspect a previous snapshot.'>
            <div className='mt-4 space-y-2'>
              {reports.slice(0, 5).map((item) => (
                <button
                  key={item.id}
                  type='button'
                  onClick={() => setSelectedReportId(item.id)}
                  className={
                    'flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition ' +
                    (selectedReport?.id === item.id
                      ? 'border-zinc-900 bg-zinc-100 text-zinc-900 dark:border-zinc-100 dark:bg-zinc-800 dark:text-zinc-100'
                      : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800')
                  }
                >
                  <div>
                    <p className='font-medium'>{item.dateLabel}</p>
                    <p className='text-xs text-zinc-500 dark:text-zinc-400'>{item.rating}</p>
                  </div>
                  <span className='font-semibold'>{item.esg.toFixed(1)}</span>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </section>
    </PageTransition>
  )
}

export default Dashboard
