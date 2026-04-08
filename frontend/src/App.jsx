import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Route, Routes, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Analysis from './pages/Analysis'
import AnalysisNew from './pages/AnalysisNew'
import About from './pages/About'
import Contact from './pages/Contact'
import Dashboard from './pages/Dashboard'
import ESGCalculator from './pages/ESGCalculator'
import EnvironmentalInput from './pages/EnvironmentalInput'
import ForgotPassword from './pages/ForgotPassword'
import GovernanceInput from './pages/GovernanceInput'
import Help from './pages/Help'
import Home from './pages/Home'
import Login from './pages/Login'
import ManageProfile from './pages/ManageProfile'
import NotFound from './pages/NotFound'
import Onboarding from './pages/Onboarding'
import ResetPassword from './pages/ResetPassword'
import Reports from './pages/Reports'
import Services from './pages/Services'
import SocialInput from './pages/SocialInput'
import Signup from './pages/Signup'

const THEME_STORAGE_KEY = 'greenlytics-theme'

function App() {
  const location = useLocation()
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_STORAGE_KEY) || 'light')

  useEffect(() => {
    // Theme toggle logic:
    // We use Tailwind's `dark` class strategy by adding/removing `dark`
    // on the root html element, then persist the chosen theme in localStorage.
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  useEffect(() => {
    const handleThemeSync = (event) => {
      const nextTheme = event?.detail?.theme
      if (nextTheme === 'light' || nextTheme === 'dark') {
        setTheme(nextTheme)
      }
    }

    window.addEventListener('greenlytics-theme-change', handleThemeSync)
    return () => window.removeEventListener('greenlytics-theme-change', handleThemeSync)
  }, [])

  return (
    <div className='min-h-screen bg-zinc-50 text-zinc-900 transition-colors duration-300 dark:bg-zinc-950 dark:text-white'>
      <Navbar theme={theme} onToggleTheme={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))} />

      <main>
        <AnimatePresence mode='wait'>
          <Routes location={location} key={location.pathname}>
            <Route path='/' element={<Home />} />
            <Route path='/about' element={<About />} />
            <Route path='/services' element={<Services />} />
            <Route path='/esg-calculator' element={<ESGCalculator />} />
            <Route path='/calculator' element={<ESGCalculator />} />
            <Route element={<ProtectedRoute />}>
              <Route path='/onboarding' element={<Onboarding />} />
              <Route path='/esg-input/environmental' element={<EnvironmentalInput />} />
              <Route path='/esg-input/social' element={<SocialInput />} />
              <Route path='/esg-input/governance' element={<GovernanceInput />} />
              <Route path='/dashboard' element={<Dashboard />} />
              <Route path='/analysis' element={<Analysis />} />
              <Route path='/analysis/new' element={<AnalysisNew />} />
              <Route path='/analysis/:id' element={<Analysis />} />
              <Route path='/reports' element={<Reports />} />
              <Route path='/insights' element={<Reports />} />
              <Route path='/profile' element={<ManageProfile />} />
              <Route path='/settings' element={<ManageProfile />} />
            </Route>
            <Route path='/help' element={<Help />} />
            <Route path='/contact' element={<Contact />} />
            <Route path='/login' element={<Login />} />
            <Route path='/signup' element={<Signup />} />
            <Route path='/sign-in' element={<Login />} />
            <Route path='/forgot-password' element={<ForgotPassword />} />
            <Route path='/reset-password' element={<ResetPassword />} />
            <Route path='*' element={<NotFound />} />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  )
}

export default App
