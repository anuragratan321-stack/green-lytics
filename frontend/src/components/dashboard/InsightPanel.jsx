import { motion as Motion } from 'framer-motion'
import { Link } from 'react-router-dom'

function InsightPanel({ insights = [] }) {
  return (
    <div className='space-y-2.5'>
      {insights.map((insight, index) => (
        <Motion.div
          key={`${insight}-${index}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: index * 0.04 }}
          className='rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-200'
        >
          {insight}
        </Motion.div>
      ))}

      <Link to='/analysis' className='inline-flex text-sm font-medium text-zinc-700 transition hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100'>
        View Full Insights →
      </Link>
    </div>
  )
}

export default InsightPanel
