import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion as Motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { Activity, AlertTriangle, ArrowLeft, Building2, Download, Eye, EyeOff, HelpCircle, LockKeyhole, MessageSquare, Settings, Trash2, User } from 'lucide-react'
import Button from '../components/Button'
import Card from '../components/Card'
import PageTransition from '../components/PageTransition'
import SettingsSection from '../components/settings/SettingsSection'
import { getCurrentUser, signIn, signOut, updatePassword } from '../services/auth'
import { deleteUserReports, deleteUserSetup, getUserReports, getUserSetup, saveUserSetup } from '../services/db'

const USER_STORAGE_KEY = 'greenlytics_user'
const THEME_STORAGE_KEY = 'greenlytics-theme'
const PREFERENCES_KEY = 'greenlytics_preferences'

const industries = ['IT / Tech', 'Manufacturing', 'Finance', 'Healthcare', 'Logistics', 'Energy']
const roles = ['Manager', 'Employee', 'Worker', 'Consultant']
const companySizes = ['Small', 'Medium', 'Large']
const analysisModes = ['Simple', 'Advanced']

const inputClass =
  'mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-2 text-zinc-900 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200/80 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:ring-zinc-700'

const emptySecurity = { currentPassword: '', newPassword: '', confirmPassword: '' }

function getAvatarStorageKey(userId) {
  return `greenlytics_avatar_${userId || 'guest'}`
}

