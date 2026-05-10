(function(){
  window.CLIPENCY_LAUNCH_FLOW = "launch-flow-v1";

  const SUPABASE_URL = "https://spwtkdgpgeutrhwcjrpy.supabase.co";

  function clean(v){
    return String(v || "").replace(/\s+/g, " ").trim();
  }

  function path(){
    return location.pathname.replace(/\/+$/, "").toLowerCase();
  }

  function isCampaignPage(){
    return path().includes("/campaign");
  }

  function isAdminReviewPage(){
    return path() === "/admin/review" || path() === "/admin/reviews";
  }

  function getClient(){
    return window.clipencySupabase || window.supabaseClient || window.sbClient || null;
  }

  async function getAnonKey(){
    if(window.CLIPENCY_SUPABASE_ANON_KEY) return window.CLIPENCY_SUPABASE_ANON_KEY;

    try{
      const txt = await fetch("/supabaseClient.js?v=" + Date.now()).then(r => r.text());
      const key = txt.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/)?.[0];
      if(key) return key;
    }catch(e){}

    throw new Error("Supabase anon key not found.");
  }

  async function getToken(){
    const client = getClient();

    try{
      const session = await client?.auth?.getSession?.();
      const token = session?.data?.session?.access_token;
      if(token) return token;
    }catch(e){}

    for(let i = 0; i < localStorage.length; i++){
      const key = localStorage.key(i);
      if(!key || !key.includes("sb-")) continue;

      try{
        const value = JSON.parse(localStorage.getItem(key));
        if(value?.access_token) return value.access_token;
        if(value?.currentSession?.access_token) return value.currentSession.access_token;
      }catch(e){}
    }

    throw new Error("User session missing. Please login again.");
  }

  async function rpc(name, payload){
    const anon = await getAnonKey();
    const token = await getToken();

    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
      method: "POST",
      headers: {
        apikey: anon,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload || {})
    });

    const text = await res.text();

    if(!res.ok){
      throw new Error(text || `${name} failed`);
    }

    try { return JSON.parse(text); }
    catch(e) { return text; }
  }

  function pageCampaignTitle(){
    const candidates = [
      document.querySelector(".campaign-title")?.textContent,
      document.querySelector("[data-campaign-title]")?.dataset?.campaignTitle,
      document.querySelector("h1")?.textContent,
      document.querySelector("h2")?.textContent
    ];

    for(const c of candidates){
      const v = clean(c);
      if(v && !/^campaigns$/i.test(v) && !/^clipency$/i.test(v)) return v;
    }

    return "Campaign";
  }

  function pagePlatform(){
    const txt = clean(document.body.textContent).toLowerCase();
    if(txt.includes("youtube")) return "YouTube";
    if(txt.includes("tiktok")) return "TikTok";
    if(txt.includes("instagram")) return "Instagram";
    return "Instagram";
  }

  function campaignId(){
    return clean(
      document.querySelector("[data-campaign-id]")?.dataset?.campaignId ||
      new URLSearchParams(location.search).get("campaign_id") ||
      new URLSearchParams(location.search).get("id") ||
      ""
    );
  }

  function findClipUrl(){
    for(const el of document.querySelectorAll("input, textarea")){
      const v = clean(el.value);
      if(/^https?:\/\//i.test(v)) return v;
    }

    return "";
  }

  function findHandle(){
    for(const el of document.querySelectorAll("input, textarea")){
      const meta = clean(`${el.name || ""} ${el.id || ""} ${el.placeholder || ""}`).toLowerCase();
      const v = clean(el.value);

      if(v && /(handle|username|account|profile)/.test(meta)) return v;
    }

    return "";
  }

  async function submitClip(){
    let url = findClipUrl();

    if(!url){
      url = prompt("Paste your clip/post URL:");
    }

    url = clean(url);

    if(!url){
      alert("Clip URL is required.");
      return;
    }

    const payload = {
      p_campaign_id: campaignId(),
      p_campaign_title: pageCampaignTitle(),
      p_post_url: url,
      p_platform: pagePlatform(),
      p_account_handle: findHandle()
    };

    await rpc("clipency_launch_submit_clip", payload);

    alert("Clip submitted successfully. It is now pending review.");
  }

  function isSubmitButton(el){
    const txt = clean(el?.textContent || "").toLowerCase();
    return (
      txt.includes("submit your clip") ||
      txt.includes("submit clip") ||
      txt.includes("submit proof") ||
      txt.includes("upload clip") ||
      txt === "submit"
    );
  }

  async function pendingRows(){
    const rows = await rpc("clipency_launch_admin_review_queue", {});
    return (Array.isArray(rows) ? rows : []).filter(r => {
      const s = String(r.review_status || r.status || "").toLowerCase();
      return s === "pending";
    });
  }

  function rowIndexForButton(btn, actionText){
    const buttons = Array.from(document.querySelectorAll("button,a,[role='button']"))
      .filter(b => clean(b.textContent).toLowerCase() === actionText);

    return Math.max(0, buttons.indexOf(btn));
  }

  async function approve(btn){
    const rows = await pendingRows();
    const row = rows[rowIndexForButton(btn, "approve")];

    if(!row?.id){
      alert("Could not find this pending submission. Refresh and try again.");
      return;
    }

    const entered = prompt("Enter earning amount for this approved clip:", "0");
    if(entered === null) return;

    const amount = Number(String(entered).replace(/[^0-9.]/g, ""));

    if(Number.isNaN(amount) || amount < 0){
      alert("Enter a valid amount.");
      return;
    }

    await rpc("clipency_launch_approve_submission", {
      p_submission_id: row.id,
      p_earning: amount
    });

    alert("Submission approved.");
    location.reload();
  }

  async function reject(btn){
    const rows = await pendingRows();
    const row = rows[rowIndexForButton(btn, "reject")];

    if(!row?.id){
      alert("Could not find this pending submission. Refresh and try again.");
      return;
    }

    const reason = prompt("Enter rejection reason:");
    if(reason === null) return;

    await rpc("clipency_launch_reject_submission", {
      p_submission_id: row.id,
      p_reason: reason
    });

    alert("Submission rejected.");
    location.reload();
  }

  async function handleClick(e){
    const btn = e.target.closest("button,a,[role='button']");
    if(!btn) return;

    const txt = clean(btn.textContent).toLowerCase();

    if(isCampaignPage() && isSubmitButton(btn)){
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      try{
        await submitClip();
      }catch(error){
        console.error("[Clipency Launch Submit]", error);
        alert("Clip submission failed: " + (error.message || error));
      }

      return;
    }

    if(isAdminReviewPage() && txt === "approve"){
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      try{
        await approve(btn);
      }catch(error){
        console.error("[Clipency Launch Approve]", error);
        alert("Admin action failed: " + (error.message || error));
      }

      return;
    }

    if(isAdminReviewPage() && txt === "reject"){
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      try{
        await reject(btn);
      }catch(error){
        console.error("[Clipency Launch Reject]", error);
        alert("Admin action failed: " + (error.message || error));
      }
    }
  }

  window.addEventListener("click", handleClick, true);
  window.addEventListener("submit", function(e){
    if(!isCampaignPage()) return;

    const form = e.target;
    if(!(form instanceof HTMLFormElement)) return;

    if(findClipUrl() || /clip|proof|post|video|submit/i.test(clean(form.textContent))){
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      submitClip().catch(error => {
        console.error("[Clipency Launch Submit Form]", error);
        alert("Clip submission failed: " + (error.message || error));
      });
    }
  }, true);
})();
