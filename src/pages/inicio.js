import { supabase } from '../supabase-client.js'
import { formatearFechaCorta, badgeEstado, textoGrado } from '../utils.js'

export async function init() {
  await Promise.all([
    cargarKPIs(),
    cargarProximosExamenes(),
    cargarInscripcionesRecientes()
  ])
}

async function cargarKPIs() {
  try {
    const [examenes, aspirantes, pendientes, clubs] = await Promise.all([
      supabase.from('exams').select('id', { count: 'exact' }).eq('status', 'abierto'),
      supabase.from('aspirants').select('id', { count: 'exact' }),
      supabase.from('inscriptions').select('id', { count: 'exact' }).eq('payment_status', 'pendiente'),
      supabase.from('clubs').select('id', { count: 'exact' }),
    ])
    document.getElementById('kpi-examenes').textContent  = examenes.count ?? '—'
    document.getElementById('kpi-aspirantes').textContent = aspirantes.count ?? '—'
    document.getElementById('kpi-pendientes').textContent = pendientes.count ?? '—'
    document.getElementById('kpi-clubs').textContent     = clubs.count ?? '—'
  } catch (e) { console.error(e) }
}

async function cargarProximosExamenes() {
  const tbody = document.getElementById('tabla-proximos-examenes')
  try {
    const { data } = await supabase
      .from('exams')
      .select('name, exam_date, status')
      .gte('exam_date', new Date().toISOString().split('T')[0])
      .order('exam_date', { ascending: true })
      .limit(5)

    if (!data || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;color:#6b7280;padding:20px;">No hay exámenes próximos</td></tr>`
      return
    }
    tbody.innerHTML = data.map(e => `
      <tr>
        <td>${e.name}</td>
        <td>${formatearFechaCorta(e.exam_date)}</td>
        <td>${badgeEstado(e.status)}</td>
      </tr>`).join('')
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;color:#dc2626;">Error al cargar</td></tr>`
  }
}

async function cargarInscripcionesRecientes() {
  const tbody = document.getElementById('tabla-inscripciones-recientes')
  try {
    const { data } = await supabase
      .from('inscriptions')
      .select('target_grade, inscription_status, aspirants(full_name)')
      .order('created_at', { ascending: false })
      .limit(5)

    if (!data || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;color:#6b7280;padding:20px;">No hay inscripciones</td></tr>`
      return
    }
    tbody.innerHTML = data.map(i => `
      <tr>
        <td>${i.aspirants?.full_name ?? '—'}</td>
        <td>${textoGrado(i.target_grade)}</td>
        <td>${badgeEstado(i.inscription_status)}</td>
      </tr>`).join('')
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;color:#dc2626;">Error al cargar</td></tr>`
  }
}
