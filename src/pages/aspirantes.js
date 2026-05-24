import { supabase } from '../supabase-client.js'
import { LISTA_GRADOS, textoGrado, formatearFechaCorta, badgeEstado, mostrarError, mostrarExito, mostrarNotificacion, validarCamposRequeridos } from '../utils.js'

let todosAspirantes = []
let editandoAspId = null
let licenciasTemp = []
let clubsDisponibles = []

export async function init() {
  poblarGrados()
  await cargarClubs()
  await cargarAspirantes()
  if (window.currentProfile?.role === 'aspirante') {
    document.getElementById('btn-nuevo-asp').style.display = 'none'
  }
  window.filtrarAspirantes    = filtrarAspirantes
  window.abrirModalAspirante  = abrirModalAspirante
  window.editarAspirante      = editarAspirante
  window.cerrarModalAspirante = cerrarModalAspirante
  window.guardarAspirante     = guardarAspirante
  window.agregarLicencia      = agregarLicencia
  window.confirmarLicencia    = confirmarLicencia
  window.eliminarLicencia     = eliminarLicencia
  window.verHistorial         = verHistorial
  window.cerrarHistorial      = cerrarHistorial
}

function poblarGrados() {
  const select = document.getElementById('asp-grado')
  select.innerHTML = '<option value="">— Seleccionar —</option>'
  LISTA_GRADOS.forEach(g => {
    const opt = document.createElement('option')
    opt.value = g
    opt.textContent = textoGrado(g)
    select.appendChild(opt)
  })
}

async function cargarClubs() {
  const { data } = await supabase.from('clubs').select('id, name').order('name')
  clubsDisponibles = data ?? []
  const selectFiltro = document.getElementById('filtro-club-asp')
  const selectModal  = document.getElementById('asp-club')
  clubsDisponibles.forEach(c => {
    selectFiltro.innerHTML += `<option value="${c.id}">${c.name}</option>`
    const opt = document.createElement('option')
    opt.value = c.id
    opt.textContent = c.name
    selectModal.appendChild(opt)
  })
}

async function cargarAspirantes() {
  const tbody = document.getElementById('tabla-aspirantes')
  try {
    const { data, error } = await supabase
      .from('aspirants')
      .select('*, clubs(name)')
      .order('full_name')
    if (error) throw error
    todosAspirantes = data ?? []
    renderizarAspirantes(todosAspirantes)
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#dc2626;">Error al cargar aspirantes.</td></tr>`
  }
}

function estaIncompleto(a) {
  return !a.birth_date || !a.current_grade || !a.grade_date || !a.dni
}

function renderizarAspirantes(lista) {
  const tbody = document.getElementById('tabla-aspirantes')
  const count = document.getElementById('asp-count')
  count.textContent = `${lista.length} aspirante${lista.length !== 1 ? 's' : ''}`

  if (lista.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">🥋</div><p>No hay aspirantes registrados.</p></div></td></tr>`
    return
  }

  tbody.innerHTML = lista.map(a => `
    <tr>
      <td><strong>${a.full_name}</strong></td>
      <td>${a.clubs?.name ?? '—'}</td>
      <td>${textoGrado(a.current_grade)}</td>
      <td>${formatearFechaCorta(a.grade_date)}</td>
      <td>${a.karate_style ?? '—'}</td>
      <td style="white-space:nowrap;">
        ${estaIncompleto(a) ? `<span class="badge badge-orange" style="margin-right:6px;cursor:pointer;" onclick="editarAspirante('${a.id}')" title="Faltan datos obligatorios">⚠ Incompleto</span>` : ''}
        <button class="btn btn-secondary btn-sm" onclick="editarAspirante('${a.id}')">Editar</button>
        <button class="btn btn-secondary btn-sm" style="margin-left:4px;" onclick="verHistorial('${a.id}','${a.full_name}')">Historial</button>
      </td>
    </tr>`).join('')
}

