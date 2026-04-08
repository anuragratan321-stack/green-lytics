import { AnimatePresence, motion as Motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

function SettingsSection({ id, title, icon: Icon, summary, activeSection, onToggle, children }) {
  const isOpen = activeSection === id

  return (
    <Motion.section
      layout
      className={
        'rounded-2xl border bg-white shadow-sm transition-colors dark:bg-zinc-900 ' +
        (isOpen ? 'border-zinc-400 dark:border-zinc-600' : 'border-zinc-200 dark:border-zinc-800')
      }
    >
      <button
        type='button'
        onClick={() => onToggle(id)}
        className='flex w-full items-center justify-between gap-3 rounded-2xl px-5 py-4 text-left transition hover:bg-zinc-50 dark:hover:bg-zinc-800/70'
      >
        <div className='flex min-w-0 items-center gap-3'>
          <span className='inline-flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200'>
            <Icon size={17} />
          </span>
          <div className='min-w-0'>
            <h3 className='text-sm font-semibold text-zinc-900 dark:text-white'>{title}</h3>
            <p className='truncate text-xs text-zinc-500 dark:text-zinc-400'>{summary}</p>
          </div>
        </div>

        <ChevronDown size={16} className={'text-zinc-500 transition-transform ' + (isOpen ? 'rotate-180' : '')} />
      </button>

      <AnimatePresence initial={false}>
        {isOpen ? (
          <Motion.div
            key='content'
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className='overflow-hidden'
          >
            <div className='border-t border-zinc-200 px-5 py-4 dark:border-zinc-800'>{children}</div>
          </Motion.div>
        ) : null}
      </AnimatePresence>
    </Motion.section>
  )
}

export default SettingsSection
