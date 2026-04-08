import { useState } from 'react'
import ReportRow from './ReportRow'

function ReportList({ reports, trendById, onViewReport, onEditReport, onRenameReport, isRenamingReportId, onDeleteReport, onDownloadReport, onPrintReport }) {
  const [openMenuId, setOpenMenuId] = useState(null)

  if (!reports.length) return null

  return (
    <div className='overflow-visible rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900'>
      <div className='hidden gap-3 border-b border-zinc-200 bg-zinc-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 md:grid md:grid-cols-[3.8fr_1fr_1fr_1.2fr_1.2fr]'>
        <span>Report</span>
        <span>ESG Score</span>
        <span>Status</span>
        <span>Score Change</span>
        <span className='text-right'>Actions</span>
      </div>

      {reports.map((report) => (
        <ReportRow
          key={report._id}
          report={report}
          trend={trendById?.[report._id]}
          isRenaming={isRenamingReportId === report._id}
          isMenuOpen={openMenuId === report._id}
          onMenuOpenChange={(open) => setOpenMenuId(open ? report._id : null)}
          onView={onViewReport}
          onEdit={onEditReport}
          onRename={onRenameReport}
          onDelete={onDeleteReport}
          onDownload={onDownloadReport}
          onPrint={onPrintReport}
        />
      ))}
    </div>
  )
}

export default ReportList
