import { supabase } from '../supabase-client.js'
import {
  LISTA_GRADOS, textoGrado, formatearFechaCorta, badgeEstado,
  calcularDescuento, calcularImporte, validarRequisitos,
  mostrarError, mostrarExito, mostrarNotificacion, validarCamposRequeridos
} from '../utils.js'

let todasInscripciones = []
let aspirantesDisp = []
let examenesDisp = []
let aspiranteSeleccionado = null
let examenSeleccionado = null
let pagandoId = null
let ultimoRequisito = null

export async function init() {
  await Promise.all([cargarAspirantes(), cargarExamenes(), cargarInscripciones()])
  window.filtrarInscripciones  = filtrarInscripciones
  window.onAspiraanteChange    = onAspiraanteChange
  window.onExamenChange        = onExamenChange
  window.calcularCuota         = calcularCuota
  window.abrirModalInscripcion = abrirModalInscripcion
  window.cerrarModalInscripcion = cerrarModalInscripcion
  window.guardarInscripcion    = guardarInscripcion
  window.abrirModalPago        = abrirModalPago
  window.cerrarModalPago       = cerrarModalPago
  window.confirmarPago         = confirmarPago
}

async function cargarAspirantes() {
  const { data } = await supabase.from('aspirants')
    .select('id, full_name, birth_date, grade_date, current_grade, club_id, is_champion_madrid, is_champion_spain, is_champion_europe, is_champion_world')
    .order('full_name')
  aspirantesDisp = data ?? []
  const select = document.getElementById('insc-aspirante')
  aspirantesDisp.forEach(a => {
    const opt = document.createElement('option')
    opt.value = a.id
    opt.textContent = a.full_name
    select.appendChild(opt)
  })
}

async function cargarExamenes() {
  const { data } = await supabase.from('exams')
    .select('id, name, exam_date, grades_offered')
    .in('status', ['abierto','en_curso'])
    .order('exam_date')
  examenesDisp = data ?? []
  const select = document.getElementById('insc-examen')
  examenesDisp.forEach(e => {
    const opt = document.createElement('option')
    opt.value = e.id
    opt.textContent = `${e.name} – ${formatearFechaCorta(e.exam_date)}`
    select.appendChild(opt)
  })
}

async function cargarInscripciones() {
  const tbody = document.getElementById('tabla-inscripciones')
  try {
    const { data, error } = await supabase
      .from('inscriptions')
      .select('*, aspirants(full_name), exams(name, exam_date)')
      .order('created_at', { ascending: false })
    if (error) throw error
    todasInscripciones = data ?? []
    renderizarInscripciones(todasInscripciones)
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:#dc2626;">Error al cargar.</td></tr>`
  }
}

