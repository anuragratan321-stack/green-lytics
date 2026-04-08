import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { getSessionUser } from '../services/auth'

function ProtectedRoute() {
  const location = useLocation()
  const [isChecking, setIsChecking] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    let isMounted = true

    ;(async () => {
      try {
        const user = await getSessionUser()
        if (isMounted) {
          setIsAuthenticated(Boolean(user?.id))
        }
      } catch {
        if (isMounted) {
          setIsAuthenticated(false)
        }
      } finally {
        if (isMounted) {
          setIsChecking(false)
        }
      }
    })()

    return () => {
      isMounted = false
    }
  }, [])

  if (isChecking) {
    return (
      <div className='mx-auto w-full max-w-5xl px-6 py-16'>
        <div className='animate-pulse rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900'>
          <div className='h-4 w-48 rounded bg-zinc-200 dark:bg-zinc-800' />
          <div className='mt-4 h-3 w-72 rounded bg-zinc-200 dark:bg-zinc-800' />
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to='/login' replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}

export default ProtectedRoute
