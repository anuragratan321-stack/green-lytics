import { motion as Motion } from 'framer-motion'
import { Info } from 'lucide-react'
import Button from './Button'
import Card from './Card'
import PageTransition from './PageTransition'

const stepLabels = ['Environmental', 'Social', 'Governance']

const inputClass =
  'w-full rounded-xl border border-zinc-300 bg-white px-4 py-2 text-zinc-900 outline-none transition focus:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white'

function FieldTooltip({ text }) {
  return (
    <span className='group relative inline-flex'>
      <button
        type='button'
        className='rounded-full p-1 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200'
        aria-label='Metric help'
      >
        <Info size={14} />
      </button>
      <span className='pointer-events-none absolute left-1/2 top-full z-10 mt-2 hidden w-56 -translate-x-1/2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-normal text-zinc-600 shadow-md group-hover:block group-focus-within:block dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300'>
        {text}
      </span>
    </span>
  )
}

function ESGInputLayout({ title, description, stepIndex, fields, values, skipped, onChange, onToggleSkip, onBack, onNext, nextLabel, children, draftStatus }) {
  const handleNumberInputWheel = (event, field) => {
    const resolvedType = field.type || 'number'
    if (resolvedType === 'number') {
      event.currentTarget.blur()
    }
  }

  const handleFieldChange = (field, rawValue) => {
    const cleanedValue = field.allowCommas ? rawValue.replaceAll(',', '') : rawValue
    onChange(field.key, cleanedValue)
  }

  const validateFieldValue = (field, rawValue, isSkipped) => {
    if (isSkipped) return ''
    if (rawValue === '' || rawValue === null || rawValue === undefined) return ''

    const numericValue = Number(rawValue)
    const expectsNumeric = field.type === 'number' || field.inputMode === 'decimal' || field.inputMode === 'numeric'

    if (expectsNumeric && !Number.isFinite(numericValue)) return 'Enter a valid number.'
    if (Number.isFinite(field.min) && Number.isFinite(numericValue) && numericValue < field.min) return `Value must be at least ${field.min}.`
    if (Number.isFinite(field.max) && Number.isFinite(numericValue) && numericValue > field.max) return `Value must be at most ${field.max}.`
    if (typeof field.validate === 'function') {
      const customError = field.validate(rawValue, values)
      if (customError) return customError
    }
    return ''
  }

  const fieldErrors = fields.reduce((acc, field) => {
    const error = validateFieldValue(field, values[field.key], skipped[field.key])
    if (error) acc[field.key] = error
    return acc
  }, {})

  const hasValidationErrors = Object.keys(fieldErrors).length > 0

  return (
    <PageTransition>
      <section className='mx-auto w-full max-w-3xl px-4 py-16 md:px-6'>
        <Card className='space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900'>
          <div className='mb-6'>
            <h1 className='text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white'>{title}</h1>
            <p className='mt-2 text-sm text-zinc-600 dark:text-zinc-300'>{description}</p>
            {draftStatus ? <p className='mt-1 text-xs text-zinc-500 dark:text-zinc-400'>{draftStatus}</p> : null}
          </div>

          <div className='mb-8'>
            <div className='mb-4 flex items-center justify-between'>
              <span className='text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400'>Progress</span>
              <span className='text-xs font-medium text-zinc-600 dark:text-zinc-300'>Step {stepIndex + 1} of 3</span>
            </div>

            <div className='px-1'>
              <div className='flex items-center'>
                {stepLabels.map((label, index) => {
                  const isActive = index === stepIndex
                  const isCompleted = index < stepIndex
                  const isUpcoming = index > stepIndex

                  return (
                    <div key={label} className='flex flex-1 items-center'>
                      <Motion.span
                        animate={isActive ? { scale: 1.15 } : { scale: 1 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className={
                          'h-3 w-3 rounded-full transition-colors ' +
                          (isCompleted ? 'bg-emerald-500' : isActive ? 'bg-black dark:bg-white' : 'bg-zinc-300 dark:bg-zinc-700')
                        }
                      />
                      {index < stepLabels.length - 1 ? <span className='mx-2 h-[2px] flex-1 bg-zinc-300 dark:bg-zinc-700' /> : null}
                    </div>
                  )
                })}
              </div>

              <div className='mt-2 grid grid-cols-3 gap-2'>
                {stepLabels.map((label, index) => (
                  <p
                    key={label}
                    className={
                      'text-xs font-medium ' +
                      (index === stepIndex
                        ? 'text-zinc-900 dark:text-white'
                        : index < stepIndex
                          ? 'text-zinc-700 dark:text-zinc-200'
                          : 'text-zinc-500 dark:text-zinc-400')
                    }
                  >
                    {label}
                  </p>
                ))}
              </div>
            </div>
          </div>

          <Motion.div
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.22 }}
            className='space-y-4'
          >
            {fields.map((field) => (
              <div key={field.key} className='space-y-2 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950'>
                <div className='flex items-center justify-between gap-3'>
                  <label htmlFor={field.key} className='inline-flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-200'>
                    {field.label}
                    <FieldTooltip text={field.tooltip} />
                  </label>
                  <button
                    type='button'
                    onClick={() => onToggleSkip(field.key)}
                    className='text-xs font-medium text-zinc-500 transition hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100'
                  >
                    {skipped[field.key] ? 'Undo skip' : 'Skip this field'}
                  </button>
                </div>
                <div className='mt-2 flex items-center gap-2'>
                  <input
                    id={field.key}
                    type={field.type || 'number'}
                    inputMode={field.inputMode}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    value={values[field.key] ?? ''}
                    onChange={(event) => handleFieldChange(field, event.target.value)}
                    onWheel={(event) => handleNumberInputWheel(event, field)}
                    placeholder={field.placeholder}
                    className={'flex-1 ' + inputClass + (fieldErrors[field.key] ? ' border-rose-400 focus:border-rose-500' : '')}
                    disabled={Boolean(skipped[field.key])}
                  />
                  {field.selector ? (
                    <select
                      value={values[field.selector.key] ?? field.selector.options[0]}
                      onChange={(event) => onChange(field.selector.key, event.target.value)}
                      className='rounded-lg border border-zinc-300 bg-white px-2 py-2 text-xs text-zinc-700 outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200'
                      disabled={Boolean(skipped[field.key])}
                    >
                      {field.selector.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : null}
                  {field.unit ? <span className='ml-1 text-sm text-zinc-500 dark:text-zinc-400'>{field.unit}</span> : null}
                </div>
                {fieldErrors[field.key] ? <p className='text-xs font-medium text-rose-600 dark:text-rose-400'>{fieldErrors[field.key]}</p> : null}
              </div>
            ))}
          </Motion.div>

          {children}

          <div className='mt-6 flex items-center justify-between border-t border-zinc-200 pt-4 dark:border-zinc-800'>
            <Button type='button' onClick={onBack} className='bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100'>
              Back
            </Button>
            <Button
              type='button'
              disabled={hasValidationErrors}
              onClick={() => {
                if (hasValidationErrors) return
                onNext()
              }}
              className={hasValidationErrors ? 'cursor-not-allowed opacity-60' : ''}
            >
              {nextLabel}
            </Button>
          </div>
        </Card>
      </section>
    </PageTransition>
  )
}

export default ESGInputLayout
