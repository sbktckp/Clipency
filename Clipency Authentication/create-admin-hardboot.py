from pathlib import Path
import re

files = list(Path(".").rglob("*.js")) + list(Path(".").rglob("*.html"))
text = "\n".join(
    p.read_text(encoding="utf-8", errors="ignore")
    for p in files
)

url_match = re.search(r'https://[a-zA-Z0-9.-]+\.supabase\.co', text)
key_match = re.search(r'eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+', text)

if not url_match:
    raise SystemExit("Supabase URL not found.")
if not key_match:
    raise SystemExit("Supabase anon key not found.")

url = url_match.group(0)
key = key_match.group(0)

Path("clipency-admin-supabase-hardboot.js").write_text(f"""
(function () {{
  if (window.__clipencyAdminSupabaseHardbootLoaded) return;
  window.__clipencyAdminSupabaseHardbootLoaded = true;

  var SUPABASE_URL = "{url}";
  var SUPABASE_ANON_KEY = "{key}";

  function createClientNow() {{
    if (!window.supabase || !window.supabase.createClient) return false;

    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {{
      auth: {{
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }}
    }});

    window.dispatchEvent(new CustomEvent("clipency:supabase-ready"));
    console.log("Clipency Admin Supabase client ready");
    return true;
  }}

  if (createClientNow()) return;

  var script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
  script.async = false;

  script.onload = function () {{
    if (!createClientNow()) {{
      window.__clipencySupabaseBootError = new Error("Supabase library loaded but client could not be created.");
    }}
  }};

  script.onerror = function () {{
    window.__clipencySupabaseBootError = new Error("Supabase CDN failed to load.");
  }};

  document.head.appendChild(script);
}})();
""", encoding="utf-8")

print("Created clipency-admin-supabase-hardboot.js")
print("Supabase URL found:", url)
