import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL      = 'https://tcyfuhgijsidesoschim.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_tpsochBWZufQkplm5HdhUw_JEboOrF3'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
})
