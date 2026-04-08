import { supabase } from '../lib/supabase'

function throwIfError(error, fallbackMessage) {
  if (error) {
    throw new Error(error.message || fallbackMessage)
  }
}

export async function signUp(email, password) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    throwIfError(error, 'Sign up failed.')
    return data?.user || null
  } catch (error) {
    throw new Error(error.message || 'Unable to sign up right now.')
  }
}

export async function signIn(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    throwIfError(error, 'Sign in failed.')
    return data?.user || null
  } catch (error) {
    throw new Error(error.message || 'Unable to sign in right now.')
  }
}

export async function signInWithOAuth(provider) {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    })

    throwIfError(error, `Sign in with ${provider} failed.`)
    return data || null
  } catch (error) {
    throw new Error(error.message || `Unable to sign in with ${provider} right now.`)
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    throwIfError(error, 'Sign out failed.')
    return null
  } catch (error) {
    throw new Error(error.message || 'Unable to sign out right now.')
  }
}

export async function getSessionUser() {
  try {
    const { data, error } = await supabase.auth.getSession()
    throwIfError(error, 'Failed to fetch session.')
    return data?.session?.user || null
  } catch (error) {
    throw new Error(error.message || 'Unable to get session user right now.')
  }
}

export function subscribeToAuthChanges(callback) {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback?.({
      event,
      user: session?.user || null,
      session: session || null,
    })
  })

  return () => {
    data?.subscription?.unsubscribe()
  }
}

export async function waitForSessionUser({ timeoutMs = 2500, intervalMs = 120 } = {}) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const user = await getSessionUser().catch(() => null)
    if (user?.id) return user
    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }

  return null
}

export async function getCurrentUser() {
  try {
    const sessionUser = await getSessionUser().catch(() => null)
    if (sessionUser?.id) return sessionUser

    const { data, error } = await supabase.auth.getUser()
    throwIfError(error, 'Failed to fetch current user.')
    return data?.user || null
  } catch (error) {
    throw new Error(error.message || 'Unable to get current user right now.')
  }
}

export async function requestPasswordReset(email) {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    throwIfError(error, 'Failed to send password reset email.')
    return data || null
  } catch (error) {
    throw new Error(error.message || 'Unable to send password reset email right now.')
  }
}

export async function updatePassword(newPassword) {
  try {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword })
    throwIfError(error, 'Failed to update password.')
    return data?.user || null
  } catch (error) {
    throw new Error(error.message || 'Unable to update password right now.')
  }
}
