(function(){
  window.CLIPENCY_PAYOUT_TARGETED_LIVE = "targeted-v1";

  function isPayoutPage(){
    return location.pathname.replace(/\/+$/, "") === "/payouts";
  }

  function money(n){
    const v = Number(n || 0);
    return "$" + v.toLocaleString(undefined, {
      minimumFractionDigits: v % 1 ? 2 : 0,
      maximumFractionDigits: 2
    });
  }

  function client(){
    return window.clipencySupabase || window.supabaseClient || window.sbClient || null;
  }

  async function rpc(name, body){
    const sb = client();
    if(!sb?.auth?.getSession) throw new Error("Supabase client missing");

    const session = await sb.auth.getSession();
    const token = session?.data?.session?.access_token;
    if(!token) throw new Error("User session missing");

    const url = window.CLIPENCY_SUPABASE_URL || "https://spwtkdgpgeutrhwcjrpy.supabase.co";
    const key = window.CLIPENCY_SUPABASE_ANON_KEY;
    if(!key) throw new Error("Supabase anon key missing");

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
    if(!res.ok) throw new Error(text || `${name} failed`);

    try { return JSON.parse(text); }
    catch(e) { return text; }
  }

  function setText(id, value){
    const el = document.getElementById(id);
    if(el) el.textContent = value;
  }

  function renderHistory(rows){
    const list = document.getElementById("tx-list");
    if(!list) return;

    if(!rows || !rows.length){
      list.innerHTML = `
        <div style="padding:22px 0;color:var(--ts);font-weight:600;">
          No payout history yet.
        </div>
      `;
      return;
    }

    list.innerHTML = rows.map(row => {
      const status = String(row.status || "pending").toLowerCase();
      const isPaid = status === "paid" || status === "completed" || status === "approved";

      return `
        <div class="tx-item">
          <div class="tx-icon">💸</div>
          <div style="flex:1;min-width:0;">
            <div class="tx-desc">Payout withdrawal</div>
            <div class="tx-date">${row.requested_at ? new Date(row.requested_at).toLocaleDateString("en-US", {month:"short", day:"numeric", year:"numeric"}) : ""}</div>
          </div>
          <div style="text-align:right;">
            <div class="tx-amount" style="color:${isPaid ? "var(--green)" : "#FACC15"}">${money(row.amount)}</div>
            <div class="tx-status" style="text-transform:capitalize;">${status}</div>
          </div>
        </div>
      `;
    }).join("");
  }

  async function refreshPayouts(){
    if(!isPayoutPage()) return;

    let summary = {
      available_balance: 0,
      pending_payout: 0,
      paid_total: 0
    };

    setText("bal-available", "$0");
    setText("bal-pending", "$0");
    setText("bal-paid", "$0");
    renderHistory([]);

    try{
      const summaryData = await rpc("my_payout_summary", {});
      summary = Array.isArray(summaryData) ? summaryData[0] : summaryData;

      window.__clipencyPayoutSummary = summary;

      setText("bal-available", money(summary.available_balance));
      setText("bal-pending", money(summary.pending_payout));
      setText("bal-paid", money(summary.paid_total));

      const historyData = await rpc("my_payout_history", {});
      renderHistory(Array.isArray(historyData) ? historyData : []);
    }catch(error){
      console.error("[Clipency payout targeted live]", error);
      window.__clipencyPayoutSummary = summary;
    }
  }

  async function submitWithdrawal(amount){
    await rpc("request_my_payout", { p_amount: amount });
    await refreshPayouts();
  }

  function bindWithdraw(){
    const btn = document.getElementById("btn-withdraw");
    if(!btn || btn.dataset.clipencyTargetedBound === "true") return;

    btn.dataset.clipencyTargetedBound = "true";

    btn.addEventListener("click", async function(e){
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

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

      try{
        await submitWithdrawal(amount);
        alert("Withdrawal request submitted.");
      }catch(error){
        console.error(error);
        alert("Withdrawal failed: " + (error.message || error));
      }
    }, true);
  }

  function boot(){
    if(!isPayoutPage()) return;

    refreshPayouts();
    bindWithdraw();

    setTimeout(refreshPayouts, 600);
    setTimeout(refreshPayouts, 1800);
    setInterval(refreshPayouts, 15000);
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", boot);
  }else{
    boot();
  }

  window.addEventListener("load", boot);
})();
