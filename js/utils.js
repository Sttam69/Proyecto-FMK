// ============================================================
// UTILIDADES DEL SISTEMA FMK
// Funciones para: cálculos de edad, requisitos, descuentos,
// formateo de fechas, grades, etc.
// ============================================================

// ============================================================
// CONSTANTES DEL SISTEMA
// Basadas en la Normativa de Grados FMK 2017
// ============================================================

// Cuotas de inscripción según el grado objetivo (en euros)
export const CUOTAS = {
  '10KYU': 20, '9KYU': 20, '8KYU': 25, '7KYU': 25,
  '6KYU':  30, '5KYU': 30, '4KYU': 35, '3KYU': 35,
  '2KYU':  40, '1KYU': 40,
  '1DAN':  80, '2DAN': 90, '3DAN': 100, '4DAN': 110,
  '5DAN': 130, '6DAN': 150, '7DAN': 180, '8DAN': 200,
};

// Tiempo mínimo entre grados (en meses)
export const TIEMPO_MINIMO = {
  '10KYU': 0,  '9KYU': 3,  '8KYU': 3,  '7KYU': 3,
  '6KYU':  3,  '5KYU': 4,  '4KYU': 4,  '3KYU': 6,
  '2KYU':  6,  '1KYU': 9,
  '1DAN': 12,  '2DAN': 24, '3DAN': 36, '4DAN': 48,
  '5DAN': 60,  '6DAN': 72, '7DAN': 84, '8DAN': 96,
};

// Edad mínima para cada grado (en años)
export const EDAD_MINIMA = {
  '10KYU': 5,  '9KYU': 5,  '8KYU': 5,  '7KYU': 6,
  '6KYU':  6,  '5KYU': 7,  '4KYU': 7,  '3KYU': 8,
  '2KYU':  9,  '1KYU': 10,
  '1DAN': 14,  '2DAN': 16, '3DAN': 18, '4DAN': 22,
  '5DAN': 28,  '6DAN': 35, '7DAN': 45, '8DAN': 55,
};

// Licencias mínimas requeridas para cada grado
export const LICENCIAS_MINIMAS = {
  '10KYU': 0, '9KYU': 1,  '8KYU': 1,  '7KYU': 1,
  '6KYU':  1, '5KYU': 1,  '4KYU': 2,  '3KYU': 2,
  '2KYU':  2, '1KYU': 3,
  '1DAN':  3, '2DAN': 4,  '3DAN': 5,  '4DAN': 5,
  '5DAN':  6, '6DAN': 6,  '7DAN': 7,  '8DAN': 8,
};

// Lista ordenada de grados (de menor a mayor)
export const LISTA_GRADOS = [
  '10KYU','9KYU','8KYU','7KYU','6KYU','5KYU','4KYU','3KYU','2KYU','1KYU',
  '1DAN','2DAN','3DAN','4DAN','5DAN','6DAN','7DAN','8DAN'
];

// ============================================================
// CÁLCULOS DE REQUISITOS
// ============================================================

// Calcula la edad exacta en años en una fecha determinada
export function calcularEdad(fechaNacimiento, fechaExamen) {
  const nacimiento = new Date(fechaNacimiento);
  const examen     = new Date(fechaExamen);
  let edad = examen.getFullYear() - nacimiento.getFullYear();
  const mes = examen.getMonth() - nacimiento.getMonth();
  if (mes < 0 || (mes === 0 && examen.getDate() < nacimiento.getDate())) {
    edad--;
  }
  return edad;
}

// Calcula los meses transcurridos entre dos fechas
export function calcularMeses(fechaInicio, fechaFin) {
  const inicio = new Date(fechaInicio);
  const fin    = new Date(fechaFin);
  return (fin.getFullYear() - inicio.getFullYear()) * 12
       + (fin.getMonth() - inicio.getMonth());
}

// Valida todos los requisitos para que un aspirante pueda inscribirse
// Devuelve un objeto { cumple: boolean, detalles: [...] }
export function validarRequisitos(aspirante, targetGrade, examDate, licencias) {
  const detalles = [];
  let cumple = true;

  // 1. Verificar edad mínima
  const edadMinima = EDAD_MINIMA[targetGrade] ?? 0;
  const edadActual = calcularEdad(aspirante.birth_date, examDate);
  const cumpleEdad = edadActual >= edadMinima;
  if (!cumpleEdad) cumple = false;
  detalles.push({
    ok: cumpleEdad,
    texto: `Edad mínima: ${edadMinima} años (tiene ${edadActual} años)`
  });

  // 2. Verificar tiempo mínimo desde el último grado
  const mesesMinimos = TIEMPO_MINIMO[targetGrade] ?? 0;
  const mesesTranscurridos = calcularMeses(aspirante.grade_date, examDate);
  const cumpleTiempo = mesesTranscurridos >= mesesMinimos;
  if (!cumpleTiempo) cumple = false;
  detalles.push({
    ok: cumpleTiempo,
    texto: `Tiempo mínimo: ${mesesMinimos} meses (lleva ${mesesTranscurridos} meses con el grado actual)`
  });

  // 3. Verificar número de licencias
  const licenciasMinimas = LICENCIAS_MINIMAS[targetGrade] ?? 0;
  const licenciasCount   = licencias ? licencias.length : 0;
  const cumpleLicencias  = licenciasCount >= licenciasMinimas;
  if (!cumpleLicencias) cumple = false;
  detalles.push({
    ok: cumpleLicencias,
    texto: `Licencias federativas: mínimo ${licenciasMinimas} (tiene ${licenciasCount})`
  });

  // 4. Para grados a partir de 5ºDAN: trabajo escrito requerido
  const gradoIndex = LISTA_GRADOS.indexOf(targetGrade);
  if (gradoIndex >= LISTA_GRADOS.indexOf('5DAN')) {
    detalles.push({
      ok: null,
      texto: 'Trabajo escrito requerido (verificar por separado, 2 meses de antelación)'
    });
  }

  return { cumple, detalles };
}

