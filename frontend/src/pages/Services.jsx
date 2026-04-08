import { BarChart3, FileText, Leaf, LineChart } from 'lucide-react'
import Card from '../components/Card'
import PageTransition from '../components/PageTransition'

const services = [
  {
    title: 'ESG Analytics',
    description: 'Track ESG performance trends with clear metrics and benchmark-ready insights.',
    icon: BarChart3,
  },
  {
    title: 'Carbon Tracking',
    description: 'Monitor emissions progress and support climate-focused decision making.',
    icon: Leaf,
  },
  {
    title: 'Sustainability Reports',
    description: 'Create concise reports for stakeholders with transparent ESG summaries.',
    icon: FileText,
  },
  {
    title: 'Performance Insights',
    description: 'Understand where to improve through practical, data-backed recommendations.',
    icon: LineChart,
  },
]

function Services() {
  return (
    <PageTransition>
      <section className='mx-auto w-full max-w-5xl px-6 py-16'>
        <h1 className='text-4xl font-bold tracking-tight text-zinc-900 dark:text-white'>Services</h1>
        <p className='mt-3 text-zinc-600 dark:text-zinc-300'>Simple tools to support your sustainability initiatives.</p>

        <div className='mt-10 grid gap-6 sm:grid-cols-2'>
          {services.map((item) => (
            <Card key={item.title} title={item.title} description={item.description} icon={item.icon} />
          ))}
        </div>
      </section>
    </PageTransition>
  )
}

export default Services
