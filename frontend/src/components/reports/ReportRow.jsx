import { useEffect, useRef, useState } from 'react'
import { Pencil } from 'lucide-react'
import Button from '../Button'
import ActionDropdown from './ActionDropdown'

function getStatus(score) {
  if (!Number.isFinite(score)) return { label: 'Unknown', cls: 'text-zinc-600 bg-zinc-100 dark:text-zinc-300 dark:bg-zinc-800' }
  if (score >= 80) return { label: 'Excellent', cls: 'bg-emerald-100 text-emerald-800 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-900/60' }
  if (score >= 60) return { label: 'Good', cls: 'bg-lime-100 text-lime-800 ring-1 ring-inset ring-lime-200 dark:bg-lime-950/40 dark:text-lime-200 dark:ring-lime-900/60' }
  if (score >= 40) return { label: 'Average', cls: 'bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900/60' }
  return { label: 'Poor', cls: 'bg-rose-100 text-rose-800 ring-1 ring-inset ring-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:ring-rose-900/60' }
}

function getStatusTooltip(status) {
  if (status === 'Excellent') return 'Strong ESG performance'
  if (status === 'Good') return 'Healthy ESG performance with room to improve'
  if (status === 'Average') return 'Moderate ESG performance; improvement recommended'
  if (status === 'Poor') return 'Low ESG performance; action needed'
  return 'Status unavailable due to insufficient score data'
}

function formatDate(date) {
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return 'Unknown date'
  const datePart = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const timePart = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
  return `${datePart} • ${timePart}`
}

function formatTrend(value) {
  if (!Number.isFinite(value)) return <span className='text-zinc-500 dark:text-zinc-400'>—</span>
  if (value === 0) return <span className='text-zinc-500 dark:text-zinc-400'>→ 0.0</span>
  if (value > 0) return <span className='font-medium text-emerald-600 dark:text-emerald-400'>↑ +{value.toFixed(1)}</span>
  return <span className='font-medium text-rose-600 dark:text-rose-400'>↓ {value.toFixed(1)}</span>
}

function defaultReportName(report) {
  return `ESG Report - ${formatDate(report?.createdAt).replace(' • ', ', ')}`
}

function ReportRow({
  report,
  trend,
  isRenaming,
  isMenuOpen,
  onMenuOpenChange,
  onView,
  onEdit,
  onRename,
  onDownload,
  onPrint,
  onDelete,
}) {
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(report?.reportName || report?.data?.reportName || defaultReportName(report))
  const renameInputRef = useRef(null)
  const total = Number(report?.scores?.total) || 0
  const status = getStatus(total)
  const trendLabel = 'Compared to previous report'
  const currentName = report?.reportName || report?.data?.reportName || defaultReportName(report)

  useEffect(() => {
    setNameDraft(currentName)
  }, [currentName])

  useEffect(() => {
    if (!editingName) return
    renameInputRef.current?.focus()
    renameInputRef.current?.select()
  }, [editingName])

  const commitRename = () => {
    const trimmed = nameDraft.trim()
    if (!trimmed) {
      setNameDraft(currentName)
      setEditingName(false)
      return
    }
    if (trimmed !== currentName) onRename(report, trimmed)
    setEditingName(false)
  }

  const handleNameKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      commitRename()
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      setNameDraft(currentName)
      setEditingName(false)
    }
  }

  return (
    <div className='grid grid-cols-2 items-center gap-3 border-b border-zinc-200 px-5 py-3.5 text-sm transition-colors duration-150 hover:bg-zinc-50/80 last:border-b-0 dark:border-zinc-800 dark:hover:bg-zinc-800/40 md:grid-cols-[3.8fr_1fr_1fr_1.2fr_1.2fr]'>
      <div className='col-span-2 min-w-0 md:col-span-1'>
        {editingName ? (
          <input
            ref={renameInputRef}
            value={nameDraft}
            onChange={(event) => setNameDraft(event.target.value)}
            onBlur={commitRename}
            onKeyDown={handleNameKeyDown}
            className='w-full rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm font-medium text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100'
            disabled={isRenaming}
          />
        ) : (
          <div className='flex items-start gap-1.5'>
            <div className='min-w-0'>
              <p title={currentName} className='line-clamp-2 break-words font-semibold leading-snug text-zinc-900 dark:text-zinc-100'>
                {currentName}
              </p>
              <p title={`${formatDate(report.createdAt)} • ${report.industry || 'N/A'} • ${report.role || 'N/A'}`} className='mt-0.5 text-xs text-zinc-500 dark:text-zinc-400'>
                {formatDate(report.createdAt)} • {report.industry || 'N/A'} • {report.role || 'N/A'}
              </p>
            </div>
            <button
              type='button'
              title='Rename report'
              aria-label='Rename report'
              onClick={() => setEditingName(true)}
              className='inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200'
            >
              <Pencil size={13} />
            </button>
          </div>
        )}
      </div>

      <div className='col-span-1 text-lg font-bold tracking-tight text-zinc-900 dark:text-white md:col-span-1'>{total.toFixed(1)}</div>

      <div className='col-span-1 md:col-span-1'>
        <span title={getStatusTooltip(status.label)} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.cls}`}>
          {status.label}
        </span>
      </div>

      <div className='col-span-1 md:col-span-1' title={trendLabel}>
        {formatTrend(trend)}
      </div>

      <div className='col-span-1 flex items-center justify-end gap-2 md:col-span-1'>
        <Button type='button' onClick={() => onView(report)} className='bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700'>
          View
        </Button>
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
  )
}

export default ReportRow
