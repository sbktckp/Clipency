(function(){
  window.CLIPENCY_PAYOUTS_DYNAMIC = "payouts-dynamic-v3-disable-zero-withdraw";

  let latestAvailable = 0;

  function money(n){
    const value = Number(n || 0);
    return "$" + value.toLocaleString(undefined, {
      minimumFractionDigits: value % 1 ? 2 : 0,
      maximumFractionDigits: 2
    });
  }

  function clean(v){
    return String(v || "").replace(/\s+/g, " ").trim();
  }

  function client(){
    return window.clipencySupabase || window.supabaseClient || window.sbClient || null;
  }

  async function waitForSupabase(){
    for(let i = 0; i < 50; i++){
      const sb = client();
      if(sb && sb.rpc && sb.auth) return sb;
      await new Promise(r => setTimeout(r, 120));
    }
    throw new Error("Supabase client missing");
  }

  function getMetricCurrencyNodes(){
    return Array.from(document.querySelectorAll("body *"))
      .filter(el => {
        const txt = clean(el.textContent);
        const r = el.getBoundingClientRect();
        return /^\$[\d,]+(\.\d+)?$/.test(txt)
          && r.width > 20
          && r.height > 20
          && r.top < 750;
      })
      .sort((a,b) => {
        const ar = a.getBoundingClientRect();
        const br = b.getBoundingClientRect();
        if(Math.abs(ar.top - br.top) > 30) return ar.top - br.top;
        return ar.left - br.left;
      });
  }

  function forceMetricValues(row){
    const values = getMetricCurrencyNodes();

    latestAvailable = Number(row.available_balance || 0);

    if(values[0]) values[0].textContent = money(row.available_balance || 0);
    if(values[1]) values[1].textContent = money(row.pending_payout || 0);
    if(values[2]) values[2].textContent = money(row.paid_total || 0);

    updateWithdrawButton();
  }

  function findHistoryBox(){
    const headings = Array.from(document.querySelectorAll("h1,h2,h3,h4,div,section"))
      .filter(el => clean(el.textContent).toLowerCase() === "payout history");

    const heading = headings[0];
    if(!heading) return null;

    return {
      box: heading.closest("section,article,div"),
      heading
    };
  }

  function renderHistory(items){
    const found = findHistoryBox();
    if(!found || !found.box) return;

    const box = found.box;
    const heading = found.heading;

    box.querySelectorAll(".cx-payout-history-dynamic").forEach(el => el.remove());

    Array.from(box.children).forEach(child => {
      if(child.contains(heading)) return;
      child.style.display = "none";
    });

    const wrap = document.createElement("div");
    wrap.className = "cx-payout-history-dynamic";
    wrap.style.display = "grid";
    wrap.style.gap = "14px";
    wrap.style.marginTop = "24px";

    if(!items.length){
      wrap.innerHTML = `
        <div style="color:rgba(216,199,180,.72);font-weight:850;">
          No payout history yet.
        </div>
      `;
      box.appendChild(wrap);
      return;
    }

    wrap.innerHTML = items.map(item => {
      const amount = Number(item.amount || 0);
      const status = clean(item.status || "pending");
      const title = clean(item.title || "Transaction");
      const date = item.created_at ? new Date(item.created_at).toLocaleDateString() : "";

      const color =
        status === "paid" || status === "available" || status === "approved"
          ? "#72f0aa"
          : status === "pending"
            ? "#ffd35a"
            : "#ff9b9b";

      return `
        <div style="
          display:flex;
          justify-content:space-between;
          gap:18px;
          align-items:center;
          padding:16px 0;
          border-bottom:1px solid rgba(224,172,120,.10);
        ">
          <div>
            <div style="font-weight:900;color:#fff8ef;">${title}</div>
            <div style="color:rgba(216,199,180,.62);font-size:14px;margin-top:5px;">${date}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-weight:950;color:${color};">${money(Math.abs(amount))}</div>
            <div style="color:rgba(216,199,180,.62);font-size:13px;text-transform:capitalize;margin-top:5px;">
              ${status.replaceAll("_"," ")}
            </div>
          </div>
        </div>
      `;
    }).join("");

    box.appendChild(wrap);
  }

  function updateWithdrawButton(){
    Array.from(document.querySelectorAll("button,a,[role='button']")).forEach(btn => {
      if(!/withdraw/i.test(clean(btn.textContent)) && !btn.dataset.cxWithdrawButton) return;

      btn.dataset.cxWithdrawButton = "true";

      if(latestAvailable <= 0){
        btn.textContent = "No balance";
        btn.setAttribute("aria-disabled", "true");

        if(btn.tagName === "BUTTON"){
          btn.disabled = true;
        }

        btn.style.opacity = "0.55";
        btn.style.cursor = "not-allowed";
        btn.style.pointerEvents = "none";
      }else{
        btn.textContent = "Withdraw →";
        btn.removeAttribute("aria-disabled");

        if(btn.tagName === "BUTTON"){
          btn.disabled = false;
        }

        btn.style.opacity = "1";
        btn.style.cursor = "pointer";
        btn.style.pointerEvents = "auto";
      }
    });
  }

  async function load(){
    const sb = await waitForSupabase();

    const { data, error } = await sb.rpc("clipency_my_payout_dashboard");
    if(error) throw error;

    const row = Array.isArray(data) ? data[0] : data || {};
    let history = row.history || [];

    if(typeof history === "string"){
      try { history = JSON.parse(history); }
      catch { history = []; }
    }

    if(!Array.isArray(history)) history = [];

    forceMetricValues({
      available_balance: row.available_balance || 0,
      pending_payout: row.pending_payout || 0,
      paid_total: row.paid_total || 0
    });

    renderHistory(history);
  }

  async function requestPayout(){
    try{
      if(latestAvailable <= 0){
        alert("No available balance to withdraw yet.");
        return;
      }

      const amountText = prompt("Enter payout amount:");
      if(amountText === null) return;

      const amount = Number(String(amountText).replace(/[^0-9.]/g, ""));

      if(!amount || amount <= 0){
        alert("Enter a valid amount.");
        return;
      }

      if(amount > latestAvailable){
        alert("Requested amount cannot exceed available balance of " + money(latestAvailable) + ".");
        return;
      }

      const sb = await waitForSupabase();

      const { error } = await sb.rpc("clipency_request_payout", {
        p_amount: amount
      });

      if(error) throw error;

      alert("Payout request submitted.");
      await load();
    }catch(error){
      alert("Payout request failed: " + (error.message || error));
    }
  }

  function bindWithdraw(){
    Array.from(document.querySelectorAll("button,a,[role='button']")).forEach(btn => {
      if(/withdraw/i.test(clean(btn.textContent)) || btn.dataset.cxWithdrawButton){
        btn.dataset.cxWithdrawButton = "true";

        btn.onclick = function(e){
          e.preventDefault();
          e.stopPropagation();

          if(latestAvailable <= 0){
            alert("No available balance to withdraw yet.");
            return false;
          }

          requestPayout();
          return false;
        };
      }
    });

    updateWithdrawButton();
  }

  function boot(){
    bindWithdraw();

    load().catch(error => {
      console.error("[Clipency Payouts Dynamic]", error);

      forceMetricValues({
        available_balance: 0,
        pending_payout: 0,
        paid_total: 0
      });

      renderHistory([]);
    });
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", boot);
  }else{
    boot();
  }

  window.addEventListener("load", function(){
    setTimeout(boot, 500);
    setTimeout(updateWithdrawButton, 900);
  });
})();
