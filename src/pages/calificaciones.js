import { supabase } from '../supabase-client.js'
import { textoGrado, badgeEstado } from '../utils.js'

let inscripcionesExamen = []
let calificacionesExistentes = {}

export async function init() {
  await cargarExamenesSelect()
  window.cargarAspirantesDeExamen = cargarAspirantesDeExamen
  window.guardarCalificacion      = guardarCalificacion
  window.calcularResultadoFinal   = calcularResultadoFinal
}

async function cargarExamenesSelect() {
  const { data } = await supabase.from('exams').select('id, name').in('status', ['abierto','en_curso']).order('exam_date', { ascending: false })
  const select = document.getElementById('filtro-exam-cal')
  ;(data ?? []).forEach(e => {
    const opt = document.createElement('option')
    opt.value = e.id
    opt.textContent = e.name
    select.appendChild(opt)
  })
}

async function cargarAspirantesDeExamen() {
  const examId = document.getElementById('filtro-exam-cal').value
  const contenedor = document.getElementById('contenido-calificaciones')
  const rol = window.currentProfile?.role

  if (!examId) {
    contenedor.innerHTML = '<div class="empty-state"><div class="empty-icon">🏆</div><p>Selecciona un examen.</p></div>'
    return
  }

  contenedor.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><span>Cargando aspirantes...</span></div>'

  try {
    const { data: inscripciones, error } = await supabase
      .from('inscriptions')
      .select('id, target_grade, specific_block_path, aspirants(full_name), exam_results(final_result)')
      .eq('exam_id', examId)
      .eq('inscription_status', 'confirmada')
    if (error) throw error
    inscripcionesExamen = inscripciones ?? []

    const userId = window.currentProfile?.id
    const { data: grades } = await supabase
      .from('grades')
      .select('inscription_id, common_block_result, specific_block_result')
      .eq('judge_profile_id', userId)
      .in('inscription_id', inscripcionesExamen.map(i => i.id))

    calificacionesExistentes = {}
    ;(grades ?? []).forEach(g => { calificacionesExistentes[g.inscription_id] = g })

    renderizarTablaCalificaciones(rol)
  } catch (err) {
    contenedor.innerHTML = `<div class="alert alert-error">Error al cargar: ${err.message}</div>`
  }
}

