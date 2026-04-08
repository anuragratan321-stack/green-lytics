import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion as Motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'
import PageTransition from '../components/PageTransition'
import { getCurrentUser } from '../services/auth'
import { getUserSetup, saveUserSetup } from '../services/db'

const USER_STORAGE_KEY = 'greenlytics_user'
const TOTAL_STEPS = 5

const industries = ['IT / Tech', 'Manufacturing', 'Finance', 'Healthcare', 'Logistics', 'Energy']
const roles = ['Manager', 'Employee', 'Worker', 'Consultant']
const companySizes = ['Small', 'Medium', 'Large']

const inputClass =
  'mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-2 text-zinc-900 outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white'

const stepVariants = {
  enter: (direction) => ({ opacity: 0, x: direction > 0 ? 24 : -24 }),
  center: { opacity: 1, x: 0 },
  exit: (direction) => ({ opacity: 0, x: direction > 0 ? -24 : 24 }),
}

const emptyUser = {
  industry: '',
  role: '',
  name: '',
  companySize: '',
  region: '',
  step: 1,
  completed: false,
}

function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    return {
      ...emptyUser,
      ...parsed,
      step: Number(parsed.step) >= 1 && Number(parsed.step) <= TOTAL_STEPS ? Number(parsed.step) : 1,
      completed: Boolean(parsed.completed),
    }
  } catch {
    return null
  }
}

