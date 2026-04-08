import { motion as Motion } from 'framer-motion'
import { BarChart3, LayoutDashboard, LogOut, Plus, Settings } from 'lucide-react'

function AccountMenu({ userName, userEmail, avatarUrl, onNavigate, onLogout }) {
  const itemClass =
    'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800'

  return (
    <Motion.div
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className='absolute right-0 z-50 mt-2 w-72 rounded-2xl border border-zinc-200 bg-white p-3 shadow-xl dark:border-zinc-700 dark:bg-zinc-900'
      role='menu'
      aria-label='Account menu'
    >
      <div className='mb-3 flex items-center gap-3 rounded-xl px-1 py-1'>
        {avatarUrl ? (
          <img src={avatarUrl} alt='User avatar' className='h-10 w-10 rounded-full border border-zinc-200 object-cover dark:border-zinc-700' />
        ) : (
          <div className='flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-zinc-100 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'>
            {userName?.slice(0, 1)?.toUpperCase() || 'U'}
          </div>
        )}

        <div className='min-w-0'>
          <p className='truncate text-sm font-semibold text-zinc-900 dark:text-white'>{userName}</p>
          <p className='truncate text-xs text-zinc-500 dark:text-zinc-400'>{userEmail}</p>
        </div>
      </div>

      <div className='space-y-1'>
        <button type='button' onClick={() => onNavigate('/dashboard')} className={itemClass} role='menuitem'>
          <LayoutDashboard size={16} />
          Dashboard
        </button>

        <button
          type='button'
          onClick={() => onNavigate('/analysis/new')}
          className='flex w-full items-center gap-2.5 rounded-xl bg-zinc-100 px-3 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700'
          role='menuitem'
        >
          <Plus size={16} />
          New Analysis
        </button>

        <button type='button' onClick={() => onNavigate('/reports')} className={itemClass} role='menuitem'>
          <BarChart3 size={16} />
          Insights
        </button>
      </div>

      <div className='my-3 h-px bg-zinc-200 dark:bg-zinc-700' />

      <div className='space-y-1'>
        <button type='button' onClick={() => onNavigate('/settings')} className={itemClass} role='menuitem'>
          <Settings size={16} />
          Settings
        </button>

        <button
          type='button'
          onClick={onLogout}
          className='flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30'
          role='menuitem'
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </Motion.div>
  )
}

export default AccountMenu
