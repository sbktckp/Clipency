(function(){
  window.CLIPENCY_SUBMIT_FORCE_V3 = "submit-force-v3-active";

  function clean(v){
    return String(v || "").replace(/\s+/g, " ").trim();
  }

  function isCampaignPath(){
    return location.pathname.toLowerCase().includes("/campaign");
  }

  function sb(){
    return window.clipencySupabase || window.supabaseClient || window.sbClient || null;
  }

  async function submitClip(scope){
    const client = sb();

    if(!client?.rpc){
      throw new Error("Supabase client not found on this page.");
    }

    const userResult = await client.auth.getUser();

    if(!userResult?.data?.user){
      throw new Error("User not logged in. Please login again.");
    }

    let clipUrl = "";

    const inputs = Array.from(document.querySelectorAll("input, textarea"));
    for(const input of inputs){
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

    if(/^campaigns$/i.test(title) || /^clipency$/i.test(title)){
      title = "Campaign";
    }

    const pageText = clean(document.body.textContent).toLowerCase();

    let platform = "Instagram";
    if(pageText.includes("youtube")) platform = "YouTube";
    else if(pageText.includes("tiktok")) platform = "TikTok";
    else if(pageText.includes("instagram")) platform = "Instagram";

    let handle = "";
    for(const input of inputs){
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

    console.log("[Clipency Submit Force V3] Payload:", payload);

    const { data, error } = await client.rpc("clipency_submit_clip_v2", payload);

    if(error){
      console.error("[Clipency Submit Force V3] RPC error:", error);
      throw error;
    }

    console.log("[Clipency Submit Force V3] Inserted:", data);
    alert("Clip submitted successfully. It is now pending review.");
  }

  function shouldInterceptButton(btn){
    const text = clean(btn.textContent).toLowerCase();
    return (
      text.includes("submit your clip") ||
      text.includes("submit clip") ||
      text === "submit" ||
      text.includes("upload clip") ||
      text.includes("send clip")
    );
  }

  document.addEventListener("click", async function(e){
    if(!isCampaignPath()) return;

    const btn = e.target.closest("button,a,[role='button']");
    if(!btn) return;

    if(!shouldInterceptButton(btn)) return;

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    try{
      await submitClip(btn.closest("section,main,.modal,.dialog,.campaign-card,.campaign-detail") || document.body);
    }catch(error){
      console.error("[Clipency Submit Force V3] Failed:", error);
      alert("Clip submission failed: " + (error.message || JSON.stringify(error)));
    }
  }, true);

  console.log("[Clipency Submit Force V3] loaded");
})();
