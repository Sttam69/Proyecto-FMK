import { supabase } from '../supabase-client.js'
import { textoRol, mostrarError, mostrarExito, mostrarNotificacion } from '../utils.js'

let todosUsuarios = []
let editandoId = null
let clubs = []

export async function init() {
  await Promise.all([cargarClubs(), cargarUsuarios()])
  window.filtrarUsuarios      = filtrarUsuarios
  window.abrirModalUsuario    = abrirModalUsuario
  window.editarUsuario        = editarUsuario
  window.cerrarModalUsuario   = cerrarModalUsuario
  window.toggleCampoClub      = toggleCampoClub
  window.guardarUsuario       = guardarUsuario
  window.toggleActivo         = toggleActivo
  window.eliminarUsuario      = eliminarUsuario
}

async function cargarClubs() {
  const { data } = await supabase.from('clubs').select('id, name').order('name')
  clubs = data ?? []
  const select = document.getElementById('usr-club')
  clubs.forEach(c => {
    const opt = document.createElement('option')
    opt.value = c.id
    opt.textContent = c.name
    select.appendChild(opt)
  })
}

async function cargarUsuarios() {
  const tbody = document.getElementById('tabla-usuarios')
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, clubs(name)')
      .order('full_name')
    if (error) throw error
    todosUsuarios = data ?? []
    renderizarUsuarios(todosUsuarios)
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#dc2626;">Error al cargar usuarios.</td></tr>`
  }
}

function renderizarUsuarios(lista) {
  const tbody = document.getElementById('tabla-usuarios')
  const count = document.getElementById('usuarios-count')
  count.textContent = `${lista.length} usuario${lista.length !== 1 ? 's' : ''}`

  if (lista.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">👥</div><p>No hay usuarios para mostrar.</p></div></td></tr>`
    return
  }

  tbody.innerHTML = lista.map(u => `
    <tr>
      <td><strong>${u.full_name}</strong></td>
      <td style="color:#6b7280;">${u.email ?? '—'}</td>
      <td>${textoRol(u.role)}</td>
      <td>${u.clubs?.name ?? '—'}</td>
      <td>${u.is_active
        ? '<span class="badge badge-green">Activo</span>'
        : '<span class="badge badge-red">Inactivo</span>'}</td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="editarUsuario('${u.id}')">Editar</button>
        <button class="btn btn-danger btn-sm" style="margin-left:4px;" onclick="toggleActivo('${u.id}', ${u.is_active})">
          ${u.is_active ? 'Desactivar' : 'Activar'}
        </button>
        <button class="btn btn-danger btn-sm" style="margin-left:4px;" onclick="eliminarUsuario('${u.id}', '${u.full_name.replace(/'/g, "\\'")}')">
          Eliminar
        </button>
      </td>
    </tr>`).join('')
}

function filtrarUsuarios() {
  const q = document.getElementById('search-usuarios').value.toLowerCase()
  const filtrado = todosUsuarios.filter(u =>
    u.full_name.toLowerCase().includes(q) || u.role.toLowerCase().includes(q)
  )
  renderizarUsuarios(filtrado)
}

function abrirModalUsuario() {
  editandoId = null
  document.getElementById('modal-usuario-titulo').textContent = 'Nuevo usuario'
  document.getElementById('usr-nombre').value = ''
  document.getElementById('usr-email').value = ''
  document.getElementById('usr-password').value = ''
  document.getElementById('usr-rol').value = ''
  document.getElementById('usr-club').value = ''
  document.getElementById('campo-club').style.display = 'none'
  document.getElementById('campo-password').style.display = 'block'
  document.getElementById('msg-usuario').innerHTML = ''
  document.getElementById('modal-usuario').classList.remove('hidden')
}

function editarUsuario(id) {
  const u = todosUsuarios.find(x => x.id === id)
  if (!u) return
  editandoId = id
  document.getElementById('modal-usuario-titulo').textContent = 'Editar usuario'
  document.getElementById('usr-nombre').value = u.full_name
  document.getElementById('usr-email').value = ''
  document.getElementById('usr-rol').value = u.role
  document.getElementById('usr-club').value = u.club_id ?? ''
  document.getElementById('campo-club').style.display = (u.role === 'representante' || u.role === 'aspirante') ? 'block' : 'none'
  document.getElementById('campo-password').style.display = 'none'
  document.getElementById('msg-usuario').innerHTML = ''
  document.getElementById('modal-usuario').classList.remove('hidden')
}

