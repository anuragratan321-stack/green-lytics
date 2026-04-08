import { useMemo, useState } from 'react'
import { AnimatePresence, motion as Motion } from 'framer-motion'
import { Info, Lightbulb, X } from 'lucide-react'
import Button from '../components/Button'
import Card from '../components/Card'
import PageTransition from '../components/PageTransition'
import { calculateESGScore, getESGRating, getESGStatusMeta } from '../utils/esg'

function ESGCalculator() {
  const [environmental, setEnvironmental] = useState(70)
  const [social, setSocial] = useState(65)
  const [governance, setGovernance] = useState(60)
  const [score, setScore] = useState(null)
  const [showLegend, setShowLegend] = useState(false)
  const [showTips, setShowTips] = useState(false)

  const rating = useMemo(() => (score === null ? null : getESGRating(score)), [score])
  const statusMeta = useMemo(() => (score === null ? null : getESGStatusMeta(score)), [score])

  const handleCalculate = (event) => {
    event.preventDefault()
    setScore(calculateESGScore(environmental, social, governance))
  }

  const inputClass =
    'mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-2 text-zinc-900 outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white'

  const suggestions = useMemo(() => {
    if (score === null) return []
    if (score >= 81) return ['Maintain current ESG governance controls.', 'Publish quarterly ESG transparency updates.']
    if (score >= 61) return ['Increase renewable energy usage.', 'Set stricter supplier sustainability criteria.']
    if (score >= 41) return ['Improve waste and water reduction plans.', 'Train teams on social and governance compliance.']
    return ['Launch immediate emissions reduction actions.', 'Create an executive ESG recovery roadmap this quarter.']
  }, [score])

  const metricBars = [
    { label: 'E', value: Number(environmental) || 0, color: 'bg-emerald-500' },
    { label: 'S', value: Number(social) || 0, color: 'bg-blue-500' },
    { label: 'G', value: Number(governance) || 0, color: 'bg-violet-500' },
  ]

  const normalizedScore = Math.max(0, Math.min(100, score ?? 0))
  const meterRadius = 58
  const meterCircumference = 2 * Math.PI * meterRadius
  const meterOffset = meterCircumference * (1 - normalizedScore / 100)

  const meterColor =
    statusMeta?.color === 'red'
      ? '#ef4444'
      : statusMeta?.color === 'orange'
        ? '#f97316'
        : statusMeta?.color === 'green'
          ? '#22c55e'
          : '#10b981'

  return (
    <PageTransition>
      <section className='mx-auto w-full max-w-5xl px-6 py-16'>
        <h1 className='text-4xl font-bold tracking-tight text-zinc-900 dark:text-white'>ESG Calculator</h1>
        <p className='mt-3 text-zinc-600 dark:text-zinc-300'>Calculate a simple weighted ESG score for demonstrations.</p>

        <div className='mt-10 grid gap-6 lg:grid-cols-2'>
          <Card title='Inputs' description='Enter values between 0 and 100 for each ESG category.'>
            <form onSubmit={handleCalculate} className='mt-6 space-y-5'>
              <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-200'>
                Environmental Score (40%)
                <input
                  type='number'
                  min='0'
                  max='100'
                  value={environmental}
                  onChange={(event) => setEnvironmental(event.target.value)}
                  className={inputClass}
                />
              </label>

              <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-200'>
                Social Score (30%)
                <input type='number' min='0' max='100' value={social} onChange={(event) => setSocial(event.target.value)} className={inputClass} />
              </label>

              <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-200'>
                Governance Score (30%)
                <input
                  type='number'
                  min='0'
                  max='100'
                  value={governance}
                  onChange={(event) => setGovernance(event.target.value)}
                  className={inputClass}
                />
              </label>

              <Button type='submit'>Calculate</Button>
            </form>
          </Card>

          <Card title='Result' description='Your weighted ESG score appears here after calculation.'>
            <div className='mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-center dark:border-zinc-800 dark:bg-zinc-950'>
              <p className='text-sm text-zinc-500 dark:text-zinc-400'>ESG Score</p>
              <div className='mt-4 flex justify-center'>
                <div className='relative h-36 w-36'>
                  <svg className='h-36 w-36 -rotate-90' viewBox='0 0 140 140'>
                    <circle cx='70' cy='70' r={meterRadius} fill='none' stroke='rgba(161,161,170,0.25)' strokeWidth='12' />
                    <Motion.circle
                      cx='70'
                      cy='70'
                      r={meterRadius}
                      fill='none'
                      stroke={meterColor}
                      strokeWidth='12'
                      strokeLinecap='round'
                      strokeDasharray={meterCircumference}
                      initial={{ strokeDashoffset: meterCircumference }}
                      animate={{ strokeDashoffset: meterOffset }}
                      transition={{ duration: 0.7, ease: 'easeOut' }}
                    />
                  </svg>
                  <div className='absolute inset-0 flex flex-col items-center justify-center'>
                    <p className={'text-4xl font-extrabold ' + (statusMeta?.textClass ?? 'text-zinc-900 dark:text-white')}>
                      {score === null ? '--' : score}
                    </p>
                    <p className='text-xs text-zinc-500 dark:text-zinc-400'>out of 100</p>
                  </div>
                </div>
              </div>
              <p className='mt-3 text-base font-semibold text-zinc-700 dark:text-zinc-300'>Rating: {rating ?? '--'}</p>
              {statusMeta && (
                <div className='mt-3 flex flex-wrap items-center justify-center gap-2'>
                  <span className={'rounded-full px-3 py-1 text-xs font-semibold ' + statusMeta.badgeClass}>{statusMeta.label}</span>
                  <span className='text-xs text-zinc-600 dark:text-zinc-300'>{statusMeta.meaning}</span>
                </div>
              )}

              <div className='mt-6'>
                <div className='relative h-4 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800'>
                  <div className='absolute inset-y-0 left-0 w-1/5 bg-rose-500' />
                  <div className='absolute inset-y-0 left-1/5 w-1/5 bg-red-500' />
                  <div className='absolute inset-y-0 left-2/5 w-1/5 bg-orange-500' />
                  <div className='absolute inset-y-0 left-3/5 w-1/5 bg-green-500' />
                  <div className='absolute inset-y-0 right-0 w-1/5 bg-emerald-500' />
                  <Motion.div
                    initial={{ left: 0 }}
                    animate={{ left: `calc(${score ?? 0}% - 8px)` }}
                    transition={{ duration: 0.5 }}
                    className='absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-2 border-white bg-black shadow'
                  />
                </div>
                <div className='mt-2 flex justify-between text-[11px] text-zinc-500 dark:text-zinc-400'>
                  <span>1</span>
                  <span>20</span>
                  <span>40</span>
                  <span>60</span>
                  <span>80</span>
                  <span>100</span>
                </div>
              </div>

              <div className='mt-6 rounded-xl border border-zinc-200 p-4 text-left dark:border-zinc-800'>
                <p className='text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400'>Animated ESG Mix</p>
                <div className='mt-3 space-y-3'>
                  {metricBars.map((bar) => (
                    <div key={bar.label}>
                      <div className='mb-1 flex justify-between text-xs text-zinc-600 dark:text-zinc-300'>
                        <span>{bar.label}</span>
                        <span>{bar.value}</span>
                      </div>
                      <div className='h-2.5 rounded-full bg-zinc-200 dark:bg-zinc-800'>
                        <Motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(0, Math.min(100, bar.value))}%` }}
                          transition={{ duration: 0.5 }}
                          className={'h-full rounded-full ' + bar.color}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className='mt-5 flex flex-wrap items-center justify-center gap-2'>
                <button
                  type='button'
                  onClick={() => setShowLegend(true)}
                  className='inline-flex items-center gap-1 rounded-xl border border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800'
                >
                  <Info size={14} />
                  Scale Legend
                </button>
                <button
                  type='button'
                  onClick={() => setShowTips(true)}
                  className='inline-flex items-center gap-1 rounded-xl border border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800'
                >
                  <Lightbulb size={14} />
                  Improvement Tips
                </button>
              </div>
            </div>
          </Card>
        </div>

        <AnimatePresence>
          {showLegend && (
            <Motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4'
            >
              <Motion.div
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 12, opacity: 0 }}
                className='w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900'
              >
                <div className='mb-4 flex items-center justify-between'>
                  <h3 className='text-lg font-semibold text-zinc-900 dark:text-white'>ESG Scale Meaning</h3>
                  <button type='button' onClick={() => setShowLegend(false)} className='rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'>
                    <X size={16} />
                  </button>
                </div>
                <ul className='space-y-2 text-sm text-zinc-700 dark:text-zinc-300'>
                  <li><span className='font-semibold text-rose-600'>1-20:</span> Critical risk</li>
                  <li><span className='font-semibold text-red-600'>21-40:</span> Bad / risky</li>
                  <li><span className='font-semibold text-orange-600'>41-60:</span> Medium</li>
                  <li><span className='font-semibold text-green-600'>61-80:</span> Normal</li>
                  <li><span className='font-semibold text-emerald-600'>81-100:</span> Excellent</li>
                </ul>
              </Motion.div>
            </Motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showTips && (
            <Motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4'
            >
              <Motion.div
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 12, opacity: 0 }}
                className='w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900'
              >
                <div className='mb-4 flex items-center justify-between'>
                  <h3 className='text-lg font-semibold text-zinc-900 dark:text-white'>Improvement Plan</h3>
                  <button type='button' onClick={() => setShowTips(false)} className='rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'>
                    <X size={16} />
                  </button>
                </div>
                <p className='mb-3 text-sm text-zinc-600 dark:text-zinc-300'>
                  Current score band: <span className={statusMeta?.textClass ?? ''}>{statusMeta?.label ?? 'Not calculated'}</span>
                </p>
                <ul className='list-disc space-y-2 pl-5 text-sm text-zinc-700 dark:text-zinc-300'>
                  {(suggestions.length ? suggestions : ['Calculate score first to get custom tips.']).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </Motion.div>
            </Motion.div>
          )}
        </AnimatePresence>
      </section>
    </PageTransition>
  )
}

export default ESGCalculator
