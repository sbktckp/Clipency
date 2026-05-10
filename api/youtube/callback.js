const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const APP_URL = process.env.APP_URL || "https://clipency.in";
const YOUTUBE_REDIRECT_URI =
  process.env.YOUTUBE_REDIRECT_URI || `${APP_URL}/api/youtube/callback`;

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

async function getStateRow(state) {
  const rows = await supabaseRest(
    `oauth_states?state=eq.${encodeURIComponent(state)}&provider=eq.youtube&select=*`
  );

  return Array.isArray(rows) ? rows[0] : null;
}

async function deleteState(state) {
  await supabaseRest(`oauth_states?state=eq.${encodeURIComponent(state)}`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" }
  });
}

async function exchangeCode(code) {
  const body = new URLSearchParams({
    code,
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    redirect_uri: YOUTUBE_REDIRECT_URI,
    grant_type: "authorization_code"
  });

  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  const json = await r.json();
  if (!r.ok) throw new Error(JSON.stringify(json));
  return json;
}

async function getChannel(accessToken) {
  const r = await fetch(
    "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );

  const json = await r.json();
  if (!r.ok) throw new Error(JSON.stringify(json));

  const channel = json.items && json.items[0];
  if (!channel?.id) throw new Error("No YouTube channel found");

  return channel;
}

async function upsertAccount(userId, channel) {
  const snippet = channel.snippet || {};
  const customUrl = String(snippet.customUrl || "").trim();
  const handle = customUrl
    ? customUrl.replace(/^@/, "")
    : String(snippet.title || channel.id).trim();

  const avatar =
    snippet.thumbnails?.high?.url ||
    snippet.thumbnails?.medium?.url ||
    snippet.thumbnails?.default?.url ||
    "";

  const profileUrl = customUrl.startsWith("@")
    ? `https://www.youtube.com/${customUrl}`
    : `https://www.youtube.com/channel/${channel.id}`;

  const payload = {
    user_id: userId,
    platform: "youtube",
    platform_user_id: channel.id,
    handle,
    profile_url: profileUrl,
    display_name: snippet.title || handle,
    avatar_url: avatar,
    auth_provider: "youtube_oauth",
    status: "verified",
    verified_at: new Date().toISOString(),
    connected_at: new Date().toISOString(),
    raw_profile: channel,
    updated_at: new Date().toISOString()
  };

  await supabaseRest("connected_accounts?on_conflict=user_id,platform", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation"
    },
    body: JSON.stringify(payload)
  });
}

module.exports = async function handler(req, res) {
  try {
    const { code, state, error } = req.query || {};

    if (error) return res.redirect(`${APP_URL}/profile?youtube=cancelled`);
    if (!code || !state) return res.redirect(`${APP_URL}/profile?youtube=missing`);

    const stateRow = await getStateRow(state);

    if (!stateRow?.user_id) {
      return res.redirect(`${APP_URL}/profile?youtube=invalid_state`);
    }

    if (new Date(stateRow.expires_at).getTime() < Date.now()) {
      await deleteState(state);
      return res.redirect(`${APP_URL}/profile?youtube=expired_state`);
    }

    const token = await exchangeCode(code);
    const channel = await getChannel(token.access_token);

    await upsertAccount(stateRow.user_id, channel);
    await deleteState(state);

    return res.redirect(`${APP_URL}/profile?youtube=connected`);
  } catch (error) {
    console.error("[YouTube OAuth Callback]", error);
    return res.redirect(`${APP_URL}/profile?youtube=error`);
  }
};
