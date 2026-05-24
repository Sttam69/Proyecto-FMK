-- ============================================================
-- SISTEMA DE GESTIÓN DE EXÁMENES - FEDERACIÓN MADRILEÑA DE KARATE (FMK)
-- Archivo: 01_schema.sql
-- Ejecutar en: Supabase → SQL Editor
-- Instrucciones: Copia y pega TODO este archivo en el editor SQL
--                de tu proyecto Supabase y haz clic en "Run".
-- ============================================================


-- ============================================================
-- PASO 1: CREAR LAS TABLAS
-- (El orden importa porque unas tablas dependen de otras)
-- ============================================================

-- 1. CLUBES DE KARATE
-- Debe crearse antes que profiles y aspirants porque ambas la referencian
CREATE TABLE IF NOT EXISTS clubs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  city        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PERFILES DE USUARIO
-- Vinculado a auth.users (tabla interna de Supabase).
-- Cuando el admin crea un usuario en Supabase Auth, se debe insertar
-- una fila aquí con el mismo id.
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('admin', 'juez', 'representante', 'aspirante')),
  club_id     UUID REFERENCES clubs(id),
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ASPIRANTES (competidores que se presentan a los exámenes)
CREATE TABLE IF NOT EXISTS aspirants (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id           UUID REFERENCES profiles(id),           -- si tiene cuenta en el sistema
  club_id              UUID NOT NULL REFERENCES clubs(id),
  full_name            TEXT NOT NULL,
  birth_date           DATE NOT NULL,
  dni                  TEXT,
  email                TEXT,
  phone                TEXT,
  karate_style         TEXT,                                    -- ej: 'Shotokan', 'Goju-ryu'
  current_grade        TEXT NOT NULL,                          -- ej: '6KYU', '1DAN', '3DAN'
  grade_date           DATE NOT NULL,                          -- fecha en que obtuvo el grado actual
  is_champion_madrid   BOOLEAN DEFAULT FALSE,
  is_champion_spain    BOOLEAN DEFAULT FALSE,
  is_champion_europe   BOOLEAN DEFAULT FALSE,
  is_champion_world    BOOLEAN DEFAULT FALSE,
  notes                TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- 4. LICENCIAS FEDERATIVAS ANUALES
-- Cada temporada que el aspirante estuvo federado
CREATE TABLE IF NOT EXISTS licenses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aspirant_id  UUID NOT NULL REFERENCES aspirants(id) ON DELETE CASCADE,
  season       TEXT NOT NULL,       -- ej: '2024-2025'
  issued_date  DATE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 5. DOCUMENTOS DEL ASPIRANTE (almacenados en Supabase Storage)
CREATE TABLE IF NOT EXISTS aspirant_documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aspirant_id   UUID NOT NULL REFERENCES aspirants(id) ON DELETE CASCADE,
  doc_type      TEXT NOT NULL CHECK (doc_type IN ('dni', 'carnet_grados', 'foto', 'otro')),
  storage_path  TEXT NOT NULL,      -- ruta dentro del bucket de Supabase Storage
  file_name     TEXT,
  uploaded_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CONVOCATORIAS DE EXAMEN
CREATE TABLE IF NOT EXISTS exams (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 TEXT NOT NULL,       -- ej: 'Examen de Grados Junio 2026'
  exam_date            DATE NOT NULL,
  location             TEXT,
  grades_offered       TEXT[],              -- array de grados que se evalúan, ej: ['1KYU','1DAN']
  status               TEXT DEFAULT 'abierto'
                         CHECK (status IN ('abierto', 'en_curso', 'cerrado', 'cancelado')),
  inscription_deadline DATE,               -- plazo de inscripción (35 días antes del examen)
  created_by           UUID REFERENCES profiles(id),
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- 7. INSCRIPCIONES A EXÁMENES
CREATE TABLE IF NOT EXISTS inscriptions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id             UUID NOT NULL REFERENCES exams(id),
  aspirant_id         UUID NOT NULL REFERENCES aspirants(id),
  target_grade        TEXT NOT NULL,       -- grado al que aspira
  specific_block_path TEXT
                        CHECK (specific_block_path IN ('kumite', 'campeonatos', 'tecnica')),
  fee_amount          NUMERIC(8,2) NOT NULL,   -- cuota base según el grado
  discount_percent    INTEGER DEFAULT 0,        -- porcentaje de descuento aplicado
  final_amount        NUMERIC(8,2) NOT NULL,   -- cuota final después del descuento
  payment_status      TEXT DEFAULT 'pendiente'
                        CHECK (payment_status IN ('pendiente', 'confirmado', 'exento')),
  payment_date        DATE,
  requirements_ok     BOOLEAN DEFAULT FALSE,   -- el sistema verificó que cumple requisitos
  inscription_status  TEXT DEFAULT 'pendiente'
                        CHECK (inscription_status IN ('pendiente','confirmada','aplazada','cancelada')),
  registered_by       UUID REFERENCES profiles(id),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exam_id, aspirant_id)             -- un aspirante solo puede inscribirse una vez por examen
);

