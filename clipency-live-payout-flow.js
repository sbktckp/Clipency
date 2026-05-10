(function(){
  const log = (...a) => console.log("[Clipency Live Payout Flow]", ...a);

  function pathMatch(paths){
    return paths.some(p => location.pathname.replace(/\/+$/, "") === p.replace(/\/+$/, ""));
  }

  function config(){
    if(window.CLIPENCY_SUPABASE_URL && window.CLIPENCY_SUPABASE_ANON_KEY){
      return {
        url: window.CLIPENCY_SUPABASE_URL,
        key: window.CLIPENCY_SUPABASE_ANON_KEY
      };
    }
    throw new Error("Supabase config missing. Check /supabaseClient.js");
  }

  async function token(){
    const client = window.clipencySupabase || window.supabaseClient || window.sbClient;
    if(!client?.auth?.getSession){
      throw new Error("Supabase auth client missing.");
    }

    const session = await client.auth.getSession();
    const accessToken = session?.data?.session?.access_token;

    if(!accessToken){
      throw new Error("User not logged in.");
    }

    return accessToken;
  }

  async function rpc(name, body){
    const c = config();
    const t = await token();

    const res = await fetch(`${c.url}/rest/v1/rpc/${name}`, {
      method: "POST",
      headers: {
        apikey: c.key,
        Authorization: `Bearer ${t}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body || {})
    });

    const text = await res.text();

    if(!res.ok){
      throw new Error(text || `RPC failed: ${name}`);
    }

    try { return JSON.parse(text); }
    catch(e) { return text; }
  }

  function money(n){
    return "$" + Number(n || 0).toLocaleString(undefined, {
      minimumFractionDigits: Number(n || 0) % 1 ? 2 : 0,
      maximumFractionDigits: 2
    });
  }

  function ownText(el){
    return Array.from(el.childNodes)
      .filter(n => n.nodeType === Node.TEXT_NODE)
      .map(n => n.textContent)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function findLabel(label){
    const wanted = label.toLowerCase();

    return Array.from(document.querySelectorAll("body *")).find(el => {
      const own = ownText(el).toLowerCase();
      const all = (el.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();

      return own === wanted || all === wanted || own.includes(wanted);
    });
  }

  function nearestBigBox(el){
    let node = el;
    for(let i = 0; i < 10 && node; i++){
      const r = node.getBoundingClientRect();
      if(r.width > 180 && r.height > 90){
        return node;
      }
      node = node.parentElement;
    }
    return el;
  }

  function setCardAmount(label, value){
    const labelNode = findLabel(label);
    if(!labelNode) return;

    const card = nearestBigBox(labelNode);

    const candidates = Array.from(card.querySelectorAll("*"))
      .filter(el => /^\$[\d,]+(\.\d+)?$/.test((el.textContent || "").trim()))
      .sort((a,b) => parseFloat(getComputedStyle(b).fontSize) - parseFloat(getComputedStyle(a).fontSize));

    if(candidates[0]){
      candidates[0].textContent = value;
    }
  }

  function findHistoryPanel(){
    const heading = findLabel("Payout History");
    if(!heading) return null;

    let node = heading;
    for(let i = 0; i < 10 && node; i++){
      const r = node.getBoundingClientRect();
      if(r.width > 400 && r.height > 140){
        return node;
      }
      node = node.parentElement;
    }
    return heading.parentElement;
  }

  function renderPayoutHistory(rows){
    const panel = findHistoryPanel();
    if(!panel) return;

    panel.innerHTML = "";

    const wrap = document.createElement("div");
    wrap.style.padding = "28px";

    const h = document.createElement("h2");
    h.textContent = "Payout History";
    h.style.margin = "0 0 18px";
    h.style.color = "#fff8ef";

    wrap.appendChild(h);

    if(!rows || !rows.length){
      const empty = document.createElement("div");
      empty.textContent = "No payout history yet.";
      empty.style.padding = "26px 0";
      empty.style.borderTop = "1px solid rgba(224,172,120,.14)";
      empty.style.color = "rgba(216,199,180,.72)";
      empty.style.fontWeight = "700";
      wrap.appendChild(empty);
      panel.appendChild(wrap);
      return;
    }

    rows.forEach(row => {
      const item = document.createElement("div");
      item.style.display = "flex";
      item.style.justifyContent = "space-between";
      item.style.alignItems = "center";
      item.style.gap = "18px";
      item.style.padding = "18px 0";
      item.style.borderTop = "1px solid rgba(224,172,120,.14)";

      const status = String(row.status || "pending").toLowerCase();

      item.innerHTML = `
        <div>
          <strong style="color:#fff8ef;">Payout withdrawal</strong>
          <div style="color:rgba(216,199,180,.65);font-size:14px;margin-top:4px;">
            ${row.requested_at ? new Date(row.requested_at).toLocaleString() : ""}
          </div>
        </div>
        <div style="text-align:right;">
          <strong style="color:${status === "paid" ? "#5ff0a8" : "#e0ac78"};">
            ${money(row.amount)}
          </strong>
          <div style="color:rgba(216,199,180,.65);font-size:14px;margin-top:4px;text-transform:capitalize;">
            ${status}
          </div>
        </div>
      `;

      wrap.appendChild(item);
    });

    panel.appendChild(wrap);
  }

  async function refreshClipperPayoutPage(){
    if(!pathMatch(["/payouts"])) return;

    try{
      const summaryData = await rpc("my_payout_summary", {});
      const summary = Array.isArray(summaryData) ? summaryData[0] : summaryData;

      setCardAmount("Available Balance", money(summary.available_balance));
      setCardAmount("Pending Payout", money(summary.pending_payout));
      setCardAmount("Paid", money(summary.paid_total));

      window.__clipencyPayoutSummary = summary;

      const history = await rpc("my_payout_history", {});
      renderPayoutHistory(Array.isArray(history) ? history : []);
    }catch(error){
      console.error(error);
      setCardAmount("Available Balance", "$0");
      setCardAmount("Pending Payout", "$0");
      setCardAmount("Paid", "$0");
      renderPayoutHistory([]);
    }
  }

  function bindWithdraw(){
    if(!pathMatch(["/payouts"])) return;

    const btn = Array.from(document.querySelectorAll("button,a,[role='button']"))
      .find(el => /withdraw/i.test(el.textContent || ""));

    if(!btn || btn.dataset.clipencyWithdrawBound === "true") return;

    btn.dataset.clipencyWithdrawBound = "true";

    btn.addEventListener("click", async function(e){
      e.preventDefault();
      e.stopPropagation();

      try{
        const summary = window.__clipencyPayoutSummary || {};
        const available = Number(summary.available_balance || 0);

        if(available <= 0){
          alert("Available balance is $0. Nothing to withdraw yet.");
          return;
        }

        const entered = prompt(`Enter withdrawal amount. Available: ${money(available)}`, String(available));
        if(entered === null) return;

        const amount = Number(String(entered).replace(/[^0-9.]/g, ""));

        if(!amount || amount <= 0){
          alert("Enter a valid amount.");
          return;
        }

        if(amount > available){
          alert(`Insufficient balance. Available: ${money(available)}`);
          return;
        }

        await rpc("request_my_payout", { p_amount: amount });

        alert("Withdrawal request submitted.");
        await refreshClipperPayoutPage();
      }catch(error){
        console.error(error);
        alert("Withdrawal failed: " + (error.message || error));
      }
    }, true);
  }

  function collectSubmissionPayload(form){
    const fd = new FormData(form);

    function val(names){
      for(const name of names){
        const v = fd.get(name);
        if(v !== null && String(v).trim()) return String(v).trim();
      }
      return "";
    }

    const allInputs = Array.from(form.querySelectorAll("input,textarea,select"))
      .map(i => i.value)
      .filter(Boolean);

    const url = val(["post_url", "video_url", "clip_url", "proof_url", "url", "link"]) ||
      allInputs.find(v => /^https?:\/\//i.test(v)) ||
      "";

    const platform = val(["platform"]) ||
      Array.from(form.querySelectorAll("select option:checked")).map(o => o.textContent.trim()).find(Boolean) ||
      "Instagram";

    const account = val(["account_handle", "handle", "username", "profile"]);

    const campaignId =
      form.dataset.campaignId ||
      form.closest("[data-campaign-id]")?.dataset?.campaignId ||
      new URLSearchParams(location.search).get("campaign_id") ||
      new URLSearchParams(location.search).get("id") ||
      "";

    const campaignTitle =
      form.dataset.campaignTitle ||
      form.closest("[data-campaign-title]")?.dataset?.campaignTitle ||
      document.querySelector("h1,h2,.campaign-title")?.textContent?.trim() ||
      "Campaign";

    return {
      p_campaign_id: campaignId,
      p_campaign_title: campaignTitle,
      p_post_url: url,
      p_platform: platform,
      p_account_handle: account
    };
  }

  function bindClipSubmission(){
    if(!/campaign|proof|submit/i.test(location.pathname)) return;

    document.addEventListener("submit", async function(e){
      const form = e.target;
      if(!(form instanceof HTMLFormElement)) return;

      const text = (form.textContent || "").toLowerCase();
      const hasUrl = Array.from(form.querySelectorAll("input,textarea"))
        .some(i => /^https?:\/\//i.test(i.value || ""));

      const likelyClipForm =
        hasUrl ||
        text.includes("submit your clip") ||
        text.includes("proof") ||
        text.includes("clip url") ||
        text.includes("post url") ||
        text.includes("video url");

      if(!likelyClipForm) return;

      e.preventDefault();
      e.stopPropagation();

      try{
        const payload = collectSubmissionPayload(form);

        if(!payload.p_post_url){
          alert("Please paste your clip/post URL before submitting.");
          return;
        }

        await rpc("submit_my_clip", payload);

        alert("Clip submitted successfully. It is now pending review.");
        form.reset();
      }catch(error){
        console.error(error);
        alert("Clip submission failed: " + (error.message || error));
      }
    }, true);
  }

  function boot(){
    refreshClipperPayoutPage();
    bindWithdraw();
    bindClipSubmission();

    if(pathMatch(["/payouts"])){
      setInterval(refreshClipperPayoutPage, 30000);
    }

    log("loaded", location.pathname);
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", boot);
  }else{
    boot();
  }

  window.addEventListener("load", boot);
})();
