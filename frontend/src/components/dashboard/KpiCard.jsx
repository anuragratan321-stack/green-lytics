import { motion as Motion } from 'framer-motion'

function KpiCard({ title, value, status, deltaText, icon: Icon, color = 'zinc' }) {
  const colorMap = {
    green: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-900',
    yellow: 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950/30 dark:border-amber-900',
    red: 'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-300 dark:bg-rose-950/30 dark:border-rose-900',
    zinc: 'text-zinc-700 bg-zinc-50 border-zinc-200 dark:text-zinc-300 dark:bg-zinc-900 dark:border-zinc-800',
  }

  const tone = colorMap[color] || colorMap.zinc

  return (
    <Motion.article
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ duration: 0.18 }}
      className='rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900'
    >
      <div className='flex items-start justify-between gap-3'>
        <div>
          <p className='text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400'>{title}</p>
          <p className='mt-2 text-3xl font-semibold text-zinc-900 dark:text-white'>{value}</p>
        </div>
        {Icon ? (
          <span className='inline-flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200'>
            <Icon size={18} />
          </span>
        ) : null}
      </div>

      <div className='mt-4 flex items-center justify-between gap-3'>
        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}>{status}</span>
        <span className='text-xs text-zinc-500 dark:text-zinc-400'>{deltaText}</span>
      </div>
    </Motion.article>
  )
}

export default KpiCard