-- 8. SOLICITUDES DE APLAZAMIENTO
CREATE TABLE IF NOT EXISTS postponements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inscription_id  UUID NOT NULL REFERENCES inscriptions(id),
  reason          TEXT NOT NULL,
  request_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  status          TEXT DEFAULT 'pendiente'
                    CHECK (status IN ('pendiente', 'aprobado', 'rechazado')),
  resolved_by     UUID REFERENCES profiles(id),
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TRIBUNALES (grupo de jueces por examen)
CREATE TABLE IF NOT EXISTS tribunals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id     UUID NOT NULL REFERENCES exams(id),
  name        TEXT NOT NULL,       -- ej: 'Tribunal A', 'Tribunal Principal'
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 10. JUECES ASIGNADOS A UN TRIBUNAL
CREATE TABLE IF NOT EXISTS tribunal_judges (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tribunal_id          UUID NOT NULL REFERENCES tribunals(id),
  judge_profile_id     UUID NOT NULL REFERENCES profiles(id),
  diploma_valid_until  DATE,
  is_president         BOOLEAN DEFAULT FALSE,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tribunal_id, judge_profile_id)
);

-- 11. ASPIRANTES ASIGNADOS A UN TRIBUNAL
CREATE TABLE IF NOT EXISTS tribunal_aspirants (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tribunal_id    UUID NOT NULL REFERENCES tribunals(id),
  inscription_id UUID NOT NULL REFERENCES inscriptions(id),
  UNIQUE(tribunal_id, inscription_id)
);

-- 12. CALIFICACIONES REGISTRADAS POR CADA JUEZ
CREATE TABLE IF NOT EXISTS grades (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inscription_id         UUID NOT NULL REFERENCES inscriptions(id),
  judge_profile_id       UUID NOT NULL REFERENCES profiles(id),
  common_block_result    TEXT CHECK (common_block_result IN ('apto', 'no_apto')),
  specific_block_result  TEXT CHECK (specific_block_result IN ('apto', 'no_apto')),
  notes                  TEXT,
  graded_at              TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(inscription_id, judge_profile_id)  -- un juez solo califica una vez a cada aspirante
);

-- 13. RESULTADO FINAL DEL EXAMEN (calculado por el sistema)
CREATE TABLE IF NOT EXISTS exam_results (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inscription_id          UUID NOT NULL UNIQUE REFERENCES inscriptions(id),
  final_result            TEXT NOT NULL
                            CHECK (final_result IN ('apto', 'no_apto', 'pendiente_especifico')),
  common_block_valid_until DATE,   -- si suspende el bloque específico, el común es válido 1 año
  notes                   TEXT,
  calculated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- 14. REGISTRO DE AUDITORÍA (historial de acciones del sistema)
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id),
  action      TEXT NOT NULL,       -- ej: 'login', 'crear_inscripcion', 'registrar_calificacion'
  table_name  TEXT,
  record_id   UUID,
  details     JSONB,               -- datos adicionales en formato JSON
  ip_address  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- PASO 2: ACTIVAR LA SEGURIDAD POR FILAS (ROW LEVEL SECURITY)
-- Esto asegura que cada usuario solo vea los datos que le corresponden
-- ============================================================

ALTER TABLE profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs                ENABLE ROW LEVEL SECURITY;
ALTER TABLE aspirants            ENABLE ROW LEVEL SECURITY;
ALTER TABLE licenses             ENABLE ROW LEVEL SECURITY;
ALTER TABLE aspirant_documents   ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams                ENABLE ROW LEVEL SECURITY;
ALTER TABLE inscriptions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE postponements        ENABLE ROW LEVEL SECURITY;
ALTER TABLE tribunals            ENABLE ROW LEVEL SECURITY;
ALTER TABLE tribunal_judges      ENABLE ROW LEVEL SECURITY;
ALTER TABLE tribunal_aspirants   ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades               ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_results         ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs           ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- PASO 3: FUNCIONES AUXILIARES
-- Estas funciones ayudan a las políticas de seguridad a saber
-- qué rol y club tiene el usuario que está conectado.
-- ============================================================

-- Obtiene el rol del usuario actualmente conectado
CREATE OR REPLACE FUNCTION get_current_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Obtiene el club_id del usuario actualmente conectado
CREATE OR REPLACE FUNCTION get_current_club()
RETURNS UUID AS $$
  SELECT club_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- ============================================================
-- PASO 4: POLÍTICAS DE SEGURIDAD (quién puede ver y modificar qué)
-- ============================================================

