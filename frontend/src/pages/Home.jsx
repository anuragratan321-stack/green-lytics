import { useEffect, useState } from 'react'
import { AnimatePresence, motion as Motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { BarChart3, CheckCircle2, ChevronLeft, ChevronRight, Leaf, LineChart, ShieldCheck, Sparkles, X } from 'lucide-react'
import Button from '../components/Button'
import Card from '../components/Card'
import PageTransition from '../components/PageTransition'
import { getSessionUser, signIn, signInWithOAuth, signUp, waitForSessionUser } from '../services/auth'
import { getUserSetup } from '../services/db'
import googleLogo from '../assets/Google.webp'

const USER_STORAGE_KEY = 'greenlytics_user'
const AUTH_INTENT_KEY = 'greenlytics_auth_intent'

function hasLocalCompletedSetup() {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY)
    if (!raw) return false
    const parsed = JSON.parse(raw)
    return Boolean(parsed?.completed)
  } catch {
    return false
  }
}

const showcaseItems = [
  { title: 'Real-time ESG Dashboards', description: 'Track environmental, social, and governance metrics in one clean view.', icon: BarChart3 },
  { title: 'Carbon Monitoring', description: 'Measure and compare carbon output with transparent progress trends.', icon: Leaf },
  { title: 'Actionable Insights', description: 'Turn ESG data into practical recommendations for your team.', icon: LineChart },
]

const whyChooseUs = [
  'Simple interface for student demos and presentations',
  'Fast performance with clean and readable code',
  'Clear ESG calculator logic that is easy to explain',
  'Light and dark themes for polished demonstrations',
]

const heroSlides = [
  {
    title: 'Track ESG metrics in real time',
    description: 'Monitor environmental, social, and governance performance with one unified view.',
  },
  {
    title: 'Understand risk levels instantly',
    description: 'Use color-mapped scoring and clear meanings to communicate ESG health quickly.',
  },
  {
    title: 'Convert insights into action',
    description: 'Turn score outputs into practical recommendations your team can execute.',
  },
]

