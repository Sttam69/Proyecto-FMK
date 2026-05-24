# Especificación de Requerimientos del Sistema (SRS)

## Sistema Web para la Gestión de Exámenes de Grados de la Federación Madrileña de Karate (FMK)

---

**Versión:** 1.0
**Fecha:** Mayo 2026
**Documento basado en:** Normativa de Grados FMK 2017
**Tipo de documento:** Especificación de Requerimientos del Sistema (SRS)

---

## Tabla de Contenidos

1. [Introducción](#1-introducción)
2. [Objetivos del sistema](#2-objetivos-del-sistema)
3. [Alcance](#3-alcance)
4. [Descripción general](#4-descripción-general)
5. [Requerimientos funcionales](#5-requerimientos-funcionales)
6. [Requerimientos no funcionales](#6-requerimientos-no-funcionales)
7. [Casos de uso](#7-casos-de-uso)
8. [Roles de usuario](#8-roles-de-usuario)
9. [Restricciones del sistema](#9-restricciones-del-sistema)
10. [Diseño general de navegación](#10-diseño-general-de-navegación)
11. [Estructura del menú lateral](#11-estructura-del-menú-lateral)
12. [Consideraciones de seguridad](#12-consideraciones-de-seguridad)
13. [Tecnologías sugeridas](#13-tecnologías-sugeridas)
14. [Conclusiones](#14-conclusiones)

---

## 1. Introducción

### 1.1 Propósito del documento

Este documento describe en detalle todos los requerimientos que debe cumplir el sistema web para la gestión de exámenes de grados de la Federación Madrileña de Karate (FMK). Su finalidad es servir como guía clara para los desarrolladores, administradores y usuarios finales del sistema.

### 1.2 Contexto

Actualmente, la Federación Madrileña de Karate gestiona sus exámenes de grados de manera manual, lo cual implica un alto consumo de tiempo, riesgo de errores en los cálculos de edad y tiempo de permanencia entre grados, además de dificultades en el control de inscripciones, pagos y resultados.

El sistema propuesto busca automatizar todos estos procesos, ofreciendo una herramienta moderna, segura y fácil de usar tanto desde una computadora como desde un teléfono celular.

### 1.3 Definiciones importantes

| Término | Significado |
|---------|-------------|
| FMK | Federación Madrileña de Karate |
| Aspirante | Persona que se presenta a un examen de grado |
| Tribunal | Grupo de jueces que evalúa los exámenes |
| Bloque Común | Primera parte del examen que incluye Kihon, Kata y temario teórico |
| Bloque Específico | Segunda parte del examen (Vía Kumite, Vía Campeonatos o Vía Técnica) |
| DAN | Nivel o rango dentro de los cinturones negros |
| Kyu | Rango inferior antes de obtener el cinturón negro |
| Licencia | Documento que acredita la práctica federada anual |

---

## 2. Objetivos del sistema

### 2.1 Objetivo general

Diseñar y desarrollar una aplicación web que permita gestionar de forma eficiente, segura y automatizada todo el proceso de exámenes de grados de la Federación Madrileña de Karate, desde la inscripción hasta la emisión del resultado final.

### 2.2 Objetivos específicos

- Automatizar la verificación del cumplimiento de requisitos (edad mínima, tiempo entre grados y número de licencias).
- Facilitar la inscripción de los aspirantes a los exámenes mediante formularios digitales.
- Calcular automáticamente los descuentos y exenciones a los que tienen derecho ciertos aspirantes (campeones de Madrid, España, Europa o Mundo).
- Organizar los tribunales asignando jueces de forma rápida y ordenada.
- Permitir que los jueces registren las calificaciones de los aspirantes en tiempo real.
- Generar las actas oficiales y los resultados finales de cada examen.
- Mantener un historial completo y seguro de todos los exámenes realizados.
- Adaptarse a diferentes dispositivos (computadora, tableta y celular).

---

## 3. Alcance

### 3.1 Lo que el sistema sí incluye

- Gestión de usuarios con diferentes roles (Administrador, Juez, Representante de Club, Aspirante).
- Registro y control de inscripciones a los exámenes.
- Validación automática de requisitos administrativos según la normativa de la FMK.
- Cálculo automático de cuotas y descuentos.
- Asignación de jueces a los tribunales.
- Registro de calificaciones por parte de los jueces.
- Generación de resultados y actas oficiales.
- Consulta del historial de exámenes por parte del aspirante.
- Notificaciones por correo electrónico (resultados, recordatorios, fechas de examen).

### 3.2 Lo que el sistema NO incluye

- Procesamiento de pagos en línea (el sistema solo registra los pagos confirmados).
- Transmisión de los exámenes en video.
- Gestión de torneos o campeonatos deportivos.
- Sistema de entrenamiento o aprendizaje virtual del karate.
- Registro público abierto: solo el administrador puede crear cuentas de usuario.

---

## 4. Descripción general

### 4.1 Perspectiva del producto

El sistema será una aplicación web independiente, accesible desde cualquier navegador moderno. Estará alojado en un servidor seguro y permitirá que múltiples personas accedan al mismo tiempo sin que la información se mezcle o se pierda.

### 4.2 Funciones principales

El sistema ofrecerá las siguientes funciones principales:

1. **Acceso controlado:** Solo los usuarios creados por el administrador podrán ingresar al sistema.
2. **Panel de control personalizado:** Cada usuario verá únicamente las opciones que le corresponden según su rol.
3. **Gestión de aspirantes:** Registro completo de cada deportista con su historial de grados.
4. **Validación automática:** El sistema avisa si un aspirante cumple o no con los requisitos para presentarse a un examen.
5. **Gestión de exámenes:** Creación, organización y seguimiento de las fechas de examen.
6. **Tribunales y calificaciones:** Asignación de jueces y registro de los resultados de cada aspirante.
7. **Reportes y actas:** Generación de documentos oficiales en formato PDF.

### 4.3 Usuarios del sistema

El sistema está pensado para ser utilizado por cuatro tipos de personas: el administrador de la FMK, los jueces de tribunal, los representantes de cada club y los aspirantes que se presentan a los exámenes. Cada uno de estos perfiles tendrá acceso a funciones distintas según sus responsabilidades dentro de la federación.

---

## 5. Requerimientos funcionales

A continuación se presentan los requerimientos funcionales que debe cumplir el sistema, organizados por módulos.

### 5.1 Módulo de autenticación y usuarios

| Código | Requerimiento |
|--------|---------------|
| RF-01 | El sistema debe permitir el inicio de sesión únicamente a usuarios previamente creados por el administrador. |
| RF-02 | El sistema NO debe ofrecer ninguna opción de registro público o autorregistro. |
| RF-03 | El sistema debe permitir la recuperación de contraseña mediante un enlace enviado al correo electrónico del usuario. |
| RF-04 | El sistema debe cerrar la sesión automáticamente después de 30 minutos de inactividad. |
| RF-05 | El administrador debe poder crear, editar, desactivar o eliminar cuentas de usuarios. |
| RF-06 | Cada usuario debe iniciar sesión sin permisos de administrador, salvo que su rol así lo indique. |

### 5.2 Módulo de aspirantes

| Código | Requerimiento |
|--------|---------------|
| RF-07 | El sistema debe permitir registrar a cada aspirante con sus datos personales, club al que pertenece, estilo de karate, grado actual y fecha de obtención. |
| RF-08 | El sistema debe guardar el historial de licencias federativas de cada aspirante. |
| RF-09 | El sistema debe almacenar copias digitales del DNI, carnet de grados y fotografías del aspirante. |
| RF-10 | El sistema debe permitir consultar el historial completo de exámenes presentados por cada aspirante. |

### 5.3 Módulo de control de requisitos

| Código | Requerimiento |
|--------|---------------|
| RF-11 | El sistema debe calcular automáticamente la edad del aspirante en la fecha del examen. |
| RF-12 | El sistema debe verificar si el aspirante cumple con el tiempo mínimo de permanencia desde su último grado. |
| RF-13 | El sistema debe verificar el número de licencias federativas (consecutivas o alternas) que posee el aspirante. |
| RF-14 | El sistema debe mostrar un aviso claro indicando si el aspirante cumple o no con los requisitos para presentarse al examen solicitado. |
| RF-15 | El sistema debe validar que el aspirante presente toda la documentación con 35 días de antelación a la fecha del examen. |

### 5.4 Módulo de inscripciones y pagos

| Código | Requerimiento |
|--------|---------------|
| RF-16 | El sistema debe permitir que los aspirantes (o sus representantes de club) realicen la inscripción al examen. |
| RF-17 | El sistema debe calcular la cuota de inscripción según el grado al que aspira el usuario. |
| RF-18 | El sistema debe aplicar automáticamente los descuentos correspondientes: 50% para repetidores, 50% para campeones de Madrid o España, y 100% para campeones de Europa o Mundo. |
| RF-19 | El sistema debe permitir al administrador registrar los pagos recibidos y marcar la inscripción como confirmada. |
| RF-20 | El sistema debe permitir la solicitud de aplazamiento por causa justificada, dentro de los 15 días naturales posteriores al examen. |

### 5.5 Módulo de exámenes

| Código | Requerimiento |
|--------|---------------|
| RF-21 | El administrador debe poder crear nuevas convocatorias de examen con fecha, lugar y grados a evaluar. |
| RF-22 | El sistema debe permitir consultar el listado de aspirantes inscritos a cada examen. |
| RF-23 | El aspirante debe poder elegir la vía del bloque específico: Vía Kumite, Vía Campeonatos o Vía Técnica. |
| RF-24 | El sistema debe generar el listado de katas y demás contenido que debe presentar el aspirante según su grado. |

### 5.6 Módulo de tribunales

| Código | Requerimiento |
|--------|---------------|
| RF-25 | El administrador debe poder asignar jueces a cada tribunal, preferiblemente en número impar. |
| RF-26 | El sistema debe validar que los jueces asignados cuenten con su diploma vigente. |
| RF-27 | El sistema debe permitir auxiliar al tribunal con árbitros de Shiai Kumite cuando sea necesario. |

### 5.7 Módulo de calificaciones

| Código | Requerimiento |
|--------|---------------|
| RF-28 | Cada juez debe poder registrar la calificación de "Apto" o "No Apto" para cada aspirante en el Bloque Común. |
| RF-29 | Cada juez debe poder registrar la calificación del Bloque Específico según la vía elegida por el aspirante. |
| RF-30 | El sistema debe calcular el resultado final según la mayoría simple de los jueces (o el 80% de los jueces para exámenes de 5º DAN en adelante). |
| RF-31 | El sistema debe validar que el aspirante haya aprobado el Bloque Común antes de calificar el Bloque Específico. |
| RF-32 | El sistema debe permitir que el resultado del Bloque Común aprobado sea válido durante un año si se suspende el Bloque Específico. |

### 5.8 Módulo de reportes

| Código | Requerimiento |
|--------|---------------|
| RF-33 | El sistema debe generar el acta oficial del examen en formato PDF. |
| RF-34 | El sistema debe generar reportes estadísticos sobre aprobados, suspendidos y aspirantes por club. |
| RF-35 | El sistema debe enviar notificaciones por correo electrónico a los aspirantes con sus resultados. |

---

## 6. Requerimientos no funcionales

Los requerimientos no funcionales describen cómo debe comportarse el sistema en cuanto a calidad, rendimiento y seguridad.

### 6.1 Usabilidad

- La interfaz debe ser intuitiva y fácil de usar para personas sin conocimientos técnicos.
- El diseño debe adaptarse correctamente a pantallas de computadora, tabletas y teléfonos celulares.
- Los textos, botones y formularios deben tener un tamaño legible en cualquier dispositivo.
- El sistema debe estar disponible en idioma español.

### 6.2 Rendimiento

- El sistema debe responder a cualquier acción del usuario en menos de 3 segundos.
- Debe soportar al menos 200 usuarios conectados al mismo tiempo sin degradar la experiencia.
- Las búsquedas y consultas deben mostrar resultados en menos de 2 segundos.

### 6.3 Disponibilidad

- El sistema debe estar disponible al menos el 99% del tiempo (24 horas al día, 7 días a la semana).
- Se deben programar mantenimientos en horarios de baja demanda y notificar con antelación.

### 6.4 Seguridad

- Todas las contraseñas deben almacenarse cifradas mediante algoritmos seguros (por ejemplo, bcrypt).
- Toda la comunicación entre el navegador y el servidor debe realizarse mediante HTTPS.
- El sistema debe registrar todas las acciones importantes (auditoría) para futuras revisiones.

### 6.5 Concurrencia

- Si varios usuarios usan el sistema al mismo tiempo, el menú y la información mostrada no deben mezclarse ni fallar.
- Cada sesión debe mantenerse aislada de las demás.

### 6.6 Respaldo de información

- Se deben realizar copias de seguridad automáticas de la base de datos cada 24 horas.
- En caso de fallo, el sistema debe poder restaurar los datos sin perder información importante.

### 6.7 Compatibilidad

- El sistema debe funcionar correctamente en los navegadores más usados: Google Chrome, Mozilla Firefox, Safari y Microsoft Edge, en sus versiones actuales.

---

## 7. Casos de uso

A continuación se presentan los casos de uso más importantes del sistema.

### 7.1 Tabla resumen de casos de uso

| Código | Caso de uso | Actor principal |
|--------|-------------|-----------------|
| CU-01 | Iniciar sesión en el sistema | Todos los usuarios |
| CU-02 | Crear cuenta de usuario | Administrador |
| CU-03 | Registrar nuevo aspirante | Representante de Club |
| CU-04 | Inscribir aspirante a un examen | Representante de Club / Aspirante |
| CU-05 | Validar requisitos de inscripción | Sistema (automático) |
| CU-06 | Aplicar descuento por mérito deportivo | Sistema (automático) |
| CU-07 | Confirmar pago de cuota | Administrador |
| CU-08 | Crear convocatoria de examen | Administrador |
| CU-09 | Asignar jueces al tribunal | Administrador |
| CU-10 | Registrar calificación de aspirante | Juez de Tribunal |
| CU-11 | Consultar resultado final del examen | Aspirante |
| CU-12 | Generar acta oficial del examen | Administrador |
| CU-13 | Solicitar aplazamiento de examen | Aspirante |
| CU-14 | Consultar historial de grados | Aspirante / Administrador |

### 7.2 Descripción detallada de casos de uso principales

#### CU-01: Iniciar sesión en el sistema

**Actor:** Cualquier usuario registrado.
**Descripción:** El usuario ingresa al sistema con su correo electrónico y contraseña.

**Pasos:**

1. El usuario abre la página de inicio de sesión.
2. Ingresa su correo electrónico y contraseña.
3. Hace clic en el botón "Iniciar sesión".
4. El sistema verifica las credenciales.
5. Si son correctas, muestra el panel principal según el rol del usuario.
6. Si son incorrectas, muestra un mensaje de error.

#### CU-04: Inscribir aspirante a un examen

**Actor:** Representante de Club o Aspirante.
**Descripción:** El usuario registra la inscripción de un aspirante a un examen específico.

**Pasos:**

1. El usuario ingresa al menú "Inscripciones".
2. Selecciona la opción "Nueva inscripción".
3. Elige el aspirante de la lista (si es Representante) o sus propios datos (si es Aspirante).
4. Selecciona el examen y el grado al que aspira.
5. Elige la vía del bloque específico (Kumite, Campeonatos o Técnica).
6. El sistema verifica automáticamente los requisitos de edad, tiempo y licencias.
7. Si todo cumple, muestra el monto a pagar (con descuentos si aplica).
8. El usuario confirma la inscripción.
9. El sistema guarda la inscripción y queda pendiente de confirmación de pago.

#### CU-10: Registrar calificación de aspirante

**Actor:** Juez de Tribunal.
**Descripción:** El juez registra el resultado de un aspirante en cada parte del examen.

**Pasos:**

1. El juez inicia sesión y entra al menú "Calificaciones".
2. Selecciona el examen en curso.
3. Visualiza la lista de aspirantes asignados a su tribunal.
4. Para cada aspirante, registra "Apto" o "No Apto" en el Bloque Común.
5. Si el aspirante aprobó el Bloque Común, registra el resultado del Bloque Específico.
6. Guarda las calificaciones.
7. El sistema calcula el resultado final según la mayoría de jueces.

#### CU-12: Generar acta oficial del examen

**Actor:** Administrador.
**Descripción:** El administrador genera el documento oficial con los resultados del examen.

**Pasos:**

1. El administrador entra al menú "Exámenes".
2. Selecciona el examen finalizado.
3. Hace clic en "Generar acta oficial".
4. El sistema crea un documento PDF con los resultados de todos los aspirantes.
5. El administrador descarga el acta y la firma digitalmente o de forma manual.
6. El sistema envía una copia del resultado por correo electrónico a cada aspirante.

---

## 8. Roles de usuario

El sistema contará con cuatro roles principales, cada uno con permisos específicos.

### 8.1 Tabla de roles y permisos

| Rol | Descripción | Permisos principales |
|-----|-------------|----------------------|
| **Administrador de la FMK** | Persona encargada de gestionar toda la federación. | Crear usuarios, organizar exámenes, asignar tribunales, generar actas, consultar todos los datos del sistema. |
| **Juez de Tribunal** | Persona certificada por la FMK para evaluar exámenes. | Consultar aspirantes asignados a su tribunal, registrar calificaciones, consultar normativa. |
| **Representante de Club** | Persona designada por cada club de karate. | Registrar aspirantes de su club, inscribirlos a exámenes, consultar el estado de las inscripciones, avalar solicitudes. |
| **Aspirante** | Deportista que se presenta a los exámenes. | Consultar sus propios datos, ver sus resultados, solicitar aplazamientos, descargar sus certificados. |

### 8.2 Comparativa de accesos

| Función | Administrador | Juez | Representante | Aspirante |
|---------|:-------------:|:----:|:-------------:|:---------:|
| Crear usuarios | ✅ | ❌ | ❌ | ❌ |
| Crear exámenes | ✅ | ❌ | ❌ | ❌ |
| Asignar jueces | ✅ | ❌ | ❌ | ❌ |
| Registrar aspirantes | ✅ | ❌ | ✅ | ❌ |
| Inscribir a un examen | ✅ | ❌ | ✅ | ✅ |
| Calificar exámenes | ❌ | ✅ | ❌ | ❌ |
| Generar actas | ✅ | ❌ | ❌ | ❌ |
| Consultar propios resultados | ✅ | ❌ | ✅ | ✅ |
| Consultar todos los resultados | ✅ | ❌ | ❌ | ❌ |

---

## 9. Restricciones del sistema

A continuación se listan las restricciones que el sistema debe respetar de forma obligatoria.

### 9.1 Restricciones normativas

- El sistema debe seguir estrictamente la Normativa de Grados de la FMK aprobada el 4 de julio de 2017.
- Los tiempos mínimos entre grados, edades mínimas y número de licencias deben respetarse según la tabla oficial de la FMK.
- Los exámenes a partir de 5º DAN requieren un trabajo escrito presentado con dos meses de antelación.

### 9.2 Restricciones técnicas

- El sistema debe funcionar como aplicación web, accesible desde cualquier navegador moderno.
- No se permitirá el acceso mediante una aplicación de escritorio o móvil nativa en esta primera versión.
- Toda la información debe almacenarse en una base de datos relacional segura.

### 9.3 Restricciones de acceso

- Solo el administrador puede crear nuevas cuentas de usuario.
- No existirá ninguna opción pública de registro abierto.
- Los aspirantes solo podrán ver su propia información, nunca la de otros.

### 9.4 Restricciones legales

- El sistema debe cumplir con la legislación vigente sobre protección de datos personales (Reglamento General de Protección de Datos - RGPD).
- Las imágenes y datos personales solo podrán ser usados con consentimiento del usuario.

---

## 10. Diseño general de navegación

### 10.1 Estructura de la interfaz

La pantalla principal del sistema estará dividida en tres áreas:

1. **Menú lateral izquierdo:** Contiene todas las opciones organizadas por categorías. Será fijo y siempre visible en pantallas grandes. En celulares, se mostrará como un menú desplegable.
2. **Encabezado superior:** Muestra el nombre del usuario, su rol, notificaciones y un botón para cerrar sesión.
3. **Área de contenido central:** Es donde se muestran los formularios, listas y reportes según la opción seleccionada.

### 10.2 Flujo general de navegación

```
[Pantalla de Inicio de Sesión]
            ↓
   [Validación de credenciales]
            ↓
    [Panel Principal del Usuario]
            ↓
  [Selección de opción del menú]
            ↓
   [Vista de contenido o acción]
```

### 10.3 Comportamiento responsivo

- **En computadora:** El menú lateral estará siempre visible a la izquierda, ocupando aproximadamente el 20% del ancho de la pantalla.
- **En tableta:** El menú será visible pero más estrecho.
- **En celular:** El menú estará oculto y se mostrará al tocar un ícono de tres líneas en la esquina superior izquierda.

---

## 11. Estructura del menú lateral

El menú lateral contendrá todas las opciones del sistema, organizadas por categorías. Las opciones visibles cambiarán según el rol del usuario que haya iniciado sesión.

### 11.1 Menú completo (vista de Administrador)

**🏠 Inicio**
- Panel principal
- Notificaciones

**👥 Gestión de Usuarios**
- Crear nuevo usuario
- Listado de usuarios
- Roles y permisos

**🥋 Aspirantes**
- Registrar aspirante
- Listado de aspirantes
- Historial de grados

**📝 Inscripciones**
- Nueva inscripción
- Inscripciones pendientes
- Pagos y descuentos
- Aplazamientos

**📅 Exámenes**
- Crear convocatoria
- Listado de exámenes
- Calendario de exámenes

**⚖️ Tribunales**
- Asignar jueces
- Listado de jueces
- Diplomas de jueces

**🏆 Calificaciones**
- Registrar calificaciones
- Resultados finales
- Actas oficiales

**📊 Reportes**
- Estadísticas generales
- Aprobados por examen
- Aspirantes por club
- Exportar a PDF/Excel

**⚙️ Configuración**
- Datos de la federación
- Cuotas y descuentos
- Estilos reconocidos
- Plantillas de actas

**👤 Mi cuenta**
- Editar perfil
- Cambiar contraseña
- Cerrar sesión

### 11.2 Vista del menú según el rol

| Categoría del Menú | Administrador | Juez | Representante | Aspirante |
|--------------------|:-------------:|:----:|:-------------:|:---------:|
| Inicio | ✅ | ✅ | ✅ | ✅ |
| Gestión de Usuarios | ✅ | ❌ | ❌ | ❌ |
| Aspirantes | ✅ | ❌ | ✅ | ✅ (solo propio) |
| Inscripciones | ✅ | ❌ | ✅ | ✅ (solo propias) |
| Exámenes | ✅ | ✅ (solo asignados) | ✅ (consulta) | ✅ (consulta) |
| Tribunales | ✅ | ❌ | ❌ | ❌ |
| Calificaciones | ✅ | ✅ | ❌ | ✅ (solo propias) |
| Reportes | ✅ | ❌ | ✅ (parciales) | ❌ |
| Configuración | ✅ | ❌ | ❌ | ❌ |
| Mi cuenta | ✅ | ✅ | ✅ | ✅ |

---

## 12. Consideraciones de seguridad

La seguridad de la información es una prioridad fundamental para el sistema. A continuación se describen las medidas que se deben implementar.

### 12.1 Autenticación

- El acceso al sistema solo se permite mediante usuario y contraseña.
- Las contraseñas deben tener al menos 8 caracteres, incluyendo letras mayúsculas, minúsculas, números y un símbolo.
- Las contraseñas se almacenan cifradas con bcrypt o un algoritmo equivalente.
- Después de 5 intentos fallidos, la cuenta se bloquea temporalmente por 15 minutos.

### 12.2 Autorización

- Cada acción del usuario se verifica para asegurar que tiene los permisos correspondientes.
- Los aspirantes nunca podrán ver datos de otros aspirantes.
- Los jueces solo podrán calificar a los aspirantes asignados a su tribunal.

### 12.3 Comunicación segura

- Toda la información se transmite mediante el protocolo HTTPS.
- Los certificados SSL deben renovarse antes de su fecha de expiración.

### 12.4 Protección contra ataques

- El sistema debe estar protegido contra ataques comunes como inyección SQL, Cross-Site Scripting (XSS) y Cross-Site Request Forgery (CSRF).
- Se debe limitar el número de solicitudes por minuto por usuario para evitar ataques de fuerza bruta.

### 12.5 Auditoría

- El sistema registra todas las acciones importantes: inicios de sesión, creación de usuarios, calificaciones registradas, actas generadas.
- Estos registros se conservan durante al menos 5 años para futuras revisiones.

### 12.6 Respaldo y recuperación

- Se realizan copias de seguridad diarias automáticas de la base de datos.
- Las copias se almacenan en un servidor diferente al principal.
- En caso de fallo del servidor, el sistema puede restaurarse en un plazo máximo de 4 horas.

### 12.7 Protección de datos personales

- El sistema cumple con el Reglamento General de Protección de Datos (RGPD).
- Los usuarios pueden solicitar la consulta, modificación o eliminación de sus datos personales.
- Las imágenes (DNI, fotografías) se almacenan en un repositorio cifrado.

---

## 13. Tecnologías sugeridas

A continuación se presentan las tecnologías recomendadas para el desarrollo del sistema. Estas son sugerencias basadas en estándares actuales de la industria.

### 13.1 Frontend (parte visible del usuario)

| Tecnología | Propósito |
|------------|-----------|
| **React.js** o **Vue.js** | Construcción de la interfaz de usuario interactiva. |
| **Tailwind CSS** o **Bootstrap** | Diseño moderno y responsivo. |
| **TypeScript** | Mejor control de errores durante el desarrollo. |
| **Axios** | Comunicación con el servidor mediante peticiones HTTP. |

### 13.2 Backend (parte del servidor)

| Tecnología | Propósito |
|------------|-----------|
| **Node.js con Express** o **Python con Django/Flask** | Servidor que procesa las peticiones del cliente. |
| **JWT (JSON Web Tokens)** | Gestión segura de sesiones de usuario. |
| **bcrypt** | Cifrado seguro de contraseñas. |

### 13.3 Base de datos

| Tecnología | Propósito |
|------------|-----------|
| **PostgreSQL** o **MySQL** | Almacenamiento estructurado de la información. |
| **Redis** (opcional) | Caché para mejorar el rendimiento en consultas frecuentes. |

### 13.4 Infraestructura

| Tecnología | Propósito |
|------------|-----------|
| **Servidor en la nube** (AWS, Azure, Google Cloud) | Alojamiento del sistema. |
| **Docker** | Empaquetado y despliegue del sistema. |
| **Nginx** | Servidor web para gestionar las conexiones. |
| **Let's Encrypt** | Certificados SSL gratuitos para HTTPS. |

### 13.5 Herramientas adicionales

| Tecnología | Propósito |
|------------|-----------|
| **Git y GitHub** | Control de versiones del código fuente. |
| **Jira** o **Trello** | Gestión del proyecto. |
| **Postman** | Pruebas de las funciones del servidor. |
| **Jest** o **PyTest** | Pruebas automáticas del sistema. |

---

## 14. Conclusiones

El sistema web propuesto para la gestión de exámenes de grados de la Federación Madrileña de Karate representa una mejora significativa frente al proceso manual que se realiza en la actualidad. Su desarrollo permitirá optimizar el tiempo del personal administrativo, reducir los errores humanos en la verificación de requisitos y ofrecer una experiencia moderna y profesional tanto para los aspirantes como para los jueces.

Entre los principales beneficios que aporta este sistema se destacan los siguientes: la automatización del control de requisitos administrativos según la normativa oficial, el cálculo automático de cuotas y descuentos, la organización ordenada de los tribunales, el registro digital de calificaciones por parte de los jueces y la generación inmediata de actas oficiales.

Además, el sistema se ha diseñado siguiendo principios modernos de desarrollo web, asegurando que sea accesible desde cualquier dispositivo, fácil de usar para personas sin conocimientos técnicos y, sobre todo, seguro en cuanto al manejo de la información personal de los usuarios.

La implementación del sistema deberá realizarse por fases, comenzando por los módulos más esenciales (autenticación, aspirantes e inscripciones) y avanzando progresivamente hacia funcionalidades más avanzadas como los reportes estadísticos y las notificaciones automáticas. Esta estrategia permitirá entregar valor temprano a la federación y obtener retroalimentación continua de los usuarios para ir mejorando el sistema.

Finalmente, se recomienda que el desarrollo del sistema cuente con la participación activa de representantes de la FMK, jueces experimentados y miembros del Departamento de Grados, con el fin de asegurar que el producto final responda fielmente a las necesidades reales de la federación y respete los aspectos tradicionales del karate que tanto valor tienen para esta disciplina.

---

**Fin del documento**

*Este documento ha sido elaborado como parte de la planificación del sistema web para la Federación Madrileña de Karate, basado en la Normativa de Grados aprobada en Comisión Delegada el 4 de julio de 2017.*