function renderizarTablaCalificaciones(rol) {
  const contenedor = document.getElementById('contenido-calificaciones')
  const esJuez  = rol === 'juez'
  const esAdmin = rol === 'admin'

  if (inscripcionesExamen.length === 0) {
    contenedor.innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div><p>No hay aspirantes confirmados en este examen.</p></div>'
    return
  }

  const filas = inscripcionesExamen.map(insc => {
    const cal = calificacionesExistentes[insc.id] ?? {}
    const resultadoFinal = insc.exam_results?.final_result

    if (esJuez) {
      return `
        <tr>
          <td><strong>${insc.aspirants?.full_name ?? '—'}</strong></td>
          <td>${textoGrado(insc.target_grade)}</td>
          <td style="text-transform:capitalize;">${insc.specific_block_path ?? '—'}</td>
          <td>
            <select class="select-calificacion" data-inscid="${insc.id}" data-bloque="common"
              onchange="guardarCalificacion('${insc.id}', 'common', this.value)"
              style="padding:6px 10px;border:1.5px solid #e5e7eb;border-radius:6px;font-size:13px;">
              <option value="">— Pendiente —</option>
              <option value="apto"    ${cal.common_block_result === 'apto'    ? 'selected' : ''}>✓ Apto</option>
              <option value="no_apto" ${cal.common_block_result === 'no_apto' ? 'selected' : ''}>✗ No Apto</option>
            </select>
          </td>
          <td>
            <select class="select-calificacion" data-inscid="${insc.id}" data-bloque="specific"
              onchange="guardarCalificacion('${insc.id}', 'specific', this.value)"
              style="padding:6px 10px;border:1.5px solid #e5e7eb;border-radius:6px;font-size:13px;"
              ${cal.common_block_result !== 'apto' ? 'disabled' : ''}>
              <option value="">— Pendiente —</option>
              <option value="apto"    ${cal.specific_block_result === 'apto'    ? 'selected' : ''}>✓ Apto</option>
              <option value="no_apto" ${cal.specific_block_result === 'no_apto' ? 'selected' : ''}>✗ No Apto</option>
            </select>
          </td>
          <td>${resultadoFinal ? badgeEstado(resultadoFinal) : '<span class="badge badge-gray">Sin calcular</span>'}</td>
        </tr>`
    } else {
      return `
        <tr>
          <td><strong>${insc.aspirants?.full_name ?? '—'}</strong></td>
          <td>${textoGrado(insc.target_grade)}</td>
          <td style="text-transform:capitalize;">${insc.specific_block_path ?? '—'}</td>
          <td>${cal.common_block_result   ? badgeEstado(cal.common_block_result)   : '<span class="badge badge-gray">—</span>'}</td>
          <td>${cal.specific_block_result ? badgeEstado(cal.specific_block_result) : '<span class="badge badge-gray">—</span>'}</td>
          <td>
            ${resultadoFinal ? badgeEstado(resultadoFinal) : '<span class="badge badge-gray">Sin calcular</span>'}
            ${esAdmin && !resultadoFinal
              ? `<button class="btn btn-primary btn-sm" style="margin-left:6px;" onclick="calcularResultadoFinal('${insc.id}')">Calcular</button>`
              : ''}
          </td>
        </tr>`
    }
  }).join('')

  contenedor.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3>🏆 Aspirantes del examen</h3>
        <span style="font-size:13px;color:#6b7280;">${inscripcionesExamen.length} aspirante${inscripcionesExamen.length !== 1 ? 's' : ''}</span>
      </div>
      <div id="msg-cal" style="padding:0 20px;"></div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Aspirante</th><th>Grado</th><th>Vía</th>
            <th>Bloque Común</th><th>Bloque Específico</th><th>Resultado Final</th>
          </tr>
        </thead>
        <tbody>${filas}</tbody>
      </table>
    </div>`
}

async function guardarCalificacion(inscId, bloque, valor) {
  const userId = window.currentProfile?.id
  if (!userId) return

  if (bloque === 'specific') {
    const cal = calificacionesExistentes[inscId] ?? {}
    if (cal.common_block_result !== 'apto') {
      alert('El aspirante debe aprobar el Bloque Común antes de calificar el Bloque Específico.')
      return
    }
  }

  const campo = bloque === 'common' ? 'common_block_result' : 'specific_block_result'

  try {
    const { error } = await supabase.from('grades').upsert({
      inscription_id:   inscId,
      judge_profile_id: userId,
      [campo]:          valor || null
    }, { onConflict: 'inscription_id,judge_profile_id' })
    if (error) throw error

    if (!calificacionesExistentes[inscId]) calificacionesExistentes[inscId] = {}
    calificacionesExistentes[inscId][campo] = valor || null

    const selectEsp = document.querySelector(`[data-inscid="${inscId}"][data-bloque="specific"]`)
    if (selectEsp) {
      selectEsp.disabled = (bloque === 'common' && valor !== 'apto')
    }
  } catch (err) {
    alert(`Error al guardar: ${err.message}`)
  }
}

async function calcularResultadoFinal(inscId) {
  const { data: todasCalif, error } = await supabase
    .from('grades')
    .select('common_block_result, specific_block_result')
    .eq('inscription_id', inscId)

  if (error || !todasCalif || todasCalif.length === 0) {
    alert('No hay calificaciones registradas para calcular el resultado.')
    return
  }

  const total      = todasCalif.length
  const aptosComun = todasCalif.filter(c => c.common_block_result   === 'apto').length
  const aptosEsp   = todasCalif.filter(c => c.specific_block_result === 'apto').length

  const insc  = inscripcionesExamen.find(i => i.id === inscId)
  const grado = insc?.target_grade ?? ''
  const esDanAlto = ['5DAN','6DAN','7DAN','8DAN'].includes(grado)
  const umbral = esDanAlto ? Math.ceil(total * 0.8) : Math.ceil(total / 2)

  let resultado
  if (aptosComun < umbral) {
    resultado = 'no_apto'
  } else if (aptosEsp >= umbral) {
    resultado = 'apto'
  } else {
    resultado = 'pendiente_especifico'
  }

  const validoHasta = resultado === 'pendiente_especifico'
    ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    : null

  await supabase.from('exam_results').upsert({
    inscription_id:           inscId,
    final_result:             resultado,
    common_block_valid_until: validoHasta,
  }, { onConflict: 'inscription_id' })

  const label = resultado === 'apto' ? 'APTO' : resultado === 'no_apto' ? 'NO APTO' : 'BLOQUE ESPECÍFICO PENDIENTE'
  alert(`Resultado calculado: ${label} (${aptosComun}/${total} votos Bloque Común)`)

  await cargarAspirantesDeExamen()
}