function filtrarAspirantes() {
  const q    = document.getElementById('search-asp').value.toLowerCase()
  const club = document.getElementById('filtro-club-asp').value
  const filtrado = todosAspirantes.filter(a => {
    const coincideTexto = a.full_name.toLowerCase().includes(q)
      || (a.current_grade ?? '').toLowerCase().includes(q)
      || (a.clubs?.name ?? '').toLowerCase().includes(q)
    const coincideClub = !club || a.club_id === club
    return coincideTexto && coincideClub
  })
  renderizarAspirantes(filtrado)
}

function abrirModalAspirante(id) {
  editandoAspId = id ?? null
  licenciasTemp = []
  document.getElementById('modal-asp-titulo').textContent = id ? 'Editar aspirante' : 'Nuevo aspirante'
  document.getElementById('msg-aspirante').innerHTML = ''
  ;['asp-nombre','asp-nacimiento','asp-club','asp-grado','asp-fecha-grado'].forEach(fId => {
    const el = document.getElementById(fId)
    if (!el) return
    el.classList.remove('input-error')
    el.closest('.form-group')?.querySelector('label')?.classList.remove('label-error')
  })

  if (!id) {
    ;['asp-nombre','asp-dni','asp-email','asp-telefono'].forEach(f => { document.getElementById(f).value = '' })
    document.getElementById('asp-nacimiento').value = ''
    document.getElementById('asp-fecha-grado').value = ''
    document.getElementById('asp-club').value = ''
    document.getElementById('asp-grado').value = ''
    document.getElementById('asp-estilo').value = ''
    ;['asp-madrid','asp-españa','asp-europa','asp-mundo'].forEach(f => { document.getElementById(f).checked = false })
  } else {
    const a = todosAspirantes.find(x => x.id === id)
    if (!a) return
    document.getElementById('asp-nombre').value    = a.full_name
    document.getElementById('asp-dni').value       = a.dni ?? ''
    document.getElementById('asp-email').value     = a.email ?? ''
    document.getElementById('asp-telefono').value  = a.phone ?? ''
    document.getElementById('asp-nacimiento').value = a.birth_date
    document.getElementById('asp-fecha-grado').value = a.grade_date
    document.getElementById('asp-club').value      = a.club_id
    document.getElementById('asp-grado').value     = a.current_grade
    document.getElementById('asp-estilo').value    = a.karate_style ?? ''
    document.getElementById('asp-madrid').checked  = a.is_champion_madrid
    document.getElementById('asp-españa').checked  = a.is_champion_spain
    document.getElementById('asp-europa').checked  = a.is_champion_europe
    document.getElementById('asp-mundo').checked   = a.is_champion_world
    cargarLicenciasAspirante(id)
  }

  renderizarLicencias()
  document.getElementById('modal-aspirante').classList.remove('hidden')
}

async function cargarLicenciasAspirante(aspId) {
  const { data } = await supabase.from('licenses').select('season').eq('aspirant_id', aspId)
  licenciasTemp = (data ?? []).map(l => l.season)
  renderizarLicencias()
}

function renderizarLicencias() {
  const contenedor = document.getElementById('lista-licencias')
  contenedor.innerHTML = licenciasTemp.map(s => `
    <span style="background:#dbeafe;color:#1d4ed8;padding:4px 10px;border-radius:100px;font-size:12px;display:inline-flex;align-items:center;gap:6px;">
      ${s}
      <button type="button" onclick="eliminarLicencia('${s}')" style="background:none;border:none;cursor:pointer;color:#1d4ed8;font-size:14px;padding:0;line-height:1;">×</button>
    </span>`).join('')
}

function agregarLicencia() {
  document.getElementById('form-nueva-licencia').style.display = 'flex'
}

function confirmarLicencia() {
  const val = document.getElementById('nueva-temporada').value.trim()
  if (val && !licenciasTemp.includes(val)) {
    licenciasTemp.push(val)
    renderizarLicencias()
  }
  document.getElementById('nueva-temporada').value = ''
  document.getElementById('form-nueva-licencia').style.display = 'none'
}

function eliminarLicencia(season) {
  licenciasTemp = licenciasTemp.filter(s => s !== season)
  renderizarLicencias()
}

function editarAspirante(id) { abrirModalAspirante(id) }

