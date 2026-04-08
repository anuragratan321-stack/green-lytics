import { supabase } from '../lib/supabase'
import { getCurrentUser } from './auth'

const USER_SETUP_CACHE_PREFIX = 'greenlytics_user_setup_'
let hasWarnedMissingUserProfilesTable = false

function toNumberOrNull(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function resolveAuthenticatedUser({ attempts = 4, delayMs = 120 } = {}) {
  for (let index = 0; index < attempts; index += 1) {
    const user = await getCurrentUser().catch(() => null)
    if (user?.id) return user
    if (index < attempts - 1) await sleep(delayMs)
  }
  return null
}

function setupCacheKey(userId) {
  return `${USER_SETUP_CACHE_PREFIX}${userId || 'guest'}`
}

function readCachedSetup(userId) {
  if (typeof window === 'undefined' || !userId) return null
  try {
    const raw = localStorage.getItem(setupCacheKey(userId))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

function writeCachedSetup(userId, setup) {
  if (typeof window === 'undefined' || !userId || !setup || typeof setup !== 'object') return
  try {
    localStorage.setItem(setupCacheKey(userId), JSON.stringify(setup))
  } catch {
    // Ignore storage write errors.
  }
}

function isNoRowsError(error) {
  return error?.code === 'PGRST116'
}

function isMissingUserProfilesTableError(error) {
  const message = String(error?.message || '').toLowerCase()
  return error?.code === 'PGRST205' || message.includes("could not find the table 'public.user_profiles'")
}

function warnUserProfilesTableMissing(error) {
  if (hasWarnedMissingUserProfilesTable) return
  hasWarnedMissingUserProfilesTable = true
  console.warn('[supabase] Missing table public.user_profiles. Run migrations in your Supabase project.', error?.message || '')
}

export async function saveESGReport(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    console.error('saveESGReport: invalid ESG report data payload.')
    return null
  }

  try {
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError) {
      console.error('saveESGReport auth error:', authError.message)
      return null
    }

    const user = authData?.user

    if (!user?.id) {
      return null
    }

    const payload = {
      user_id: user.id,
      environmental_score: toNumberOrNull(data.environmental_score ?? data.environmentalScore),
      social_score: toNumberOrNull(data.social_score ?? data.socialScore),
      governance_score: toNumberOrNull(data.governance_score ?? data.governanceScore),
      total_score: toNumberOrNull(data.total_score ?? data.totalScore),
      data: data.data ?? data,
    }

    const { data: inserted, error } = await supabase.from('esg_reports').insert(payload).select().single()

    if (error) {
      console.error('saveESGReport insert error:', error.message)
      return null
    }

    return inserted
  } catch (error) {
    console.error('saveESGReport unexpected error:', error.message || error)
    return null
  }
}

export async function getUserReports() {
  try {
    const user = await getCurrentUser()

    if (!user?.id) {
      return []
    }

    const { data, error } = await supabase.from('esg_reports').select('*').eq('user_id', user.id).order('created_at', { ascending: false })

    if (error) {
      console.error('getUserReports query error:', error.message)
      return []
    }

    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('getUserReports unexpected error:', error.message || error)
    return []
  }
}

export async function getUserSetup() {
  try {
    const user = await resolveAuthenticatedUser({ attempts: 8, delayMs: 180 })
    if (!user?.id) return null
    const cachedSetup = readCachedSetup(user.id)

    const { data, error } = await supabase.from('user_profiles').select('*').eq('user_id', user.id).single()
    if (error) {
      if (isNoRowsError(error)) {
        return cachedSetup || null
      }
      if (isMissingUserProfilesTableError(error)) {
        warnUserProfilesTableMissing(error)
        return cachedSetup || null
      }
      console.error('getUserSetup query error:', error.message)
      return cachedSetup
    }

    if (data) {
      writeCachedSetup(user.id, data)
      return data
    }

    return cachedSetup || null
  } catch (error) {
    console.error('getUserSetup unexpected error:', error.message || error)
    return null
  }
}

export async function saveUserSetup(setupData) {
  if (!setupData || typeof setupData !== 'object' || Array.isArray(setupData)) {
    console.error('saveUserSetup: invalid setup payload.')
    return null
  }

  try {
    const user = await resolveAuthenticatedUser({ attempts: 8, delayMs: 180 })
    if (!user?.id) return null

    const payload = {
      user_id: user.id,
      name: setupData.name || null,
      industry: setupData.industry || null,
      role: setupData.role || null,
      company_size: setupData.companySize || null,
      region: setupData.region || null,
      step: Number(setupData.step) || 1,
      completed: Boolean(setupData.completed),
      updated_at: new Date().toISOString(),
    }

    const localFallback = {
      ...payload,
      id: null,
    }

    const { data, error } = await supabase.from('user_profiles').upsert(payload, { onConflict: 'user_id' }).select().single()
    if (error) {
      if (isMissingUserProfilesTableError(error)) {
        warnUserProfilesTableMissing(error)
        writeCachedSetup(user.id, localFallback)
        return localFallback
      }
      console.error('saveUserSetup upsert error:', error.message)
      writeCachedSetup(user.id, localFallback)
      return localFallback
    }

    writeCachedSetup(user.id, data)
    return data
  } catch (error) {
    console.error('saveUserSetup unexpected error:', error.message || error)
    return null
  }
}

export async function deleteUserSetup() {
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError) {
      console.error('deleteUserSetup auth error:', authError.message)
      return false
    }

    const user = authData?.user
    if (!user?.id) return false

    const { error } = await supabase.from('user_profiles').delete().eq('user_id', user.id)
    if (error) {
      if (isMissingUserProfilesTableError(error)) {
        warnUserProfilesTableMissing(error)
        return true
      }
      console.error('deleteUserSetup delete error:', error.message)
      return false
    }

    return true
  } catch (error) {
    console.error('deleteUserSetup unexpected error:', error.message || error)
    return false
  }
}

export async function deleteUserReports() {
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError) {
      console.error('deleteUserReports auth error:', authError.message)
      return false
    }

    const user = authData?.user
    if (!user?.id) return false

    const { error } = await supabase.from('esg_reports').delete().eq('user_id', user.id)
    if (error) {
      console.error('deleteUserReports delete error:', error.message)
      return false
    }

    return true
  } catch (error) {
    console.error('deleteUserReports unexpected error:', error.message || error)
    return false
  }
}
