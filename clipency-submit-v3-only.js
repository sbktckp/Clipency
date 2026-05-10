(function(){
  window.CLIPENCY_SUBMIT_V3_ONLY = "submit-v3-only-active";

  function clean(v){
    return String(v || "").replace(/\s+/g, " ").trim();
  }

  function isCampaignPage(){
    return location.pathname.toLowerCase().includes("/campaign");
  }

  function sb(){
    return window.clipencySupabase || window.supabaseClient || window.sbClient || null;
  }

  async function submitClip(){
    const client = sb();

    if(!client?.rpc){
      throw new Error("Supabase client missing.");
    }

    const user = await client.auth.getUser();

    if(!user?.data?.user){
      throw new Error("User not logged in.");
    }

    let clipUrl = "";

    for(const input of document.querySelectorAll("input, textarea")){
      const value = clean(input.value);
      if(/^https?:\/\//i.test(value)){
        clipUrl = value;
        break;
      }
    }

    if(!clipUrl){
      clipUrl = prompt("Paste your clip/post URL:");
    }

    clipUrl = clean(clipUrl);

    if(!clipUrl){
      alert("Clip URL is required.");
      return;
    }

    let title =
      clean(document.querySelector(".campaign-title")?.textContent) ||
      clean(document.querySelector("h1")?.textContent) ||
      clean(document.querySelector("h2")?.textContent) ||
      "Campaign";

    if(/^campaigns$/i.test(title)){
      title = "Campaign";
    }

    const bodyText = clean(document.body.textContent).toLowerCase();

    let platform = "Instagram";
    if(bodyText.includes("youtube")) platform = "YouTube";
    else if(bodyText.includes("tiktok")) platform = "TikTok";
    else if(bodyText.includes("instagram")) platform = "Instagram";

    let handle = "";

    for(const input of document.querySelectorAll("input, textarea")){
      const meta = clean(`${input.name || ""} ${input.id || ""} ${input.placeholder || ""}`).toLowerCase();
      const value = clean(input.value);

      if(value && /(handle|username|account|profile)/.test(meta)){
        handle = value;
        break;
      }
    }

    const campaignId =
      clean(document.querySelector("[data-campaign-id]")?.dataset?.campaignId) ||
      clean(new URLSearchParams(location.search).get("campaign_id")) ||
      clean(new URLSearchParams(location.search).get("id")) ||
      "";

    const payload = {
      p_campaign_id: campaignId,
      p_campaign_title: title,
      p_post_url: clipUrl,
      p_platform: platform,
      p_account_handle: handle
    };

    console.log("[Clipency Submit V3] payload", payload);

    const { data, error } = await client.rpc("clipency_submit_clip_v3", payload);

    if(error){
      console.error("[Clipency Submit V3] error", error);
      throw error;
    }

    console.log("[Clipency Submit V3] success", data);
    alert("Clip submitted successfully. It is now pending review.");
  }

  function bind(){
    if(!isCampaignPage()) return;

    document.addEventListener("click", async function(e){
      const btn = e.target.closest("button,a,[role='button']");
      if(!btn) return;

      const text = clean(btn.textContent).toLowerCase();

      if(
        !text.includes("submit your clip") &&
        !text.includes("submit clip") &&
        text !== "submit" &&
        !text.includes("upload clip")
      ){
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      try{
        await submitClip();
      }catch(error){
        alert("Clip submission failed: " + (error.message || JSON.stringify(error)));
      }
    }, true);

    console.log("[Clipency Submit V3] loaded");
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", bind);
  }else{
    bind();
  }
})();
