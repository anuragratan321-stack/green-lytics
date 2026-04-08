import Button from '../components/Button'
import Card from '../components/Card'
import PageTransition from '../components/PageTransition'

function Contact() {
  const inputClass =
    'mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-2 text-zinc-900 outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white'

  return (
    <PageTransition>
      <section className='mx-auto w-full max-w-5xl px-6 py-16'>
        <h1 className='text-4xl font-bold tracking-tight text-zinc-900 dark:text-white'>Contact</h1>
        <p className='mt-3 text-zinc-600 dark:text-zinc-300'>Send us a message through this demo form.</p>

        <Card title='Contact Form' description='No backend required for this demo.'>
          <form className='mt-6 space-y-5'>
            <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-200'>
              Name
              <input type='text' className={inputClass} placeholder='Your name' />
            </label>

            <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-200'>
              Email
              <input type='email' className={inputClass} placeholder='you@example.com' />
            </label>

            <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-200'>
              Message
              <textarea className={inputClass + ' min-h-32 resize-y'} placeholder='Write your message' />
            </label>

            <Button type='button'>Submit</Button>
          </form>
        </Card>
      </section>
    </PageTransition>
  )
}

export default Contact
