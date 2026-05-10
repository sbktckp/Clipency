(function(){
  window.CLIPENCY_PROFILE_IDENTITY_FIX = "profile-identity-fix-v1";

  function clean(v){
    return String(v || "").replace(/\s+/g, " ").trim();
  }

  function isProfilePage(){
    return location.pathname.replace(/\/+$/, "").toLowerCase() === "/profile";
  }

  function sb(){
    return window.clipencySupabase || window.supabaseClient || window.sbClient || null;
  }

  function splitName(displayName, email){
    const n = clean(displayName);
    if(n && !n.includes("@")){
      const parts = n.split(" ");
      return {
        first: parts[0] || "",
        last: parts.slice(1).join(" ") || "",
        display: n
      };
    }

    const local = clean(email).split("@")[0] || "Clipper";
    return {
      first: local,
      last: "",
      display: local
    };
  }

  function makeUsername(profile, user){
    const raw =
      profile?.username ||
      user?.user_metadata?.username ||
      user?.email?.split("@")[0] ||
      profile?.display_name ||
      "clipper";

    return clean(raw)
      .replace(/^@/, "")
      .toLowerCase()
      .replace(/[^a-z0-9._]/g, "");
  }

  function findEditProfileCard(){
    const nodes = Array.from(document.querySelectorAll("section, div, main, article"));
    return nodes.find(el => /edit profile/i.test(clean(el.textContent)) && el.querySelectorAll("input").length >= 3);
  }

  function setEditInputs(profile){
    const card = findEditProfileCard();
    if(!card) return;

    const inputs = Array.from(card.querySelectorAll("input")).filter(i => {
      const type = String(i.type || "text").toLowerCase();
      return ["text", "email", "search", ""].includes(type);
    });

    if(inputs[0]) inputs[0].value = profile.first_name || "";
    if(inputs[1]) inputs[1].value = profile.last_name || "";
    if(inputs[2]) inputs[2].value = profile.display_name || "";
  }

  function replaceExactText(oldValues, newValue){
    if(!newValue) return;

    const oldSet = new Set(oldValues.map(v => clean(v)).filter(Boolean));

    Array.from(document.querySelectorAll("body *")).forEach(el => {
      if(el.children.length) return;

      const t = clean(el.textContent);
      if(oldSet.has(t)){
        el.textContent = newValue;
      }
    });
  }

  function applyProfile(profile){
    const display = clean(profile.display_name);
    const first = clean(profile.first_name);
    const last = clean(profile.last_name);
    const username = clean(profile.username).replace(/^@/, "");

    setEditInputs(profile);

    replaceExactText(
      ["Ayush Bera", "Smit Bharat Patil", "Bharat Patil"],
      display
    );

    replaceExactText(
      ["Ayush", "Smit"],
      first
    );

    replaceExactText(
      ["Bera", "Bharat Patil"],
      last
    );

    replaceExactText(
      ["@beraayush79", "@ayushbera79", "@smitbharatpatil"],
      username ? "@" + username : ""
    );
  }

  async function loadProfile(){
    if(!isProfilePage()) return;

    const client = sb();
    if(!client?.auth?.getUser) return;

    const userRes = await client.auth.getUser();
    const user = userRes?.data?.user;
    if(!user) return;

    let profile = null;

    try{
      const { data } = await client
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      profile = data;
    }catch(e){}

    if(!profile){
      const metaName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.user_metadata?.display_name ||
        "";

      const parts = splitName(metaName, user.email);

      profile = {
        id: user.id,
        email: user.email,
        first_name: parts.first,
        last_name: parts.last,
        display_name: parts.display,
        username: makeUsername({}, user)
      };

      try{
        await client.from("profiles").upsert(profile, { onConflict: "id" });
      }catch(e){}
    }

    profile.username = makeUsername(profile, user);

    applyProfile(profile);
    bindSave(profile, user);
  }

  function bindSave(currentProfile, user){
    const card = findEditProfileCard();
    if(!card || card.dataset.profileFixBound === "true") return;

    card.dataset.profileFixBound = "true";

    const saveBtn = Array.from(card.querySelectorAll("button,a,[role='button']"))
      .find(btn => /save profile/i.test(clean(btn.textContent)));

    if(!saveBtn) return;

    saveBtn.addEventListener("click", async function(e){
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      const client = sb();
      const inputs = Array.from(card.querySelectorAll("input")).filter(i => {
        const type = String(i.type || "text").toLowerCase();
        return ["text", "email", "search", ""].includes(type);
      });

      const first = clean(inputs[0]?.value);
      const last = clean(inputs[1]?.value);
      const display = clean(inputs[2]?.value) || clean(`${first} ${last}`);
      const username = clean(currentProfile.username || makeUsername({ display_name: display }, user)).replace(/^@/, "");

      const payload = {
        id: user.id,
        email: user.email,
        first_name: first,
        last_name: last,
        display_name: display,
        username,
        updated_at: new Date().toISOString()
      };

      const { error } = await client.from("profiles").upsert(payload, { onConflict: "id" });

      if(error){
        alert("Profile save failed: " + error.message);
        return;
      }

      applyProfile(payload);
      alert("Profile saved.");
    }, true);
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", loadProfile);
  }else{
    loadProfile();
  }

  window.addEventListener("load", loadProfile);
})();
