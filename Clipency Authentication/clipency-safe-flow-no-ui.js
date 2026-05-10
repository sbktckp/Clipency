(function(){
  window.CLIPENCY_SAFE_FLOW_NO_UI = "safe-flow-no-ui-v1";

  const path = () => location.pathname.replace(/\/+$/, "").toLowerCase();

  const isCampaignPage = () => path().includes("/campaign");
  const isAdminReview = () => path() === "/admin/review" || path() === "/admin/reviews";

  function clean(v){
    return String(v || "").replace(/\s+/g, " ").trim();
  }

  function sb(){
    return window.clipencySupabase || window.supabaseClient || window.sbClient || null;
  }

  async function rpc(name, payload){
    const client = sb();

    if(!client?.rpc){
      throw new Error("Supabase client missing. Login again or check supabaseClient.js.");
    }

    const { data, error } = await client.rpc(name, payload || {});

    if(error){
      throw error;
    }

    return data;
  }

  function findUrl(scope){
    const inputs = Array.from(scope.querySelectorAll("input, textarea"));

    for(const input of inputs){
      const value = clean(input.value);
      if(/^https?:\/\//i.test(value)) return value;
    }

    return "";
  }

  function findHandle(scope){
    const inputs = Array.from(scope.querySelectorAll("input, textarea"));

    for(const input of inputs){
      const meta = clean(`${input.name || ""} ${input.id || ""} ${input.placeholder || ""}`).toLowerCase();
      const value = clean(input.value);

      if(value && /(handle|username|account|profile)/.test(meta)){
        return value;
      }
    }

    return "";
  }

  function findPlatform(scope){
    const selected = clean(scope.querySelector("select")?.value);
    if(selected) return selected;

    const txt = clean(document.body.textContent).toLowerCase();

    if(txt.includes("youtube")) return "YouTube";
    if(txt.includes("tiktok")) return "TikTok";
    if(txt.includes("instagram")) return "Instagram";

    return "Instagram";
  }

  function findCampaignTitle(scope){
    const candidates = [
      scope.closest("[data-campaign-title]")?.dataset?.campaignTitle,
      scope.closest("[data-title]")?.dataset?.title,
      document.querySelector(".campaign-title")?.textContent,
      document.querySelector("h1")?.textContent,
      document.querySelector("h2")?.textContent
    ];

    for(const c of candidates){
      const value = clean(c);
      if(value && !/^campaigns$/i.test(value) && !/^clipency$/i.test(value)){
        return value;
      }
    }

    return "Campaign";
  }

  function findCampaignId(scope){
    return clean(
      scope.closest("[data-campaign-id]")?.dataset?.campaignId ||
      new URLSearchParams(location.search).get("campaign_id") ||
      new URLSearchParams(location.search).get("id") ||
      ""
    );
  }

  async function submitClip(scope){
    const payload = {
      p_campaign_id: findCampaignId(scope),
      p_campaign_title: findCampaignTitle(scope),
      p_post_url: findUrl(scope),
      p_platform: findPlatform(scope),
      p_account_handle: findHandle(scope)
    };

    if(!payload.p_post_url){
      const manual = prompt("Paste the clip/post URL:");
      if(!manual) return;
      payload.p_post_url = manual.trim();
    }

    await rpc("clipency_submit_clip_v2", payload);

    alert("Clip submitted successfully. It is now pending review.");
  }

  function cloneButton(btn){
    const clone = btn.cloneNode(true);
    clone.dataset.clipencySafeBound = "true";
    btn.replaceWith(clone);
    return clone;
  }

  function bindSubmitButtons(){
    if(!isCampaignPage()) return;

    const buttons = Array.from(document.querySelectorAll("button,a,[role='button']"))
      .filter(btn => /submit your clip|submit clip|submit|upload|send/i.test(clean(btn.textContent || "")));

    buttons.forEach(btn => {
      if(btn.dataset.clipencySafeBound === "true") return;

      const clone = cloneButton(btn);

      clone.addEventListener("click", async function(e){
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        const scope =
          clone.closest("form") ||
          clone.closest(".modal,.dialog,.popup,.campaign-detail,.campaign-card,section,main") ||
          document.body;

        try{
          await submitClip(scope);
        }catch(error){
          console.error("[Clipency Safe Submit]", error);
          alert("Clip submission failed: " + (error.message || JSON.stringify(error)));
        }
      }, true);
    });
  }

  async function getPendingRows(){
    const rows = await rpc("clipency_admin_review_queue_v2", {});
    return (Array.isArray(rows) ? rows : []).filter(r => {
      const status = String(r.review_status || r.status || "").toLowerCase();
      return status === "pending";
    });
  }

  function bindAdminButtons(){
    if(!isAdminReview()) return;

    const approveButtons = Array.from(document.querySelectorAll("button,a,[role='button']"))
      .filter(btn => /^approve$/i.test(clean(btn.textContent)));

    const rejectButtons = Array.from(document.querySelectorAll("button,a,[role='button']"))
      .filter(btn => /^reject$/i.test(clean(btn.textContent)));

    approveButtons.forEach((btn, index) => {
      if(btn.dataset.clipencySafeBound === "true") return;

      const clone = cloneButton(btn);

      clone.addEventListener("click", async function(e){
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        try{
          const rows = await getPendingRows();
          const row = rows[index];

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

          await rpc("clipency_approve_submission_v2", {
            p_submission_id: row.id,
            p_earning: amount
          });

          alert("Submission approved and earning added.");
          location.reload();
        }catch(error){
          console.error("[Clipency Safe Approve]", error);
          alert("Admin action failed: " + (error.message || JSON.stringify(error)));
        }
      }, true);
    });

    rejectButtons.forEach((btn, index) => {
      if(btn.dataset.clipencySafeBound === "true") return;

      const clone = cloneButton(btn);

      clone.addEventListener("click", async function(e){
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        try{
          const rows = await getPendingRows();
          const row = rows[index];

          if(!row?.id){
            alert("Could not find this pending submission. Refresh and try again.");
            return;
          }

          const reason = prompt("Enter rejection reason:");
          if(reason === null) return;

          await rpc("clipency_reject_submission_v2", {
            p_submission_id: row.id,
            p_reason: reason
          });

          alert("Submission rejected.");
          location.reload();
        }catch(error){
          console.error("[Clipency Safe Reject]", error);
          alert("Admin action failed: " + (error.message || JSON.stringify(error)));
        }
      }, true);
    });
  }

  function boot(){
    bindSubmitButtons();
    bindAdminButtons();

    setTimeout(bindSubmitButtons, 800);
    setTimeout(bindAdminButtons, 800);
    setTimeout(bindSubmitButtons, 1800);
    setTimeout(bindAdminButtons, 1800);
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", boot);
  }else{
    boot();
  }

  window.addEventListener("load", boot);
})();
