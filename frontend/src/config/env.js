function readEnvValue(primaryKey, fallbackKey) {
  const primary = import.meta.env?.[primaryKey]
  const fallback = fallbackKey ? import.meta.env?.[fallbackKey] : ''
  return (primary || fallback || '').toString().trim()
}

function warnMissing(key, fallbackValue = '') {
  if (fallbackValue) {
    console.warn(`[env] ${key} is missing. Using fallback value.`)
    return
  }
  console.warn(`[env] ${key} is missing. Please configure it in your deployment environment.`)
}

const resolvedBackendUrl = readEnvValue('VITE_BACKEND_URL')
const resolvedSupabaseUrl = readEnvValue('VITE_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL')
const resolvedSupabaseAnonKey = readEnvValue('VITE_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY')

if (!resolvedBackendUrl) {
  warnMissing('VITE_BACKEND_URL', window?.location?.origin || '')
}

if (!resolvedSupabaseUrl) {
  warnMissing('VITE_SUPABASE_URL')
}

if (!resolvedSupabaseAnonKey) {
  warnMissing('VITE_SUPABASE_ANON_KEY')
}

export const BACKEND_BASE_URL = (resolvedBackendUrl || window?.location?.origin || '').replace(/\/+$/, '')
export const SUPABASE_URL = resolvedSupabaseUrl
export const SUPABASE_ANON_KEY = resolvedSupabaseAnonKey
