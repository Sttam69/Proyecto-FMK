import { supabase } from '../supabase-client.js'
import { textoGrado, formatearFecha, formatearFechaCorta, badgeEstado } from '../utils.js'

let datosExamen = null

export async function init() {
  await cargarExamenesSelect()
  window.cargarEstadisticas = cargarEstadisticas
  window.generarActaPDF     = generarActaPDF
  window.exportarCSV        = exportarCSV
}

async function cargarExamenesSelect() {
  const { data } = await supabase.from('exams').select('id, name').order('exam_date', { ascending: false })
  const select = document.getElementById('filtro-exam-rep')
  ;(data ?? []).forEach(e => {
    const opt = document.createElement('option')
    opt.value = e.id
    opt.textContent = e.name
    select.appendChild(opt)
  })
}

async function cargarEstadisticas() {
  const examId = document.getElementById('filtro-exam-rep').value
  const contenedor = document.getElementById('contenido-reportes')

  if (!examId) {
    contenedor.innerHTML = '<div class="empty-state"><div class="empty-icon">📊</div><p>Selecciona un examen.</p></div>'
    return
  }

  contenedor.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><span>Generando reporte...</span></div>'

  const [{ data: examen }, { data: inscripciones }] = await Promise.all([
    supabase.from('exams').select('*').eq('id', examId).single(),
    supabase.from('inscriptions')
      .select('target_grade, inscription_status, final_amount, aspirants(full_name, clubs(name)), exam_results(final_result, common_block_valid_until)')
      .eq('exam_id', examId)
      .order('target_grade')
  ])

  datosExamen = { examen, inscripciones: inscripciones ?? [] }

  const total      = inscripciones?.length ?? 0
  const aptos      = inscripciones?.filter(i => i.exam_results?.final_result === 'apto').length ?? 0
  const noAptos    = inscripciones?.filter(i => i.exam_results?.final_result === 'no_apto').length ?? 0
  const pendientes = total - aptos - noAptos

  const porClub = {}
  ;(inscripciones ?? []).forEach(i => {
    const club = i.aspirants?.clubs?.name ?? 'Sin club'
    if (!porClub[club]) porClub[club] = { total: 0, aptos: 0 }
    porClub[club].total++
    if (i.exam_results?.final_result === 'apto') porClub[club].aptos++
  })

  contenedor.innerHTML = `
    <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr);">
      <div class="kpi-card blue">
        <div class="kpi-label">Total inscritos</div>
        <div class="kpi-value">${total}</div>
      </div>
      <div class="kpi-card green">
        <div class="kpi-label">Aptos</div>
        <div class="kpi-value">${aptos}</div>
        <div class="kpi-sub">${total ? Math.round((aptos/total)*100) : 0}% del total</div>
      </div>
      <div class="kpi-card red">
        <div class="kpi-label">No Aptos</div>
        <div class="kpi-value">${noAptos}</div>
      </div>
      <div class="kpi-card orange">
        <div class="kpi-label">Sin resultado</div>
        <div class="kpi-value">${pendientes}</div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
      <div class="card">
        <div class="card-header"><h3>🏢 Resultados por club</h3></div>
        <table class="data-table">
          <thead><tr><th>Club</th><th>Inscritos</th><th>Aptos</th><th>%</th></tr></thead>
          <tbody>
            ${Object.entries(porClub).map(([club, datos]) => `
              <tr>
                <td>${club}</td>
                <td>${datos.total}</td>
                <td>${datos.aptos}</td>
                <td>${Math.round((datos.aptos/datos.total)*100)}%</td>
              </tr>`).join('') || '<tr><td colspan="4" style="text-align:center;color:#6b7280;">Sin datos</td></tr>'}
          </tbody>
        </table>
      </div>

      <div class="card">
        <div class="card-header"><h3>📄 Generar documentos</h3></div>
        <div class="card-body" style="display:flex;flex-direction:column;gap:12px;">
          <button class="btn btn-primary" onclick="generarActaPDF()">📄 Generar acta oficial PDF</button>
          <button class="btn btn-secondary" onclick="exportarCSV()">📊 Exportar resultados a CSV</button>
          <p style="font-size:12px;color:#6b7280;">El acta PDF incluirá el nombre del examen, fecha, lugar y los resultados de todos los aspirantes.</p>
        </div>
      </div>
    </div>

    <div class="card" style="margin-top:16px;">
      <div class="card-header"><h3>📋 Listado completo de resultados</h3></div>
      <table class="data-table" id="tabla-resultados-completos">
        <thead>
          <tr><th>#</th><th>Aspirante</th><th>Club</th><th>Grado</th><th>Estado inscripción</th><th>Resultado</th></tr>
        </thead>
        <tbody>
          ${(inscripciones ?? []).map((i, idx) => `
            <tr>
              <td>${idx + 1}</td>
              <td><strong>${i.aspirants?.full_name ?? '—'}</strong></td>
              <td>${i.aspirants?.clubs?.name ?? '—'}</td>
              <td>${textoGrado(i.target_grade)}</td>
              <td>${badgeEstado(i.inscription_status)}</td>
              <td>${i.exam_results?.final_result ? badgeEstado(i.exam_results.final_result) : '<span class="badge badge-gray">Pendiente</span>'}</td>
            </tr>`).join('') || '<tr><td colspan="6" style="text-align:center;color:#6b7280;padding:20px;">Sin aspirantes confirmados.</td></tr>'}
        </tbody>
      </table>
    </div>`
}

