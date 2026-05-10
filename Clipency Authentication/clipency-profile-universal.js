(function(){
  window.CLIPENCY_PROFILE_UNIVERSAL = "profile-universal-v1";

  function clean(v){
    return String(v || "").replace(/\s+/g, " ").trim();
  }

  function isProfilePage(){
    return location.pathname.replace(/\/+$/, "").toLowerCase() === "/profile";
  }

  function sb(){
    return window.clipencySupabase || window.supabaseClient || window.sbClient || null;
  }

  function titleCaseFromEmail(email){
    const local = clean(email).split("@")[0] || "Clipper";
    return local
      .replace(/[._-]+/g, " ")
      .split(" ")
      .filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  function splitName(name, email){
    let display = clean(name);

    if(!display || display.includes("@")){
      display = titleCaseFromEmail(email);
    }

    const parts = display.split(" ").filter(Boolean);

    return {
      first_name: parts[0] || display,
      last_name: parts.slice(1).join(" "),
      display_name: display
    };
  }

  function usernameFrom(profile, user){
    const raw =
      profile?.username ||
      user?.user_metadata?.username ||
      profile?.display_name ||
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      user?.email?.split("@")[0] ||
      "clipper";

    return clean(raw)
      .replace(/^@/, "")
      .toLowerCase()
      .replace(/[^a-z0-9._]/g, "");
  }

  async function getProfile(){
    const client = sb();
    if(!client?.auth?.getUser) return null;

    const userRes = await client.auth.getUser();
    const user = userRes?.data?.user;
    if(!user) return null;

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

      const names = splitName(metaName, user.email);

      profile = {
        id: user.id,
        email: user.email,
        first_name: names.first_name,
        last_name: names.last_name,
        display_name: names.display_name,
        username: ""
      };

      profile.username = usernameFrom(profile, user);

      try{
        await client.from("profiles").upsert(profile, { onConflict: "id" });
      }catch(e){}
    }

    profile.email = profile.email || user.email;
    profile.display_name = clean(profile.display_name) || splitName("", user.email).display_name;
    profile.first_name = clean(profile.first_name) || splitName(profile.display_name, user.email).first_name;
    profile.last_name = clean(profile.last_name) || splitName(profile.display_name, user.email).last_name;
    profile.username = usernameFrom(profile, user);

    return { profile, user };
  }

  function findEditCard(){
    return Array.from(document.querySelectorAll("section, div, main, article"))
      .find(el => /edit profile/i.test(clean(el.textContent)) && el.querySelectorAll("input").length >= 3);
  }

  function visibleInputs(card){
    return Array.from(card.querySelectorAll("input"))
      .filter(input => input.offsetParent !== null && !["hidden", "submit", "button"].includes(String(input.type || "").toLowerCase()));
  }

  function setEditFields(profile){
    const card = findEditCard();
    if(!card) return;

    const inputs = visibleInputs(card);

    if(inputs[0]){
      inputs[0].value = profile.first_name;
      inputs[0].setAttribute("value", profile.first_name);
    }

    if(inputs[1]){
      inputs[1].value = profile.last_name;
      inputs[1].setAttribute("value", profile.last_name);
    }

    if(inputs[2]){
      inputs[2].value = profile.display_name;
      inputs[2].setAttribute("value", profile.display_name);
    }
  }

  function replaceWrongIdentity(profile){
    const display = profile.display_name;
    const username = "@" + profile.username;

    const wrongNames = [
      "Ayush Bera",
      "Smit Bharat Patil",
      "Team Clipency",
      "Bharat Patil"
    ];

    const wrongUsernames = [
      "@beraayush79",
      "@ayushbera79",
      "@smitbharatpatil",
      "@teamclipency"
    ];

    Array.from(document.querySelectorAll("body *")).forEach(el => {
      if(el.children.length) return;

      const text = clean(el.textContent);

      if(wrongNames.includes(text) && text !== display){
        el.textContent = display;
      }

      if(wrongUsernames.includes(text) && text !== username){
        el.textContent = username;
      }
    });
  }

  function bindSave(profile, user){
    const card = findEditCard();
    if(!card || card.dataset.universalProfileBound === "true") return;

    card.dataset.universalProfileBound = "true";

    const saveBtn = Array.from(card.querySelectorAll("button,a,[role='button']"))
      .find(btn => /save profile/i.test(clean(btn.textContent)));

    if(!saveBtn) return;

    saveBtn.addEventListener("click", async function(e){
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      const client = sb();
      const inputs = visibleInputs(card);

      const first = clean(inputs[0]?.value);
      const last = clean(inputs[1]?.value);
      const display = clean(inputs[2]?.value) || clean(`${first} ${last}`);

      const payload = {
        id: user.id,
        email: user.email,
        first_name: first,
        last_name: last,
        display_name: display,
        username: profile.username,
        updated_at: new Date().toISOString()
      };

      const { error } = await client.from("profiles").upsert(payload, { onConflict: "id" });

      if(error){
        alert("Profile save failed: " + error.message);
        return;
      }

      profile.first_name = first;
      profile.last_name = last;
      profile.display_name = display;

      setEditFields(profile);
      replaceWrongIdentity(profile);

      alert("Profile saved.");
    }, true);
  }

  async function boot(){
    if(!isProfilePage()) return;

    const result = await getProfile();
    if(!result) return;

    const { profile, user } = result;

    setEditFields(profile);
    replaceWrongIdentity(profile);
    bindSave(profile, user);

    setTimeout(() => {
      setEditFields(profile);
      replaceWrongIdentity(profile);
    }, 700);

    setTimeout(() => {
      setEditFields(profile);
      replaceWrongIdentity(profile);
    }, 1600);
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", boot);
  }else{
    boot();
  }

  window.addEventListener("load", boot);
})();
