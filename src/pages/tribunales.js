import { supabase } from '../supabase-client.js'
import { mostrarError, mostrarExito } from '../utils.js'

let juecesDisp = []
let juecesEnTribunal = []
let editandoTribId = null
let examSeleccionadoId = null

export async function init() {
  await Promise.all([cargarExamenesSelect(), cargarJueces()])
  window.cargarTribunalesDeExamen = cargarTribunalesDeExamen
  window.abrirModalTribunal       = abrirModalTribunal
  window.editarTribunal           = editarTribunal
  window.agregarJuezTribunal      = agregarJuezTribunal
  window.togglePresidente         = togglePresidente
  window.quitarJuez               = quitarJuez
  window.cerrarModalTribunal      = cerrarModalTribunal
  window.guardarTribunal          = guardarTribunal
}

async function cargarExamenesSelect() {
  const { data } = await supabase.from('exams').select('id, name').order('exam_date', { ascending: false })
  const select = document.getElementById('filtro-exam-trib')
  ;(data ?? []).forEach(e => {
    const opt = document.createElement('option')
    opt.value = e.id
    opt.textContent = e.name
    select.appendChild(opt)
  })
}

async function cargarJueces() {
  const { data } = await supabase.from('profiles').select('id, full_name').eq('role', 'juez').eq('is_active', true).order('full_name')
  juecesDisp = data ?? []
  const select = document.getElementById('select-nuevo-juez')
  juecesDisp.forEach(j => {
    const opt = document.createElement('option')
    opt.value = j.id
    opt.textContent = j.full_name
    select.appendChild(opt)
  })
}

async function cargarTribunalesDeExamen() {
  const examId = document.getElementById('filtro-exam-trib').value
  examSeleccionadoId = examId || null
  document.getElementById('btn-nuevo-trib').disabled = !examId

  const contenedor = document.getElementById('contenido-tribunales')
  if (!examId) {
    contenedor.innerHTML = '<div class="empty-state"><div class="empty-icon">⚖️</div><p>Selecciona un examen para ver sus tribunales.</p></div>'
    return
  }

  contenedor.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><span>Cargando tribunales...</span></div>'

  const { data: tribunales } = await supabase
    .from('tribunals')
    .select('*, tribunal_judges(*, profiles(full_name))')
    .eq('exam_id', examId)

  if (!tribunales || tribunales.length === 0) {
    contenedor.innerHTML = '<div class="empty-state"><div class="empty-icon">⚖️</div><p>No hay tribunales creados para este examen.</p></div>'
    return
  }

  contenedor.innerHTML = tribunales.map(t => {
    const jueces = (t.tribunal_judges ?? []).map(tj => `
      <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #f0f2f5;">
        <span style="font-size:14px;">👤</span>
        <span style="flex:1;font-size:13.5px;">${tj.profiles?.full_name ?? '—'}</span>
        ${tj.is_president ? '<span class="badge badge-blue">Presidente</span>' : ''}
        ${tj.diploma_valid_until ? `<span style="font-size:12px;color:#6b7280;">Diploma: ${tj.diploma_valid_until}</span>` : '<span class="badge badge-red" style="font-size:11px;">Sin diploma</span>'}
      </div>`).join('')

    return `
      <div class="card" style="margin-bottom:16px;">
        <div class="card-header">
          <h3>⚖️ ${t.name}</h3>
          <button class="btn btn-secondary btn-sm" onclick="editarTribunal('${t.id}')">Editar</button>
        </div>
        <div class="card-body">
          ${jueces || '<p style="color:#6b7280;font-size:13px;">Sin jueces asignados.</p>'}
          <p style="font-size:12px;color:#6b7280;margin-top:8px;">${(t.tribunal_judges ?? []).length} juez/jueces asignados</p>
        </div>
      </div>`
  }).join('')
}

function abrirModalTribunal() {
  editandoTribId = null
  juecesEnTribunal = []
  document.getElementById('modal-trib-titulo').textContent = 'Nuevo tribunal'
  document.getElementById('trib-nombre').value = ''
  document.getElementById('msg-tribunal').innerHTML = ''
  renderizarJuecesEnTribunal()
  document.getElementById('modal-tribunal').classList.remove('hidden')
}

