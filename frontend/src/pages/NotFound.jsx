import { Link } from 'react-router-dom'
import Button from '../components/Button'
import PageTransition from '../components/PageTransition'

function NotFound() {
  return (
    <PageTransition>
      <section className='mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl flex-col items-center justify-center px-6 text-center'>
        <h1 className='text-5xl font-bold text-zinc-900 dark:text-white'>404</h1>
        <p className='mt-3 text-zinc-600 dark:text-zinc-300'>Page not found.</p>
        <Link to='/' className='mt-6'>
          <Button>Back Home</Button>
        </Link>
      </section>
    </PageTransition>
  )
}

export default NotFound
