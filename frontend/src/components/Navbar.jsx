import { useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion as Motion } from 'framer-motion'
import { BarChart3, ChevronDown, CircleHelp, LayoutDashboard, LogIn, LogOut, LucideUserCircle2, Menu, Moon, Settings2, Sun, X } from 'lucide-react'
import AccountMenu from './AccountMenu'
import logo from '../assets/greenlytics.png'
import { getSessionUser, signOut, subscribeToAuthChanges } from '../services/auth'

const navItems = [
  { label: 'About', to: '/about', icon: CircleHelp },
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Reports', to: '/reports', icon: BarChart3 },
  { label: 'ESG Calculator', to: '/calculator', icon: BarChart3 },
]

const USER_STORAGE_KEY = 'greenlytics_user'

function getAvatarStorageKey(userId) {
  return `greenlytics_avatar_${userId || 'guest'}`
}

function getStoredProfileName() {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY)
    if (!raw) return ''
    const parsed = JSON.parse(raw)
    return typeof parsed?.name === 'string' ? parsed.name.trim() : ''
  } catch {
    return ''
  }
}

function Navbar({ theme, onToggleTheme }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [isAuthReady, setIsAuthReady] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState('')
  const profileButtonRef = useRef(null)
  const profileMenuRef = useRef(null)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    let mounted = true

    const syncUser = (nextUser) => {
      if (!mounted) return
      setUser(nextUser || null)
      if (nextUser?.id) {
        setAvatarUrl(localStorage.getItem(getAvatarStorageKey(nextUser.id)) || '')
      } else {
        setAvatarUrl('')
        setProfileOpen(false)
      }
      setIsAuthReady(true)
    }

    ;(async () => {
      const currentUser = await getSessionUser().catch(() => null)
      syncUser(currentUser || null)
    })()

    const unsubscribe = subscribeToAuthChanges(({ user: nextUser }) => {
      syncUser(nextUser || null)
    })

    return () => {
      mounted = false
      unsubscribe?.()
    }
  }, [])

  useEffect(() => {
    if (!profileOpen) return

    const handleOutside = (event) => {
      const target = event.target
      if (profileButtonRef.current?.contains(target) || profileMenuRef.current?.contains(target)) return
      setProfileOpen(false)
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setProfileOpen(false)
      }
    }

    window.addEventListener('mousedown', handleOutside)
    window.addEventListener('keydown', handleEscape)
    return () => {
      window.removeEventListener('mousedown', handleOutside)
      window.removeEventListener('keydown', handleEscape)
    }
  }, [profileOpen])

  const linkClass = ({ isActive }) =>
    'text-sm font-medium transition-colors ' +
    (isActive ? 'text-black dark:text-white' : 'text-zinc-600 hover:text-black dark:text-zinc-300 dark:hover:text-white')

  const isLoggedIn = Boolean(user?.id)
  const storedName = getStoredProfileName()
  const userName = storedName || (user?.email ? user.email.split('@')[0] : 'My Account')

  const handleSignOut = async () => {
    await signOut().catch(() => {})
    setProfileOpen(false)
    setUser(null)
    setAvatarUrl('')
    localStorage.removeItem(USER_STORAGE_KEY)
    navigate('/', { replace: true })
  }

  const handleMenuNavigate = (path) => {
    setProfileOpen(false)
    navigate(path)
  }

  return (
    <header className='sticky top-0 z-40 border-b border-zinc-200/80 bg-white/90 backdrop-blur transition-colors dark:border-zinc-800 dark:bg-zinc-950/90'>
      <nav className='mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6'>
        <NavLink to='/' className='flex items-center gap-2.5'>
          <img src={logo} alt='GreenLytics logo' className='h-8 w-8 rounded-lg object-cover' />
          <span className='text-2xl font-bold tracking-tight text-zinc-900 dark:text-white'>GreenLytics</span>
        </NavLink>

        <ul className='hidden items-center gap-8 lg:flex'>
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} className={linkClass}>
                {item.label}
              </NavLink>
            </li>
          ))}
          {isAuthReady && !isLoggedIn ? (
            <li>
              <NavLink to='/sign-in' className={linkClass}>
                Sign-In
              </NavLink>
            </li>
          ) : null}
        </ul>

        <div className='flex items-center gap-2'>
          <button
            type='button'
            onClick={onToggleTheme}
            aria-label='Toggle theme'
            className='inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800'
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {isAuthReady && isLoggedIn ? (
            <div className='relative'>
              <button
                ref={profileButtonRef}
                type='button'
                onClick={(event) => {
                  event.stopPropagation()
                  setProfileOpen((prev) => !prev)
                }}
                className='inline-flex h-10 items-center gap-1 rounded-xl border border-zinc-200 bg-white px-3 text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800'
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt='Profile' className='h-6 w-6 rounded-full object-cover' />
                ) : (
                  <LucideUserCircle2 size={20} />
                )}
                <ChevronDown size={14} />
              </button>

              <AnimatePresence>
                {profileOpen ? (
                  <div ref={profileMenuRef} onClick={(event) => event.stopPropagation()}>
                    <AccountMenu
                      userName={userName}
                      userEmail={user?.email || ''}
                      avatarUrl={avatarUrl}
                      onNavigate={handleMenuNavigate}
                      onLogout={handleSignOut}
                    />
                  </div>
                ) : null}
              </AnimatePresence>
            </div>
          ) : null}

          <button
            type='button'
            onClick={() => setOpen((prev) => !prev)}
            aria-label='Toggle menu'
            className='rounded-xl border border-zinc-200 p-2 text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800 lg:hidden'
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <>
            <Motion.button
              type='button'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              className='fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px] lg:hidden'
              aria-label='Close sidebar'
            />

            <Motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.28, ease: 'easeInOut' }}
              className='fixed right-0 top-0 z-50 h-screen w-[80%] max-w-[18rem] border-l border-zinc-200 bg-zinc-50 px-5 py-6 dark:border-zinc-800 dark:bg-zinc-950 lg:hidden'
            >
              <div className='mb-8 flex items-center justify-between'>
                <button
                  type='button'
                  onClick={() => setOpen(false)}
                  className='rounded-xl p-2 text-zinc-700 hover:bg-zinc-200 dark:text-zinc-200 dark:hover:bg-zinc-800'
                  aria-label='Close menu'
                >
                  <Menu size={26} />
                </button>

                <button
                  type='button'
                  onClick={() => setOpen(false)}
                  className='rounded-lg p-2 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                  aria-label='Close'
                >
                  <X size={18} />
                </button>
              </div>

              <ul className='space-y-3'>
                {navItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        onClick={() => setOpen(false)}
                        className={({ isActive }) =>
                          'flex items-center gap-3 rounded-xl px-2 py-2.5 text-lg font-medium transition ' +
                          (isActive
                            ? 'text-black dark:text-white'
                            : 'text-zinc-700 hover:bg-zinc-200 dark:text-zinc-200 dark:hover:bg-zinc-800')
                        }
                      >
                        <Icon size={22} strokeWidth={2} />
                        <span>{item.label}</span>
                      </NavLink>
                    </li>
                  )
                })}

                {isAuthReady && !isLoggedIn ? (
                  <li>
                    <NavLink
                      to='/sign-in'
                      onClick={() => setOpen(false)}
                      className={({ isActive }) =>
                        'flex items-center gap-3 rounded-xl px-2 py-2.5 text-lg font-medium transition ' +
                        (isActive ? 'text-black dark:text-white' : 'text-zinc-700 hover:bg-zinc-200 dark:text-zinc-200 dark:hover:bg-zinc-800')
                      }
                    >
                      <LogIn size={22} strokeWidth={2} />
                      <span>Sign-In</span>
                    </NavLink>
                  </li>
                ) : (
                  <>
                    <li>
                      <button
                        type='button'
                        onClick={() => {
                          setOpen(false)
                          navigate('/dashboard')
                        }}
                        className='flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left text-lg font-medium text-zinc-700 transition hover:bg-zinc-200 dark:text-zinc-200 dark:hover:bg-zinc-800'
                      >
                        <LayoutDashboard size={22} strokeWidth={2} />
                        <span>Dashboard</span>
                      </button>
                    </li>
                    <li>
                      <button
                        type='button'
                        onClick={() => {
                          setOpen(false)
                          navigate('/settings')
                        }}
                        className='flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left text-lg font-medium text-zinc-700 transition hover:bg-zinc-200 dark:text-zinc-200 dark:hover:bg-zinc-800'
                      >
                        <Settings2 size={22} strokeWidth={2} />
                        <span>Manage Profile</span>
                      </button>
                    </li>
                    <li>
                      <button
                        type='button'
                        onClick={() => {
                          setOpen(false)
                          handleSignOut()
                        }}
                        className='flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left text-lg font-medium text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30'
                      >
                        <LogOut size={22} strokeWidth={2} />
                        <span>Logout</span>
                      </button>
                    </li>
                  </>
                )}

                <li>
                  <button
                    type='button'
                    onClick={onToggleTheme}
                    className='flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left text-lg font-medium text-zinc-700 transition hover:bg-zinc-200 dark:text-zinc-200 dark:hover:bg-zinc-800'
                  >
                    {theme === 'dark' ? <Sun size={22} strokeWidth={2} /> : <Moon size={22} strokeWidth={2} />}
                    <span>Change Theme</span>
                  </button>
                </li>
              </ul>
            </Motion.aside>
          </>
        )}
      </AnimatePresence>
    </header>
  )
}

export default Navbar
