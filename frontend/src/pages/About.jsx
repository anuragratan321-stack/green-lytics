import { motion as Motion } from 'framer-motion'
import {
  ArrowRight,
  BarChart3,
  Bot,
  ClipboardCheck,
  Eye,
  FileText,
  Leaf,
  LineChart,
  Target,
  Users,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'
import PageTransition from '../components/PageTransition'

const featureItems = [
  {
    title: 'ESG Score Calculation',
    description: 'Turn raw sustainability inputs into a clear ESG score with transparent weighting across environmental, social, and governance pillars.',
    icon: BarChart3,
  },
  {
    title: 'Report Generation',
    description: 'Save structured ESG reports your team can review, compare over time, and use for internal and stakeholder conversations.',
    icon: FileText,
  },
  {
    title: 'AI Insights',
    description: 'Get concise observations that highlight strengths, flag weak areas, and make next actions easier to prioritize.',
    icon: Bot,
  },
  {
    title: 'Performance Tracking',
    description: 'Monitor trend movement across reports so progress is visible, measurable, and grounded in data.',
    icon: LineChart,
  },
]

const valuePoints = [
  {
    title: 'Data-Driven Sustainability Decisions',
    description: 'Move from assumptions to evidence by tracking metrics that matter and seeing their impact over time.',
    icon: ClipboardCheck,
  },
  {
    title: 'Transparency and Accountability',
    description: 'Create a consistent reporting rhythm that helps teams align and communicate ESG performance clearly.',
    icon: Eye,
  },
  {
    title: 'Focused Improvement',
    description: 'Identify where improvement effort creates the most ESG impact instead of treating every metric equally.',
    icon: Target,
  },
]

const howItWorksSteps = [
  {
    title: 'Input ESG Data',
    description: 'Capture environmental, social, and governance inputs through a guided workflow.',
    icon: Leaf,
  },
  {
    title: 'Generate Analysis',
    description: 'Compute scores, produce report breakdowns, and summarize key findings instantly.',
    icon: BarChart3,
  },
  {
    title: 'Track and Improve',
    description: 'Review trends, compare outcomes, and run the next cycle with better decisions.',
    icon: LineChart,
  },
]

function HeroSection() {
  const navigate = useNavigate()

  return (
    <section className='relative overflow-hidden rounded-[2rem] border border-zinc-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-6 py-14 shadow-sm dark:border-zinc-800 dark:from-zinc-900 dark:via-zinc-950 dark:to-emerald-950/20 sm:px-10 sm:py-16'>
      <div className='pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-200/50 blur-3xl dark:bg-emerald-700/20' />
      <div className='pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-teal-200/40 blur-3xl dark:bg-teal-700/20' />

      <Motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className='relative mx-auto max-w-3xl text-center'
      >
        <p className='inline-flex items-center rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:border-emerald-900/60 dark:bg-zinc-900/70 dark:text-emerald-300'>
          About GreenLytics
        </p>
        <h1 className='mt-5 text-balance text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white sm:text-5xl'>
          ESG Intelligence Built for Clear Decisions
        </h1>
        <p className='mx-auto mt-4 max-w-2xl text-base leading-relaxed text-zinc-600 dark:text-zinc-300 sm:text-lg'>
          GreenLytics helps teams transform scattered sustainability data into scores, reports, and actionable insights they can actually use.
        </p>
        <div className='mt-8 flex flex-wrap items-center justify-center gap-3'>
          <Button type='button' onClick={() => navigate('/analysis/new')} className='inline-flex items-center gap-2'>
            Start Analysis
            <ArrowRight size={16} />
          </Button>
          <Button type='button' onClick={() => navigate('/dashboard')} className='bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100'>
            Go to Dashboard
          </Button>
        </div>
      </Motion.div>
    </section>
  )
}

function FeaturesGrid() {
  return (
    <section className='mt-16'>
      <div className='max-w-3xl'>
        <h2 className='text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white'>Core Product Capabilities</h2>
        <p className='mt-3 text-zinc-600 dark:text-zinc-300'>Everything in GreenLytics is designed to make ESG performance measurable, understandable, and easier to improve.</p>
      </div>

      <div className='mt-8 grid gap-5 sm:grid-cols-2'>
        {featureItems.map((item, index) => (
          <Motion.div
            key={item.title}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.28, delay: index * 0.04 }}
          >
            <Card className='h-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md'>
              <div className='inline-flex rounded-xl bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'>
                <item.icon size={18} />
              </div>
              <h3 className='mt-4 text-lg font-semibold text-zinc-900 dark:text-white'>{item.title}</h3>
              <p className='mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300'>{item.description}</p>
            </Card>
          </Motion.div>
        ))}
      </div>
    </section>
  )
}

