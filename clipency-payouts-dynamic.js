(function(){
  window.CLIPENCY_PAYOUTS_DYNAMIC = "payouts-dynamic-v1";

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
    for(let i = 0; i < 40; i++){
      const sb = client();
      if(sb && sb.rpc && sb.auth) return sb;
      await new Promise(r => setTimeout(r, 150));
    }
    throw new Error("Supabase client missing");
  }

  function findCard(label){
    const nodes = Array.from(document.querySelectorAll("div,section,article"));
    return nodes
      .filter(el => clean(el.textContent).toLowerCase().includes(label.toLowerCase()))
      .sort((a,b) => a.getBoundingClientRect().height - b.getBoundingClientRect().height)[0];
  }

  function updateCard(label, value){
    const card = findCard(label);
    if(!card) return;

    const leaves = Array.from(card.querySelectorAll("*")).filter(el => !el.children.length);
    const target = leaves.find(el => /^\$[\d,]+/.test(clean(el.textContent)));

    if(target){
      target.textContent = money(value);
    }
  }

  function historyContainer(){
    const headings = Array.from(document.querySelectorAll("h1,h2,h3,h4,div,section"))
      .filter(el => /^Payout History$/i.test(clean(el.textContent)));

    const heading = headings[0];
    if(!heading) return null;

    return heading.closest("section,article,div") || heading.parentElement;
  }

  function renderHistory(items){
    const box = historyContainer();
    if(!box) return;

    const existingRows = Array.from(box.children).filter(el => !/Payout History/i.test(clean(el.textContent)));
    existingRows.forEach(el => el.remove());

    const wrap = document.createElement("div");
    wrap.style.display = "grid";
    wrap.style.gap = "14px";
    wrap.style.marginTop = "24px";

    if(!items.length){
      wrap.innerHTML = `<div style="color:rgba(216,199,180,.72);font-weight:800;">No payout history yet.</div>`;
      box.appendChild(wrap);
      return;
    }

    wrap.innerHTML = items.map(item => {
      const amount = Number(item.amount || 0);
      const status = clean(item.status || "pending");
      const title = clean(item.title || "Transaction");
      const date = item.created_at ? new Date(item.created_at).toLocaleDateString() : "";
      const color = status === "paid" || status === "available" || status === "approved"
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
            <div style="color:rgba(216,199,180,.62);font-size:13px;text-transform:capitalize;margin-top:5px;">${status.replaceAll("_"," ")}</div>
          </div>
        </div>
      `;
    }).join("");

    box.appendChild(wrap);
  }

  async function load(){
    const sb = await waitForSupabase();

    const { data, error } = await sb.rpc("clipency_my_payout_dashboard");

    if(error) throw error;

    const row = Array.isArray(data) ? data[0] : data;
    const history = Array.isArray(row?.history) ? row.history : [];

    updateCard("Available Balance", row?.available_balance || 0);
    updateCard("Pending Payout", row?.pending_payout || 0);
    updateCard("Paid", row?.paid_total || 0);
    renderHistory(history);
  }

  async function requestPayout(){
    try{
      const amountText = prompt("Enter payout amount:");
      if(amountText === null) return;

      const amount = Number(String(amountText).replace(/[^0-9.]/g, ""));
      if(!amount || amount <= 0){
        alert("Enter a valid amount.");
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
      if(/withdraw/i.test(clean(btn.textContent))){
        btn.onclick = function(e){
          e.preventDefault();
          e.stopPropagation();
          requestPayout();
        };
      }
    });
  }

  function boot(){
    bindWithdraw();
    load().catch(error => {
      console.error("[Clipency Payouts Dynamic]", error);
      renderHistory([]);
      updateCard("Available Balance", 0);
      updateCard("Pending Payout", 0);
      updateCard("Paid", 0);
    });
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", boot);
  }else{
    boot();
  }

  window.addEventListener("load", function(){
    setTimeout(boot, 700);
  });
})();
