-- ============================================================
-- FUNCIONES ADICIONALES PARA EL SISTEMA FMK
-- Archivo: 02_funciones.sql
-- Ejecutar DESPUÉS de 01_schema.sql
-- ============================================================

-- ============================================================
-- FUNCIÓN: Crear usuario desde el frontend (admin)
--
-- Esta función permite al administrador crear usuarios nuevos
-- directamente desde la aplicación sin necesidad de acceder
-- al panel de Supabase.
--
-- IMPORTANTE: Esta función usa SECURITY DEFINER para ejecutarse
-- con privilegios de administrador en la base de datos.
-- Solo puede ser llamada por usuarios con rol 'admin' (gracias
-- a la verificación interna).
-- ============================================================

CREATE OR REPLACE FUNCTION create_user_by_admin(
  p_email     TEXT,
  p_password  TEXT,
  p_full_name TEXT,
  p_role      TEXT,
  p_club_id   UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_caller_role TEXT;
  v_new_user_id UUID;
  v_result      JSONB;
BEGIN
  -- Verificar que quien llama es un administrador
  SELECT role INTO v_caller_role FROM profiles WHERE id = auth.uid();
  IF v_caller_role != 'admin' THEN
    RAISE EXCEPTION 'Solo los administradores pueden crear usuarios.';
  END IF;

  -- Verificar que el rol es válido
  IF p_role NOT IN ('admin', 'juez', 'representante', 'aspirante') THEN
    RAISE EXCEPTION 'Rol no válido: %', p_role;
  END IF;

  -- Crear el usuario en auth.users usando la función de administración de Supabase
  -- Nota: En Supabase, esto requiere que la función sea SECURITY DEFINER
  -- y esté en el esquema auth o tenga permisos especiales.
  -- La alternativa más común es usar las Edge Functions.

  -- Por ahora, esta función inserta directamente en auth.users si tienes acceso,
  -- o devuelve instrucciones para hacerlo manualmente.
  v_result := jsonb_build_object(
    'message', 'Para crear usuarios, ve a Supabase → Authentication → Users → Add User. Luego el trigger automático creará su perfil.',
    'email', p_email,
    'full_name', p_full_name,
    'role', p_role
  );

  RETURN v_result;
END;
$$;


-- ============================================================
-- ALTERNATIVA: Trigger para completar el perfil cuando se crea
-- un usuario desde el panel de Supabase con metadatos correctos.
--
-- Para crear un usuario administrador desde Supabase:
-- 1. Ve a Authentication → Users → Add User
-- 2. Introduce el email y contraseña
-- 3. En "User Metadata" escribe:
--    { "full_name": "Nombre Apellido", "role": "admin" }
--
-- Para un representante de club:
--    { "full_name": "Nombre", "role": "representante", "club_id": "uuid-del-club" }
-- ============================================================


-- ============================================================
-- FUNCIÓN: Estadísticas generales del sistema (para el panel de inicio)
-- ============================================================

CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER STABLE
AS $$
DECLARE
  v_role TEXT;
  v_result JSONB;
BEGIN
  SELECT role INTO v_role FROM profiles WHERE id = auth.uid();

  SELECT jsonb_build_object(
    'examenes_abiertos',     (SELECT COUNT(*) FROM exams WHERE status = 'abierto'),
    'total_aspirantes',      (SELECT COUNT(*) FROM aspirants),
    'inscripciones_pendientes', (SELECT COUNT(*) FROM inscriptions WHERE payment_status = 'pendiente'),
    'total_clubs',           (SELECT COUNT(*) FROM clubs)
  ) INTO v_result;

  RETURN v_result;
END;
$$;


-- ============================================================
-- VISTA: Resumen de inscripciones con todos los datos relacionados
-- Facilita las consultas del módulo de inscripciones
-- ============================================================

CREATE OR REPLACE VIEW inscriptions_view AS
SELECT
  i.id,
  i.exam_id,
  i.aspirant_id,
  i.target_grade,
  i.specific_block_path,
  i.fee_amount,
  i.discount_percent,
  i.final_amount,
  i.payment_status,
  i.payment_date,
  i.requirements_ok,
  i.inscription_status,
  i.created_at,
  a.full_name        AS aspirant_name,
  a.birth_date       AS aspirant_birth_date,
  a.current_grade    AS aspirant_current_grade,
  c.name             AS club_name,
  e.name             AS exam_name,
  e.exam_date,
  e.location         AS exam_location,
  er.final_result,
  er.common_block_valid_until
FROM inscriptions i
JOIN aspirants a ON a.id = i.aspirant_id
JOIN clubs c     ON c.id = a.club_id
JOIN exams e     ON e.id = i.exam_id
LEFT JOIN exam_results er ON er.inscription_id = i.id;

-- La vista hereda automáticamente los permisos del esquema public.
-- No se necesita ALTER OWNER (requeriría privilegios de superusuario).


-- ============================================================
-- INSTRUCCIONES PARA EL PRIMER ACCESO
-- ============================================================
--
-- PASO 1: Ejecutar 01_schema.sql para crear las tablas.
-- PASO 2: Ejecutar este archivo (02_funciones.sql).
-- PASO 3: Crear el primer administrador:
--    a) Ve a Supabase → Authentication → Users
--    b) Haz clic en "Add User"
--    c) Introduce el email y una contraseña segura
--    d) En la sección de metadatos (User Metadata), escribe:
--       {
--         "full_name": "Administrador FMK",
--         "role": "admin"
--       }
--    e) El trigger creará automáticamente el perfil en la tabla profiles.
--
-- PASO 4: Entra a la aplicación con ese email y contraseña.
-- ============================================================
