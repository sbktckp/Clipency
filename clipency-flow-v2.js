(function(){
  window.CLIPENCY_FLOW_V2 = "flow-v2-active";

  function path(){
    return location.pathname.replace(/\/+$/, "").toLowerCase();
  }

  function isSubmitPage(){
    return path().includes("/campaign") || path().includes("/proof");
  }

  function isAdminReviewPage(){
    return path() === "/admin/review" || path() === "/admin/reviews";
  }

  function sb(){
    return window.clipencySupabase || window.supabaseClient || window.sbClient || null;
  }

  async function rpc(name, payload){
    const client = sb();

    if(!client?.rpc){
      throw new Error("Supabase client missing.");
    }

    const { data, error } = await client.rpc(name, payload || {});

    if(error){
      throw error;
    }

    return data;
  }

  function clean(v){
    return String(v || "").replace(/\s+/g, " ").trim();
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
      const label = clean(`${input.name} ${input.id} ${input.placeholder}`).toLowerCase();
      const value = clean(input.value);

      if(value && /(handle|username|account|profile)/.test(label)){
        return value;
      }
    }

    return "";
  }

  function findPlatform(scope){
    const selected = scope.querySelector("select")?.value;
    if(clean(selected)) return clean(selected);

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
      scope.querySelector("h1,h2,h3,.campaign-title")?.textContent,
      document.querySelector(".campaign-title,h1,h2")?.textContent
    ];

    for(const c of candidates){
      const value = clean(c);
      if(value && !/^campaigns$/i.test(value) && !/^payouts$/i.test(value)){
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

    console.log("[Clipency Flow V2] submitting clip", payload);

    const id = await rpc("clipency_submit_clip_v2", payload);

    alert("Clip submitted successfully. It is now pending review.");

    if(scope instanceof HTMLFormElement){
      scope.reset();
    }

    console.log("[Clipency Flow V2] submission id", id);
  }

  function bindClipSubmit(){
    if(!isSubmitPage()) return;

    document.addEventListener("submit", async function(e){
      const form = e.target;

      if(!(form instanceof HTMLFormElement)) return;

      const text = clean(form.textContent).toLowerCase();
      const hasUrl = !!findUrl(form);

      if(!hasUrl && !/(clip|proof|post|video|submit)/.test(text)) return;

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      try{
        await submitClip(form);
      }catch(error){
        console.error("[Clipency Flow V2] submit failed", error);
        alert("Clip submission failed: " + (error.message || JSON.stringify(error)));
      }
    }, true);

    document.addEventListener("click", async function(e){
      const btn = e.target.closest("button,a,[role='button']");
      if(!btn) return;

      const text = clean(btn.textContent).toLowerCase();

      if(!/(submit|send|upload)/.test(text)) return;

      const scope =
        btn.closest("form") ||
        btn.closest(".modal,.dialog,.popup,.campaign-card,.campaign-detail,section,main") ||
        document.body;

      if(!findUrl(scope) && !/(clip|proof|post|video)/.test(clean(scope.textContent).toLowerCase())) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      try{
        await submitClip(scope);
      }catch(error){
        console.error("[Clipency Flow V2] submit failed", error);
        alert("Clip submission failed: " + (error.message || JSON.stringify(error)));
      }
    }, true);

    console.log("[Clipency Flow V2] submit binding active");
  }

  async function getReviewRows(){
    const rows = await rpc("clipency_admin_review_queue_v2", {});
    return Array.isArray(rows) ? rows : [];
  }

  function getVisibleRow(btn){
    return btn.closest("tr") ||
      btn.closest("[data-submission-id]") ||
      btn.closest(".submission-row,.review-row,.queue-row,.card") ||
      btn.closest("div");
  }

  function rowText(row){
    return clean(row?.textContent || "").toLowerCase();
  }

  function matchSubmissionFromVisibleRow(row, rows){
    const text = rowText(row);

    const pending = rows.filter(r =>
      String(r.review_status || r.status || "").toLowerCase() === "pending"
    );

    for(const r of pending){
      const campaign = clean(r.campaign_title).toLowerCase();
      const handle = clean(r.account_handle).toLowerCase();

      if(campaign && text.includes(campaign)){
        if(!handle || text.includes(handle)) return r;
      }
    }

    return pending[0] || rows[0] || null;
  }

  function bindAdminActions(){
    if(!isAdminReviewPage()) return;

    document.addEventListener("click", async function(e){
      const btn = e.target.closest("button,a,[role='button']");
      if(!btn) return;

      const text = clean(btn.textContent).toLowerCase();

      if(!/(approve|reject)/.test(text)) return;

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      try{
        const rows = await getReviewRows();
        const visibleRow = getVisibleRow(btn);
        const sub = matchSubmissionFromVisibleRow(visibleRow, rows);

        if(!sub?.id){
          alert("Could not find this submission id. Refresh and try again.");
          return;
        }

        if(text.includes("approve")){
          const entered = prompt("Enter earning amount for this clip:", "0");
          if(entered === null) return;

          const amount = Number(String(entered).replace(/[^0-9.]/g, ""));

          if(Number.isNaN(amount) || amount < 0){
            alert("Enter a valid amount.");
            return;
          }

          await rpc("clipency_approve_submission_v2", {
            p_submission_id: sub.id,
            p_earning: amount
          });

          alert("Submission approved and earning added.");
          location.reload();
          return;
        }

        if(text.includes("reject")){
          const reason = prompt("Reason for rejection:", "");
          if(reason === null) return;

          await rpc("clipency_reject_submission_v2", {
            p_submission_id: sub.id,
            p_reason: reason
          });

          alert("Submission rejected.");
          location.reload();
        }
      }catch(error){
        console.error("[Clipency Flow V2] admin action failed", error);
        alert("Admin action failed: " + (error.message || JSON.stringify(error)));
      }
    }, true);

    console.log("[Clipency Flow V2] admin review binding active");
  }

  function boot(){
    bindClipSubmit();
    bindAdminActions();
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", boot);
  }else{
    boot();
  }
})();
