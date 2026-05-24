import { supabase } from '../supabase-client.js'
import { logout } from '../auth.js'
import { textoRol, obtenerIniciales, mostrarError, mostrarExito, mostrarNotificacion } from '../utils.js'

export async function init() {
  window.guardarNombre   = guardarNombre
  window.cambiarPassword = cambiarPassword
  window.subirAvatar     = subirAvatar
  window.logout          = logout

  const profile = window.currentProfile
  if (!profile) return

  actualizarAvatarUI(profile.avatar_url ?? null, profile.full_name)
  document.getElementById('cuenta-nombre').textContent = profile.full_name
  document.getElementById('cuenta-rol').textContent    = textoRol(profile.role)
  document.getElementById('cuenta-club').textContent   = profile.clubs?.name ? `Club: ${profile.clubs.name}` : ''
  document.getElementById('editar-nombre').value       = profile.full_name
}

function actualizarAvatarUI(avatarUrl, nombre) {
  const pequeño = document.getElementById('user-avatar')
  const grande  = document.getElementById('avatar-grande')
  if (avatarUrl) {
    const img = `<img src="${avatarUrl}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
    if (pequeño) pequeño.innerHTML = img
    if (grande)  grande.innerHTML  = img
  } else {
    const iniciales = obtenerIniciales(nombre)
    if (pequeño) pequeño.textContent = iniciales
    if (grande)  grande.textContent  = iniciales
  }
}

async function guardarNombre() {
  const nombre = document.getElementById('editar-nombre').value.trim()
  if (!nombre) { mostrarError('msg-cuenta', 'El nombre no puede estar vacío.'); return }

  const { error } = await supabase
    .from('profiles')
    .update({ full_name: nombre })
    .eq('id', window.currentProfile.id)

  if (error) {
    mostrarError('msg-cuenta', `Error: ${error.message}`)
  } else {
    window.currentProfile.full_name = nombre
    document.getElementById('user-name').textContent     = nombre
    document.getElementById('cuenta-nombre').textContent = nombre
    if (!window.currentProfile.avatar_url) {
      actualizarAvatarUI(null, nombre)
    }
    mostrarExito('msg-cuenta', '✓ Nombre actualizado correctamente.')
  }
}

async function cambiarPassword() {
  const nueva   = document.getElementById('nueva-password').value
  const repetir = document.getElementById('repetir-password').value

  if (!nueva || nueva.length < 8) {
    mostrarError('msg-password', 'La contraseña debe tener al menos 8 caracteres.')
    return
  }
  if (nueva !== repetir) {
    mostrarError('msg-password', 'Las contraseñas no coinciden.')
    return
  }

  const { error } = await supabase.auth.updateUser({ password: nueva })
  if (error) {
    mostrarError('msg-password', `Error: ${error.message}`)
  } else {
    document.getElementById('nueva-password').value   = ''
    document.getElementById('repetir-password').value = ''
    mostrarExito('msg-password', '✓ Contraseña cambiada correctamente.')
  }
}

async function subirAvatar(input) {
  const file = input.files[0]
  if (!file) return

  if (file.size > 2 * 1024 * 1024) {
    mostrarNotificacion('La imagen no puede superar 2 MB.', 'error')
    input.value = ''
    return
  }

  const userId = window.currentProfile.id
  const ext    = file.name.split('.').pop()
  const path   = `${userId}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true })

  if (uploadError) {
    console.error('Error al subir avatar:', uploadError)
    mostrarNotificacion('Error al subir la imagen.', 'error')
    input.value = ''
    return
  }

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(path)

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', userId)

  if (updateError) {
    console.error('Error al guardar avatar:', updateError)
    mostrarNotificacion('Error al guardar la foto de perfil.', 'error')
    input.value = ''
    return
  }

  window.currentProfile.avatar_url = publicUrl
  actualizarAvatarUI(publicUrl, window.currentProfile.full_name)
  mostrarNotificacion('✓ Foto de perfil actualizada correctamente.')
  input.value = ''
}
