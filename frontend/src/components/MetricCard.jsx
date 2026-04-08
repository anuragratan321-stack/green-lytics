import { useState } from 'react'
import { AnimatePresence, motion as Motion } from 'framer-motion'
import { ChevronDown, ChevronUp } from 'lucide-react'
import BenchmarkTooltip from './BenchmarkTooltip'

function MetricCard({ row }) {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <div className='space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950'>
      <div className='flex items-start justify-between gap-3'>
        <div className='flex items-center gap-1'>
          <p className='text-sm font-medium text-zinc-900 dark:text-white'>{row.label}</p>
          <BenchmarkTooltip benchmarkText={row.benchmark} />
        </div>
        <span className={'rounded-full px-2.5 py-1 text-xs font-semibold ' + row.assessment.badgeClass}>{row.status}</span>
      </div>

      <div className='flex items-center justify-between text-sm text-zinc-700 dark:text-zinc-300'>
        <p>
          Your value: <span className='font-medium text-zinc-900 dark:text-white'>{row.valueText}</span>
        </p>
      </div>

      <div className='px-1'>
        <div className='h-2.5 rounded-full bg-zinc-200 dark:bg-zinc-800'>
          <Motion.div
            className={'h-full rounded-full ' + row.assessment.barClass}
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(6, Number.isFinite(row.score) ? row.score : 8)}%` }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          />
        </div>
      </div>

      <p className='text-sm text-zinc-600 dark:text-zinc-300'>{row.assessment.message}</p>

      <button
        type='button'
        onClick={() => setShowDetails((prev) => !prev)}
        className='inline-flex items-center gap-1 text-xs font-medium text-zinc-500 transition hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
      >
        {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {showDetails ? 'Hide Details' : 'View Details'}
      </button>

      <AnimatePresence initial={false}>
        {showDetails ? (
          <Motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className='overflow-hidden'
          >
            <div className='rounded-lg border border-zinc-200 bg-white p-3 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300'>
              {row.explanation}
            </div>
          </Motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

export default MetricCard