// ============================================================
// CÁLCULO DE CUOTAS Y DESCUENTOS
// ============================================================

// Calcula el descuento porcentual según los méritos del aspirante
export function calcularDescuento(aspirante, esRepetidor = false) {
  if (aspirante.is_champion_world || aspirante.is_champion_europe) return 100;
  if (aspirante.is_champion_spain || aspirante.is_champion_madrid) return 50;
  if (esRepetidor) return 50;
  return 0;
}

// Calcula el importe final de la inscripción
export function calcularImporte(targetGrade, descuentoPercent) {
  const cuotaBase = CUOTAS[targetGrade] ?? 50;
  const descuento = cuotaBase * (descuentoPercent / 100);
  return {
    base:     cuotaBase,
    descuento: descuento,
    final:    cuotaBase - descuento
  };
}

// ============================================================
// FORMATEO DE FECHAS Y TEXTOS
// ============================================================

// Formatea una fecha al estilo español: "17 de mayo de 2026"
export function formatearFecha(fecha) {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
}

// Formatea una fecha en formato corto: "17/05/2026"
export function formatearFechaCorta(fecha) {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleDateString('es-ES');
}

// Convierte el código de grado a texto legible
export function textoGrado(grado) {
  if (!grado) return '—';
  if (grado.includes('KYU')) return `${grado.replace('KYU', 'º Kyu')}`;
  if (grado.includes('DAN')) return `${grado.replace('DAN', 'º Dan')}`;
  return grado;
}

// Devuelve el HTML de un badge de estado con el color correcto
export function badgeEstado(estado) {
  const map = {
    'apto':               { clase: 'badge-green',  texto: 'Apto' },
    'no_apto':            { clase: 'badge-red',    texto: 'No Apto' },
    'pendiente':          { clase: 'badge-yellow', texto: 'Pendiente' },
    'confirmada':         { clase: 'badge-green',  texto: 'Confirmada' },
    'confirmado':         { clase: 'badge-green',  texto: 'Confirmado' },
    'aplazada':           { clase: 'badge-blue',   texto: 'Aplazada' },
    'cancelada':          { clase: 'badge-red',    texto: 'Cancelada' },
    'abierto':            { clase: 'badge-green',  texto: 'Abierto' },
    'en_curso':           { clase: 'badge-blue',   texto: 'En Curso' },
    'cerrado':            { clase: 'badge-gray',   texto: 'Cerrado' },
    'cancelado':          { clase: 'badge-red',    texto: 'Cancelado' },
    'exento':             { clase: 'badge-blue',   texto: 'Exento' },
    'pendiente_especifico': { clase: 'badge-yellow', texto: 'Bloque Específico Pendiente' },
  };
  const info = map[estado] ?? { clase: 'badge-gray', texto: estado ?? '—' };
  return `<span class="badge ${info.clase}">${info.texto}</span>`;
}

// Obtiene las iniciales de un nombre para el avatar
export function obtenerIniciales(nombre) {
  if (!nombre) return '?';
  return nombre.split(' ')
    .slice(0, 2)
    .map(p => p[0])
    .join('')
    .toUpperCase();
}

// Convierte el rol interno a texto legible
export function textoRol(rol) {
  const map = {
    'admin':         'Administrador',
    'juez':          'Juez de Tribunal',
    'representante': 'Representante de Club',
    'aspirante':     'Aspirante',
  };
  return map[rol] ?? rol;
}

// ============================================================
// UTILIDADES DE INTERFAZ
// ============================================================

// Muestra un mensaje de error en un elemento del DOM
export function mostrarError(elementId, mensaje) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.className = 'alert alert-error';
  el.textContent = mensaje;
  el.style.display = 'flex';
}

// Muestra un mensaje de éxito en un elemento del DOM
export function mostrarExito(elementId, mensaje) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.className = 'alert alert-success';
  el.textContent = mensaje;
  el.style.display = 'flex';
  setTimeout(() => { el.style.display = 'none'; }, 4000);
}

// Oculta un mensaje
export function ocultarMensaje(elementId) {
  const el = document.getElementById(elementId);
  if (el) el.style.display = 'none';
}

// Genera el HTML de la fila de "cargando" para una tabla
export function filasCargando(columnas = 5) {
  return `<tr><td colspan="${columnas}" class="loading-spinner">
    <div class="spinner"></div><span>Cargando datos...</span>
  </td></tr>`;
}

// Genera el HTML de "sin resultados" para una tabla
export function filasVacias(columnas = 5, mensaje = 'No hay datos para mostrar.') {
  return `<tr><td colspan="${columnas}">
    <div class="empty-state">
      <div class="empty-icon">📋</div>
      <p>${mensaje}</p>
    </div>
  </td></tr>`;
}

// Cierra un modal
export function cerrarModal(modalId) {
  const el = document.getElementById(modalId);
  if (el) el.classList.add('hidden');
}

// Abre un modal
export function abrirModal(modalId) {
  const el = document.getElementById(modalId);
  if (el) el.classList.remove('hidden');
}
