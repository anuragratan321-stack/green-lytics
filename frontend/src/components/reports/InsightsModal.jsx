import { useEffect } from 'react'
import { motion as Motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, CheckCircle2, Lightbulb, Sparkles, X } from 'lucide-react'
import { createPortal } from 'react-dom'

function getInsightTone(text = '') {
  const value = String(text || '').toLowerCase()
  const riskKeywords = ['low', 'weak', 'risk', 'gap', 'declin', 'below target', 'poor']
  const positiveKeywords = ['strong', 'improv', 'stable', 'resilien', 'strength', 'performing well']

  if (riskKeywords.some((keyword) => value.includes(keyword))) {
    return {
      icon: AlertTriangle,
      iconClass: 'text-amber-600 dark:text-amber-400',
      rowClass: 'border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/25',
    }
  }

  if (positiveKeywords.some((keyword) => value.includes(keyword))) {
    return {
      icon: CheckCircle2,
      iconClass: 'text-emerald-600 dark:text-emerald-400',
      rowClass: 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/25',
    }
  }

  return {
    icon: Sparkles,
    iconClass: 'text-sky-600 dark:text-sky-400',
    rowClass: 'border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950',
  }
}

function InsightsModal({ open, onClose, insights = [], recommendations = [] }) {
  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    const handleEscape = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleEscape)
    return () => {
      document.body.style.overflow = previousOverflow || 'auto'
      window.removeEventListener('keydown', handleEscape)
    }
  }, [open, onClose])

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open ? (
        <Motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className='fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-sm'
          onClick={onClose}
          aria-modal='true'
          role='dialog'
        >
          <Motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(event) => event.stopPropagation()}
            className='w-[90%] max-w-2xl rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900'
          >
            <div className='flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800'>
              <div className='flex items-center gap-2'>
                <Sparkles size={16} className='text-amber-500' />
                <h3 className='text-base font-semibold text-zinc-900 dark:text-white'>Full AI Insights</h3>
              </div>
              <button
                type='button'
                onClick={onClose}
                className='inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                aria-label='Close'
              >
                <X size={16} />
              </button>
            </div>

            <div className='max-h-[80vh] space-y-6 overflow-y-auto px-5 py-4'>
              <div>
                <h4 className='text-sm font-semibold text-zinc-900 dark:text-white'>AI Insights</h4>
                <div className='mt-3 space-y-2'>
                  {insights.map((item, index) => {
                    const tone = getInsightTone(item)
                    const ToneIcon = tone.icon
                    return (
                      <div key={`${item}-${index}`} className={`flex items-start gap-3 rounded-xl border p-3 text-sm ${tone.rowClass}`}>
                        <ToneIcon size={15} className={`mt-0.5 shrink-0 ${tone.iconClass}`} />
                        <span className='leading-6 text-zinc-700 dark:text-zinc-200'>{item}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div>
                <h4 className='text-sm font-semibold text-zinc-900 dark:text-white'>Recommendations</h4>
                <div className='mt-3 space-y-2'>
                  {recommendations.map((item, index) => (
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
            </div>
          </Motion.div>
        </Motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}

export default InsightsModal
