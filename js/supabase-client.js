// ============================================================
// CLIENTE DE SUPABASE v2
// Este archivo crea la conexión con tu base de datos.
// IMPORTANTE: Reemplaza los valores de abajo con tus credenciales
// reales de Supabase (las encuentras en: Settings → API)
// ============================================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://tcyfuhgijsidesoschim.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_tpsochBWZufQkplm5HdhUw_JEboOrF3';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});
