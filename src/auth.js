import { supabase } from './supabase-client.js'

const INACTIVITY_MINUTES = 30
let inactivityTimer = null

export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  resetInactivityTimer()
  return data
}

export async function logout() {
  clearInactivityTimer()
  await supabase.auth.signOut()
  window.location.href = '/index.html'
}

export async function sendPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/index.html?reset=true`
  })
  if (error) throw error
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function getCurrentProfile() {
  const session = await getSession()
  if (!session) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('*, clubs(name)')
    .eq('id', session.user.id)
    .single()
  if (error) throw error
  return data
}

export async function requireAuth() {
  const session = await getSession()
  if (!session) {
    window.location.href = '/index.html'
    return null
  }
  resetInactivityTimer()
  return session
}

function resetInactivityTimer() {
  clearInactivityTimer()
  inactivityTimer = setTimeout(() => {
    alert('Tu sesión ha expirado por inactividad. Por favor, inicia sesión de nuevo.')
    logout()
  }, INACTIVITY_MINUTES * 60 * 1000)
}

function clearInactivityTimer() {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer)
    inactivityTimer = null
  }
}

export function startActivityListeners() {
  const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
  events.forEach(event => {
    document.addEventListener(event, resetInactivityTimer, { passive: true })
  })
}
