# Sistema de Gestión de Exámenes FMK
## Federación Madrileña de Karate

---

## Pasos para poner en marcha el sistema

### 1. Crear la base de datos en Supabase

1. Entra a tu proyecto en [supabase.com](https://supabase.com)
2. Ve a **SQL Editor** (en el menú izquierdo)
3. Copia y pega el contenido de `database/01_schema.sql` y haz clic en **Run**
4. Luego copia y pega `database/02_funciones.sql` y haz clic en **Run**

### 2. Configurar las credenciales

1. En Supabase, ve a **Settings → API**
2. Copia el valor de **Project URL** (algo como `https://xxxx.supabase.co`)
3. Copia el valor de **anon public** (la clave pública)
4. Abre el archivo `js/supabase-client.js` y reemplaza:
   - `TU_SUPABASE_URL_AQUI` → pega tu Project URL
   - `TU_SUPABASE_ANON_KEY_AQUI` → pega tu anon key

### 3. Crear el primer usuario administrador

1. En Supabase, ve a **Authentication → Users → Add User**
2. Introduce el email y contraseña del administrador
3. En la sección **User Metadata**, escribe exactamente:
   ```json
   {
     "full_name": "Administrador FMK",
     "role": "admin"
   }
   ```
4. El sistema creará automáticamente el perfil de administrador.

### 4. Subir a Netlify

1. Asegúrate de haber completado el paso 2 (credenciales configuradas)
2. Ve a [netlify.com](https://netlify.com) → tu equipo → **Add new site**
3. Elige **Deploy manually**
4. Arrastra toda la carpeta `ProyectoFMK` al área de Netlify
5. ¡Listo! Tu sitio estará disponible en la URL que Netlify te asigne.

---

## Estructura del proyecto

```
ProyectoFMK/
├── index.html              → Página de inicio de sesión
├── dashboard.html          → Panel principal de la aplicación
├── netlify.toml            → Configuración de Netlify
├── css/
│   └── styles.css          → Todos los estilos del sistema
├── js/
│   ├── supabase-client.js  → Conexión a Supabase (poner credenciales aquí)
│   ├── auth.js             → Login, logout, sesión
│   ├── router.js           → Navegación entre secciones
│   └── utils.js            → Funciones de cálculo y formato
├── pages/
│   ├── inicio.html         → Panel de inicio con estadísticas
│   ├── usuarios.html       → Gestión de usuarios (admin)
│   ├── aspirantes.html     → Registro y listado de aspirantes
│   ├── inscripciones.html  → Inscripciones y pagos
│   ├── examenes.html       → Convocatorias de examen
│   ├── tribunales.html     → Asignación de jueces
│   ├── calificaciones.html → Registro de notas
│   ├── reportes.html       → Actas PDF y estadísticas
│   └── mi-cuenta.html      → Perfil y cambio de contraseña
└── database/
    ├── 01_schema.sql       → Tablas, RLS y datos iniciales
    └── 02_funciones.sql    → Funciones y vistas adicionales
```

---

## Roles de usuario

| Rol | Acceso |
|-----|--------|
| **admin** | Acceso total al sistema |
| **juez** | Exámenes asignados y calificaciones |
| **representante** | Aspirantes y exámenes de su club |
| **aspirante** | Sus propios datos y resultados |