function Home() {
  const navigate = useNavigate()
  const [activeSlide, setActiveSlide] = useState(0)
  const [authOpen, setAuthOpen] = useState(false)
  const [authTab, setAuthTab] = useState('login')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroSlides.length)
    }, 4500)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!authOpen) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [authOpen])

  useEffect(() => {
    ;(async () => {
      const params = new URLSearchParams(window.location.search)
      const hasOAuthParams = params.has('code') || params.has('access_token') || params.get('type') === 'recovery'
      const hasIntent = sessionStorage.getItem(AUTH_INTENT_KEY) === 'start'
      if (!hasOAuthParams && !hasIntent) return

      const user = (await waitForSessionUser()) || (await getSessionUser().catch(() => null))
      if (!user?.id) return

      const setup = await getUserSetup()
      sessionStorage.removeItem(AUTH_INTENT_KEY)
      window.history.replaceState({}, '', window.location.pathname)
      navigate(setup?.completed || hasLocalCompletedSetup() ? '/dashboard' : '/onboarding', { replace: true })
    })()
  }, [navigate])

  const goToSlide = (index) => setActiveSlide(index)
  const prevSlide = () => setActiveSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)
  const nextSlide = () => setActiveSlide((prev) => (prev + 1) % heroSlides.length)

  const handleGetStarted = async () => {
    const sessionUser = await getSessionUser().catch(() => null)
    if (!sessionUser?.id) {
      setAuthOpen(true)
      return
    }

    if (hasLocalCompletedSetup()) {
      navigate('/dashboard')
      return
    }

    const setup = await getUserSetup()
    navigate(setup?.completed ? '/dashboard' : '/onboarding')
  }

  const handleAuthSubmit = async (event) => {
    event.preventDefault()
    setAuthError('')
    setAuthLoading(true)
    try {
      if (authTab === 'login') {
        await signIn(authEmail, authPassword)
      } else {
        await signUp(authEmail, authPassword)
      }
      await waitForSessionUser()
      const setup = await getUserSetup()
      setAuthOpen(false)
      navigate(setup?.completed || hasLocalCompletedSetup() ? '/dashboard' : '/onboarding')
    } catch (error) {
      setAuthError(error.message || 'Authentication failed. Please try again.')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleOAuthStart = async () => {
    setAuthError('')
    try {
      sessionStorage.setItem(AUTH_INTENT_KEY, 'start')
      await signInWithOAuth('google')
    } catch (error) {
      setAuthError(error.message || 'Unable to continue with Google.')
      sessionStorage.removeItem(AUTH_INTENT_KEY)
    }
  }

  return (
    <PageTransition>
      <div className='mx-auto w-full max-w-6xl px-6 py-8'>
        <section className='flex min-h-[calc(100vh-6rem)] flex-col items-center justify-center text-center'>
          <Motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className='text-balance text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-6xl'
          >
            Welcome to GreenLytics
          </Motion.h1>
          <Motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.08 }}
            className='mt-8 text-xl italic text-zinc-700 dark:text-zinc-300'
          >
            Where sustainability meets intelligence...
          </Motion.p>
          <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35, delay: 0.16 }} className='mt-12'>
            <Button type='button' onClick={handleGetStarted}>
              Get Started
            </Button>
          </Motion.div>

          <Motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.22 }}
            className='mt-10 w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900'
          >
            <div className='flex items-center justify-between'>
              <p className='text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400'>Live Highlights</p>
              <div className='flex items-center gap-1.5'>
                <button
                  type='button'
                  onClick={prevSlide}
                  className='rounded-lg border border-zinc-200 p-1.5 text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800'
                  aria-label='Previous slide'
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type='button'
                  onClick={nextSlide}
                  className='rounded-lg border border-zinc-200 p-1.5 text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800'
                  aria-label='Next slide'
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            <div className='mt-4 min-h-24'>
              <AnimatePresence mode='wait'>
                <Motion.div
                  key={activeSlide}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                >
                  <h3 className='text-xl font-semibold text-zinc-900 dark:text-white'>{heroSlides[activeSlide].title}</h3>
                  <p className='mt-2 text-sm text-zinc-600 dark:text-zinc-300'>{heroSlides[activeSlide].description}</p>
                </Motion.div>
              </AnimatePresence>
            </div>

            <div className='mt-4 flex items-center justify-center gap-2'>
              {heroSlides.map((slide, index) => (
                <button
                  key={slide.title}
                  type='button'
                  onClick={() => goToSlide(index)}
                  className={'h-2 rounded-full transition-all ' + (activeSlide === index ? 'w-7 bg-zinc-900 dark:bg-white' : 'w-2 bg-zinc-300 dark:bg-zinc-600')}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </Motion.div>
        </section>

        <Motion.section
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.3 }}
          className='py-16'
        >
          <div className='mb-8 flex items-center gap-2'>
            <Sparkles size={18} className='text-green-600' />
            <h2 className='text-2xl font-bold text-zinc-900 dark:text-white'>Showcase</h2>
          </div>
          <div className='grid gap-6 md:grid-cols-3'>
            {showcaseItems.map((item) => (
              <Card key={item.title} title={item.title} description={item.description} icon={item.icon} />
            ))}
          </div>
        </Motion.section>

        <Motion.section
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.3 }}
          className='py-8'
        >
          <div className='rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900'>
            <div className='mb-4 flex items-center gap-2'>
              <ShieldCheck size={18} className='text-green-600' />
              <h2 className='text-2xl font-bold text-zinc-900 dark:text-white'>About GreenLytics</h2>
            </div>
            <p className='max-w-4xl text-base leading-relaxed text-zinc-700 dark:text-zinc-300'>
              GreenLytics is a focused ESG demo platform built to make sustainability data easy to understand. It combines
              clean design, transparent scoring, and simple workflows so teams can communicate ESG performance confidently.
            </p>
          </div>
        </Motion.section>

        <Motion.section
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.3 }}
          className='py-16'
        >
          <h2 className='text-2xl font-bold text-zinc-900 dark:text-white'>Why Choose Us</h2>
          <ul className='mt-6 grid gap-4 md:grid-cols-2'>
            {whyChooseUs.map((point) => (
              <li
                key={point}
                className='flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-5 text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300'
              >
                <CheckCircle2 size={18} className='mt-0.5 text-green-600' />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </Motion.section>
      </div>

      <AnimatePresence>
        {authOpen ? (
          <>
            <Motion.button
              type='button'
              onClick={() => setAuthOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='fixed inset-0 z-[70] bg-black/45 backdrop-blur-sm'
              aria-label='Close authentication'
            />
            <Motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.2 }}
              className='fixed inset-0 z-[80] flex items-center justify-center px-4'
            >
              <div className='w-full max-w-md'>
                <Card title={authTab === 'login' ? 'Login' : 'Sign Up'} description='Access your GreenLytics account.'>
                  <div className='mb-4 flex items-center justify-between'>
                    <div className='inline-flex rounded-xl border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-700 dark:bg-zinc-800'>
                      {[
                        { key: 'login', label: 'Login' },
                        { key: 'signup', label: 'Sign Up' },
                      ].map((tab) => (
                        <button
                          key={tab.key}
                          type='button'
                          onClick={() => setAuthTab(tab.key)}
                          className={
                            'rounded-lg px-3 py-1.5 text-xs font-semibold transition ' +
                            (authTab === tab.key ? 'bg-black text-white dark:bg-white dark:text-black' : 'text-zinc-600 dark:text-zinc-300')
                          }
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                    <button
                      type='button'
                      onClick={() => setAuthOpen(false)}
                      className='rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      aria-label='Close'
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <form onSubmit={handleAuthSubmit} className='space-y-4'>
                    <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-200'>
                      Email
                      <input
                        type='email'
                        value={authEmail}
                        onChange={(event) => setAuthEmail(event.target.value)}
                        className='mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-2 text-zinc-900 outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white'
                        placeholder='you@example.com'
                        required
                      />
                    </label>

                    <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-200'>
                      Password
                      <input
                        type='password'
                        value={authPassword}
                        onChange={(event) => setAuthPassword(event.target.value)}
                        className='mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-2 text-zinc-900 outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white'
                        placeholder='Enter password'
                        required
                      />
                    </label>

                    {authError ? <p className='text-sm text-rose-600 dark:text-rose-400'>{authError}</p> : null}

                    <Button type='submit' className='w-full' disabled={authLoading}>
                      {authLoading ? 'Please wait...' : authTab === 'login' ? 'Login' : 'Sign Up'}
                    </Button>

                    <div className='flex items-center gap-2'>
                      <div className='h-px flex-1 bg-zinc-200 dark:bg-zinc-800' />
                      <span className='text-xs text-zinc-500 dark:text-zinc-400'>or</span>
                      <div className='h-px flex-1 bg-zinc-200 dark:bg-zinc-800' />
                    </div>

                    <Button type='button' className='w-full bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100' onClick={handleOAuthStart}>
                      <span className='inline-flex items-center gap-2'>
                        <img src={googleLogo} alt='Google' className='h-4 w-4 rounded-sm object-contain' />
                        Continue with Google
                      </span>
                    </Button>
                  </form>
                </Card>
              </div>
            </Motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </PageTransition>
  )
}

export default Home
