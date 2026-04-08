import { useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'
import PageTransition from '../components/PageTransition'
import { requestPasswordReset } from '../services/auth'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const inputClass =
    'mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-2 text-zinc-900 outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white'

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setIsLoading(true)

    try {
      await requestPasswordReset(email)
      setMessage('Password reset link sent. Check your email inbox.')
    } catch (err) {
      setError(err.message || 'Could not send reset link.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <PageTransition>
      <section className='mx-auto flex w-full max-w-5xl justify-center px-6 py-16'>
        <div className='w-full max-w-md'>
          <Card title='Forgot Password' description='Enter your email to receive a secure reset link.'>
            <form onSubmit={handleSubmit} className='mt-6 space-y-5'>
              <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-200'>
                Email
                <input type='email' value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} placeholder='you@example.com' required />
              </label>

              {error ? <p className='text-sm text-rose-600 dark:text-rose-400'>{error}</p> : null}
              {message ? <p className='text-sm text-emerald-600 dark:text-emerald-400'>{message}</p> : null}

              <Button type='submit' className='w-full' disabled={isLoading}>
                {isLoading ? 'Sending link...' : 'Send Reset Link'}
              </Button>

              <p className='text-center text-sm text-zinc-600 dark:text-zinc-300'>
                <Link to='/login' className='font-semibold text-zinc-900 underline dark:text-white'>
                  Back to login
                </Link>
              </p>
            </form>
          </Card>
        </div>
      </section>
    </PageTransition>
  )
}

export default ForgotPassword
