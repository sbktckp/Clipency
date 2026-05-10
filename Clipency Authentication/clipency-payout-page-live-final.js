(function(){
  window.CLIPENCY_PAYOUT_LIVE_FINAL = "loaded-final-v4";

  function isPayoutPage(){
    return location.pathname.replace(/\/+$/, "") === "/payouts";
  }

  function money(n){
    return "$" + Number(n || 0).toLocaleString(undefined, {
      maximumFractionDigits: 2
    });
  }

  function cleanText(el){
    return (el.textContent || "").replace(/\s+/g, " ").trim();
  }

  function getSupabase(){
    return window.clipencySupabase || window.supabaseClient || window.sbClient || null;
  }

  async function rpc(name, body){
    const client = getSupabase();

    if(!client){
      throw new Error("Supabase client missing");
    }

    const session = await client.auth.getSession();
    const token = session?.data?.session?.access_token;

    if(!token){
      throw new Error("User session missing");
    }

    const url = window.CLIPENCY_SUPABASE_URL || "https://spwtkdgpgeutrhwcjrpy.supabase.co";
    const key = window.CLIPENCY_SUPABASE_ANON_KEY;

    if(!key){
      throw new Error("Supabase anon key missing");
    }

    const res = await fetch(`${url}/rest/v1/rpc/${name}`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body || {})
    });

    const text = await res.text();

    if(!res.ok){
      throw new Error(text);
    }

    try {
      return JSON.parse(text);
    } catch(e) {
      return text;
    }
  }

  function allMoneyNodes(){
    return Array.from(document.querySelectorAll("body *"))
      .filter(el => /^\$[\d,]+(\.\d+)?$/.test(cleanText(el)))
      .map(el => ({
        el,
        rect: el.getBoundingClientRect(),
        size: parseFloat(getComputedStyle(el).fontSize || 0)
      }))
      .filter(x => x.size >= 24)
      .sort((a,b) => {
        if(Math.abs(a.rect.top - b.rect.top) > 80) return a.rect.top - b.rect.top;
        return a.rect.left - b.rect.left;
      });
  }

  function setTopAmounts(summary){
    const values = [
      money(summary.available_balance),
      money(summary.pending_payout),
      money(summary.paid_total)
    ];

    const nodes = allMoneyNodes().slice(0, 3);

    nodes.forEach((x, index) => {
      x.el.textContent = values[index] || "$0";
    });
  }

  function findHistoryPanel(){
    const heading = Array.from(document.querySelectorAll("body *"))
      .find(el => /^payout history$/i.test(cleanText(el)));

    if(!heading) return null;

    let node = heading;

    for(let i = 0; i < 12 && node; i++){
      const r = node.getBoundingClientRect();

      if(r.width > 300 && r.height > 120){
        return node;
      }

      node = node.parentElement;
    }

    return heading.parentElement;
  }

  function renderHistory(rows){
    const panel = findHistoryPanel();
    if(!panel) return;

    panel.innerHTML = `
      <div style="padding:28px 34px;">
        <h2 style="margin:0 0 18px;color:#fff8ef;font-size:22px;">Payout History</h2>
        <div id="clipency-live-history"></div>
      </div>
    `;

    const box = panel.querySelector("#clipency-live-history");

    if(!rows || !rows.length){
      box.innerHTML = `
        <div style="border-top:1px solid rgba(224,172,120,.14);padding:28px 0;color:rgba(216,199,180,.72);font-weight:700;">
          No payout history yet.
        </div>
      `;
      return;
    }

    box.innerHTML = rows.map(row => {
      const status = String(row.status || "pending").toLowerCase();

      return `
        <div style="display:flex;justify-content:space-between;gap:18px;border-top:1px solid rgba(224,172,120,.14);padding:18px 0;">
          <div>
            <strong style="color:#fff8ef;">Payout withdrawal</strong>
            <div style="color:rgba(216,199,180,.62);font-size:14px;margin-top:5px;">
              ${row.requested_at ? new Date(row.requested_at).toLocaleString() : ""}
            </div>
          </div>
          <div style="text-align:right;">
            <strong style="color:${status === "paid" ? "#5ff0a8" : "#e0ac78"};">${money(row.amount)}</strong>
            <div style="color:rgba(216,199,180,.62);font-size:14px;margin-top:5px;text-transform:capitalize;">${status}</div>
          </div>
        </div>
      `;
    }).join("");
  }

  async function refresh(){
    if(!isPayoutPage()) return;

    let summary = {
      available_balance: 0,
      pending_payout: 0,
      paid_total: 0
    };

    setTopAmounts(summary);
    renderHistory([]);

    try {
      const summaryData = await rpc("my_payout_summary", {});
      summary = Array.isArray(summaryData) ? summaryData[0] : summaryData;

      window.__clipencyPayoutSummary = summary;

      setTopAmounts(summary);

      const historyData = await rpc("my_payout_history", {});
      renderHistory(Array.isArray(historyData) ? historyData : []);
    } catch(error) {
      console.error("[Clipency payout live]", error);
      window.__clipencyPayoutSummary = summary;
      setTopAmounts(summary);
      renderHistory([]);
    }
  }

  function bindWithdraw(){
    if(!isPayoutPage()) return;

    const btn = Array.from(document.querySelectorAll("button,a,[role='button']"))
      .find(el => /withdraw/i.test(cleanText(el)));

    if(!btn || btn.dataset.cxWithdrawBound === "true") return;

    btn.dataset.cxWithdrawBound = "true";

    btn.addEventListener("click", async function(e){
      e.preventDefault();
      e.stopPropagation();

      const available = Number(window.__clipencyPayoutSummary?.available_balance || 0);

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
      await refresh();
    }, true);
  }

  function boot(){
    if(!isPayoutPage()) return;

    refresh();
    bindWithdraw();

    setTimeout(refresh, 500);
    setTimeout(refresh, 1500);
    setTimeout(refresh, 3000);
    setInterval(refresh, 10000);
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  window.addEventListener("load", boot);
})();
