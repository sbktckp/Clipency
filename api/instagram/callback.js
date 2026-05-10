const { APP_URL, getStateRow, deleteState, upsertAccount } = require("../social/_helpers");

async function exchangeCode(code) {
  const body = new URLSearchParams({
    client_id: process.env.INSTAGRAM_CLIENT_ID,
    client_secret: process.env.INSTAGRAM_CLIENT_SECRET,
    grant_type: "authorization_code",
    redirect_uri: process.env.INSTAGRAM_REDIRECT_URI || `${APP_URL}/api/instagram/callback`,
    code
  });

  const r = await fetch("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    body
  });

  const json = await r.json();
  if (!r.ok) throw new Error(JSON.stringify(json));
  return json;
}

async function getUser(accessToken) {
  const r = await fetch(`https://graph.instagram.com/me?fields=id,username,account_type&access_token=${encodeURIComponent(accessToken)}`);

  const json = await r.json();
  if (!r.ok) throw new Error(JSON.stringify(json));

  if (!json.id) throw new Error("No Instagram user found");

  return json;
}

module.exports = async function handler(req, res) {
  try {
    const { code, state, error } = req.query || {};

    if (error) return res.redirect(`${APP_URL}/profile?instagram=cancelled`);
    if (!code || !state) return res.redirect(`${APP_URL}/profile?instagram=missing`);

    const stateRow = await getStateRow(state, "instagram");
    if (!stateRow?.user_id) return res.redirect(`${APP_URL}/profile?instagram=invalid_state`);

    const token = await exchangeCode(code);
    const user = await getUser(token.access_token);

    await upsertAccount({
      user_id: stateRow.user_id,
      platform: "instagram",
      platform_user_id: user.id,
      handle: user.username || user.id,
      display_name: user.username || "Instagram Creator",
      profile_url: user.username ? `https://instagram.com/${user.username}` : "",
      avatar_url: "",
      auth_provider: "instagram_oauth",
      raw_profile: user
    });

    await deleteState(state);
    return res.redirect(`${APP_URL}/profile?instagram=connected`);
  } catch (error) {
    console.error("[Instagram Callback]", error);
    return res.redirect(`${APP_URL}/profile?instagram=error`);
  }
};
