import { useEffect, useState } from 'react'
import { AnimatePresence, motion as Motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, BarChart3, Brain, CheckCircle2, ChevronLeft, ChevronRight, Database, FileCheck2, Gauge, Leaf, LineChart, Lock, ShieldCheck, Sparkles, Wand2, X } from 'lucide-react'
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

const coreFeatures = [
  { title: 'Real-time ESG Dashboard', description: 'Monitor environmental, social, and governance scores in one live command center.', icon: Gauge },
  { title: 'AI-Powered Insights', description: 'Get structured insights and recommendations generated from your ESG inputs.', icon: Brain },
  { title: 'Carbon Tracking', description: 'Track emissions intensity and resource efficiency with transparent score impact.', icon: Leaf },
  { title: 'Smart Reporting', description: 'Export polished ESG reports for stakeholders, demos, and presentations.', icon: FileCheck2 },
  { title: 'Trend Analytics', description: 'Compare reports over time to identify score movement and performance gaps.', icon: LineChart },
  { title: 'Secure Data Layer', description: 'Built with Supabase auth and scoped records for reliable multi-user workflows.', icon: Lock },
]

const workflowSteps = [
  { title: 'Input ESG Data', description: 'Capture operational, social, and governance metrics in guided forms.', icon: Database },
  { title: 'Analyze Performance', description: 'Generate clear ESG scoring with pillar-level breakdowns and trend context.', icon: BarChart3 },
  { title: 'Get AI Insights', description: 'Receive concise, practical recommendations to improve weakest metrics.', icon: Wand2 },
]

