import Button from '../components/Button'
import Card from '../components/Card'
import PageTransition from '../components/PageTransition'

function SignIn() {
  const inputClass =
    'mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-2 text-zinc-900 outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white'

  return (
    <PageTransition>
      <section className='mx-auto flex w-full max-w-5xl justify-center px-6 py-16'>
        <div className='w-full max-w-md'>
          <Card title='Sign-In' description='Demo-only sign-in interface.'>
            <form className='mt-6 space-y-5'>
              <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-200'>
                Email
                <input type='email' className={inputClass} placeholder='you@example.com' />
              </label>
              <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-200'>
                Password
                <input type='password' className={inputClass} placeholder='Enter password' />
              </label>
              <Button type='button' className='w-full'>
                Login
              </Button>
            </form>
          </Card>
        </div>
      </section>
    </PageTransition>
  )
}

export default SignIn
