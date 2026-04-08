import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'
import PageTransition from '../components/PageTransition'
import { updatePassword } from '../services/auth'

function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const inputClass =
    'mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-2 text-zinc-900 outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white'

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsLoading(true)
    try {
      await updatePassword(password)
      navigate('/login', { replace: true })
    } catch (err) {
      setError(err.message || 'Unable to reset password.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <PageTransition>
      <section className='mx-auto flex w-full max-w-5xl justify-center px-6 py-16'>
        <div className='w-full max-w-md'>
          <Card title='Reset Password' description='Create a new password for your account.'>
            <form onSubmit={handleSubmit} className='mt-6 space-y-5'>
              <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-200'>
                New password
                <input type='password' value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} placeholder='Enter new password' required />
              </label>

              <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-200'>
                Confirm password
                <input
                  type='password'
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className={inputClass}
                  placeholder='Confirm new password'
                  required
                />
              </label>

              {error ? <p className='text-sm text-rose-600 dark:text-rose-400'>{error}</p> : null}

              <Button type='submit' className='w-full' disabled={isLoading}>
                {isLoading ? 'Updating password...' : 'Update Password'}
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

export default ResetPassword
