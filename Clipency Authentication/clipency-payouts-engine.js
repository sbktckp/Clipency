
(function(){
  function money(n){
    const value = Number(n || 0);
    return "$" + value.toLocaleString(undefined, {
      minimumFractionDigits: value % 1 ? 2 : 0,
      maximumFractionDigits: 2
    });
  }

  function getConfig(){
    const url = window.CLIPENCY_SUPABASE_URL;
    const key = window.CLIPENCY_SUPABASE_ANON_KEY;

    if(url && key){
      return { url, key };
    }

    const c = window.clipencySupabase || window.supabaseClient || window.sbClient;
    if(c && c.supabaseUrl && c.supabaseKey){
      return { url: c.supabaseUrl, key: c.supabaseKey };
    }

    return null;
  }

  async function getToken(){
    try{
      const c = window.clipencySupabase || window.supabaseClient || window.sbClient;
      if(c && c.auth && c.auth.getSession){
        const result = await c.auth.getSession();
        return result?.data?.session?.access_token || null;
      }
    }catch(e){}
    return null;
  }

  async function rpc(name, body){
    const config = getConfig();
    if(!config) throw new Error("Supabase config not found");

    const token = await getToken();

    const res = await fetch(`${config.url}/rest/v1/rpc/${name}`, {
      method: "POST",
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${token || config.key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body || {})
    });

    const text = await res.text();

    if(!res.ok){
      throw new Error(text || `RPC failed: ${name}`);
    }

    try{
      return JSON.parse(text);
    }catch(e){
      return text;
    }
  }

  function findCard(label){
    const wanted = label.toLowerCase();
    const nodes = Array.from(document.querySelectorAll("body *"));

    const labelNode = nodes.find(el => {
      const text = (el.textContent || "").trim().toLowerCase();
      return text === wanted || text.includes(wanted);
    });

    if(!labelNode) return null;

    let node = labelNode;
    for(let i = 0; i < 8 && node; i++){
      const rect = node.getBoundingClientRect();
      if(rect.width > 180 && rect.height > 90){
        return node;
      }
      node = node.parentElement;
    }

    return labelNode.parentElement || labelNode;
  }

  function setCardValue(label, value){
    const card = findCard(label);
    if(!card) return;

    const candidates = Array.from(card.querySelectorAll("*"))
      .filter(el => {
        const text = (el.textContent || "").trim();
        return /^\$[\d,]+/.test(text) || text === "$0" || /balance|payout|paid/i.test(text);
      })
      .sort((a,b) => {
        const fa = parseFloat(getComputedStyle(a).fontSize || "0");
        const fb = parseFloat(getComputedStyle(b).fontSize || "0");
        return fb - fa;
      });

    const target = candidates.find(el => /^\$/.test((el.textContent || "").trim())) || candidates[0];

    if(target){
      target.textContent = value;
    }
  }

  async function refreshPayouts(){
    const data = await rpc("my_payout_summary", {});
    const row = Array.isArray(data) ? data[0] : data;

    setCardValue("Available Balance", money(row.available_balance));
    setCardValue("Pending Payout", money(row.pending_payout));
    setCardValue("Paid", money(row.paid_total));

    window.__cxPayoutSummary = row;
  }

  function bindWithdraw(){
    const buttons = Array.from(document.querySelectorAll("button, a, [role='button']"));
    const withdraw = buttons.find(b => /withdraw/i.test(b.textContent || ""));

    if(!withdraw || withdraw.dataset.cxPayoutBound === "true") return;

    withdraw.dataset.cxPayoutBound = "true";

    withdraw.addEventListener("click", async function(e){
      e.preventDefault();
      e.stopPropagation();

      try{
        const summary = window.__cxPayoutSummary || {};
        const available = Number(summary.available_balance || 0);

        if(available <= 0){
          alert("Available balance is $0. Nothing to withdraw yet.");
          return;
        }

        const input = prompt(`Enter withdrawal amount. Available: ${money(available)}`, String(available));

        if(input === null) return;

        const amount = Number(String(input).replace(/[^0-9.]/g, ""));

        if(!amount || amount <= 0){
          alert("Enter a valid amount.");
          return;
        }

        if(amount > available){
          alert(`Amount is higher than available balance. Available: ${money(available)}`);
          return;
        }

        await rpc("request_my_payout", { p_amount: amount });

        alert("Withdrawal request submitted.");
        await refreshPayouts();
      }catch(error){
        console.error(error);
        alert("Withdrawal failed: " + (error.message || error));
      }
    }, true);
  }

  async function boot(){
    if(!/\/payouts\/?$/.test(location.pathname)) return;

    try{
      await refreshPayouts();
      bindWithdraw();
      setInterval(refreshPayouts, 30000);
    }catch(error){
      console.error("[Clipency payouts engine]", error);
    }
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", boot);
  }else{
    boot();
  }

  window.addEventListener("load", boot);
})();
