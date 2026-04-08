import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion as Motion } from 'framer-motion'
import { Filter, LayoutGrid, List, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'
import ReportCard from '../components/reports/ReportCard'
import ReportList from '../components/reports/ReportList'
import PageTransition from '../components/PageTransition'
import { downloadReportPdf, printSingleReport } from '../services/reportExportService'
import { fetchReports, removeReport, updateReport } from '../services/reportsApi'

const REPORTS_VIEW_MODE_KEY = 'greenlytics_reports_view_mode'

function formatReportDateTime(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown date'
  const datePart = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const timePart = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
  return `${datePart} • ${timePart}`
}

function getDefaultReportName(report) {
  const dateLabel = formatReportDateTime(report?.createdAt).replace(' • ', ', ')
  return `ESG Report - ${dateLabel}`
}

function Reports() {
  const navigate = useNavigate()
  const filtersRef = useRef(null)
  const [reports, setReports] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isRenamingReportId, setIsRenamingReportId] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [industryFilter, setIndustryFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [viewMode, setViewMode] = useState(() => localStorage.getItem(REPORTS_VIEW_MODE_KEY) || 'list')
  const [openCardMenuId, setOpenCardMenuId] = useState(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const data = await fetchReports()
        if (mounted) {
          setReports(Array.isArray(data) ? data : [])
          setError('')
        }
      } catch (err) {
        if (mounted) setError(err.message || 'Unable to load reports.')
      } finally {
        if (mounted) setIsLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(REPORTS_VIEW_MODE_KEY, viewMode)
  }, [viewMode])

  useEffect(() => {
    if (!filtersOpen) return
    const handleOutside = (event) => {
      if (filtersRef.current?.contains(event.target)) return
      setFiltersOpen(false)
    }
    window.addEventListener('mousedown', handleOutside)
    return () => window.removeEventListener('mousedown', handleOutside)
  }, [filtersOpen])

  const getStatusLabel = (score) => {
    const numeric = Number(score)
    if (!Number.isFinite(numeric)) return 'Unknown'
    if (numeric >= 80) return 'Excellent'
    if (numeric >= 60) return 'Good'
    if (numeric >= 40) return 'Average'
    return 'Poor'
  }

  const industries = useMemo(() => Array.from(new Set(reports.map((item) => item.industry).filter(Boolean))).sort(), [reports])

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const status = getStatusLabel(report?.scores?.total)
      const createdAt = new Date(report.createdAt)
      const createdAtTime = createdAt.getTime()
      const fromTime = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null
      const toTime = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : null

      const formattedDate = Number.isNaN(createdAtTime) ? '' : createdAt.toLocaleDateString()
      const formattedDateTime = Number.isNaN(createdAtTime) ? '' : formatReportDateTime(report.createdAt)
      const isoDate = Number.isNaN(createdAtTime) ? '' : createdAt.toISOString().slice(0, 10)
      const normalizedSearch = search.trim().toLowerCase()
      const reportName = report.reportName || report?.data?.reportName || getDefaultReportName(report)
      const searchable = `${reportName} ${report.industry || ''} ${report.role || ''} ${formattedDate} ${formattedDateTime} ${isoDate}`.toLowerCase()

      if (statusFilter !== 'all' && status !== statusFilter) return false
      if (industryFilter !== 'all' && report.industry !== industryFilter) return false
      if (normalizedSearch && !searchable.includes(normalizedSearch)) return false
      if (fromTime !== null && (!Number.isFinite(createdAtTime) || createdAtTime < fromTime)) return false
      if (toTime !== null && (!Number.isFinite(createdAtTime) || createdAtTime > toTime)) return false
      return true
    })
  }, [reports, search, statusFilter, industryFilter, dateFrom, dateTo])

  const sortedReports = useMemo(() => {
    return [...filteredReports].sort((a, b) => {
      if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      if (sortBy === 'highest') return (Number(b?.scores?.total) || 0) - (Number(a?.scores?.total) || 0)
      if (sortBy === 'lowest') return (Number(a?.scores?.total) || 0) - (Number(b?.scores?.total) || 0)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [filteredReports, sortBy])

  const trendById = useMemo(() => {
    const byDateDesc = [...reports].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    const trendMap = {}
    byDateDesc.forEach((report, index) => {
      const prev = byDateDesc[index + 1]
      const currentScore = Number(report?.scores?.total)
      const prevScore = Number(prev?.scores?.total)
      trendMap[report._id] = Number.isFinite(currentScore) && Number.isFinite(prevScore) ? currentScore - prevScore : null
    })
    return trendMap
  }, [reports])

  const latestImprovementText = useMemo(() => {
    if (reports.length < 2) return ''
    const byDateDesc = [...reports].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    const latest = byDateDesc[0]
    const previous = byDateDesc[1]
    const latestScore = Number(latest?.scores?.total)
    const previousScore = Number(previous?.scores?.total)
    if (!Number.isFinite(latestScore) || !Number.isFinite(previousScore)) return ''
    const delta = latestScore - previousScore
    if (delta > 0) return `Your latest ESG score increased by +${delta.toFixed(1)} points`
    if (delta < 0) return `Your latest ESG score decreased by ${delta.toFixed(1)} points`
    return 'Your latest ESG score has no change from the previous report'
  }, [reports])

  const handleDownloadReport = async (report) => {
    try {
      await downloadReportPdf(report)
    } catch (err) {
      setError(err.message || 'Unable to generate PDF report.')
    }
  }

  const handlePrintReport = async (report) => {
    try {
      await printSingleReport(report)
    } catch (err) {
      setError(err.message || 'Unable to open print view.')
    }
  }

  const handleEditInputs = (report) => {
    navigate('/esg-input/environmental', {
      state: {
        reportId: report?._id || null,
        reportInputs: report?.inputs || null,
      },
    })
  }

  const handleRenameReport = async (report, nextName) => {
    if (!report?._id) return
    const trimmed = nextName.trim()
    if (!trimmed) return
    const currentName = report.reportName || report?.data?.reportName || getDefaultReportName(report)
    if (trimmed === currentName) return

    setIsRenamingReportId(report._id)
    setError('')

    const payload = {
      reportName: trimmed,
      industry: report.industry || '',
      role: report.role || '',
      companySize: report.companySize || '',
      region: report.region || '',
      scores: report.scores || { environmental: 0, social: 0, governance: 0, total: 0 },
      inputs: report.inputs || {},
      data: report.data && typeof report.data === 'object' ? { ...report.data, reportName: trimmed } : { reportName: trimmed },
    }

    try {
      const updated = await updateReport(report._id, payload)
      setReports((prev) => prev.map((item) => (item._id === report._id ? updated : item)))
    } catch (err) {
      setError(err.message || 'Unable to rename report.')
    } finally {
      setIsRenamingReportId(null)
    }
  }

  const handleDeleteReport = async (report) => {
    setPendingDelete(report)
  }

  const handleConfirmDelete = async () => {
    if (!pendingDelete?._id) return
    setIsDeleting(true)
    try {
      await removeReport(pendingDelete._id)
      setReports((prev) => prev.filter((item) => item._id !== pendingDelete._id))
      setPendingDelete(null)
    } catch (err) {
      setError(err.message || 'Unable to delete report.')
    } finally {
      setIsDeleting(false)
    }
  }

  const hasAdvancedFilters = statusFilter !== 'all' || industryFilter !== 'all' || Boolean(dateFrom) || Boolean(dateTo)

  return (
    <PageTransition>
      <section className='mx-auto w-full max-w-6xl px-6 py-10'>
        <div className='mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between'>
          <div>
            <h1 className='text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white'>Reports</h1>
            <p className='mt-1 text-zinc-600 dark:text-zinc-300'>Review, manage, and export your ESG reports.</p>
          </div>
          <Button type='button' onClick={() => navigate('/analysis/new')} className='inline-flex items-center gap-2'>
            <Plus size={16} />
            New Analysis
          </Button>
        </div>

        <div className='mb-4 grid gap-2 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm md:grid-cols-[1.5fr_minmax(0,180px)_auto_auto] dark:border-zinc-800 dark:bg-zinc-900'>
          <input
            type='text'
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder='Search reports...'
            className='rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white'
          />

          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className='rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200'
          >
            <option value='newest'>Newest first</option>
            <option value='oldest'>Oldest first</option>
            <option value='highest'>Highest score</option>
            <option value='lowest'>Lowest score</option>
          </select>

          <div className='relative' ref={filtersRef}>
            <button
              type='button'
              title='Advanced filters'
              aria-label='Advanced filters'
              onClick={() => setFiltersOpen((prev) => !prev)}
              className={
                'inline-flex h-full min-h-10 w-full items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm transition md:min-w-[132px] ' +
                (hasAdvancedFilters
                  ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                  : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800')
              }
            >
              <Filter size={15} />
              Filters
            </button>

            <AnimatePresence>
              {filtersOpen ? (
                <Motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className='absolute right-0 z-30 mt-2 w-[280px] rounded-xl border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-900'
                >
                  <div className='space-y-3'>
                    <label className='block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400'>
                      Status
                      <select
                        value={statusFilter}
                        onChange={(event) => setStatusFilter(event.target.value)}
                        className='mt-1 w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-2 text-sm text-zinc-700 outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200'
                      >
                        <option value='all'>All status</option>
                        <option value='Excellent'>Excellent</option>
                        <option value='Good'>Good</option>
                        <option value='Average'>Average</option>
                        <option value='Poor'>Poor</option>
                      </select>
                    </label>

                    <label className='block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400'>
                      Industry
                      <select
                        value={industryFilter}
                        onChange={(event) => setIndustryFilter(event.target.value)}
                        className='mt-1 w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-2 text-sm text-zinc-700 outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200'
                      >
                        <option value='all'>All industries</option>
                        {industries.map((industry) => (
                          <option key={industry} value={industry}>
                            {industry}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className='grid grid-cols-2 gap-2'>
                      <label className='block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400'>
                        Start
                        <input
                          type='date'
                          value={dateFrom}
                          onChange={(event) => setDateFrom(event.target.value)}
                          className='mt-1 w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-2 text-sm text-zinc-700 outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200'
                        />
                      </label>
                      <label className='block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400'>
                        End
                        <input
                          type='date'
                          value={dateTo}
                          onChange={(event) => setDateTo(event.target.value)}
                          className='mt-1 w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-2 text-sm text-zinc-700 outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200'
                        />
                      </label>
                    </div>
                  </div>
                </Motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <div className='inline-flex items-center rounded-xl border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-700 dark:bg-zinc-800'>
            <button
              type='button'
              onClick={() => setViewMode('list')}
              className={
                'inline-flex h-8 w-8 items-center justify-center rounded-lg transition ' +
                (viewMode === 'list' ? 'bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400')
              }
            >
              <List size={16} />
            </button>
            <button
              type='button'
              onClick={() => setViewMode('grid')}
              className={
                'inline-flex h-8 w-8 items-center justify-center rounded-lg transition ' +
                (viewMode === 'grid' ? 'bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400')
              }
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>

        {error ? <p className='mb-4 text-sm text-rose-600 dark:text-rose-400'>{error}</p> : null}
        {latestImprovementText ? <p className='mb-3 text-sm text-zinc-600 dark:text-zinc-300'>{latestImprovementText}</p> : null}

        {isLoading ? (
          <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
            {[1, 2, 3].map((key) => (
              <div key={key} className='h-64 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800' />
            ))}
          </div>
        ) : sortedReports.length ? (
          <Motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            {viewMode === 'list' ? (
              <ReportList
                reports={sortedReports}
                trendById={trendById}
                onViewReport={(report) => navigate(`/analysis/${report._id}`)}
                onEditReport={handleEditInputs}
                onRenameReport={handleRenameReport}
                isRenamingReportId={isRenamingReportId}
                onDeleteReport={handleDeleteReport}
                onDownloadReport={handleDownloadReport}
                onPrintReport={handlePrintReport}
              />
            ) : (
              <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
                {sortedReports.map((report) => (
                  <ReportCard
                    key={report._id}
                    report={report}
                    scoreChange={trendById?.[report._id]}
                    isMenuOpen={openCardMenuId === report._id}
                    onMenuOpenChange={(open) => setOpenCardMenuId(open ? report._id : null)}
                    onView={(item) => navigate(`/analysis/${item._id}`)}
                    onEdit={handleEditInputs}
                    onDelete={handleDeleteReport}
                    onDownload={handleDownloadReport}
                    onPrint={handlePrintReport}
                  />
                ))}
              </div>
            )}
          </Motion.div>
        ) : reports.length ? (
          <Card title='No matching reports' description='Try adjusting search or filters to find reports.'>
            <div className='mt-5 flex flex-wrap gap-2'>
              <Button type='button' className='bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100' onClick={() => setSearch('')}>
                Clear Search
              </Button>
              <Button
                type='button'
                className='bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100'
                onClick={() => {
                  setSortBy('newest')
                  setStatusFilter('all')
                  setIndustryFilter('all')
                  setDateFrom('')
                  setDateTo('')
                  setFiltersOpen(false)
                }}
              >
                Reset Filters
              </Button>
            </div>
          </Card>
        ) : (
          <Card title='No reports yet' description='Run your first ESG assessment to build report history.'>
            <div className='mt-5'>
              <Button type='button' onClick={() => navigate('/analysis/new')} className='inline-flex items-center gap-2'>
                <Plus size={16} />
                New Analysis
              </Button>
            </div>
          </Card>
        )}
      </section>

      <AnimatePresence>
        {pendingDelete ? (
          <>
            <Motion.button
              type='button'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='fixed inset-0 z-50 bg-black/40 backdrop-blur-sm'
              onClick={() => !isDeleting && setPendingDelete(null)}
              aria-label='Close delete confirmation'
            />
            <Motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className='fixed left-1/2 top-1/2 z-[60] w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900'
            >
              <h3 className='text-lg font-semibold text-zinc-900 dark:text-white'>Are you sure you want to delete this report?</h3>
              <p className='mt-2 text-sm text-zinc-600 dark:text-zinc-300'>This action cannot be undone.</p>

              <div className='mt-5 flex items-center justify-end gap-2'>
                <Button
                  type='button'
                  className='bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100'
                  onClick={() => setPendingDelete(null)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  type='button'
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className='bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/20 dark:text-rose-300 dark:hover:bg-rose-950/40'
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </Motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </PageTransition>
  )
}

export default Reports
