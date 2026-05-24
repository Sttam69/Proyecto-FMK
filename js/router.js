// ============================================================
// ROUTER DE NAVEGACIÓN
// Carga el contenido de cada sección sin recargar la página completa.
// Funciona cambiando el hash de la URL (ej: dashboard.html#aspirantes).
// ============================================================

import { getCurrentProfile } from './auth.js';

// Mapa de secciones: cada clave es el nombre de la sección,
// el valor es la ruta al archivo HTML parcial que se cargará.
const ROUTES = {
  'inicio':          'pages/inicio.html',
  'usuarios':        'pages/usuarios.html',
  'aspirantes':      'pages/aspirantes.html',
  'inscripciones':   'pages/inscripciones.html',
  'examenes':        'pages/examenes.html',
  'tribunales':      'pages/tribunales.html',
  'calificaciones':  'pages/calificaciones.html',
  'reportes':        'pages/reportes.html',
  'mi-cuenta':       'pages/mi-cuenta.html',
};

// Títulos de página para cada sección
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
};

let currentSection = null;

// Navega a una sección cargando su HTML en el área de contenido
export async function navigateTo(section) {
  if (!section || !ROUTES[section]) section = 'inicio';
  if (section === currentSection) return;

  currentSection = section;

  // Actualizar el hash en la URL (para que el botón "atrás" funcione)
  window.location.hash = section;

  // Actualizar el título de la página en el header
  const titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = TITLES[section] || 'Panel';

  // Marcar el ítem activo en el sidebar
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.section === section);
  });

  // Cargar el contenido HTML de la sección
  const contentArea = document.getElementById('content-area');
  if (!contentArea) return;

  contentArea.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><span>Cargando...</span></div>';

  try {
    const response = await fetch(ROUTES[section]);
    if (!response.ok) throw new Error('No se pudo cargar la sección');
    const html = await response.text();
    contentArea.innerHTML = html;

    // Ejecutar el script de inicialización de la sección si existe
    const initFn = window[`init_${section.replace('-', '_')}`];
    if (typeof initFn === 'function') {
      await initFn();
    }
  } catch (err) {
    contentArea.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <p>No se pudo cargar esta sección. Por favor, intenta de nuevo.</p>
      </div>`;
  }
}

// Inicializa el router leyendo el hash actual de la URL
export function initRouter() {
  const hash = window.location.hash.replace('#', '') || 'inicio';
  navigateTo(hash);

  // Escuchar cambios en el hash (navegación con botón "atrás" del navegador)
  window.addEventListener('hashchange', () => {
    const section = window.location.hash.replace('#', '') || 'inicio';
    navigateTo(section);
  });
}

// Obtiene la sección actual
export function getCurrentSection() {
  return currentSection;
}
