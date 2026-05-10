const crypto = require("crypto");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const APP_URL = process.env.APP_URL || "https://clipency.in";
const YOUTUBE_REDIRECT_URI =
  process.env.YOUTUBE_REDIRECT_URI || `${APP_URL}/api/youtube/callback`;

async function getBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return {};
}

async function getUserFromJwt(jwt) {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${jwt}`
    }
  });

  if (!r.ok) return null;
  return await r.json();
}

async function insertState(state, userId) {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const r = await fetch(`${SUPABASE_URL}/rest/v1/oauth_states`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal"
    },
    body: JSON.stringify({
      state,
      user_id: userId,
      provider: "youtube",
      return_to: "/profile",
      expires_at: expiresAt
    })
  });

  if (!r.ok) throw new Error(await r.text());
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ error: "Supabase env missing in Vercel" });
    }

    if (!GOOGLE_CLIENT_ID) {
      return res.status(500).json({ error: "GOOGLE_CLIENT_ID missing in Vercel" });
    }

    const body = await getBody(req);
    const platform = String(body.platform || "").toLowerCase();

    if (platform !== "youtube") {
      return res.status(400).json({ error: `${platform} OAuth is coming soon` });
    }

    const jwt = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");

    if (!jwt) {
      return res.status(401).json({ error: "Missing auth session" });
    }

    const user = await getUserFromJwt(jwt);

    if (!user?.id) {
      return res.status(401).json({ error: "Invalid auth session" });
    }

    const state = crypto.randomBytes(32).toString("hex");
    await insertState(state, user.id);

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: YOUTUBE_REDIRECT_URI,
      response_type: "code",
      scope: "https://www.googleapis.com/auth/youtube.readonly",
      access_type: "offline",
      prompt: "consent",
      include_granted_scopes: "true",
      state
    });

    return res.status(200).json({
      url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
    });
  } catch (error) {
    console.error("[YouTube OAuth Connect]", error);
    return res.status(500).json({ error: error.message || "OAuth connect failed" });
  }
};