function renderizarInscripciones(lista) {
  const tbody = document.getElementById('tabla-inscripciones')
  const count = document.getElementById('insc-count')
  count.textContent = `${lista.length} inscripción${lista.length !== 1 ? 'es' : ''}`

  if (lista.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><div class="empty-icon">📝</div><p>No hay inscripciones.</p></div></td></tr>`
    return
  }

  const esAdmin = window.currentProfile?.role === 'admin'
  tbody.innerHTML = lista.map(i => `
    <tr>
      <td><strong>${i.aspirants?.full_name ?? '—'}</strong></td>
      <td>${i.exams?.name ?? '—'}</td>
      <td>${textoGrado(i.target_grade)}</td>
      <td style="text-transform:capitalize;">${i.specific_block_path ?? '—'}</td>
      <td>${i.final_amount != null ? `${i.final_amount.toFixed(2)} €` : '—'}</td>
      <td>${badgeEstado(i.payment_status)}</td>
      <td>${badgeEstado(i.inscription_status)}</td>
      <td style="white-space:nowrap;">
        ${esAdmin && i.payment_status === 'pendiente'
          ? `<button class="btn btn-success btn-sm" onclick="abrirModalPago('${i.id}','${i.aspirants?.full_name}',${i.final_amount})">Confirmar pago</button>`
          : ''}
      </td>
    </tr>`).join('')
}

function filtrarInscripciones() {
  const q    = document.getElementById('search-insc').value.toLowerCase()
  const pago = document.getElementById('filtro-pago').value
  const filtrado = todasInscripciones.filter(i => {
    const txt = (i.aspirants?.full_name + (i.exams?.name ?? '')).toLowerCase().includes(q)
    const pg  = !pago || i.payment_status === pago
    return txt && pg
  })
  renderizarInscripciones(filtrado)
}

function onAspiraanteChange() {
  const id = document.getElementById('insc-aspirante').value
  aspiranteSeleccionado = aspirantesDisp.find(a => a.id === id) ?? null

  const selectExamen = document.getElementById('insc-examen')
  const examAnterior = selectExamen.value
  selectExamen.innerHTML = '<option value="">— Seleccionar —</option>'
  examenSeleccionado = null

  let lista = examenesDisp
  if (aspiranteSeleccionado?.current_grade) {
    const idx = LISTA_GRADOS.indexOf(aspiranteSeleccionado.current_grade)
    lista = examenesDisp.filter(e =>
      !e.grades_offered?.length ||
      e.grades_offered.some(g => LISTA_GRADOS.indexOf(g) > idx)
    )
  }
  lista.forEach(e => {
    const opt = document.createElement('option')
    opt.value = e.id
    opt.textContent = `${e.name} – ${formatearFechaCorta(e.exam_date)}`
    selectExamen.appendChild(opt)
  })

  if (lista.some(e => e.id === examAnterior)) {
    selectExamen.value = examAnterior
    examenSeleccionado = examenesDisp.find(e => e.id === examAnterior) ?? null
  }

  const grado = document.getElementById('insc-grado').value
  if (aspiranteSeleccionado && examenSeleccionado && grado) {
    calcularCuota()
  } else {
    document.getElementById('panel-requisitos').style.display = 'none'
    document.getElementById('panel-cuota').style.display = 'none'
    document.getElementById('btn-guardar-insc').disabled = false
  }
}

function onExamenChange() {
  const id = document.getElementById('insc-examen').value
  examenSeleccionado = examenesDisp.find(e => e.id === id) ?? null

  const selectGrado = document.getElementById('insc-grado')
  const gradoAnterior = selectGrado.value
  selectGrado.innerHTML = '<option value="">— Seleccionar —</option>'

  let grados = examenSeleccionado?.grades_offered?.length
    ? examenSeleccionado.grades_offered
    : LISTA_GRADOS

  if (aspiranteSeleccionado?.current_grade) {
    const idx = LISTA_GRADOS.indexOf(aspiranteSeleccionado.current_grade)
    grados = grados.filter(g => LISTA_GRADOS.indexOf(g) > idx)
  }

  grados.forEach(g => {
    const opt = document.createElement('option')
    opt.value = g
    opt.textContent = textoGrado(g)
    selectGrado.appendChild(opt)
  })

  if (grados.includes(gradoAnterior) && aspiranteSeleccionado && examenSeleccionado) {
    selectGrado.value = gradoAnterior
    calcularCuota()
    return
  }

  document.getElementById('panel-requisitos').style.display = 'none'
  document.getElementById('panel-cuota').style.display = 'none'
  document.getElementById('btn-guardar-insc').disabled = false
}

async function calcularCuota() {
  const grado     = document.getElementById('insc-grado').value
  const repetidor = document.getElementById('insc-repetidor').checked
  if (!aspiranteSeleccionado || !examenSeleccionado || !grado) return

  const { data: licencias } = await supabase
    .from('licenses').select('season').eq('aspirant_id', aspiranteSeleccionado.id)

  const req = validarRequisitos(aspiranteSeleccionado, grado, examenSeleccionado.exam_date, licencias ?? [])
  const panelReq = document.getElementById('panel-requisitos')
  panelReq.style.display = 'block'
  panelReq.className = req.cumple ? 'alert alert-success' : 'alert alert-warning'
  panelReq.innerHTML = `
    <div>
      <strong>${req.cumple ? '✓ El aspirante cumple los requisitos' : '⚠ Requisitos no completados'}</strong>
      <ul style="margin-top:6px;padding-left:16px;">
        ${req.detalles.map(d => `<li style="color:${d.ok ? '#15803d' : d.ok === false ? '#b91c1c' : '#92400e'}">${d.texto}</li>`).join('')}
      </ul>
    </div>`

  const descuento = calcularDescuento(aspiranteSeleccionado, repetidor)
  const importe   = calcularImporte(grado, descuento)
  document.getElementById('cuota-base').textContent      = `${importe.base.toFixed(2)} €`
  document.getElementById('cuota-descuento').textContent = `${descuento}% (−${importe.descuento.toFixed(2)} €)`
  document.getElementById('cuota-total').textContent     = `${importe.final.toFixed(2)} €`

  ultimoRequisito = req
  const btnInsc = document.getElementById('btn-guardar-insc')
  btnInsc.disabled = !req.cumple
  btnInsc.title = req.cumple ? '' : 'El aspirante no cumple los requisitos mínimos de la normativa FMK'

  document.getElementById('panel-cuota').style.display = 'block'
}

function abrirModalInscripcion() {
  document.getElementById('insc-aspirante').value = ''
  const selExamen = document.getElementById('insc-examen')
  selExamen.innerHTML = '<option value="">— Seleccionar —</option>'
  examenesDisp.forEach(e => {
    const opt = document.createElement('option')
    opt.value = e.id
    opt.textContent = `${e.name} – ${formatearFechaCorta(e.exam_date)}`
    selExamen.appendChild(opt)
  })
  document.getElementById('btn-guardar-insc').disabled = false
  ultimoRequisito = null
  document.getElementById('insc-grado').innerHTML = '<option value="">— Seleccionar —</option>'
  document.getElementById('insc-via').value = ''
  document.getElementById('insc-repetidor').checked = false
  document.getElementById('panel-requisitos').style.display = 'none'
  document.getElementById('panel-cuota').style.display = 'none'
  document.getElementById('msg-inscripcion').innerHTML = ''
  aspiranteSeleccionado = null
  examenSeleccionado = null
  ;['insc-aspirante','insc-examen','insc-grado','insc-via'].forEach(fId => {
    const el = document.getElementById(fId)
    if (!el) return
    el.classList.remove('input-error')
    el.closest('.form-group')?.querySelector('label')?.classList.remove('label-error')
  })
  document.getElementById('modal-inscripcion').classList.remove('hidden')
}

function cerrarModalInscripcion() {
  document.getElementById('modal-inscripcion').classList.add('hidden')
}

async function guardarInscripcion() {
  const aspId  = document.getElementById('insc-aspirante').value
  const examId = document.getElementById('insc-examen').value
  const grado  = document.getElementById('insc-grado').value
  const via    = document.getElementById('insc-via').value
  const rep    = document.getElementById('insc-repetidor').checked

  const REQUERIDOS = ['insc-aspirante','insc-examen','insc-grado','insc-via']
  if (!validarCamposRequeridos(REQUERIDOS)) {
    mostrarNotificacion('Todos los campos con * son obligatorios.', 'error')
    return
  }

  const descuento = calcularDescuento(aspiranteSeleccionado ?? {}, rep)
  const importe   = calcularImporte(grado, descuento)

  const btn = document.getElementById('btn-guardar-insc')
  btn.disabled = true
  btn.textContent = 'Inscribiendo...'

  try {
    const { error } = await supabase.from('inscriptions').insert({
      exam_id: examId, aspirant_id: aspId, target_grade: grado,
      specific_block_path: via, fee_amount: importe.base,
      discount_percent: descuento, final_amount: importe.final,
      payment_status: descuento === 100 ? 'exento' : 'pendiente',
      requirements_ok: ultimoRequisito?.cumple ?? false, inscription_status: 'pendiente',
      registered_by: window.currentProfile?.id
    })
    if (error) throw error
    cerrarModalInscripcion()
    mostrarNotificacion('✓ Inscripción registrada correctamente.')
    await cargarInscripciones()
  } catch (err) {
    mostrarNotificacion(`Error: ${err.message}`, 'error')
  } finally {
    btn.disabled = false
    btn.textContent = 'Inscribir'
  }
}

function abrirModalPago(id, nombre, importe) {
  pagandoId = id
  document.getElementById('pago-info').textContent = `Aspirante: ${nombre} — Importe: ${(importe ?? 0).toFixed(2)} €`
  document.getElementById('pago-fecha').value = new Date().toISOString().split('T')[0]
  document.getElementById('pago-status').value = 'confirmado'
  document.getElementById('msg-pago').innerHTML = ''
  document.getElementById('modal-pago').classList.remove('hidden')
}

function cerrarModalPago() {
  document.getElementById('modal-pago').classList.add('hidden')
}

async function confirmarPago() {
  const fecha  = document.getElementById('pago-fecha').value
  const status = document.getElementById('pago-status').value
  const btn    = document.getElementById('btn-confirmar-pago')
  btn.disabled = true
  btn.textContent = 'Guardando...'

  try {
    const { error } = await supabase.from('inscriptions').update({
      payment_status: status,
      payment_date: fecha || null,
      inscription_status: status === 'confirmado' || status === 'exento' ? 'confirmada' : 'pendiente'
    }).eq('id', pagandoId)
    if (error) throw error
    cerrarModalPago()
    mostrarNotificacion('✓ Pago registrado.')
    await cargarInscripciones()
  } catch (err) {
    mostrarNotificacion(`Error: ${err.message}`, 'error')
  } finally {
    btn.disabled = false
    btn.textContent = 'Guardar'
  }
}
