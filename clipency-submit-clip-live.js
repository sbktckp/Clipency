(function(){
  window.CLIPENCY_SUBMIT_CLIP_LIVE = "submit-live-v1";

  function isClipSubmitArea(){
    const p = location.pathname.toLowerCase();
    return p.includes("campaign") || p.includes("proof") || p.includes("submit");
  }

  function sb(){
    return window.clipencySupabase || window.supabaseClient || window.sbClient || null;
  }

  async function callSubmitRpc(payload){
    const client = sb();

    if(!client?.auth?.getSession){
      throw new Error("Supabase client missing.");
    }

    const session = await client.auth.getSession();
    const token = session?.data?.session?.access_token;

    if(!token){
      throw new Error("User session missing. Please login again.");
    }

    const url = window.CLIPENCY_SUPABASE_URL || "https://spwtkdgpgeutrhwcjrpy.supabase.co";
    const key = window.CLIPENCY_SUPABASE_ANON_KEY;

    if(!key){
      throw new Error("Supabase anon key missing.");
    }

    const res = await fetch(`${url}/rest/v1/rpc/submit_my_clip`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const text = await res.text();

    if(!res.ok){
      throw new Error(text || "submit_my_clip failed");
    }

    try {
      return JSON.parse(text);
    } catch(e) {
      return text;
    }
  }

  function clean(v){
    return String(v || "").trim();
  }

  function findUrl(scope){
    const inputs = Array.from(scope.querySelectorAll("input, textarea"));

    for(const input of inputs){
      const value = clean(input.value);
      if(/^https?:\/\//i.test(value)){
        return value;
      }
    }

    for(const input of inputs){
      const name = `${input.name || ""} ${input.id || ""} ${input.placeholder || ""}`.toLowerCase();
      const value = clean(input.value);

      if(value && /(url|link|proof|clip|video|post)/i.test(name)){
        return value;
      }
    }

    return "";
  }

  function findHandle(scope){
    const inputs = Array.from(scope.querySelectorAll("input, textarea"));

    for(const input of inputs){
      const name = `${input.name || ""} ${input.id || ""} ${input.placeholder || ""}`.toLowerCase();
      const value = clean(input.value);

      if(value && /(handle|username|account|profile)/i.test(name)){
        return value;
      }
    }

    return "";
  }

  function findPlatform(scope){
    const select = scope.querySelector("select");
    if(select && select.value) return clean(select.value);

    const text = clean(scope.textContent).toLowerCase();

    if(text.includes("youtube")) return "YouTube";
    if(text.includes("tiktok")) return "TikTok";
    if(text.includes("instagram")) return "Instagram";

    return "Instagram";
  }

  function findCampaignTitle(scope){
    const candidates = [
      scope.closest("[data-campaign-title]")?.dataset?.campaignTitle,
      scope.closest("[data-title]")?.dataset?.title,
      document.querySelector("[data-active-campaign-title]")?.dataset?.activeCampaignTitle,
      scope.querySelector("h1,h2,h3,.campaign-title,[data-campaign-title]")?.textContent,
      document.querySelector("h1,h2,.campaign-title")?.textContent
    ];

    for(const c of candidates){
      const value = clean(c);
      if(value && !/campaigns|submit|proof/i.test(value)){
        return value;
      }
    }

    return "Campaign";
  }

  function findCampaignId(scope){
    return clean(
      scope.closest("[data-campaign-id]")?.dataset?.campaignId ||
      document.querySelector("[data-active-campaign-id]")?.dataset?.activeCampaignId ||
      new URLSearchParams(location.search).get("campaign_id") ||
      new URLSearchParams(location.search).get("id") ||
      ""
    );
  }

  function buildPayload(scope){
    return {
      p_campaign_id: findCampaignId(scope),
      p_campaign_title: findCampaignTitle(scope),
      p_post_url: findUrl(scope),
      p_platform: findPlatform(scope),
      p_account_handle: findHandle(scope)
    };
  }

  async function submitFromScope(scope){
    const payload = buildPayload(scope);

    if(!payload.p_post_url){
      alert("Please paste your clip/post URL before submitting.");
      return;
    }

    console.log("[Clipency Submit Clip] Payload:", payload);

    await callSubmitRpc(payload);

    alert("Clip submitted successfully. It is now pending review.");

    if(scope instanceof HTMLFormElement){
      scope.reset();
    }
  }

  function isLikelyClipForm(form){
    const text = clean(form.textContent).toLowerCase();
    const hasUrl = !!findUrl(form);

    return hasUrl ||
      text.includes("clip") ||
      text.includes("proof") ||
      text.includes("post url") ||
      text.includes("video url") ||
      text.includes("submit");
  }

  function bindSubmitForms(){
    document.addEventListener("submit", async function(e){
      if(!isClipSubmitArea()) return;

      const form = e.target;
      if(!(form instanceof HTMLFormElement)) return;
      if(!isLikelyClipForm(form)) return;

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      try{
        await submitFromScope(form);
      }catch(error){
        console.error("[Clipency Submit Clip] Failed:", error);
        alert("Clip submission failed: " + (error.message || error));
      }
    }, true);
  }

  function bindSubmitButtons(){
    document.addEventListener("click", async function(e){
      if(!isClipSubmitArea()) return;

      const btn = e.target.closest("button,a,[role='button']");
      if(!btn) return;

      const text = clean(btn.textContent).toLowerCase();

      if(!/(submit|send|upload)/i.test(text)) return;

      const scope =
        btn.closest("form") ||
        btn.closest("[data-campaign-id]") ||
        btn.closest(".modal,.dialog,.popup,.campaign-card,.campaign-detail,section,main") ||
        document.body;

      if(!findUrl(scope)) return;

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      try{
        await submitFromScope(scope);
      }catch(error){
        console.error("[Clipency Submit Clip] Failed:", error);
        alert("Clip submission failed: " + (error.message || error));
      }
    }, true);
  }

  function boot(){
    if(!isClipSubmitArea()) return;

    bindSubmitForms();
    bindSubmitButtons();

    console.log("[Clipency Submit Clip] loaded");
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", boot);
  }else{
    boot();
  }
})();