-- --- TABLA: profiles ---
-- El administrador puede ver y gestionar todos los perfiles
CREATE POLICY "admin_all_profiles" ON profiles
  FOR ALL USING (get_current_role() = 'admin');

-- Cada usuario puede ver su propio perfil
CREATE POLICY "own_profile_select" ON profiles
  FOR SELECT USING (id = auth.uid());

-- Cada usuario puede actualizar su propio perfil (ej: cambiar nombre)
CREATE POLICY "own_profile_update" ON profiles
  FOR UPDATE USING (id = auth.uid());


-- --- TABLA: clubs ---
-- Todos los usuarios autenticados pueden ver los clubes (para formularios de selección)
CREATE POLICY "all_view_clubs" ON clubs
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Solo el administrador puede crear, editar o eliminar clubes
CREATE POLICY "admin_manage_clubs" ON clubs
  FOR ALL USING (get_current_role() = 'admin');


-- --- TABLA: aspirants ---
-- Administrador: acceso total
CREATE POLICY "admin_all_aspirants" ON aspirants
  FOR ALL USING (get_current_role() = 'admin');

-- Representante de club: solo los aspirantes de su club
CREATE POLICY "rep_club_aspirants" ON aspirants
  FOR ALL USING (
    get_current_role() = 'representante'
    AND club_id = get_current_club()
  );

-- Aspirante: solo puede ver su propio registro
CREATE POLICY "aspirant_own_record" ON aspirants
  FOR SELECT USING (profile_id = auth.uid());


-- --- TABLA: licenses ---
CREATE POLICY "admin_all_licenses" ON licenses
  FOR ALL USING (get_current_role() = 'admin');

CREATE POLICY "rep_club_licenses" ON licenses
  FOR ALL USING (
    get_current_role() = 'representante'
    AND aspirant_id IN (
      SELECT id FROM aspirants WHERE club_id = get_current_club()
    )
  );

CREATE POLICY "aspirant_own_licenses" ON licenses
  FOR SELECT USING (
    aspirant_id IN (SELECT id FROM aspirants WHERE profile_id = auth.uid())
  );


-- --- TABLA: aspirant_documents ---
CREATE POLICY "admin_all_documents" ON aspirant_documents
  FOR ALL USING (get_current_role() = 'admin');

CREATE POLICY "rep_club_documents" ON aspirant_documents
  FOR ALL USING (
    get_current_role() = 'representante'
    AND aspirant_id IN (
      SELECT id FROM aspirants WHERE club_id = get_current_club()
    )
  );

CREATE POLICY "aspirant_own_documents" ON aspirant_documents
  FOR SELECT USING (
    aspirant_id IN (SELECT id FROM aspirants WHERE profile_id = auth.uid())
  );


-- --- TABLA: exams ---
-- Todos los usuarios autenticados pueden ver los exámenes
CREATE POLICY "all_view_exams" ON exams
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Solo el administrador puede crear, editar o eliminar exámenes
CREATE POLICY "admin_manage_exams" ON exams
  FOR ALL USING (get_current_role() = 'admin');


-- --- TABLA: inscriptions ---
CREATE POLICY "admin_all_inscriptions" ON inscriptions
  FOR ALL USING (get_current_role() = 'admin');

CREATE POLICY "rep_club_inscriptions" ON inscriptions
  FOR ALL USING (
    get_current_role() = 'representante'
    AND aspirant_id IN (
      SELECT id FROM aspirants WHERE club_id = get_current_club()
    )
  );

CREATE POLICY "aspirant_own_inscriptions" ON inscriptions
  FOR SELECT USING (
    aspirant_id IN (SELECT id FROM aspirants WHERE profile_id = auth.uid())
  );

-- El aspirante puede crear su propia inscripción
CREATE POLICY "aspirant_create_inscription" ON inscriptions
  FOR INSERT WITH CHECK (
    get_current_role() = 'aspirante'
    AND aspirant_id IN (SELECT id FROM aspirants WHERE profile_id = auth.uid())
  );


-- --- TABLA: postponements ---
CREATE POLICY "admin_all_postponements" ON postponements
  FOR ALL USING (get_current_role() = 'admin');

CREATE POLICY "aspirant_own_postponements" ON postponements
  FOR ALL USING (
    inscription_id IN (
      SELECT i.id FROM inscriptions i
      JOIN aspirants a ON a.id = i.aspirant_id
      WHERE a.profile_id = auth.uid()
    )
  );


-- --- TABLA: tribunals ---
CREATE POLICY "all_view_tribunals" ON tribunals
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "admin_manage_tribunals" ON tribunals
  FOR ALL USING (get_current_role() = 'admin');


