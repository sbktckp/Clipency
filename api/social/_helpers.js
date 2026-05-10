const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APP_URL = process.env.APP_URL || "https://clipency.in";

async function supabaseRest(path, options = {}) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      ...(options.headers || {})
    }
  });

  const text = await r.text();

  if (!r.ok) throw new Error(text);

  try { return JSON.parse(text); }
  catch { return text; }
}

async function getStateRow(state, provider) {
  const rows = await supabaseRest(
    `oauth_states?state=eq.${encodeURIComponent(state)}&provider=eq.${provider}&select=*`
  );

  return Array.isArray(rows) ? rows[0] : null;
}

async function deleteState(state) {
  await supabaseRest(`oauth_states?state=eq.${encodeURIComponent(state)}`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" }
  });
}

async function upsertAccount(payload) {
  await supabaseRest("connected_accounts?on_conflict=user_id,platform", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation"
    },
    body: JSON.stringify({
      ...payload,
      status: "verified",
      verified_at: new Date().toISOString(),
      connected_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
  });
}

module.exports = {
  APP_URL,
  getStateRow,
  deleteState,
  upsertAccount
};