function cerrarModalUsuario() {
  document.getElementById('modal-usuario').classList.add('hidden')
}

function toggleCampoClub() {
  const rol = document.getElementById('usr-rol').value
  const mostrar = rol === 'representante' || rol === 'aspirante'
  document.getElementById('campo-club').style.display = mostrar ? 'block' : 'none'
}

function traducirError(msg) {
  if (!msg) return 'Ocurrió un error inesperado. Inténtalo de nuevo.'
  if (msg.includes('Ya existe un usuario con el correo') || msg.includes('already exists') || msg.includes('unique_violation') || msg.includes('duplicate key'))
    return 'El correo electrónico ya está registrado. Usa uno diferente.'
  if (msg.includes('Permiso denegado') || msg.includes('permission denied') || msg.includes('not authorized'))
    return 'No tienes permisos para realizar esta acción.'
  if (msg.includes('Rol inválido') || msg.includes('invalid role'))
    return 'El rol seleccionado no es válido.'
  if (msg.includes('password') && (msg.includes('short') || msg.includes('corta') || msg.includes('length')))
    return 'La contraseña es demasiado corta. Usa al menos 8 caracteres.'
  if (msg.includes('Invalid email') || msg.includes('correo') || msg.includes('email'))
    return 'El formato del correo electrónico no es válido.'
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('Failed to fetch'))
    return 'Error de conexión. Comprueba tu internet e inténtalo de nuevo.'
  return 'Ocurrió un error al guardar. Inténtalo de nuevo.'
}

async function guardarUsuario() {
  const nombre   = document.getElementById('usr-nombre').value.trim()
  const email    = document.getElementById('usr-email').value.trim()
  const password = document.getElementById('usr-password').value
  const rol      = document.getElementById('usr-rol').value
  const clubId   = document.getElementById('usr-club').value || null

  if (!nombre || !rol) {
    mostrarNotificacion('Los campos de nombre y rol son obligatorios.', 'error')
    return
  }

  const btn = document.getElementById('btn-guardar-usuario')
  btn.disabled = true
  btn.textContent = 'Guardando...'

  try {
    if (editandoId) {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: nombre, role: rol, club_id: clubId })
        .eq('id', editandoId)
      if (error) throw error
      cerrarModalUsuario()
      mostrarNotificacion('✓ Usuario actualizado correctamente.')
    } else {
      if (!email || !password) {
        mostrarNotificacion('El correo y la contraseña son obligatorios para usuarios nuevos.', 'error')
        btn.disabled = false
        btn.textContent = 'Guardar'
        return
      }
      const { error } = await supabase.rpc('create_user_by_admin', {
        p_email: email, p_password: password,
        p_full_name: nombre, p_role: rol, p_club_id: clubId
      })
      if (error) throw error
      cerrarModalUsuario()
      mostrarNotificacion('✓ Usuario creado correctamente.')
    }
    await cargarUsuarios()
  } catch (err) {
    mostrarNotificacion(traducirError(err.message), 'error')
  } finally {
    btn.disabled = false
    btn.textContent = 'Guardar'
  }
}

async function eliminarUsuario(id, nombre) {
  if (!confirm(`¿Eliminar permanentemente a "${nombre}"? Esta acción no se puede deshacer.`)) return
  const { error } = await supabase.rpc('delete_user_by_admin', { p_user_id: id })
  if (!error) {
    mostrarNotificacion(`✓ Usuario "${nombre}" eliminado correctamente.`)
    await cargarUsuarios()
  } else {
    mostrarNotificacion(traducirError(error.message), 'error')
  }
}

async function toggleActivo(id, estadoActual) {
  const accion = estadoActual ? 'desactivar' : 'activar'
  if (!confirm(`¿Seguro que quieres ${accion} este usuario?`)) return
  const { error } = await supabase.rpc('set_user_active_by_admin', {
    p_user_id: id,
    p_is_active: !estadoActual
  })
  if (!error) {
    mostrarNotificacion(`Usuario ${estadoActual ? 'desactivado' : 'activado'} correctamente.`)
    await cargarUsuarios()
  } else {
    console.error('Error en toggleActivo:', error)
    mostrarNotificacion(traducirError(error.message), 'error')
  }
}
