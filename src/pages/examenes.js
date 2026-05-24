import { supabase } from '../supabase-client.js'
import { LISTA_GRADOS, textoGrado, formatearFechaCorta, badgeEstado, mostrarError, mostrarExito, mostrarNotificacion, validarCamposRequeridos } from '../utils.js'

let todosExamenes = []
let editandoExamId = null

export async function init() {
  poblarCheckboxesGrados()
  await cargarExamenes()
  if (window.currentProfile?.role !== 'admin') {
    document.getElementById('btn-nuevo-exam').style.display = 'none'
  }
  window.filtrarExamenes  = filtrarExamenes
  window.calcularPlazo    = calcularPlazo
  window.abrirModalExamen = abrirModalExamen
  window.editarExamen     = editarExamen
  window.cerrarModalExamen = cerrarModalExamen
  window.guardarExamen    = guardarExamen
}

function poblarCheckboxesGrados() {
  const contenedor = document.getElementById('checkboxes-grados')
  contenedor.innerHTML = LISTA_GRADOS.map(g => `
    <label style="font-size:12px;display:flex;align-items:center;gap:4px;cursor:pointer;">
      <input type="checkbox" value="${g}" class="check-grado" />
      ${textoGrado(g)}
    </label>`).join('')
}

async function cargarExamenes() {
  const tbody = document.getElementById('tabla-examenes')
  try {
    const { data, error } = await supabase
      .from('exams').select('*').order('exam_date', { ascending: false })
    if (error) throw error
    todosExamenes = data ?? []
    renderizarExamenes(todosExamenes)
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#dc2626;">Error al cargar exámenes.</td></tr>`
  }
}

function renderizarExamenes(lista) {
  const tbody = document.getElementById('tabla-examenes')
  const count = document.getElementById('exam-count')
  count.textContent = `${lista.length} convocatoria${lista.length !== 1 ? 's' : ''}`

  if (lista.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">📅</div><p>No hay convocatorias de examen.</p></div></td></tr>`
    return
  }

  tbody.innerHTML = lista.map(e => `
    <tr>
      <td><strong>${e.name}</strong></td>
      <td>${formatearFechaCorta(e.exam_date)}</td>
      <td>${e.location ?? '—'}</td>
      <td style="font-size:12px;">${(e.grades_offered ?? []).map(g => textoGrado(g)).join(', ') || '—'}</td>
      <td>${formatearFechaCorta(e.inscription_deadline)}</td>
      <td>${badgeEstado(e.status)}</td>
      <td style="white-space:nowrap;">
        <button class="btn btn-secondary btn-sm" onclick="editarExamen('${e.id}')">Editar</button>
        <button class="btn btn-primary btn-sm" style="margin-left:4px;" onclick="navigateTo('inscripciones')">Ver inscritos</button>
      </td>
    </tr>`).join('')
}

function filtrarExamenes() {
  const q      = document.getElementById('search-exam').value.toLowerCase()
  const status = document.getElementById('filtro-status-exam').value
  const filtrado = todosExamenes.filter(e => {
    const txt = (e.name + (e.location ?? '')).toLowerCase().includes(q)
    const st  = !status || e.status === status
    return txt && st
  })
  renderizarExamenes(filtrado)
}

function calcularPlazo() {
  const fecha = document.getElementById('exam-fecha').value
  if (!fecha) return
  const d = new Date(fecha)
  d.setDate(d.getDate() - 35)
  document.getElementById('exam-plazo').value = d.toISOString().split('T')[0]
}

function abrirModalExamen() {
  editandoExamId = null
  document.getElementById('modal-exam-titulo').textContent = 'Nueva convocatoria'
  document.getElementById('exam-nombre').value = ''
  document.getElementById('exam-fecha').value = ''
  document.getElementById('exam-plazo').value = ''
  document.getElementById('exam-lugar').value = ''
  document.getElementById('exam-status').value = 'abierto'
  document.querySelectorAll('.check-grado').forEach(c => { c.checked = false })
  document.getElementById('msg-examen').innerHTML = ''
  ;['exam-nombre','exam-fecha'].forEach(fId => {
    const el = document.getElementById(fId)
    if (!el) return
    el.classList.remove('input-error')
    el.closest('.form-group')?.querySelector('label')?.classList.remove('label-error')
  })
  document.getElementById('modal-examen').classList.remove('hidden')
}

function editarExamen(id) {
  const e = todosExamenes.find(x => x.id === id)
  if (!e) return
  editandoExamId = id
  document.getElementById('modal-exam-titulo').textContent = 'Editar convocatoria'
  document.getElementById('exam-nombre').value = e.name
  document.getElementById('exam-fecha').value  = e.exam_date
  document.getElementById('exam-plazo').value  = e.inscription_deadline ?? ''
  document.getElementById('exam-lugar').value  = e.location ?? ''
  document.getElementById('exam-status').value = e.status
  const grados = e.grades_offered ?? []
  document.querySelectorAll('.check-grado').forEach(c => { c.checked = grados.includes(c.value) })
  document.getElementById('msg-examen').innerHTML = ''
  document.getElementById('modal-examen').classList.remove('hidden')
}

function cerrarModalExamen() {
  document.getElementById('modal-examen').classList.add('hidden')
}

async function guardarExamen() {
  const nombre  = document.getElementById('exam-nombre').value.trim()
  const fecha   = document.getElementById('exam-fecha').value
  const plazo   = document.getElementById('exam-plazo').value || null
  const lugar   = document.getElementById('exam-lugar').value.trim() || null
  const status  = document.getElementById('exam-status').value
  const grados  = [...document.querySelectorAll('.check-grado:checked')].map(c => c.value)

  const REQUERIDOS = ['exam-nombre','exam-fecha']
  if (!validarCamposRequeridos(REQUERIDOS)) {
    mostrarNotificacion('El nombre y la fecha del examen son obligatorios.', 'error')
    return
  }

  const btn = document.getElementById('btn-guardar-exam')
  btn.disabled = true
  btn.textContent = 'Guardando...'

  const datos = {
    name: nombre, exam_date: fecha, inscription_deadline: plazo,
    location: lugar, status, grades_offered: grados,
    created_by: window.currentProfile?.id
  }

  try {
    if (editandoExamId) {
      const { error } = await supabase.from('exams').update(datos).eq('id', editandoExamId)
      if (error) throw error
    } else {
      const { error } = await supabase.from('exams').insert(datos)
      if (error) throw error
    }
    cerrarModalExamen()
    mostrarNotificacion('✓ Convocatoria guardada correctamente.')
    await cargarExamenes()
  } catch (err) {
    mostrarNotificacion(`Error: ${err.message}`, 'error')
  } finally {
    btn.disabled = false
    btn.textContent = 'Guardar'
  }
}