const trustHighlights = [
  'Simple onboarding and fast setup for teams.',
  'Scoring logic designed for explainable demos.',
  'Actionable insights, not noisy long-form output.',
  'Export-ready reports for stakeholders.',
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

        <div className='mx-auto w-full max-w-6xl px-4'>
          <Motion.section
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.35 }}
            className='py-16'
          >
            <div className='relative overflow-hidden rounded-3xl border border-zinc-200/90 bg-gradient-to-br from-white via-zinc-50 to-emerald-50 p-7 shadow-md dark:border-zinc-800 dark:from-zinc-900 dark:via-zinc-900 dark:to-emerald-950/20 lg:p-9'>
              <div className='pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl' />
              <div className='pointer-events-none absolute -bottom-20 left-20 h-56 w-56 rounded-full bg-sky-500/10 blur-3xl' />
              <div className='grid items-center gap-7 lg:grid-cols-[1fr_1.2fr]'>
                <div>
                  <div className='mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300'>
                    <Sparkles size={14} />
                    Product in Action
                  </div>
                  <h2 className='text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-4xl'>See Your ESG Impact Instantly</h2>
                  <p className='mt-3 max-w-xl text-zinc-700 dark:text-zinc-300'>
                    Track, analyze, and improve your ESG performance with real-time insights.
                  </p>
                  <div className='mt-5'>
                    <Button type='button' onClick={() => navigate('/calculator')} className='inline-flex items-center gap-2 shadow-md hover:shadow-lg'>
                      Try ESG Calculator
                      <ArrowRight size={16} />
                    </Button>
                  </div>
                </div>

                <Motion.div
                  whileHover={{ y: -6, scale: 1.01 }}
                  transition={{ duration: 0.22 }}
                  className='rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900'
                >
                  <div className='grid gap-3 sm:grid-cols-3'>
                    {[
                      { label: 'ESG Score', value: '82.4', delta: '+12.1', highlight: true },
                      { label: 'Environmental', value: '78.9', delta: '+8.4' },
                      { label: 'Governance', value: '88.2', delta: '+5.7' },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className={
                          'rounded-xl border p-3 dark:border-zinc-700 ' +
                          (item.highlight
                            ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/30 dark:to-zinc-900'
                            : 'border-zinc-200 bg-zinc-50 dark:bg-zinc-950')
                        }
                      >
                        <p className='text-xs text-zinc-500 dark:text-zinc-400'>{item.label}</p>
                        <p className={'mt-1 font-extrabold text-zinc-900 dark:text-white ' + (item.highlight ? 'text-3xl' : 'text-2xl')}>{item.value}</p>
                        <p className='text-xs font-semibold text-emerald-600 dark:text-emerald-400'>{item.delta}</p>
                      </div>
                    ))}
                  </div>
                  <div className='mt-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-700'>
                    <p className='text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400'>Performance Trend</p>
                    <div className='mt-3 flex h-24 items-end gap-2'>
                      {[42, 51, 48, 64, 72, 82].map((value, index) => (
                        <Motion.div
                          key={index}
                          initial={{ height: 0, opacity: 0.7 }}
                          whileInView={{ height: `${value}%`, opacity: 1 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.35, delay: index * 0.04 }}
                          className='flex-1 rounded-md bg-gradient-to-t from-emerald-600/90 to-emerald-300/80'
                        />
                      ))}
                    </div>
                  </div>
                  <div className='mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-950'>
                    <p className='text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400'>AI Insights</p>
                    <ul className='mt-2 space-y-2 text-sm text-zinc-700 dark:text-zinc-300'>
                      <li className='inline-flex items-start gap-2'>
                        <CheckCircle2 size={14} className='mt-0.5 text-emerald-600' />
                        Renewable energy adoption improved environmental resilience.
                      </li>
                      <li className='inline-flex items-start gap-2'>
                        <CheckCircle2 size={14} className='mt-0.5 text-emerald-600' />
                        Board independence is strengthening governance stability.
                      </li>
                    </ul>
                  </div>
                </Motion.div>
              </div>
            </div>
          </Motion.section>

          <Motion.section
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.35 }}
            className='py-12'
          >
            <div className='mb-7 text-center'>
              <h2 className='text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-4xl'>Core Features</h2>
              <p className='mt-2 text-zinc-700 dark:text-zinc-300'>Everything your team needs to measure and improve ESG performance.</p>
            </div>
            <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
              {coreFeatures.map((feature, index) => (
                <Motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.24, delay: index * 0.04 }}
                  whileHover={{ y: -4 }}
                  className='h-full'
                >
                  <Card
                    title={feature.title}
                    description={feature.description}
                    icon={feature.icon}
                    className='h-full rounded-2xl border-zinc-200/90 p-7 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl dark:border-zinc-800'
                  />
                </Motion.div>
              ))}
            </div>
          </Motion.section>

          <Motion.section
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.35 }}
            className='py-12'
          >
            <div className='rounded-3xl border border-zinc-200 bg-gradient-to-b from-zinc-50 to-white p-7 dark:border-zinc-800 dark:from-zinc-900/60 dark:to-zinc-900'>
              <h2 className='text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white'>How It Works</h2>
              <div className='mt-6 grid gap-5 md:grid-cols-3'>
                {workflowSteps.map((step, index) => (
                  <Motion.div
                    key={step.title}
                    whileHover={{ y: -3 }}
                    transition={{ duration: 0.2 }}
                    className='relative rounded-2xl border border-zinc-200 bg-white p-5 transition-colors hover:border-emerald-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-emerald-900'
                  >
                    {index < workflowSteps.length - 1 ? (
                      <span className='pointer-events-none absolute -right-4 top-9 hidden h-[2px] w-8 bg-zinc-300 md:block dark:bg-zinc-700' />
                    ) : null}
                    <div className='mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white'>{index + 1}</div>
                    <div className='mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200'>
                      <step.icon size={18} />
                    </div>
                    <h3 className='mt-1 text-lg font-semibold text-zinc-900 dark:text-white'>{step.title}</h3>
                    <p className='mt-2 text-sm text-zinc-700 dark:text-zinc-300'>{step.description}</p>
                  </Motion.div>
                ))}
              </div>
            </div>
          </Motion.section>

          <Motion.section
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.35 }}
            className='py-12'
          >
            <div className='grid gap-6 rounded-3xl border border-zinc-200 bg-white p-7 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 lg:grid-cols-2'>
              <div>
                <div className='mb-3 inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-600 dark:border-zinc-700 dark:text-zinc-300'>
                  <ShieldCheck size={14} className='text-emerald-600' />
                  Why GreenLytics
                </div>
                <h2 className='text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white'>Built for clear, confident ESG decisions.</h2>
                <p className='mt-3 text-zinc-700 dark:text-zinc-300'>
                  GreenLytics helps teams understand ESG complexity quickly, align on priorities, and present results with confidence.
                </p>
              </div>
              <div className='grid gap-3'>
                {trustHighlights.map((point) => (
                  <Motion.div key={point} whileHover={{ x: 3 }} className='inline-flex items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-950'>
                    <CheckCircle2 size={16} className='mt-0.5 text-emerald-600 dark:text-emerald-400' />
                    <p className='text-sm text-zinc-700 dark:text-zinc-300'>{point}</p>
                  </Motion.div>
                ))}
              </div>
            </div>
          </Motion.section>

          <Motion.section
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.35 }}
            className='py-12'
          >
            <div className='rounded-3xl border border-zinc-200 bg-gradient-to-br from-zinc-100 to-white p-7 dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950'>
              <h2 className='text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white'>Demo Use Case</h2>
              <p className='mt-2 max-w-2xl text-zinc-700 dark:text-zinc-300'>How a company improved ESG outcomes in one reporting cycle.</p>
              <div className='mt-6 grid gap-4 md:grid-cols-2'>
                <Motion.div whileHover={{ y: -3 }} className='rounded-2xl border border-rose-200 bg-rose-50 p-5 dark:border-rose-900/40 dark:bg-rose-950/20'>
                  <p className='text-xs font-semibold uppercase tracking-wide text-rose-700 dark:text-rose-300'>Before</p>
                  <p className='mt-2 text-4xl font-extrabold text-zinc-900 dark:text-white'>54.2</p>
                  <p className='mt-2 text-sm text-zinc-700 dark:text-zinc-300'>Low renewable usage, high attrition, weak governance disclosure.</p>
                </Motion.div>
                <Motion.div whileHover={{ y: -3 }} className='rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20'>
                  <p className='text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300'>After</p>
                  <p className='mt-2 text-4xl font-extrabold text-zinc-900 dark:text-white'>78.6</p>
                  <p className='mt-2 text-sm text-zinc-700 dark:text-zinc-300'>Targeted actions increased ESG score by +24.4 points in one cycle.</p>
                </Motion.div>
              </div>
            </div>
          </Motion.section>

          <Motion.section
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.35 }}
            className='py-16'
          >
            <div className='relative overflow-hidden rounded-3xl border border-zinc-200 bg-gradient-to-br from-emerald-50 via-white to-zinc-100 p-9 text-center shadow-md dark:border-zinc-800 dark:from-emerald-950/30 dark:via-zinc-900 dark:to-zinc-950'>
              <div className='pointer-events-none absolute -left-16 top-0 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl' />
              <div className='pointer-events-none absolute -right-14 bottom-0 h-44 w-44 rounded-full bg-sky-500/10 blur-3xl' />
              <h2 className='text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-5xl'>Start Tracking ESG Today</h2>
              <p className='mx-auto mt-3 max-w-2xl text-zinc-700 dark:text-zinc-300'>Turn ESG reporting into a clear, measurable system your team can act on.</p>
              <div className='mt-7 flex flex-wrap items-center justify-center gap-3'>
                <Button type='button' onClick={handleGetStarted} className='inline-flex items-center gap-2 shadow-md hover:shadow-lg'>
                  Get Started
                  <ArrowRight size={16} />
                </Button>
                <Button type='button' onClick={() => navigate('/calculator')} className='bg-zinc-200 text-zinc-900 shadow-sm hover:shadow-md dark:bg-zinc-800 dark:text-zinc-100'>
                  Try Demo
                </Button>
              </div>
            </div>
          </Motion.section>
        </div>
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
