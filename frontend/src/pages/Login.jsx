import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'
import PageTransition from '../components/PageTransition'
import { getCurrentUser, signIn, signInWithOAuth, waitForSessionUser } from '../services/auth'
import { getUserSetup } from '../services/db'
import googleLogo from '../assets/Google.webp'

const USER_STORAGE_KEY = 'greenlytics_user'

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

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isOAuthLoading, setIsOAuthLoading] = useState(false)

  const inputClass =
    'mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-2 text-zinc-900 outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white'

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await signIn(email, password)
      await waitForSessionUser()
      const setup = await getUserSetup()
      navigate(setup?.completed || hasLocalCompletedSetup() ? '/dashboard' : '/onboarding')
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    ;(async () => {
      const user = await getCurrentUser().catch(() => null)
      if (!user?.id) return
      await waitForSessionUser()
      const setup = await getUserSetup()
      navigate(setup?.completed || hasLocalCompletedSetup() ? '/dashboard' : '/onboarding', { replace: true })
    })()
  }, [navigate])

  const handleOAuth = async (provider) => {
    setError('')
    setIsOAuthLoading(true)
    try {
      await signInWithOAuth(provider)
    } catch (err) {
      setError(err.message || `Unable to continue with ${provider}.`)
      setIsOAuthLoading(false)
    }
  }

  return (
    <PageTransition>
      <section className='mx-auto flex w-full max-w-5xl justify-center px-6 py-16'>
        <div className='w-full max-w-md'>
          <Card title='Login' description='Access your GreenLytics account.'>
            <form onSubmit={handleSubmit} className='mt-6 space-y-5'>
              <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-200'>
                Email
                <input type='email' value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder='you@example.com' required />
              </label>

              <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-200'>
                Password
                <input type='password' value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} placeholder='Enter password' required />
              </label>

              {error ? <p className='text-sm text-rose-600 dark:text-rose-400'>{error}</p> : null}

              <Button type='submit' className='w-full' disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>

              <div className='flex items-center gap-2'>
                <div className='h-px flex-1 bg-zinc-200 dark:bg-zinc-800' />
                <span className='text-xs text-zinc-500 dark:text-zinc-400'>or</span>
                <div className='h-px flex-1 bg-zinc-200 dark:bg-zinc-800' />
              </div>

              <div className='space-y-2'>
                <Button type='button' className='w-full bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100' onClick={() => handleOAuth('google')} disabled={isOAuthLoading}>
                  <span className='inline-flex items-center gap-2'>
                    <img src={googleLogo} alt='Google' className='h-4 w-4 rounded-sm object-contain' />
                    Continue with Google
                  </span>
                </Button>
              </div>

              <p className='text-center text-sm text-zinc-600 dark:text-zinc-300'>
                <Link to='/forgot-password' className='font-semibold text-zinc-900 underline dark:text-white'>
                  Forgot password?
                </Link>
              </p>

              <p className='text-center text-sm text-zinc-600 dark:text-zinc-300'>
                New here?{' '}
                <Link to='/signup' className='font-semibold text-zinc-900 underline dark:text-white'>
                  Create an account
                </Link>
              </p>
            </form>
          </Card>
        </div>
      </section>
    </PageTransition>
  )
}

export default Login