function Onboarding() {
  const navigate = useNavigate()
  const existingUser = useMemo(() => getStoredUser(), [])
  const [direction, setDirection] = useState(1)
  const [step, setStep] = useState(existingUser?.step ?? 1)
  const [user, setUser] = useState(existingUser ?? emptyUser)
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const [isCompletingSetup, setIsCompletingSetup] = useState(false)
  const [setupError, setSetupError] = useState('')

  useEffect(() => {
    localStorage.setItem(
      USER_STORAGE_KEY,
      JSON.stringify({
        ...user,
        step,
      }),
    )
  }, [step, user])

  useEffect(() => {
    ;(async () => {
      const currentUser = await getCurrentUser().catch(() => null)
      if (!currentUser?.id) {
        navigate('/login', { replace: true })
        return
      }

      const setup = await getUserSetup()
      if (setup?.completed) {
        const mergedUser = {
          ...emptyUser,
          ...(existingUser || {}),
          name: setup.name || existingUser?.name || '',
          industry: setup.industry || existingUser?.industry || '',
          role: setup.role || existingUser?.role || '',
          companySize: setup.company_size || existingUser?.companySize || '',
          region: setup.region || existingUser?.region || '',
          completed: true,
          step: 5,
        }
        localStorage.setItem(
          USER_STORAGE_KEY,
          JSON.stringify(mergedUser),
        )
        navigate('/dashboard', { replace: true })
        return
      }

      if (!setup?.completed && existingUser?.completed) {
        navigate('/dashboard', { replace: true })
        return
      }

      if (setup) {
        const resolvedStep = setup.completed
          ? 5
          : setup.step && setup.step >= 1 && setup.step < TOTAL_STEPS
            ? setup.step
            : 1
        setUser((prev) => ({
          ...prev,
          name: setup.name || prev.name,
          industry: setup.industry || prev.industry,
          role: setup.role || prev.role,
          companySize: setup.company_size || prev.companySize,
          region: setup.region || prev.region,
          completed: Boolean(setup.completed),
        }))
        setStep(resolvedStep)
      }

      setIsBootstrapping(false)
    })()
  }, [existingUser, existingUser?.completed, navigate])

  const goNext = () => {
    setDirection(1)
    setStep((prev) => Math.min(TOTAL_STEPS, prev + 1))
  }

  const goBack = () => {
    setDirection(-1)
    setStep((prev) => Math.max(1, prev - 1))
  }

  const updateField = (field, value) => {
    setUser((prev) => ({ ...prev, [field]: value }))
  }

  const completeSetup = async () => {
    if (isCompletingSetup) return
    setSetupError('')
    setIsCompletingSetup(true)
    const completedUser = { ...user, completed: true }
    const savedProfile = await saveUserSetup({
      ...completedUser,
      step: 5,
      completed: true,
    }).catch(() => null)

    if (!savedProfile) {
      setSetupError('Unable to save onboarding right now. Please try again.')
      setIsCompletingSetup(false)
      return
    }

    setUser(completedUser)
    setDirection(1)
    setStep(5)
    setIsCompletingSetup(false)
  }

  const stepTitle = step === 5 ? 'Setup Complete' : "Let's Set You Up"

  if (isBootstrapping) {
    return null
  }

  return (
    <PageTransition>
      <section className='mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-5xl items-center justify-center px-6 py-16'>
        <div className='w-full max-w-xl'>
          <Card>
            <div className='mb-6 flex items-start justify-between gap-4'>
              <div>
                <p className='text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400'>Step {step}/{TOTAL_STEPS}</p>
                <h1 className='mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-3xl'>{stepTitle}</h1>
                {step !== 5 ? <p className='mt-2 text-sm text-zinc-600 dark:text-zinc-300'>This helps us personalize ESG analysis</p> : null}
              </div>
              <span className='rounded-xl border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-300'>
                {Math.round((step / TOTAL_STEPS) * 100)}%
              </span>
            </div>

            <AnimatePresence mode='wait' custom={direction}>
              {step === 1 ? (
                <Motion.div
                  key='step-1'
                  custom={direction}
                  variants={stepVariants}
                  initial='enter'
                  animate='center'
                  exit='exit'
                  transition={{ duration: 0.24 }}
                >
                  <p className='text-sm font-medium text-zinc-700 dark:text-zinc-200'>Choose your industry</p>
                  <div className='mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2'>
                    {industries.map((option) => (
                      <button
                        key={option}
                        type='button'
                        onClick={() => updateField('industry', option)}
                        className={
                          'rounded-xl border px-4 py-3 text-left text-sm font-medium transition ' +
                          (user.industry === option
                            ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-black'
                            : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800')
                        }
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  <div className='mt-8 flex justify-end'>
                    <Button type='button' onClick={goNext} disabled={!user.industry} className={!user.industry ? 'cursor-not-allowed opacity-50' : ''}>
                      Continue
                    </Button>
                  </div>
                </Motion.div>
              ) : null}

              {step === 2 ? (
                <Motion.div
                  key='step-2'
                  custom={direction}
                  variants={stepVariants}
                  initial='enter'
                  animate='center'
                  exit='exit'
                  transition={{ duration: 0.24 }}
                >
                  <p className='text-sm font-medium text-zinc-700 dark:text-zinc-200'>Select your role</p>
                  <div className='mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2'>
                    {roles.map((option) => (
                      <button
                        key={option}
                        type='button'
                        onClick={() => updateField('role', option)}
                        className={
                          'rounded-xl border px-4 py-3 text-left text-sm font-medium transition ' +
                          (user.role === option
                            ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-black'
                            : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800')
                        }
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  <div className='mt-8 flex items-center justify-between'>
                    <Button type='button' onClick={goBack} className='bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100'>
                      Back
                    </Button>
                    <Button type='button' onClick={goNext} disabled={!user.role} className={!user.role ? 'cursor-not-allowed opacity-50' : ''}>
                      Continue
                    </Button>
                  </div>
                </Motion.div>
              ) : null}

              {step === 3 ? (
                <Motion.div
                  key='step-3'
                  custom={direction}
                  variants={stepVariants}
                  initial='enter'
                  animate='center'
                  exit='exit'
                  transition={{ duration: 0.24 }}
                >
                  <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-200'>
                    Your name
                    <input
                      type='text'
                      className={inputClass}
                      value={user.name}
                      onChange={(event) => updateField('name', event.target.value)}
                      placeholder='Enter your name'
                    />
                  </label>
                  <div className='mt-8 flex items-center justify-between'>
                    <Button type='button' onClick={goBack} className='bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100'>
                      Back
                    </Button>
                    <Button
                      type='button'
                      onClick={goNext}
                      disabled={!user.name.trim()}
                      className={!user.name.trim() ? 'cursor-not-allowed opacity-50' : ''}
                    >
                      Continue
                    </Button>
                  </div>
                </Motion.div>
              ) : null}

              {step === 4 ? (
                <Motion.div
                  key='step-4'
                  custom={direction}
                  variants={stepVariants}
                  initial='enter'
                  animate='center'
                  exit='exit'
                  transition={{ duration: 0.24 }}
                >
                  <p className='text-sm font-medium text-zinc-700 dark:text-zinc-200'>Company size</p>
                  <div className='mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3'>
                    {companySizes.map((option) => (
                      <button
                        key={option}
                        type='button'
                        onClick={() => updateField('companySize', option)}
                        className={
                          'rounded-xl border px-4 py-3 text-center text-sm font-medium transition ' +
                          (user.companySize === option
                            ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-black'
                            : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800')
                        }
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  <label className='mt-5 block text-sm font-medium text-zinc-700 dark:text-zinc-200'>
                    Region (optional)
                    <input
                      type='text'
                      className={inputClass}
                      value={user.region}
                      onChange={(event) => updateField('region', event.target.value)}
                      placeholder='APAC, Europe, North America...'
                    />
                  </label>
                  <div className='mt-8 flex items-center justify-between'>
                    <Button type='button' onClick={goBack} className='bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100'>
                      Back
                    </Button>
                    <Button
                      type='button'
                      onClick={completeSetup}
                      disabled={!user.companySize || isCompletingSetup}
                      className={!user.companySize || isCompletingSetup ? 'cursor-not-allowed opacity-50' : ''}
                    >
                      {isCompletingSetup ? 'Saving...' : 'Complete Setup'}
                    </Button>
                  </div>
                  {setupError ? <p className='mt-4 text-sm text-rose-600 dark:text-rose-400'>{setupError}</p> : null}
                </Motion.div>
              ) : null}

              {step === 5 ? (
                <Motion.div
                  key='step-5'
                  custom={direction}
                  variants={stepVariants}
                  initial='enter'
                  animate='center'
                  exit='exit'
                  transition={{ duration: 0.24 }}
                  className='text-center'
                >
                  <h2 className='text-2xl font-semibold text-zinc-900 dark:text-white'>You&apos;re all set, {user.name.trim() || 'there'} 🎉</h2>
                  <p className='mt-3 text-sm text-zinc-600 dark:text-zinc-300'>Your onboarding profile has been saved. You can now start your ESG analysis.</p>
                  <div className='mt-8 flex justify-center'>
                    <Button type='button' onClick={() => navigate('/dashboard')}>
                      Start ESG Analysis
                    </Button>
                  </div>
                </Motion.div>
              ) : (
                <div />
              )}
            </AnimatePresence>
          </Card>
        </div>
      </section>
    </PageTransition>
  )
}

export default Onboarding
