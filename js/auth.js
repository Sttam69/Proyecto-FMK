// ============================================================
// MÓDULO DE AUTENTICACIÓN
// Maneja: login, logout, recuperar contraseña, sesión activa
// ============================================================

import { supabase } from './supabase-client.js';

const INACTIVITY_MINUTES = 30;
let inactivityTimer = null;

// --- LOGIN ---
// Inicia sesión con correo y contraseña
export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  resetInactivityTimer();
  return data;
}

// --- LOGOUT ---
export async function logout() {
  clearInactivityTimer();
  await supabase.auth.signOut();
  window.location.href = '/index.html';
}

// --- RECUPERAR CONTRASEÑA ---
// Envía un email con un enlace para restablecer la contraseña
export async function sendPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/index.html?reset=true`
  });
  if (error) throw error;
}

// --- OBTENER SESIÓN ACTIVA ---
// Devuelve la sesión actual o null si no hay sesión
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// --- OBTENER PERFIL DEL USUARIO ACTUAL ---
// Devuelve los datos del perfil (nombre, rol, club) del usuario conectado
export async function getCurrentProfile() {
  const session = await getSession();
  if (!session) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*, clubs(name)')
    .eq('id', session.user.id)
    .single();

  if (error) throw error;
  return data;
}

// --- PROTEGER PÁGINAS ---
// Llama esta función al inicio de cada página protegida.
// Si no hay sesión activa, redirige al login.
export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    window.location.href = '/index.html';
    return null;
  }
  resetInactivityTimer();
  return session;
}

// --- TEMPORIZADOR DE INACTIVIDAD ---
// Cierra la sesión automáticamente después de 30 minutos sin actividad

function resetInactivityTimer() {
  clearInactivityTimer();
  inactivityTimer = setTimeout(() => {
    alert('Tu sesión ha expirado por inactividad. Por favor, inicia sesión de nuevo.');
    logout();
  }, INACTIVITY_MINUTES * 60 * 1000);
}

function clearInactivityTimer() {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
    inactivityTimer = null;
  }
}

// Reinicia el temporizador cada vez que el usuario mueve el mouse o pulsa una tecla
export function startActivityListeners() {
  const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
  events.forEach(event => {
    document.addEventListener(event, resetInactivityTimer, { passive: true });
  });
}
