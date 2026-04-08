function readEnvValue(primaryKey, fallbackKey) {
  const primary = import.meta.env?.[primaryKey]
  const fallback = fallbackKey ? import.meta.env?.[fallbackKey] : ''
  return (primary || fallback || '').toString().trim()
}

const resolvedBackendUrl = readEnvValue('VITE_BACKEND_URL')
const resolvedSupabaseUrl = readEnvValue('VITE_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL')
const resolvedSupabaseAnonKey = readEnvValue('VITE_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY')

if (!resolvedBackendUrl) {
  console.warn('[env] VITE_BACKEND_URL is missing.')
}

if (!resolvedSupabaseUrl) {
  console.warn('[env] VITE_SUPABASE_URL is missing. Please configure it in your deployment environment.')
}

if (!resolvedSupabaseAnonKey) {
  console.warn('[env] VITE_SUPABASE_ANON_KEY is missing. Please configure it in your deployment environment.')
}

export const BACKEND_BASE_URL = resolvedBackendUrl.replace(/\/+$/, '')
export const SUPABASE_URL = resolvedSupabaseUrl
export const SUPABASE_ANON_KEY = resolvedSupabaseAnonKey
