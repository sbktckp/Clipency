const { APP_URL, getStateRow, deleteState, upsertAccount } = require("../../oauth-helpers");

async function exchangeCode(code) {
  const body = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY,
    client_secret: process.env.TIKTOK_CLIENT_SECRET,
    code,
    grant_type: "authorization_code",
    redirect_uri: process.env.TIKTOK_REDIRECT_URI || `${APP_URL}/api/tiktok/callback`
  });

  const r = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  const json = await r.json();
  if (!r.ok) throw new Error(JSON.stringify(json));
  return json;
}

async function getUser(accessToken) {
  const r = await fetch("https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name", {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  const json = await r.json();
  if (!r.ok) throw new Error(JSON.stringify(json));

  const user = json.data?.user;
  if (!user?.open_id) throw new Error("No TikTok user found");

  return user;
}

module.exports = async function handler(req, res) {
  try {
    const { code, state, error } = req.query || {};

    if (error) return res.redirect(`${APP_URL}/profile?tiktok=cancelled`);
    if (!code || !state) return res.redirect(`${APP_URL}/profile?tiktok=missing`);

    const stateRow = await getStateRow(state, "tiktok");
    if (!stateRow?.user_id) return res.redirect(`${APP_URL}/profile?tiktok=invalid_state`);

    const token = await exchangeCode(code);
    const user = await getUser(token.access_token);

    await upsertAccount({
      user_id: stateRow.user_id,
      platform: "tiktok",
      platform_user_id: user.open_id,
      handle: user.display_name || user.open_id,
      display_name: user.display_name || "TikTok Creator",
      profile_url: "",
      avatar_url: user.avatar_url || "",
      auth_provider: "tiktok_oauth",
      raw_profile: user
    });

    await deleteState(state);
    return res.redirect(`${APP_URL}/profile?tiktok=connected`);
  } catch (error) {
    console.error("[TikTok Callback]", error);
    return res.redirect(`${APP_URL}/profile?tiktok=error`);
  }
};
