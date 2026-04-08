import { useMemo, useState } from 'react'
import { AnimatePresence, motion as Motion } from 'framer-motion'
import { Info } from 'lucide-react'

const toneByLabel = {
  excellent: {
    dotClass: 'bg-emerald-500',
    textClass: 'text-emerald-700 dark:text-emerald-300',
    label: 'Excellent',
  },
  good: {
    dotClass: 'bg-lime-500',
    textClass: 'text-lime-700 dark:text-lime-300',
    label: 'Good',
  },
  average: {
    dotClass: 'bg-yellow-500',
    textClass: 'text-yellow-700 dark:text-yellow-300',
    label: 'Average',
  },
  poor: {
    dotClass: 'bg-orange-500',
    textClass: 'text-orange-700 dark:text-orange-300',
    label: 'Poor',
  },
  critical: {
    dotClass: 'bg-rose-500',
    textClass: 'text-rose-700 dark:text-rose-300',
    label: 'Critical',
  },
}

function parseBenchmarkText(text) {
  if (!text) return { rows: [], note: '' }

  const noteMatch = text.match(/\(([^)]+)\)\s*$/)
  const note = noteMatch ? noteMatch[1] : ''
  const base = noteMatch ? text.slice(0, noteMatch.index).trim().replace(/,\s*$/, '') : text

  const parts = base
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)

  const rows = parts.map((part) => {
    const labelMatch = part.match(/(Excellent|Good|Average|Poor|Critical)/i)
    const labelKey = (labelMatch?.[1] || '').toLowerCase()
    const range = labelMatch ? part.replace(labelMatch[0], '').trim() : part
    const tone = toneByLabel[labelKey] || toneByLabel.average
    return {
      key: `${labelKey}-${range}`,
      label: tone.label,
      range,
      dotClass: tone.dotClass,
      textClass: tone.textClass,
    }
  })

  return { rows, note }
}

function BenchmarkTooltip({ benchmarkText }) {
  const [open, setOpen] = useState(false)
  const { rows, note } = useMemo(() => parseBenchmarkText(benchmarkText), [benchmarkText])

  return (
    <span
      className='relative inline-flex'
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type='button'
        onClick={() => setOpen((prev) => !prev)}
        aria-label='Show benchmark ranges'
        className='rounded-full p-1 text-zinc-500 transition hover:cursor-pointer hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200'
      >
        <Info size={14} />
      </button>

      <AnimatePresence>
        {open ? (
          <Motion.div
            initial={{ opacity: 0, scale: 0.97, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 4 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className='absolute left-1/2 top-full z-20 mt-2 w-72 -translate-x-1/2 rounded-xl border border-zinc-200 bg-white p-3 shadow-md dark:border-zinc-700 dark:bg-zinc-900'
          >
            <p className='text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400'>Benchmark Ranges</p>
            <div className='mt-2 space-y-1.5'>
              {rows.map((row) => (
                <div key={row.key} className='flex items-center gap-2 text-sm'>
                  <span className={`h-2 w-2 rounded-full ${row.dotClass}`} />
                  <span className={`font-medium ${row.textClass}`}>{row.label}:</span>
                  <span className='text-zinc-700 dark:text-zinc-300'>{row.range}</span>
                </div>
              ))}
            </div>
            {note ? <p className='mt-2 text-xs text-zinc-500 dark:text-zinc-400'>({note})</p> : null}
          </Motion.div>
        ) : null}
      </AnimatePresence>
    </span>
  )
}

export default BenchmarkTooltip
