(function(){
  window.CLIPENCY_PAYOUT_LIVE_FINAL = "2026-05-10-final";

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

  function config(){
    if(window.CLIPENCY_SUPABASE_URL && window.CLIPENCY_SUPABASE_ANON_KEY){
      return {
        url: window.CLIPENCY_SUPABASE_URL,
        key: window.CLIPENCY_SUPABASE_ANON_KEY
      };
    }
    throw new Error("Supabase config missing");
  }

  async function token(){
    const client = window.clipencySupabase || window.supabaseClient || window.sbClient;
    if(!client?.auth?.getSession) throw new Error("Supabase auth client missing");

    const session = await client.auth.getSession();
    return session?.data?.session?.access_token || null;
  }

  async function rpc(name, body){
    const c = config();
    const t = await token();

    if(!t) throw new Error("User session missing");

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
      throw new Error(text || name + " failed");
    }

    try {
      return JSON.parse(text);
    } catch(e) {
      return text;
    }
  }

  function textOf(el){
    return (el.textContent || "").replace(/\s+/g, " ").trim();
  }

  function allElements(){
    return Array.from(document.querySelectorAll("body *"));
  }

  function findExactOrIncludes(label){
    const wanted = label.toLowerCase();
    return allElements().find(el => {
      const text = textOf(el).toLowerCase();
      return text === wanted || text.includes(wanted);
    });
  }

  function nearestCard(el){
    let node = el;
    for(let i = 0; i < 12 && node; i++){
      const r = node.getBoundingClientRect();
      if(r.width >= 220 && r.height >= 120){
        return node;
      }
      node = node.parentElement;
    }
    return el;
  }

  function setCardByLabel(label, value){
    const labelNode = findExactOrIncludes(label);
    if(!labelNode) return false;

    const card = nearestCard(labelNode);
    const amountNodes = Array.from(card.querySelectorAll("*"))
      .filter(el => /^\$[\d,]+(\.\d+)?$/.test(textOf(el)))
      .sort((a,b) => parseFloat(getComputedStyle(b).fontSize) - parseFloat(getComputedStyle(a).fontSize));

    if(amountNodes[0]){
      amountNodes[0].textContent = value;
      return true;
    }

    return false;
  }

  function forceTopThreeCards(summary){
    const values = [
      money(summary.available_balance),
      money(summary.pending_payout),
      money(summary.paid_total)
    ];

    const amountNodes = allElements()
      .filter(el => /^\$[\d,]+(\.\d+)?$/.test(textOf(el)))
      .map(el => ({ el, r: el.getBoundingClientRect(), size: parseFloat(getComputedStyle(el).fontSize || 0) }))
      .filter(x => x.r.top > 150 && x.r.top < 620 && x.r.width > 20 && x.r.height > 20)
      .sort((a,b) => {
        if(Math.abs(a.r.top - b.r.top) > 80) return a.r.top - b.r.top;
        return a.r.left - b.r.left;
      });

    const big = amountNodes
      .filter(x => x.size >= 24)
      .slice(0, 3);

    big.forEach((x, i) => {
      if(values[i]) x.el.textContent = values[i];
    });
  }

  function findHistoryPanel(){
    const heading = allElements().find(el => /^payout history$/i.test(textOf(el)));
    if(!heading) return null;

    let node = heading;
    for(let i = 0; i < 12 && node; i++){
      const r = node.getBoundingClientRect();
      if(r.width > 500 && r.height > 180){
        return node;
      }
      node = node.parentElement;
    }

    return heading.parentElement;
  }

  function renderHistory(rows){
    const panel = findHistoryPanel();
    if(!panel) return;

    panel.innerHTML = "";

    const wrapper = document.createElement("div");
    wrapper.style.padding = "28px 34px";

    const title = document.createElement("h2");
    title.textContent = "Payout History";
    title.style.margin = "0 0 18px";
    title.style.color = "#fff8ef";
    title.style.fontSize = "22px";

    wrapper.appendChild(title);

    if(!rows || !rows.length){
      const empty = document.createElement("div");
      empty.textContent = "No payout history yet.";
      empty.style.borderTop = "1px solid rgba(224,172,120,.14)";
      empty.style.padding = "28px 0";
      empty.style.color = "rgba(216,199,180,.72)";
      empty.style.fontWeight = "700";
      wrapper.appendChild(empty);
      panel.appendChild(wrapper);
      return;
    }

    rows.forEach(row => {
      const status = String(row.status || "pending").toLowerCase();

      const item = document.createElement("div");
      item.style.display = "flex";
      item.style.justifyContent = "space-between";
      item.style.alignItems = "center";
      item.style.gap = "18px";
      item.style.borderTop = "1px solid rgba(224,172,120,.14)";
      item.style.padding = "18px 0";

      item.innerHTML = `
        <div>
          <strong style="color:#fff8ef;">Payout withdrawal</strong>
          <div style="color:rgba(216,199,180,.62);font-size:14px;margin-top:5px;">
            ${row.requested_at ? new Date(row.requested_at).toLocaleString() : ""}
          </div>
        </div>
        <div style="text-align:right;">
          <strong style="color:${status === "paid" ? "#5ff0a8" : "#e0ac78"};">
            ${money(row.amount)}
          </strong>
          <div style="color:rgba(216,199,180,.62);font-size:14px;margin-top:5px;text-transform:capitalize;">
            ${status}
          </div>
        </div>
      `;

      wrapper.appendChild(item);
    });

    panel.appendChild(wrapper);
  }

  function applySummary(summary){
    const clean = {
      available_balance: Number(summary?.available_balance || 0),
      pending_payout: Number(summary?.pending_payout || 0),
      paid_total: Number(summary?.paid_total || 0)
    };

    window.__clipencyPayoutSummary = clean;

    setCardByLabel("Available Balance", money(clean.available_balance));
    setCardByLabel("Pending Payout", money(clean.pending_payout));
    setCardByLabel("Paid", money(clean.paid_total));
    forceTopThreeCards(clean);
  }

  async function refresh(){
    if(!isPayoutPage()) return;

    applySummary({
      available_balance: 0,
      pending_payout: 0,
      paid_total: 0
    });
    renderHistory([]);

    try{
      const summaryData = await rpc("my_payout_summary", {});
      const summary = Array.isArray(summaryData) ? summaryData[0] : summaryData;

      applySummary(summary);

      const historyData = await rpc("my_payout_history", {});
      renderHistory(Array.isArray(historyData) ? historyData : []);
    }catch(error){
      console.error("[Clipency payout live final]", error);
    }
  }

  function bindWithdraw(){
    if(!isPayoutPage()) return;

    const btn = allElements().find(el => {
      const tag = el.tagName.toLowerCase();
      return ["button", "a"].includes(tag) && /withdraw/i.test(textOf(el));
    });

    if(!btn || btn.dataset.clipencyFinalWithdraw === "true") return;

    btn.dataset.clipencyFinalWithdraw = "true";

    btn.addEventListener("click", async function(e){
      e.preventDefault();
      e.stopPropagation();

      try{
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
      }catch(error){
        console.error(error);
        alert("Withdrawal failed: " + (error.message || error));
      }
    }, true);
  }

  function boot(){
    if(!isPayoutPage()) return;

    refresh();
    bindWithdraw();

    setTimeout(refresh, 300);
    setTimeout(refresh, 1000);
    setTimeout(refresh, 2500);
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", boot);
  }else{
    boot();
  }

  window.addEventListener("load", boot);
})();
