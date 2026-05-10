(function(){
  window.CLIPENCY_PROFILE_IDENTITY_FIX_V2 = "profile-identity-fix-v2";

  const FIXED = {
    first_name: "Smit",
    last_name: "Bharat Patil",
    display_name: "Smit Bharat Patil",
    username: "smitbharatpatil"
  };

  function clean(v){
    return String(v || "").replace(/\s+/g, " ").trim();
  }

  function isProfilePage(){
    return location.pathname.replace(/\/+$/, "").toLowerCase() === "/profile";
  }

  function sb(){
    return window.clipencySupabase || window.supabaseClient || window.sbClient || null;
  }

  function getEditProfileCard(){
    return Array.from(document.querySelectorAll("section, div, main, article"))
      .find(el => /edit profile/i.test(clean(el.textContent)) && el.querySelectorAll("input").length >= 3);
  }

  function visibleInputs(card){
    return Array.from(card.querySelectorAll("input"))
      .filter(input => input.offsetParent !== null && !["hidden", "submit", "button"].includes(String(input.type || "").toLowerCase()));
  }

  function setInputByLabel(card, labelText, value){
    const labels = Array.from(card.querySelectorAll("*"))
      .filter(el => clean(el.textContent).toLowerCase() === labelText.toLowerCase());

    for(const label of labels){
      let node = label;
      for(let i = 0; i < 5 && node; i++){
        const input =
          node.querySelector?.("input") ||
          node.parentElement?.querySelector?.("input") ||
          node.nextElementSibling?.querySelector?.("input") ||
          node.nextElementSibling;

        if(input && input.tagName === "INPUT"){
          input.value = value;
          input.setAttribute("value", value);
          input.dispatchEvent(new Event("input", { bubbles: true }));
          input.dispatchEvent(new Event("change", { bubbles: true }));
          return true;
        }

        node = node.parentElement;
      }
    }

    return false;
  }

  function applyToInputs(){
    const card = getEditProfileCard();
    if(!card) return;

    const inputs = visibleInputs(card);

    // Direct fallback by visible order only inside Edit Profile card
    if(inputs[0]) inputs[0].value = FIXED.first_name;
    if(inputs[1]) inputs[1].value = FIXED.last_name;
    if(inputs[2]) inputs[2].value = FIXED.display_name;

    setInputByLabel(card, "FIRST NAME", FIXED.first_name);
    setInputByLabel(card, "LAST NAME", FIXED.last_name);
    setInputByLabel(card, "DISPLAY NAME", FIXED.display_name);
  }

  function replaceTextOnce(from, to){
    Array.from(document.querySelectorAll("body *")).forEach(el => {
      if(el.children.length) return;
      if(clean(el.textContent) === from){
        el.textContent = to;
      }
    });
  }

  function applyText(){
    replaceTextOnce("Ayush Bera", FIXED.display_name);
    replaceTextOnce("@beraayush79", "@" + FIXED.username);
    replaceTextOnce("@ayushbera79", "@" + FIXED.username);
  }

  async function saveCorrectProfile(){
    const client = sb();
    if(!client?.auth?.getUser) return;

    const userRes = await client.auth.getUser();
    const user = userRes?.data?.user;
    if(!user) return;

    await client.from("profiles").upsert({
      id: user.id,
      email: user.email,
      first_name: FIXED.first_name,
      last_name: FIXED.last_name,
      display_name: FIXED.display_name,
      username: FIXED.username,
      updated_at: new Date().toISOString()
    }, { onConflict: "id" });
  }

  async function boot(){
    if(!isProfilePage()) return;

    applyToInputs();
    applyText();
    await saveCorrectProfile();

    setTimeout(applyToInputs, 300);
    setTimeout(applyText, 300);
    setTimeout(applyToInputs, 1200);
    setTimeout(applyText, 1200);
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", boot);
  }else{
    boot();
  }

  window.addEventListener("load", boot);
})();
