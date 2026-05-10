const crypto = require("crypto");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APP_URL = process.env.APP_URL || "https://clipency.in";

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

async function insertState(state, userId, provider) {
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
      provider,
      return_to: "/profile",
      expires_at: expiresAt
    })
  });

  if (!r.ok) throw new Error(await r.text());
}

function getProviderConfig(platform) {
  if (platform === "youtube") {
    if (!process.env.GOOGLE_CLIENT_ID) throw new Error("GOOGLE_CLIENT_ID missing in Vercel env");

    const redirectUri =
      process.env.YOUTUBE_REDIRECT_URI || `${APP_URL}/api/youtube/callback`;

    return {
      clientId: process.env.GOOGLE_CLIENT_ID,
      redirectUri,
      authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      params: {
        client_id: process.env.GOOGLE_CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "https://www.googleapis.com/auth/youtube.readonly",
        access_type: "offline",
        prompt: "consent",
        include_granted_scopes: "true"
      }
    };
  }

  if (platform === "tiktok") {
    if (!process.env.TIKTOK_CLIENT_KEY) throw new Error("TIKTOK_CLIENT_KEY missing in Vercel env");

    const redirectUri =
      process.env.TIKTOK_REDIRECT_URI || `${APP_URL}/api/tiktok/callback`;

    return {
      clientId: process.env.TIKTOK_CLIENT_KEY,
      redirectUri,
      authUrl: "https://www.tiktok.com/v2/auth/authorize/",
      params: {
        client_key: process.env.TIKTOK_CLIENT_KEY,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "user.info.basic"
      }
    };
  }

  if (platform === "instagram") {
    if (!process.env.INSTAGRAM_CLIENT_ID) throw new Error("INSTAGRAM_CLIENT_ID missing in Vercel env");

    const redirectUri =
      process.env.INSTAGRAM_REDIRECT_URI || `${APP_URL}/api/instagram/callback`;

    return {
      clientId: process.env.INSTAGRAM_CLIENT_ID,
      redirectUri,
      authUrl: "https://www.instagram.com/oauth/authorize",
      params: {
        client_id: process.env.INSTAGRAM_CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "instagram_business_basic"
      }
    };
  }

  throw new Error("Invalid platform");
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const platform = String(req.body?.platform || "").toLowerCase();

    if (!["youtube", "instagram", "tiktok"].includes(platform)) {
      return res.status(400).json({ error: "Invalid platform" });
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
    await insertState(state, user.id, platform);

    const cfg = getProviderConfig(platform);
    const params = new URLSearchParams({ ...cfg.params, state });

    return res.status(200).json({
      url: `${cfg.authUrl}?${params.toString()}`
    });
  } catch (error) {
    console.error("[Social OAuth Connect]", error);
    return res.status(500).json({ error: error.message || "OAuth connect failed" });
  }
};
