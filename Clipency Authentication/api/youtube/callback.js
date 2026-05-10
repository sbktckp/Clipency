const { APP_URL, getStateRow, deleteState, upsertAccount } = require("../../oauth-helpers");

async function exchangeCode(code) {
  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uri: process.env.YOUTUBE_REDIRECT_URI || `${APP_URL}/api/youtube/callback`,
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
  const r = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  const json = await r.json();
  if (!r.ok) throw new Error(JSON.stringify(json));

  const channel = json.items?.[0];
  if (!channel?.id) throw new Error("No YouTube channel found");

  return channel;
}

module.exports = async function handler(req, res) {
  try {
    const { code, state, error } = req.query || {};

    if (error) return res.redirect(`${APP_URL}/profile?youtube=cancelled`);
    if (!code || !state) return res.redirect(`${APP_URL}/profile?youtube=missing`);

    const stateRow = await getStateRow(state, "youtube");
    if (!stateRow?.user_id) return res.redirect(`${APP_URL}/profile?youtube=invalid_state`);

    const token = await exchangeCode(code);
    const channel = await getChannel(token.access_token);

    const snippet = channel.snippet || {};
    const handle = String(snippet.customUrl || snippet.title || channel.id).replace(/^@/, "");
    const avatar =
      snippet.thumbnails?.high?.url ||
      snippet.thumbnails?.medium?.url ||
      snippet.thumbnails?.default?.url ||
      "";

    await upsertAccount({
      user_id: stateRow.user_id,
      platform: "youtube",
      platform_user_id: channel.id,
      handle,
      display_name: snippet.title || handle,
      profile_url: snippet.customUrl?.startsWith("@")
        ? `https://www.youtube.com/${snippet.customUrl}`
        : `https://www.youtube.com/channel/${channel.id}`,
      avatar_url: avatar,
      auth_provider: "youtube_oauth",
      raw_profile: channel
    });

    await deleteState(state);
    return res.redirect(`${APP_URL}/profile?youtube=connected`);
  } catch (error) {
    console.error("[YouTube Callback]", error);
    return res.redirect(`${APP_URL}/profile?youtube=error`);
  }
};
