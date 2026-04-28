const SUPABASE_URL = "https://spwtkdgpgeutrhwcjrpy.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_IInNrDBLK3dINHSyWaUDzg_UWF63j0B";

window.supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

var _supabase = window.supabaseClient;
