import Card from '../components/Card'
import PageTransition from '../components/PageTransition'

const faqs = [
  {
    question: 'How is the ESG score calculated?',
    answer: 'The demo calculator uses weighted scores: Environmental 40%, Social 30%, Governance 30%.',
  },
  {
    question: 'Can I export reports?',
    answer: 'This demo focuses on UI and navigation, but report exports can be integrated later.',
  },
  {
    question: 'Is GreenLytics suitable for student demos?',
    answer: 'Yes. The structure is intentionally simple, readable, and presentation-friendly.',
  },
  {
    question: 'Does it require internet after build?',
    answer: 'No external backend is required, so it works offline once built.',
  },
]

function Help() {
  return (
    <PageTransition>
      <section className='mx-auto w-full max-w-5xl px-6 py-16'>
        <h1 className='text-4xl font-bold tracking-tight text-zinc-900 dark:text-white'>Help</h1>
        <p className='mt-3 text-zinc-600 dark:text-zinc-300'>Frequently asked questions.</p>

        <div className='mt-10 space-y-4'>
          {faqs.map((faq) => (
            <Card key={faq.question} title={faq.question} description={faq.answer} />
          ))}
        </div>
      </section>
    </PageTransition>
  )
}

export default Help