async function editarTribunal(id) {
  editandoTribId = id
  const { data: trib } = await supabase.from('tribunals').select('name').eq('id', id).single()
  const { data: judges } = await supabase.from('tribunal_judges').select('*, profiles(full_name)').eq('tribunal_id', id)
  document.getElementById('trib-nombre').value = trib?.name ?? ''
  juecesEnTribunal = (judges ?? []).map(j => ({
    id: j.judge_profile_id,
    name: j.profiles?.full_name ?? '—',
    diploma: j.diploma_valid_until ?? '',
    is_president: j.is_president
  }))
  document.getElementById('modal-trib-titulo').textContent = 'Editar tribunal'
  document.getElementById('msg-tribunal').innerHTML = ''
  renderizarJuecesEnTribunal()
  document.getElementById('modal-tribunal').classList.remove('hidden')
}

function agregarJuezTribunal() {
  const juezId  = document.getElementById('select-nuevo-juez').value
  const diploma = document.getElementById('juez-diploma').value
  if (!juezId || juecesEnTribunal.find(j => j.id === juezId)) return
  const juez = juecesDisp.find(j => j.id === juezId)
  juecesEnTribunal.push({ id: juezId, name: juez?.full_name ?? '—', diploma, is_president: false })
  document.getElementById('select-nuevo-juez').value = ''
  document.getElementById('juez-diploma').value = ''
  renderizarJuecesEnTribunal()
}

function renderizarJuecesEnTribunal() {
  const contenedor = document.getElementById('lista-jueces-trib')
  if (juecesEnTribunal.length === 0) {
    contenedor.innerHTML = '<p style="font-size:13px;color:#6b7280;">Sin jueces asignados aún.</p>'
    return
  }
  contenedor.innerHTML = juecesEnTribunal.map((j, idx) => `
    <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #f0f2f5;">
      <span style="flex:1;font-size:13.5px;">👤 ${j.name}</span>
      <label style="font-size:12px;display:flex;align-items:center;gap:4px;">
        <input type="checkbox" onchange="togglePresidente(${idx})" ${j.is_president ? 'checked' : ''} /> Presidente
      </label>
      <button type="button" onclick="quitarJuez(${idx})" style="background:none;border:none;color:#dc2626;cursor:pointer;font-size:16px;">×</button>
    </div>`).join('')
}

function togglePresidente(idx) {
  juecesEnTribunal.forEach((j, i) => { j.is_president = (i === idx) })
  renderizarJuecesEnTribunal()
}

function quitarJuez(idx) {
  juecesEnTribunal.splice(idx, 1)
  renderizarJuecesEnTribunal()
}

function cerrarModalTribunal() {
  document.getElementById('modal-tribunal').classList.add('hidden')
}

async function guardarTribunal() {
  const nombre = document.getElementById('trib-nombre').value.trim()
  if (!nombre) { mostrarError('msg-tribunal', 'El nombre del tribunal es obligatorio.'); return }
  if (!examSeleccionadoId) { mostrarError('msg-tribunal', 'No hay examen seleccionado.'); return }

  const btn = document.getElementById('btn-guardar-trib')
  btn.disabled = true
  btn.textContent = 'Guardando...'

  try {
    let tribId = editandoTribId
    if (editandoTribId) {
      await supabase.from('tribunals').update({ name: nombre }).eq('id', editandoTribId)
      await supabase.from('tribunal_judges').delete().eq('tribunal_id', editandoTribId)
    } else {
      const { data, error } = await supabase.from('tribunals').insert({ exam_id: examSeleccionadoId, name: nombre }).select('id').single()
      if (error) throw error
      tribId = data.id
    }

    if (juecesEnTribunal.length > 0) {
      const judgesData = juecesEnTribunal.map(j => ({
        tribunal_id:         tribId,
        judge_profile_id:    j.id,
        diploma_valid_until: j.diploma || null,
        is_president:        j.is_president
      }))
      await supabase.from('tribunal_judges').insert(judgesData)
    }

    mostrarExito('msg-tribunal', '✓ Tribunal guardado.')
    await cargarTribunalesDeExamen()
  } catch (err) {
    mostrarError('msg-tribunal', `Error: ${err.message}`)
  } finally {
    btn.disabled = false
    btn.textContent = 'Guardar'
  }
}