function getStoredPreferences() {
  try {
    const raw = localStorage.getItem(PREFERENCES_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

function getPasswordStrength(password) {
  if (!password) return { label: 'No password entered', width: 0, color: 'bg-zinc-300' }

  let score = 0
  if (password.length >= 8) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[a-z]/.test(password)) score += 1
  if (/\d/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1

  if (score <= 2) return { label: 'Weak', width: 35, color: 'bg-rose-500' }
  if (score <= 4) return { label: 'Moderate', width: 70, color: 'bg-amber-500' }
  return { label: 'Strong', width: 100, color: 'bg-emerald-500' }
}

function formatLastLogin(value) {
  if (!value) return 'Unavailable'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unavailable'
  return date.toLocaleString()
}

function getDeviceInfo() {
  if (typeof navigator === 'undefined') return 'Unknown device'
  const platform = navigator.platform || 'Unknown platform'
  const agent = navigator.userAgent || ''
  if (agent.includes('Mac')) return `${platform} • macOS browser`
  if (agent.includes('Windows')) return `${platform} • Windows browser`
  if (agent.includes('Android')) return `${platform} • Android browser`
  if (agent.includes('iPhone') || agent.includes('iPad')) return `${platform} • iOS browser`
  return `${platform} • Web browser`
}

function ManageProfile() {
  const navigate = useNavigate()
  const uploadInputRef = useRef(null)

  const [user, setUser] = useState(null)
  const [avatarUrl, setAvatarUrl] = useState('')
  const [expandedSection, setExpandedSection] = useState('personal')

  const [personal, setPersonal] = useState({ name: '' })
  const [company, setCompany] = useState({ industry: '', role: '', companySize: '', region: '' })
  const [preferences, setPreferences] = useState({ theme: 'light', defaultIndustry: '', analysisMode: 'Simple' })
  const [security, setSecurity] = useState(emptySecurity)
  const [showPasswords, setShowPasswords] = useState({ current: false, next: false, confirm: false })

  const [initialPersonal, setInitialPersonal] = useState({ name: '' })
  const [initialCompany, setInitialCompany] = useState({ industry: '', role: '', companySize: '', region: '' })
  const [initialPreferences, setInitialPreferences] = useState({ theme: 'light', defaultIndustry: '', analysisMode: 'Simple' })
  const [initialAvatar, setInitialAvatar] = useState('')

  const [notice, setNotice] = useState({ type: '', message: '' })
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingPersonal, setIsSavingPersonal] = useState(false)
  const [isSavingCompany, setIsSavingCompany] = useState(false)
  const [isSavingPreferences, setIsSavingPreferences] = useState(false)
  const [isSavingSecurity, setIsSavingSecurity] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    let mounted = true

    ;(async () => {
      try {
        const currentUser = await getCurrentUser().catch(() => null)
        if (!mounted) return
        if (!currentUser?.id) {
          navigate('/login', { replace: true })
          return
        }

        const setup = await getUserSetup().catch(() => null)
        const storedPrefs = getStoredPreferences()
        const resolvedTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'light'
        const resolvedAvatar = localStorage.getItem(getAvatarStorageKey(currentUser.id)) || ''

        const resolvedPersonal = { name: setup?.name || '' }
        const resolvedCompany = {
          industry: setup?.industry || '',
          role: setup?.role || '',
          companySize: setup?.company_size || '',
          region: setup?.region || '',
        }
        const resolvedPreferences = {
          theme: storedPrefs?.theme || resolvedTheme,
          defaultIndustry: storedPrefs?.defaultIndustry || resolvedCompany.industry || '',
          analysisMode: storedPrefs?.analysisMode || 'Simple',
        }

        setUser(currentUser)
        setAvatarUrl(resolvedAvatar)
        setInitialAvatar(resolvedAvatar)

        setPersonal(resolvedPersonal)
        setInitialPersonal(resolvedPersonal)

        setCompany(resolvedCompany)
        setInitialCompany(resolvedCompany)

        setPreferences(resolvedPreferences)
        setInitialPreferences(resolvedPreferences)
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    })()

    return () => {
      mounted = false
    }
  }, [navigate])

  const lastLogin = formatLastLogin(user?.last_sign_in_at)
  const deviceInfo = useMemo(() => getDeviceInfo(), [])

  const passwordStrength = useMemo(() => getPasswordStrength(security.newPassword), [security.newPassword])

  const personalDirty = personal.name.trim() !== initialPersonal.name.trim() || avatarUrl !== initialAvatar
  const companyDirty = JSON.stringify(company) !== JSON.stringify(initialCompany)
  const preferencesDirty = JSON.stringify(preferences) !== JSON.stringify(initialPreferences)
  const securityDirty = Boolean(security.currentPassword || security.newPassword || security.confirmPassword)

  const personalError = !personal.name.trim() ? 'Name is required.' : ''
  const securityError = useMemo(() => {
    if (!securityDirty) return ''
    if (!security.currentPassword) return 'Current password is required.'
    if (security.newPassword.length < 8) return 'New password must be at least 8 characters.'
    if (security.newPassword !== security.confirmPassword) return 'New password and confirm password must match.'
    if (security.currentPassword === security.newPassword) return 'New password must be different from current password.'
    return ''
  }, [security, securityDirty])

  const profileName = personal.name.trim() || (user?.email ? user.email.split('@')[0] : 'My Account')
  const email = user?.email || ''

  const setSuccess = (message) => setNotice({ type: 'success', message })
  const setError = (message) => setNotice({ type: 'error', message })

  const syncLocalUserProfile = (next) => {
    localStorage.setItem(
      USER_STORAGE_KEY,
      JSON.stringify({
        name: next.name,
        industry: next.industry,
        role: next.role,
        companySize: next.companySize,
        region: next.region,
        completed: true,
        step: 5,
      }),
    )
  }

  const handleAvatarUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file || !user?.id) return

    const reader = new FileReader()
    reader.onload = () => {
      const value = typeof reader.result === 'string' ? reader.result : ''
      if (!value) return
      setAvatarUrl(value)
      localStorage.setItem(getAvatarStorageKey(user.id), value)
      setNotice({ type: '', message: '' })
    }
    reader.readAsDataURL(file)
  }

  const handleRemovePhoto = () => {
    if (!user?.id) return
    setAvatarUrl('')
    localStorage.removeItem(getAvatarStorageKey(user.id))
    setSuccess('Profile photo removed.')
  }

  const persistProfile = async (next) => {
    const saved = await saveUserSetup({
      ...next,
      completed: true,
      step: 5,
    })
    return Boolean(saved)
  }

  const handleSavePersonal = async () => {
    if (personalError) {
      setError(personalError)
      return
    }
    setIsSavingPersonal(true)
    setNotice({ type: '', message: '' })

    const nextProfile = {
      name: personal.name.trim(),
      industry: company.industry,
      role: company.role,
      companySize: company.companySize,
      region: company.region,
    }

    const ok = await persistProfile(nextProfile)
    if (!ok) {
      setError('Unable to save personal information right now.')
      setIsSavingPersonal(false)
      return
    }

    setPersonal({ name: nextProfile.name })
    setInitialPersonal({ name: nextProfile.name })
    syncLocalUserProfile(nextProfile)
    setSuccess('Personal information updated.')
    setIsSavingPersonal(false)
  }

  const handleSaveCompany = async () => {
    setIsSavingCompany(true)
    setNotice({ type: '', message: '' })

    const nextProfile = {
      name: personal.name.trim(),
      industry: company.industry,
      role: company.role,
      companySize: company.companySize,
      region: company.region,
    }

    const ok = await persistProfile(nextProfile)
    if (!ok) {
      setError('Unable to save company information right now.')
      setIsSavingCompany(false)
      return
    }

    setInitialCompany(company)
    syncLocalUserProfile(nextProfile)
    setSuccess('Company information updated.')
    setIsSavingCompany(false)
  }

  const applyTheme = (nextTheme) => {
    const root = document.documentElement
    root.classList.toggle('dark', nextTheme === 'dark')
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
    window.dispatchEvent(new CustomEvent('greenlytics-theme-change', { detail: { theme: nextTheme } }))
  }

  const handleSavePreferences = async () => {
    setIsSavingPreferences(true)
    setNotice({ type: '', message: '' })

    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences))
    applyTheme(preferences.theme)

    setInitialPreferences(preferences)
    setSuccess('Preferences updated.')
    setIsSavingPreferences(false)
  }

  const handleSavePassword = async () => {
    if (securityError) {
      setError(securityError)
      return
    }

    setIsSavingSecurity(true)
    setNotice({ type: '', message: '' })

    try {
      await signIn(email, security.currentPassword)
      await updatePassword(security.newPassword)
      setSecurity(emptySecurity)
      setSuccess('Password changed successfully.')
      setExpandedSection('security')
    } catch (error) {
      setError(error.message || 'Unable to update password.')
    } finally {
      setIsSavingSecurity(false)
    }
  }

  const handleDownloadData = async () => {
    try {
      const [setup, reports] = await Promise.all([getUserSetup(), getUserReports()])
      const payload = {
        exported_at: new Date().toISOString(),
        user: { id: user?.id, email },
        profile: setup,
        preferences,
        reports,
      }
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = 'greenlytics-account-data.json'
      anchor.click()
      URL.revokeObjectURL(url)
      setSuccess('Account data downloaded.')
    } catch {
      setError('Unable to download your account data right now.')
    }
  }

  const handleDeleteAccount = async () => {
    if (!user?.id) return
    setIsDeleting(true)

    try {
      await deleteUserReports()
      await deleteUserSetup()
      localStorage.removeItem(USER_STORAGE_KEY)
      localStorage.removeItem(PREFERENCES_KEY)
      localStorage.removeItem(getAvatarStorageKey(user.id))
      await signOut().catch(() => {})
      navigate('/', { replace: true })
    } catch {
      setError('Unable to delete account data right now.')
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }

  const toggleSection = (id) => {
    setExpandedSection((prev) => (prev === id ? '' : id))
    setNotice({ type: '', message: '' })
  }

  if (isLoading) {
    return (
      <PageTransition>
        <section className='mx-auto w-full max-w-5xl px-6 py-14'>
          <div className='animate-pulse space-y-4'>
            <div className='h-28 rounded-2xl bg-zinc-200 dark:bg-zinc-800' />
            <div className='h-20 rounded-2xl bg-zinc-200 dark:bg-zinc-800' />
            <div className='h-20 rounded-2xl bg-zinc-200 dark:bg-zinc-800' />
            <div className='h-20 rounded-2xl bg-zinc-200 dark:bg-zinc-800' />
          </div>
        </section>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <section className='mx-auto w-full max-w-5xl space-y-6 px-6 py-10'>
        <Card className='p-0'>
          <div className='flex flex-col gap-4 p-6 sm:flex-row sm:items-center'>
            <div className='group relative h-24 w-24'>
              {avatarUrl ? (
                <img src={avatarUrl} alt='Profile avatar' className='h-24 w-24 rounded-full border border-zinc-200 object-cover dark:border-zinc-700' />
              ) : (
                <div className='flex h-24 w-24 items-center justify-center rounded-full border border-zinc-200 bg-zinc-100 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'>
                  <User size={36} />
                </div>
              )}

              <div className='pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-black/45 opacity-0 transition group-hover:opacity-100'>
                <div className='pointer-events-auto flex flex-col gap-1'>
                  <button
                    type='button'
                    onClick={() => uploadInputRef.current?.click()}
                    className='rounded-md bg-white px-2 py-1 text-xs font-medium text-zinc-900 transition hover:bg-zinc-100'
                  >
                    Change Photo
                  </button>
                  <button
                    type='button'
                    onClick={handleRemovePhoto}
                    className='rounded-md bg-white/90 px-2 py-1 text-xs font-medium text-rose-600 transition hover:bg-white'
                  >
                    Remove Photo
                  </button>
                </div>
              </div>

              <input ref={uploadInputRef} type='file' accept='image/*' className='hidden' onChange={handleAvatarUpload} />
            </div>

            <div>
              <h1 className='text-2xl font-semibold text-zinc-900 dark:text-white'>{profileName}</h1>
              <p className='text-sm text-zinc-500 dark:text-zinc-400'>{email}</p>
            </div>
          </div>
        </Card>

        {notice.message ? (
          <p className={'text-sm ' + (notice.type === 'error' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400')}>{notice.message}</p>
        ) : null}

        <div className='space-y-4'>
          <SettingsSection
            id='personal'
            title='Personal Information'
            icon={User}
            summary={`${personal.name || 'Name not set'} • ${email}`}
            activeSection={expandedSection}
            onToggle={toggleSection}
          >
            <div className='grid gap-4 md:grid-cols-2'>
              <label className='text-sm font-medium text-zinc-700 dark:text-zinc-200'>
                Name
                <input className={inputClass} value={personal.name} onChange={(e) => setPersonal({ name: e.target.value })} />
              </label>

              <label className='text-sm font-medium text-zinc-700 dark:text-zinc-200'>
                Email
                <input className={inputClass + ' cursor-not-allowed opacity-80'} value={email} disabled />
              </label>
            </div>

            {personalDirty ? (
              <div className='mt-4 flex items-center gap-2'>
                <Button type='button' onClick={handleSavePersonal} disabled={Boolean(personalError) || isSavingPersonal}>
                  {isSavingPersonal ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  type='button'
                  className='bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100'
                  onClick={() => {
                    setPersonal(initialPersonal)
                    setAvatarUrl(initialAvatar)
                    if (user?.id) {
                      if (initialAvatar) localStorage.setItem(getAvatarStorageKey(user.id), initialAvatar)
                      else localStorage.removeItem(getAvatarStorageKey(user.id))
                    }
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : null}
          </SettingsSection>

          <SettingsSection
            id='company'
            title='Company Information'
            icon={Building2}
            summary={`${company.industry || 'Industry'}, ${company.role || 'Role'}, ${company.companySize || 'Company size'}`}
            activeSection={expandedSection}
            onToggle={toggleSection}
          >
            <div className='grid gap-4 md:grid-cols-2'>
              <label className='text-sm font-medium text-zinc-700 dark:text-zinc-200'>
                Industry
                <select className={inputClass} value={company.industry} onChange={(e) => setCompany((prev) => ({ ...prev, industry: e.target.value }))}>
                  <option value=''>Select industry</option>
                  {industries.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className='text-sm font-medium text-zinc-700 dark:text-zinc-200'>
                Role
                <select className={inputClass} value={company.role} onChange={(e) => setCompany((prev) => ({ ...prev, role: e.target.value }))}>
                  <option value=''>Select role</option>
                  {roles.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className='text-sm font-medium text-zinc-700 dark:text-zinc-200'>
                Company Size
                <select className={inputClass} value={company.companySize} onChange={(e) => setCompany((prev) => ({ ...prev, companySize: e.target.value }))}>
                  <option value=''>Select company size</option>
                  {companySizes.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className='text-sm font-medium text-zinc-700 dark:text-zinc-200'>
                Region
                <input className={inputClass} value={company.region} onChange={(e) => setCompany((prev) => ({ ...prev, region: e.target.value }))} placeholder='APAC, Europe...' />
              </label>
            </div>

            {companyDirty ? (
              <div className='mt-4 flex items-center gap-2'>
                <Button type='button' onClick={handleSaveCompany} disabled={isSavingCompany}>
                  {isSavingCompany ? 'Saving...' : 'Save'}
                </Button>
                <Button type='button' className='bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100' onClick={() => setCompany(initialCompany)}>
                  Cancel
                </Button>
              </div>
            ) : null}
          </SettingsSection>

          <SettingsSection
            id='security'
            title='Security'
            icon={LockKeyhole}
            summary='Password ••••••••'
            activeSection={expandedSection}
            onToggle={toggleSection}
          >
            <div className='grid gap-4 md:grid-cols-3'>
              <label className='text-sm font-medium text-zinc-700 dark:text-zinc-200'>
                Current Password
                <div className='relative'>
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    className={inputClass + ' pr-10'}
                    value={security.currentPassword}
                    onChange={(e) => setSecurity((prev) => ({ ...prev, currentPassword: e.target.value }))}
                  />
                  <button
                    type='button'
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500'
                    onClick={() => setShowPasswords((prev) => ({ ...prev, current: !prev.current }))}
                  >
                    {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>

              <label className='text-sm font-medium text-zinc-700 dark:text-zinc-200'>
                New Password
                <div className='relative'>
                  <input
                    type={showPasswords.next ? 'text' : 'password'}
                    className={inputClass + ' pr-10'}
                    value={security.newPassword}
                    onChange={(e) => setSecurity((prev) => ({ ...prev, newPassword: e.target.value }))}
                  />
                  <button
                    type='button'
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500'
                    onClick={() => setShowPasswords((prev) => ({ ...prev, next: !prev.next }))}
                  >
                    {showPasswords.next ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>

              <label className='text-sm font-medium text-zinc-700 dark:text-zinc-200'>
                Confirm Password
                <div className='relative'>
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    className={inputClass + ' pr-10'}
                    value={security.confirmPassword}
                    onChange={(e) => setSecurity((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  />
                  <button
                    type='button'
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500'
                    onClick={() => setShowPasswords((prev) => ({ ...prev, confirm: !prev.confirm }))}
                  >
                    {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>
            </div>

            <div className='mt-4'>
              <p className='text-xs text-zinc-500 dark:text-zinc-400'>Password strength: {passwordStrength.label}</p>
              <div className='mt-1 h-2 rounded-full bg-zinc-200 dark:bg-zinc-700'>
                <div className={'h-2 rounded-full transition-all ' + passwordStrength.color} style={{ width: `${passwordStrength.width}%` }} />
              </div>
            </div>

            {securityDirty ? (
              <div className='mt-4 flex items-center gap-2'>
                <Button type='button' onClick={handleSavePassword} disabled={Boolean(securityError) || isSavingSecurity}>
                  {isSavingSecurity ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  type='button'
                  className='bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100'
                  onClick={() => {
                    setSecurity(emptySecurity)
                    setShowPasswords({ current: false, next: false, confirm: false })
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : null}
          </SettingsSection>

          <SettingsSection
            id='activity'
            title='Account Activity'
            icon={Activity}
            summary={`Last login: ${lastLogin}`}
            activeSection={expandedSection}
            onToggle={toggleSection}
          >
            <div className='grid gap-4 md:grid-cols-2'>
              <div className='rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50'>
                <p className='text-xs text-zinc-500 dark:text-zinc-400'>Last login</p>
                <p className='mt-1 text-sm font-medium text-zinc-900 dark:text-white'>{lastLogin}</p>
              </div>
              <div className='rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50'>
                <p className='text-xs text-zinc-500 dark:text-zinc-400'>Device info</p>
                <p className='mt-1 text-sm font-medium text-zinc-900 dark:text-white'>{deviceInfo}</p>
              </div>
            </div>
          </SettingsSection>

          <SettingsSection
            id='preferences'
            title='Preferences'
            icon={Settings}
            summary={`${preferences.theme === 'dark' ? 'Dark' : 'Light'} theme • ${preferences.analysisMode} mode`}
            activeSection={expandedSection}
            onToggle={toggleSection}
          >
            <div className='grid gap-4 md:grid-cols-2'>
              <label className='text-sm font-medium text-zinc-700 dark:text-zinc-200'>
                Theme
                <select className={inputClass} value={preferences.theme} onChange={(e) => setPreferences((prev) => ({ ...prev, theme: e.target.value }))}>
                  <option value='light'>Light</option>
                  <option value='dark'>Dark</option>
                </select>
              </label>

              <label className='text-sm font-medium text-zinc-700 dark:text-zinc-200'>
                Default Industry
                <select
                  className={inputClass}
                  value={preferences.defaultIndustry}
                  onChange={(e) => setPreferences((prev) => ({ ...prev, defaultIndustry: e.target.value }))}
                >
                  <option value=''>Select default industry</option>
                  {industries.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className='text-sm font-medium text-zinc-700 dark:text-zinc-200'>
                Analysis Mode
                <select
                  className={inputClass}
                  value={preferences.analysisMode}
                  onChange={(e) => setPreferences((prev) => ({ ...prev, analysisMode: e.target.value }))}
                >
                  {analysisModes.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {preferencesDirty ? (
              <div className='mt-4 flex items-center gap-2'>
                <Button type='button' onClick={handleSavePreferences} disabled={isSavingPreferences}>
                  {isSavingPreferences ? 'Saving...' : 'Save'}
                </Button>
                <Button type='button' className='bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100' onClick={() => setPreferences(initialPreferences)}>
                  Cancel
                </Button>
              </div>
            ) : null}
          </SettingsSection>

          <SettingsSection
            id='support'
            title='Support'
            icon={HelpCircle}
            summary='Help resources and contact options'
            activeSection={expandedSection}
            onToggle={toggleSection}
          >
            <div className='flex flex-wrap items-center gap-2'>
              <Link
                to='/help'
                className='inline-flex items-center gap-2 rounded-2xl border border-zinc-300 px-5 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800'
              >
                <HelpCircle size={16} />
                Help / FAQ
              </Link>
              <Link
                to='/contact'
                className='inline-flex items-center gap-2 rounded-2xl border border-zinc-300 px-5 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800'
              >
                <MessageSquare size={16} />
                Contact
              </Link>
            </div>
          </SettingsSection>

          <SettingsSection
            id='privacy'
            title='Data & Privacy'
            icon={AlertTriangle}
            summary='Manage your exported data and account deletion'
            activeSection={expandedSection}
            onToggle={toggleSection}
          >
            <div className='flex flex-wrap items-center gap-2'>
              <Button type='button' className='bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100' onClick={handleDownloadData}>
                <span className='inline-flex items-center gap-2'>
                  <Download size={15} />
                  Download Data
                </span>
              </Button>

              <Button type='button' className='bg-rose-600 text-white dark:bg-rose-600 dark:text-white' onClick={() => setShowDeleteModal(true)}>
                <span className='inline-flex items-center gap-2'>
                  <Trash2 size={15} />
                  Delete Account
                </span>
              </Button>
            </div>
          </SettingsSection>
        </div>

        <Link
          to='/dashboard'
          className='inline-flex items-center gap-2 rounded-2xl border border-zinc-300 px-5 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800'
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>
      </section>

      <AnimatePresence>
        {showDeleteModal ? (
          <>
            <Motion.button
              type='button'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='fixed inset-0 z-50 bg-black/45 backdrop-blur-sm'
              onClick={() => !isDeleting && setShowDeleteModal(false)}
            />
            <Motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className='fixed left-1/2 top-1/2 z-[60] w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900'
            >
              <h3 className='text-lg font-semibold text-zinc-900 dark:text-white'>Delete Account?</h3>
              <p className='mt-2 text-sm text-zinc-600 dark:text-zinc-300'>This removes your GreenLytics profile data and reports, then signs you out.</p>
              <div className='mt-5 flex items-center justify-end gap-2'>
                <Button
                  type='button'
                  className='bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100'
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button type='button' className='bg-rose-600 text-white dark:bg-rose-600 dark:text-white' onClick={handleDeleteAccount} disabled={isDeleting}>
                  {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                </Button>
              </div>
            </Motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </PageTransition>
  )
}

export default ManageProfile