function generarActaPDF() {
  if (!datosExamen) { alert('Selecciona un examen primero.'); return }

  if (typeof window.jspdf === 'undefined') {
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
    script.onload = () => crearPDF()
    document.head.appendChild(script)
  } else {
    crearPDF()
  }
}

function crearPDF() {
  const { jsPDF } = window.jspdf
  const doc = new jsPDF()
  const { examen, inscripciones } = datosExamen

  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('FEDERACIÓN MADRILEÑA DE KARATE', 105, 20, { align: 'center' })
  doc.setFontSize(14)
  doc.text('ACTA OFICIAL DE EXAMEN DE GRADOS', 105, 32, { align: 'center' })

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(`Examen: ${examen.name}`, 20, 50)
  doc.text(`Fecha: ${formatearFecha(examen.exam_date)}`, 20, 58)
  doc.text(`Lugar: ${examen.location ?? 'No especificado'}`, 20, 66)
  doc.text(`Total de aspirantes: ${inscripciones.length}`, 20, 74)

  doc.setDrawColor(37, 99, 235)
  doc.setLineWidth(0.5)
  doc.line(20, 80, 190, 80)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('#', 20, 90)
  doc.text('Aspirante', 28, 90)
  doc.text('Club', 90, 90)
  doc.text('Grado', 130, 90)
  doc.text('Resultado', 165, 90)

  doc.setFont('helvetica', 'normal')
  let y = 98
  inscripciones.forEach((i, idx) => {
    if (y > 270) { doc.addPage(); y = 20 }
    const resultado = i.exam_results?.final_result
    doc.text(`${idx + 1}`, 20, y)
    doc.text((i.aspirants?.full_name ?? '—').substring(0, 30), 28, y)
    doc.text((i.aspirants?.clubs?.name ?? '—').substring(0, 18), 90, y)
    doc.text(textoGrado(i.target_grade), 130, y)

    if (resultado === 'apto') {
      doc.setTextColor(22, 163, 74)
      doc.text('APTO', 165, y)
    } else if (resultado === 'no_apto') {
      doc.setTextColor(220, 38, 38)
      doc.text('NO APTO', 165, y)
    } else {
      doc.setTextColor(107, 114, 128)
      doc.text('PENDIENTE', 165, y)
    }
    doc.setTextColor(0, 0, 0)
    y += 8
  })

  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(9)
    doc.setTextColor(107, 114, 128)
    doc.text(`Documento generado el ${formatearFecha(new Date())} — Página ${i} de ${pageCount}`, 105, 285, { align: 'center' })
  }

  doc.save(`Acta_${examen.name.replace(/\s+/g, '_')}.pdf`)
}

function exportarCSV() {
  if (!datosExamen) { alert('Selecciona un examen primero.'); return }
  const { examen, inscripciones } = datosExamen
  const headers = ['#', 'Aspirante', 'Club', 'Grado', 'Estado Inscripción', 'Resultado']
  const filas = inscripciones.map((i, idx) => [
    idx + 1,
    `"${i.aspirants?.full_name ?? ''}"`,
    `"${i.aspirants?.clubs?.name ?? ''}"`,
    textoGrado(i.target_grade),
    i.inscription_status,
    i.exam_results?.final_result ?? 'pendiente'
  ])

  const csv  = [headers, ...filas].map(row => row.join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `Resultados_${examen.name.replace(/\s+/g, '_')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
