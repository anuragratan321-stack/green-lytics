import { motion as Motion } from 'framer-motion'
import { Download, Eye, Printer } from 'lucide-react'
import ActionDropdown from './ActionDropdown'

function getStatus(score) {
  if (!Number.isFinite(score)) return { label: 'Unknown', cls: 'text-zinc-600 bg-zinc-100 dark:text-zinc-300 dark:bg-zinc-800' }
  if (score >= 80) return { label: 'Excellent', cls: 'bg-emerald-100 text-emerald-800 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-900/60' }
  if (score >= 60) return { label: 'Good', cls: 'bg-lime-100 text-lime-800 ring-1 ring-inset ring-lime-200 dark:bg-lime-950/40 dark:text-lime-200 dark:ring-lime-900/60' }
  if (score >= 40) return { label: 'Average', cls: 'bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900/60' }
  return { label: 'Poor', cls: 'bg-rose-100 text-rose-800 ring-1 ring-inset ring-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:ring-rose-900/60' }
}

function formatDate(date) {
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return 'Unknown date'
  const datePart = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const timePart = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
  return `${datePart} • ${timePart}`
}

function getReportName(report) {
  if (typeof report?.reportName === 'string' && report.reportName.trim()) return report.reportName.trim()
  if (typeof report?.data?.reportName === 'string' && report.data.reportName.trim()) return report.data.reportName.trim()
  return `ESG Report - ${formatDate(report?.createdAt).replace(' • ', ', ')}`
}

function formatScoreChange(value) {
  if (!Number.isFinite(value)) return null
  if (value === 0) return { text: '→ 0.0', cls: 'text-zinc-500 dark:text-zinc-400' }
  if (value > 0) return { text: `↑ +${value.toFixed(1)}`, cls: 'text-emerald-600 dark:text-emerald-400' }
  return { text: `↓ ${value.toFixed(1)}`, cls: 'text-rose-600 dark:text-rose-400' }
}

function ReportCard({ report, scoreChange, onView, onEdit, onDelete, onDownload, onPrint, isMenuOpen, onMenuOpenChange }) {
  const total = Number(report?.scores?.total) || 0
  const status = getStatus(total)
  const reportName = getReportName(report)
  const scoreChangeMeta = formatScoreChange(Number(scoreChange))

  return (
    <Motion.article
      whileHover={{ y: -2 }}
      transition={{ duration: 0.18 }}
      className='group rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700'
    >
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <p title={reportName} className='truncate text-base font-semibold text-zinc-900 dark:text-zinc-100'>
            {reportName}
          </p>
          <p className='mt-1 text-xs text-zinc-500 dark:text-zinc-400'>{formatDate(report.createdAt)}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${status.cls}`}>{status.label}</span>
      </div>

      <div className='mt-4 grid grid-cols-[auto_1fr] items-end gap-4'>
        <div>
          <p className='text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400'>ESG Score</p>
          <p className='mt-1 text-4xl font-bold leading-none tracking-tight text-zinc-900 dark:text-white'>{total.toFixed(1)}</p>
          {scoreChangeMeta ? <p className={`mt-1 text-sm font-semibold ${scoreChangeMeta.cls}`}>{scoreChangeMeta.text}</p> : null}
        </div>
        <div className='self-center text-sm text-zinc-600 dark:text-zinc-300'>
          <span className='font-medium text-zinc-700 dark:text-zinc-200'>Industry:</span> {report.industry || 'N/A'}{' '}
          <span className='mx-1 text-zinc-400'>•</span>
          <span className='font-medium text-zinc-700 dark:text-zinc-200'>Role:</span> {report.role || 'N/A'}
        </div>
      </div>

      <div className='my-4 h-px bg-zinc-200 dark:bg-zinc-800' />

      <div className='flex items-center gap-2'>
        <button
          type='button'
          onClick={() => onView(report)}
          className='inline-flex h-9 items-center gap-1.5 rounded-xl bg-zinc-900 px-3 text-xs font-semibold text-white transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200'
          title='View report'
          aria-label='View report'
        >
          <Eye size={14} />
          View
        </button>
        <button
          type='button'
          onClick={() => onDownload(report)}
          className='inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
          title='Download report'
          aria-label='Download report'
        >
          <Download size={15} />
        </button>
        <button
          type='button'
          onClick={() => onPrint(report)}
          className='inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
          title='Print report'
          aria-label='Print report'
        >
          <Printer size={15} />
        </button>
        <div className='ml-auto'>
          <ActionDropdown
            isOpen={isMenuOpen}
            onOpenChange={onMenuOpenChange}
            onEdit={() => onEdit(report)}
            onDownload={() => onDownload(report)}
            onPrint={() => onPrint(report)}
            onDelete={() => onDelete(report)}
          />
        </div>
      </div>
    </Motion.article>
  )
}

export default ReportCard