function HowItWorks() {
  return (
    <section className='mt-16'>
      <div className='max-w-3xl'>
        <h2 className='text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white'>How GreenLytics Works</h2>
        <p className='mt-3 text-zinc-600 dark:text-zinc-300'>A simple three-step flow to move from ESG inputs to measurable progress.</p>
      </div>

      <div className='mt-8 grid gap-4 md:grid-cols-3'>
        {howItWorksSteps.map((step, index) => (
          <Motion.div
            key={step.title}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.28, delay: index * 0.06 }}
            className='relative'
          >
            <div className='h-full rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900'>
              <div className='inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'>
                Step {index + 1}
              </div>
              <div className='mt-4 inline-flex rounded-xl bg-teal-100 p-2 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300'>
                <step.icon size={18} />
              </div>
              <h3 className='mt-4 text-lg font-semibold text-zinc-900 dark:text-white'>{step.title}</h3>
              <p className='mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300'>{step.description}</p>
            </div>
          </Motion.div>
        ))}
      </div>
    </section>
  )
}

function CTASection() {
  const navigate = useNavigate()

  return (
    <section className='mt-16 rounded-[1.75rem] border border-zinc-200 bg-zinc-900 px-6 py-12 text-center text-white shadow-sm dark:border-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 sm:px-10'>
      <h2 className='text-3xl font-semibold tracking-tight'>Start Analyzing ESG Performance with Confidence</h2>
      <p className='mx-auto mt-3 max-w-2xl text-zinc-300 dark:text-zinc-700'>
        Build a more transparent sustainability workflow with clear scores, report history, and insight-driven decisions.
      </p>
      <div className='mt-7 flex flex-wrap items-center justify-center gap-3'>
        <Button type='button' onClick={() => navigate('/analysis/new')} className='inline-flex items-center gap-2 bg-white text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800'>
          Start Analysis
          <ArrowRight size={16} />
        </Button>
        <Button type='button' onClick={() => navigate('/dashboard')} className='bg-zinc-700 text-zinc-100 hover:bg-zinc-600 dark:bg-zinc-300 dark:text-zinc-900 dark:hover:bg-zinc-400'>
          Go to Dashboard
        </Button>
      </div>
    </section>
  )
}

function About() {
  return (
    <PageTransition>
      <section className='mx-auto w-full max-w-6xl px-6 py-10 sm:py-14'>
        <HeroSection />

        <section className='mt-16 grid gap-6 lg:grid-cols-[1.25fr_1fr]'>
          <Card className='h-full'>
            <h2 className='text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white'>What Is GreenLytics</h2>
            <p className='mt-4 text-base leading-relaxed text-zinc-600 dark:text-zinc-300'>
              ESG data is often fragmented across spreadsheets, teams, and reporting cycles, making it hard to understand what is actually improving.
            </p>
            <p className='mt-3 text-base leading-relaxed text-zinc-600 dark:text-zinc-300'>
              GreenLytics brings ESG data into one workflow where users can input metrics, generate analysis, track report history, and act on insights without complexity.
            </p>
          </Card>

          <Card className='h-full'>
            <h3 className='text-xl font-semibold text-zinc-900 dark:text-white'>Vision</h3>
            <p className='mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300'>
              Make ESG understandable and actionable for every team by turning complex sustainability data into clear, practical decisions.
            </p>
            <h3 className='mt-6 text-xl font-semibold text-zinc-900 dark:text-white'>Mission</h3>
            <p className='mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300'>
              Help organizations build consistent ESG habits through better tracking, transparent reporting, and insight-led improvement.
            </p>
          </Card>
        </section>

        <FeaturesGrid />

        <section className='mt-16'>
          <div className='max-w-3xl'>
            <h2 className='text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white'>Why GreenLytics Matters</h2>
            <p className='mt-3 text-zinc-600 dark:text-zinc-300'>Sustainability progress should be measurable and visible. GreenLytics helps teams understand where they stand and what to improve next.</p>
          </div>

          <div className='mt-8 grid gap-4 md:grid-cols-3'>
            {valuePoints.map((item, index) => (
              <Motion.div
                key={item.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.28, delay: index * 0.05 }}
              >
                <Card className='h-full'>
                  <div className='inline-flex rounded-xl bg-zinc-100 p-2 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200'>
                    <item.icon size={18} />
                  </div>
                  <h3 className='mt-4 text-lg font-semibold text-zinc-900 dark:text-white'>{item.title}</h3>
                  <p className='mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300'>{item.description}</p>
                </Card>
              </Motion.div>
            ))}
          </div>
        </section>

        <HowItWorks />

        <section className='mt-16'>
          <Card>
            <div className='flex flex-col gap-4 sm:flex-row sm:items-center'>
              <div className='inline-flex rounded-xl bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'>
                <Users size={18} />
              </div>
              <div>
                <h2 className='text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white'>Built with Purpose</h2>
                <p className='mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300'>
                  GreenLytics is built by students passionate about sustainability and technology, with a focus on making ESG workflows practical for real teams.
                </p>
              </div>
            </div>
          </Card>
        </section>

        <CTASection />
      </section>
    </PageTransition>
  )
}

export default About
