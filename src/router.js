import { getCurrentProfile } from './auth.js'

const ROUTES = {
  'inicio':         { html: '/pages/inicio.html',         mod: () => import('./pages/inicio.js') },
  'usuarios':       { html: '/pages/usuarios.html',       mod: () => import('./pages/usuarios.js') },
  'aspirantes':     { html: '/pages/aspirantes.html',     mod: () => import('./pages/aspirantes.js') },
  'inscripciones':  { html: '/pages/inscripciones.html',  mod: () => import('./pages/inscripciones.js') },
  'examenes':       { html: '/pages/examenes.html',       mod: () => import('./pages/examenes.js') },
  'tribunales':     { html: '/pages/tribunales.html',     mod: () => import('./pages/tribunales.js') },
  'calificaciones': { html: '/pages/calificaciones.html', mod: () => import('./pages/calificaciones.js') },
  'reportes':       { html: '/pages/reportes.html',       mod: () => import('./pages/reportes.js') },
  'mi-cuenta':      { html: '/pages/mi-cuenta.html',      mod: () => import('./pages/mi-cuenta.js') },
}

const TITLES = {
  'inicio':          'Panel Principal',
  'usuarios':        'Gestión de Usuarios',
  'aspirantes':      'Aspirantes',
  'inscripciones':   'Inscripciones y Pagos',
  'examenes':        'Exámenes',
  'tribunales':      'Tribunales',
  'calificaciones':  'Calificaciones',
  'reportes':        'Reportes',
  'mi-cuenta':       'Mi Cuenta',
}

let currentSection = null

export async function navigateTo(section) {
  if (!section || !ROUTES[section]) section = 'inicio'
  if (section === currentSection) return
  currentSection = section

  window.location.hash = section

  const titleEl = document.getElementById('page-title')
  if (titleEl) titleEl.textContent = TITLES[section] || 'Panel'

  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.section === section)
  })

  const contentArea = document.getElementById('content-area')
  if (!contentArea) return

  contentArea.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><span>Cargando...</span></div>'

  try {
    const route = ROUTES[section]
    const [response, mod] = await Promise.all([
      fetch(route.html),
      route.mod()
    ])
    if (!response.ok) throw new Error('No se pudo cargar la sección')
    contentArea.innerHTML = await response.text()
    if (typeof mod.init === 'function') await mod.init()
  } catch (err) {
    contentArea.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <p>No se pudo cargar esta sección. Por favor, intenta de nuevo.</p>
      </div>`
  }
}

export function initRouter() {
  const hash = window.location.hash.replace('#', '') || 'inicio'
  navigateTo(hash)
  window.addEventListener('hashchange', () => {
    const section = window.location.hash.replace('#', '') || 'inicio'
    navigateTo(section)
  })
}

export function getCurrentSection() {
  return currentSection
}