function cerrarModalAspirante() {
  document.getElementById('modal-aspirante').classList.add('hidden')
}

async function guardarAspirante() {
  const nombre     = document.getElementById('asp-nombre').value.trim()
  const nacimiento = document.getElementById('asp-nacimiento').value
  const clubId     = document.getElementById('asp-club').value
  const grado      = document.getElementById('asp-grado').value
  const fechaGrado = document.getElementById('asp-fecha-grado').value

  const REQUERIDOS = ['asp-nombre','asp-nacimiento','asp-club','asp-grado','asp-fecha-grado']
  if (!validarCamposRequeridos(REQUERIDOS)) {
    mostrarNotificacion('Por favor, completa todos los campos obligatorios (*).', 'error')
    return
  }

  const btn = document.getElementById('btn-guardar-asp')
  btn.disabled = true
  btn.textContent = 'Guardando...'

  const datos = {
    full_name:          nombre,
    birth_date:         nacimiento,
    dni:                document.getElementById('asp-dni').value.trim() || null,
    email:              document.getElementById('asp-email').value.trim() || null,
    phone:              document.getElementById('asp-telefono').value.trim() || null,
    club_id:            clubId,
    karate_style:       document.getElementById('asp-estilo').value || null,
    current_grade:      grado,
    grade_date:         fechaGrado,
    is_champion_madrid: document.getElementById('asp-madrid').checked,
    is_champion_spain:  document.getElementById('asp-españa').checked,
    is_champion_europe: document.getElementById('asp-europa').checked,
    is_champion_world:  document.getElementById('asp-mundo').checked,
  }

  try {
    let aspId = editandoAspId
    if (editandoAspId) {
      const { error } = await supabase.from('aspirants').update(datos).eq('id', editandoAspId)
      if (error) throw error
    } else {
      const { data, error } = await supabase.from('aspirants').insert(datos).select('id').single()
      if (error) throw error
      aspId = data.id
    }

    if (aspId && licenciasTemp.length > 0) {
      await supabase.from('licenses').delete().eq('aspirant_id', aspId)
      await supabase.from('licenses').insert(licenciasTemp.map(s => ({ aspirant_id: aspId, season: s })))
    }

    cerrarModalAspirante()
    mostrarNotificacion('✓ Aspirante guardado correctamente.')
    await cargarAspirantes()
  } catch (err) {
    mostrarNotificacion(`Error: ${err.message}`, 'error')
  } finally {
    btn.disabled = false
    btn.textContent = 'Guardar'
  }
}

async function verHistorial(aspId, nombre) {
  document.getElementById('historial-titulo').textContent = `Historial de ${nombre}`
  document.getElementById('historial-contenido').innerHTML = '<div class="loading-spinner"><div class="spinner"></div><span>Cargando...</span></div>'
  document.getElementById('modal-historial').classList.remove('hidden')

  const { data } = await supabase
    .from('inscriptions')
    .select('target_grade, specific_block_path, inscription_status, final_amount, exams(name, exam_date), exam_results(final_result)')
    .eq('aspirant_id', aspId)
    .order('created_at', { ascending: false })

  if (!data || data.length === 0) {
    document.getElementById('historial-contenido').innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div><p>Sin historial de exámenes.</p></div>'
    return
  }

  document.getElementById('historial-contenido').innerHTML = `
    <table class="data-table">
      <thead><tr><th>Examen</th><th>Fecha</th><th>Grado</th><th>Inscripción</th><th>Resultado</th></tr></thead>
      <tbody>${data.map(i => `
        <tr>
          <td>${i.exams?.name ?? '—'}</td>
          <td>${formatearFechaCorta(i.exams?.exam_date)}</td>
          <td>${textoGrado(i.target_grade)}</td>
          <td>${badgeEstado(i.inscription_status)}</td>
          <td>${i.exam_results ? badgeEstado(i.exam_results.final_result) : '<span class="badge badge-gray">Pendiente</span>'}</td>
        </tr>`).join('')}
      </tbody>
    </table>`
}

function cerrarHistorial() {
  document.getElementById('modal-historial').classList.add('hidden')
}