-- --- TABLA: tribunal_judges ---
CREATE POLICY "admin_all_tribunal_judges" ON tribunal_judges
  FOR ALL USING (get_current_role() = 'admin');

-- El juez puede ver en qué tribunales está asignado
CREATE POLICY "judge_own_assignments" ON tribunal_judges
  FOR SELECT USING (
    get_current_role() = 'juez' AND judge_profile_id = auth.uid()
  );


-- --- TABLA: tribunal_aspirants ---
CREATE POLICY "admin_all_tribunal_aspirants" ON tribunal_aspirants
  FOR ALL USING (get_current_role() = 'admin');

-- El juez puede ver los aspirantes de sus tribunales
CREATE POLICY "judge_view_tribunal_aspirants" ON tribunal_aspirants
  FOR SELECT USING (
    get_current_role() = 'juez'
    AND tribunal_id IN (
      SELECT tribunal_id FROM tribunal_judges WHERE judge_profile_id = auth.uid()
    )
  );


-- --- TABLA: grades ---
CREATE POLICY "admin_all_grades" ON grades
  FOR ALL USING (get_current_role() = 'admin');

-- El juez puede ver y registrar sus propias calificaciones
CREATE POLICY "judge_own_grades" ON grades
  FOR ALL USING (
    get_current_role() = 'juez' AND judge_profile_id = auth.uid()
  );

-- El aspirante puede ver las calificaciones de su propia inscripción
CREATE POLICY "aspirant_view_own_grades" ON grades
  FOR SELECT USING (
    inscription_id IN (
      SELECT i.id FROM inscriptions i
      JOIN aspirants a ON a.id = i.aspirant_id
      WHERE a.profile_id = auth.uid()
    )
  );


-- --- TABLA: exam_results ---
CREATE POLICY "admin_all_results" ON exam_results
  FOR ALL USING (get_current_role() = 'admin');

-- El juez puede ver resultados de sus exámenes
CREATE POLICY "judge_view_results" ON exam_results
  FOR SELECT USING (get_current_role() = 'juez');

-- El aspirante ve solo sus propios resultados
CREATE POLICY "aspirant_own_results" ON exam_results
  FOR SELECT USING (
    inscription_id IN (
      SELECT i.id FROM inscriptions i
      JOIN aspirants a ON a.id = i.aspirant_id
      WHERE a.profile_id = auth.uid()
    )
  );

-- El representante ve resultados de aspirantes de su club
CREATE POLICY "rep_club_results" ON exam_results
  FOR SELECT USING (
    get_current_role() = 'representante'
    AND inscription_id IN (
      SELECT i.id FROM inscriptions i
      JOIN aspirants a ON a.id = i.aspirant_id
      WHERE a.club_id = get_current_club()
    )
  );


-- --- TABLA: audit_logs ---
-- Solo el administrador puede ver el registro de auditoría
CREATE POLICY "admin_all_audit" ON audit_logs
  FOR ALL USING (get_current_role() = 'admin');


-- ============================================================
-- PASO 5: TRIGGER AUTOMÁTICO
-- Cuando el administrador crea un usuario en Supabase Auth,
-- este trigger crea automáticamente el perfil en la tabla profiles
-- usando los metadatos que se pasen al crear el usuario.
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role    TEXT;
  v_club_id UUID;
BEGIN
  -- Validar rol; si no es válido, asignar 'aspirante'
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'aspirante');
  IF v_role NOT IN ('admin', 'juez', 'representante', 'aspirante') THEN
    v_role := 'aspirante';
  END IF;

  -- Convertir club_id solo si viene como UUID no vacío
  IF (NEW.raw_user_meta_data->>'club_id') IS NOT NULL
     AND TRIM(NEW.raw_user_meta_data->>'club_id') != '' THEN
    v_club_id := (NEW.raw_user_meta_data->>'club_id')::UUID;
  END IF;

  INSERT INTO public.profiles (id, full_name, role, club_id)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''), 'Sin nombre'),
    v_role,
    v_club_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Conectar el trigger a la tabla auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ============================================================
-- PASO 6: DATOS INICIALES DE EJEMPLO
-- Algunos clubes de muestra para poder probar el sistema.
-- Puedes borrar o modificar estos datos.
-- ============================================================

INSERT INTO clubs (name, city) VALUES
  ('Club Karate Madrid Centro', 'Madrid'),
  ('Bushido Karate Club', 'Madrid'),
  ('Dojo Shotokan Alcalá', 'Alcalá de Henares'),
  ('Club Deportivo Goju', 'Getafe')
ON CONFLICT DO NOTHING;


-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
-- Próximo paso: Ve a Supabase → Authentication → Users y crea
-- el primer usuario administrador con estos metadatos:
--   {
--     "full_name": "Administrador FMK",
--     "role": "admin"
--   }
-- ============================================================
