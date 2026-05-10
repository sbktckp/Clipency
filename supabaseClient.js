/* Public Supabase config for Clipency */
const SUPABASE_URL = "https://spwtkdgpgeutrhwcjrpy.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_IInNrDBLK3dINHSyWaUDzg_UWF63j0B";

window.CLIPENCY_SUPABASE_URL = SUPABASE_URL;
window.CLIPENCY_SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;

window.clipencySupabase = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

window.supabaseClient = window.clipencySupabase;
window.sbClient = window.clipencySupabase;
