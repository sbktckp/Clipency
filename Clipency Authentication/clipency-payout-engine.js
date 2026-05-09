
/* =====================================================
   CLIPENCY PAYOUT ENGINE
   Approved clips -> balance -> withdrawal -> admin payout -> paid
   No Clipper UI redesign. Data connection only.
   ===================================================== */
(function(){
  const MONEY = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  });

  function money(v){
    return MONEY.format(Number(v || 0));
  }

  function cleanMoney(v){
    return Number(String(v || "").replace(/[^0-9.]/g, "")) || 0;
  }

  function lower(v){
    return String(v || "").toLowerCase().trim();
  }

  function isApprovedSubmission(s){
    return ["approved", "paid"].includes(lower(s.status))
      || ["approved", "paid"].includes(lower(s.review_status));
  }

  function isActivePayoutStatus(status){
    return ["pending", "processing", "approved", "paid"].includes(lower(status));
  }

  function isPendingPayoutStatus(status){
    return ["pending", "processing", "approved"].includes(lower(status));
  }

  function getUserName(user){
    const m = user.user_metadata || {};
    return m.full_name || m.name || m.display_name || user.email || "Clipper";
  }

  function getClient(){
    return window.clipencySupabase || window.supabaseClient || window.sbClient || window.supabase || null;
  }

  function loadScript(src){
    return new Promise((resolve, reject) => {
      if(document.querySelector(`script[src="${src}"]`)) return resolve();
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  async function waitClient(){
    for(let i = 0; i < 30; i++){
      const client = getClient();
      if(client && client.auth && client.from) return client;
      await new Promise(r => setTimeout(r, 150));
    }

    try{
      await loadScript("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2");
      await loadScript("/supabaseClient.js?v=payout-engine");
    }catch(e){}

    for(let i = 0; i < 30; i++){
      const client = getClient();
      if(client && client.auth && client.from) return client;
      await new Promise(r => setTimeout(r, 150));
    }

    return null;
  }

  async function getSessionUser(){
    const client = await waitClient();
    if(!client) return { client:null, user:null };

    const { data } = await client.auth.getUser();
    return { client, user: data && data.user ? data.user : null };
  }

  async function getPrimaryPaymentMethod(client, userId){
    const { data, error } = await client
      .from("user_payment_methods")
      .select("*")
      .eq("user_id", userId)
      .eq("is_primary", true)
      .maybeSingle();

    if(error) throw error;
    return data || null;
  }

  function paymentSnapshot(method){
    if(!method) return null;

    return {
      method_type: method.method_type || "",
      account_name: method.account_name || "",
      upi_id: method.upi_id || "",
      paypal_email: method.paypal_email || "",
      bank_name: method.bank_name || "",
      bank_account: method.bank_account || "",
      ifsc: method.ifsc || "",
      extra_details: method.extra_details || ""
    };
  }

  async function getPayoutSummary(client, user){
    const userId = user.id;

    const { data: submissions, error: subError } = await client
      .from("submissions")
      .select("id,campaign_id,campaign_title,views,earnings,status,review_status,payout_status,submitted_at")
      .or(`user_id.eq.${userId},clipper_id.eq.${userId}`);

    if(subError) throw subError;

    const approved = (submissions || []).filter(isApprovedSubmission);
    const approvedEarnings = approved.reduce((sum, s) => sum + Number(s.earnings || 0), 0);

    const { data: requests, error: reqError } = await client
      .from("payout_requests")
      .select("*")
      .eq("user_id", userId)
      .order("requested_at", { ascending:false });

    if(reqError) throw reqError;

    const activeRequests = (requests || []).filter(r => isActivePayoutStatus(r.status));
    const pendingRequests = (requests || []).filter(r => isPendingPayoutStatus(r.status));
    const paidRequests = (requests || []).filter(r => lower(r.status) === "paid");

    const locked = activeRequests.reduce((sum, r) => sum + Number(r.amount || 0), 0);
    const pending = pendingRequests.reduce((sum, r) => sum + Number(r.amount || 0), 0);
    const paid = paidRequests.reduce((sum, r) => sum + Number(r.amount || 0), 0);
    const available = Math.max(0, approvedEarnings - locked);

    return {
      approved,
      requests: requests || [],
      approvedEarnings,
      available,
      pending,
      paid
    };
  }

  function findCardByText(text){
    const needle = lower(text);
    const all = Array.from(document.querySelectorAll("section,article,div"));
    return all.find(el => {
      const own = lower(el.textContent);
      if(!own.includes(needle)) return false;
      const moneyNodes = Array.from(el.querySelectorAll("*")).filter(x => /\$[\d,.]+/.test(x.textContent || ""));
      return moneyNodes.length;
    });
  }

  function setMoneyInCard(label, value){
    const card = findCardByText(label);
    if(!card) return;

    const candidates = Array.from(card.querySelectorAll("*"))
      .filter(x => /^\s*\$[\d,.]+/.test(x.textContent || ""))
      .sort((a,b) => (b.textContent || "").length - (a.textContent || "").length);

    if(candidates[0]){
      candidates[0].textContent = money(value);
    }
  }

  function setTextNearLabel(label, value){
    setMoneyInCard(label, value);
  }

  function injectPayoutStyles(){
    if(document.getElementById("cx-payout-engine-style")) return;

    const style = document.createElement("style");
    style.id = "cx-payout-engine-style";
    style.textContent = `
      .cx-payout-modal-backdrop{
        position:fixed;inset:0;z-index:2147482500;
        background:rgba(0,0,0,.72);backdrop-filter:blur(12px);
        display:flex;align-items:center;justify-content:center;padding:22px;
      }
      .cx-payout-modal{
        width:min(520px,100%);
        border:1px solid rgba(196,149,106,.28);
        border-radius:26px;
        background:linear-gradient(145deg,rgba(36,24,15,.96),rgba(10,7,5,.98));
        box-shadow:0 30px 90px rgba(0,0,0,.45);
        color:#fff8ef;
        padding:28px;
        font-family:inherit;
      }
      .cx-payout-modal h3{margin:0 0 8px;font-size:28px;color:#fff8ef;}
      .cx-payout-modal p{margin:0 0 18px;color:rgba(216,199,180,.76);line-height:1.45;}
      .cx-payout-modal input,.cx-payout-modal select,.cx-payout-modal textarea{
        width:100%;height:52px;border-radius:16px;
        border:1px solid rgba(224,172,120,.38);
        background:rgba(255,255,255,.045);
        color:#fff8ef;
        padding:0 14px;
        margin:8px 0 14px;
        box-sizing:border-box;
      }
      .cx-payout-modal textarea{height:92px;padding:14px;resize:vertical;}
      .cx-payout-actions{display:flex;gap:12px;justify-content:flex-end;margin-top:10px;}
      .cx-payout-actions button{
        height:48px;border-radius:15px;border:1px solid rgba(224,172,120,.30);
        padding:0 18px;font-weight:800;cursor:pointer;
      }
      .cx-payout-cancel{background:rgba(255,255,255,.045);color:#fff8ef;}
      .cx-payout-submit{background:linear-gradient(135deg,#c4956a,#e0ac78);color:#130d08;}
      .cx-live-history,.cx-wallet-card,.cx-admin-payout-card{
        border:1px solid rgba(196,149,106,.22);
        border-radius:24px;
        background:linear-gradient(145deg,rgba(36,24,15,.88),rgba(10,7,5,.92));
        padding:22px;
        margin-top:22px;
        color:#fff8ef;
      }
      .cx-history-row,.cx-admin-payout-row{
        display:flex;justify-content:space-between;gap:16px;
        padding:16px 0;border-bottom:1px solid rgba(196,149,106,.12);
      }
      .cx-history-row:last-child,.cx-admin-payout-row:last-child{border-bottom:0;}
      .cx-muted{color:rgba(216,199,180,.68);}
      .cx-success{color:#22c55e;}
      .cx-warning{color:#e0ac78;}
      .cx-danger{color:#ef4444;}
      .cx-admin-payout-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;}
      .cx-admin-payout-actions button{
        border-radius:12px;border:1px solid rgba(224,172,120,.32);
        background:rgba(255,255,255,.045);color:#fff8ef;
        padding:10px 12px;font-weight:800;
      }
      .cx-admin-payout-actions .paid{
        background:linear-gradient(135deg,#c4956a,#e0ac78);color:#130d08;
      }
      @media(max-width:700px){
        .cx-history-row,.cx-admin-payout-row{flex-direction:column;}
        .cx-payout-actions{flex-direction:column;}
      }
    `;
    document.head.appendChild(style);
  }

  function showNotice(title, message){
    injectPayoutStyles();

    const old = document.querySelector(".cx-payout-modal-backdrop");
    if(old) old.remove();

    const wrap = document.createElement("div");
    wrap.className = "cx-payout-modal-backdrop";
    wrap.innerHTML = `
      <div class="cx-payout-modal">
        <h3>${title}</h3>
        <p>${message}</p>
        <div class="cx-payout-actions">
          <button class="cx-payout-submit" type="button">Close</button>
        </div>
      </div>
    `;

    document.body.appendChild(wrap);
    wrap.querySelector("button").onclick = () => wrap.remove();
  }

  function showWithdrawModal(available, onSubmit){
    injectPayoutStyles();

    const old = document.querySelector(".cx-payout-modal-backdrop");
    if(old) old.remove();

    const wrap = document.createElement("div");
    wrap.className = "cx-payout-modal-backdrop";
    wrap.innerHTML = `
      <div class="cx-payout-modal">
        <h3>Withdraw earnings</h3>
        <p>Available balance: <strong>${money(available)}</strong>. Enter the amount you want to withdraw.</p>
        <input id="cx-withdraw-amount" type="number" min="1" step="0.01" placeholder="Amount in USD">
        <div class="cx-payout-actions">
          <button class="cx-payout-cancel" type="button">Cancel</button>
          <button class="cx-payout-submit" type="button">Submit request</button>
        </div>
      </div>
    `;

    document.body.appendChild(wrap);

    const input = wrap.querySelector("#cx-withdraw-amount");
    input.focus();

    wrap.querySelector(".cx-payout-cancel").onclick = () => wrap.remove();

    wrap.querySelector(".cx-payout-submit").onclick = async () => {
      const amount = cleanMoney(input.value);

      if(amount <= 0){
        showNotice("Invalid amount", "Please enter a valid withdrawal amount.");
        return;
      }

      if(amount > available){
        showNotice("Insufficient balance", `You can withdraw up to ${money(available)} only.`);
        return;
      }

      wrap.remove();
      await onSubmit(amount);
    };
  }

  function findMain(){
    return document.querySelector("main")
      || document.querySelector(".main")
      || document.querySelector(".content")
      || document.querySelector("[class*='content']")
      || document.body;
  }

  function renderClipperHistory(summary){
    const main = findMain();

    let host = document.getElementById("cx-live-payout-history");
    if(!host){
      host = document.createElement("section");
      host.id = "cx-live-payout-history";
      host.className = "cx-live-history";
      host.innerHTML = `<h3 style="margin:0 0 12px;">Live payout history</h3><div class="cx-history-list"></div>`;

      const headings = Array.from(document.querySelectorAll("h1,h2,h3,h4")).filter(h =>
        lower(h.textContent).includes("payout history")
      );

      if(headings[0] && headings[0].parentElement){
        headings[0].parentElement.appendChild(host);
      }else{
        main.appendChild(host);
      }
    }

    const list = host.querySelector(".cx-history-list");
    const rows = summary.requests || [];

    if(!rows.length){
      list.innerHTML = `<p class="cx-muted">No withdrawal requests yet.</p>`;
      return;
    }

    list.innerHTML = rows.slice(0, 8).map(r => {
      const status = lower(r.status);
      const cls = status === "paid" ? "cx-success" : status === "rejected" ? "cx-danger" : "cx-warning";
      const date = r.requested_at ? new Date(r.requested_at).toLocaleDateString() : "";
      return `
        <div class="cx-history-row">
          <div>
            <strong>Withdrawal request</strong>
            <div class="cx-muted">${date}</div>
          </div>
          <div style="text-align:right;">
            <strong class="${cls}">${money(r.amount)}</strong>
            <div class="cx-muted">${r.status}</div>
          </div>
        </div>
      `;
    }).join("");
  }

  async function initClipperPayouts(){
    const { client, user } = await getSessionUser();
    if(!client || !user) return;

    let summary;

    try{
      summary = await getPayoutSummary(client, user);
    }catch(error){
      console.error("Payout summary failed:", error);
      return;
    }

    setTextNearLabel("available balance", summary.available);
    setTextNearLabel("pending payout", summary.pending);
    setTextNearLabel("paid", summary.paid);
    renderClipperHistory(summary);

    document.addEventListener("click", async function(e){
      const btn = e.target.closest("button,a,[role='button']");
      if(!btn) return;

      const text = lower(btn.textContent);
      if(!text.includes("withdraw")) return;

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      let fresh;
      try{
        fresh = await getPayoutSummary(client, user);
      }catch(error){
        showNotice("Unable to load balance", error.message);
        return;
      }

      if(fresh.available <= 0){
        showNotice("No available balance", "You need approved unpaid clip earnings before requesting a withdrawal.");
        return;
      }

      showWithdrawModal(fresh.available, async function(amount){
        try{
          const method = await getPrimaryPaymentMethod(client, user.id);

          if(!method){
            showNotice("Payment method required", "Please add a primary payment method in Wallet before withdrawing.");
            return;
          }

          const payload = {
            user_id: user.id,
            email: user.email || "",
            display_name: getUserName(user),
            amount,
            currency: "USD",
            status: "pending",
            payment_method_id: method.id,
            payment_snapshot: paymentSnapshot(method)
          };

          const { error } = await client
            .from("payout_requests")
            .insert(payload);

          if(error) throw error;

          const updated = await getPayoutSummary(client, user);

          setTextNearLabel("available balance", updated.available);
          setTextNearLabel("pending payout", updated.pending);
          setTextNearLabel("paid", updated.paid);
          renderClipperHistory(updated);

          showNotice(
            "Withdrawal request submitted",
            `Your request to withdraw <strong>${money(amount)}</strong> has been sent to the Clipency finance team.`
          );
        }catch(error){
          showNotice("Withdrawal failed", error.message || "Something went wrong.");
        }
      });
    }, true);
  }

  async function initWalletPaymentMethod(){
    const { client, user } = await getSessionUser();
    if(!client || !user) return;

    injectPayoutStyles();

    const main = findMain();

    let panel = document.getElementById("cx-primary-payment-panel");
    if(!panel){
      panel = document.createElement("section");
      panel.id = "cx-primary-payment-panel";
      panel.className = "cx-wallet-card";
      panel.innerHTML = `
        <h3 style="margin:0 0 8px;">Primary payment method</h3>
        <p class="cx-muted" style="margin:0 0 16px;">This method will be sent to Admin OS when you request a withdrawal.</p>

        <label class="cx-muted">Method type</label>
        <select id="cx-method-type">
          <option value="UPI">UPI</option>
          <option value="PayPal">PayPal</option>
          <option value="Bank">Bank Transfer</option>
          <option value="Other">Other</option>
        </select>

        <label class="cx-muted">Account name</label>
        <input id="cx-account-name" placeholder="Account holder name">

        <label class="cx-muted">UPI ID</label>
        <input id="cx-upi-id" placeholder="example@upi">

        <label class="cx-muted">PayPal email</label>
        <input id="cx-paypal-email" placeholder="name@example.com">

        <label class="cx-muted">Bank details / extra details</label>
        <textarea id="cx-extra-details" placeholder="Bank name, account number, IFSC, or any required payment details"></textarea>

        <div class="cx-payout-actions">
          <button class="cx-payout-submit" id="cx-save-payment-method" type="button">Save primary method</button>
        </div>

        <p id="cx-payment-status" class="cx-muted" style="margin-top:14px;"></p>
      `;

      main.appendChild(panel);
    }

    const status = panel.querySelector("#cx-payment-status");

    async function loadMethod(){
      try{
        const method = await getPrimaryPaymentMethod(client, user.id);

        if(!method){
          status.textContent = "No primary payment method added yet.";
          return;
        }

        panel.querySelector("#cx-method-type").value = method.method_type || "UPI";
        panel.querySelector("#cx-account-name").value = method.account_name || "";
        panel.querySelector("#cx-upi-id").value = method.upi_id || "";
        panel.querySelector("#cx-paypal-email").value = method.paypal_email || "";
        panel.querySelector("#cx-extra-details").value = method.extra_details || "";

        status.textContent = "Primary payment method is saved.";
      }catch(error){
        status.textContent = error.message;
      }
    }

    panel.querySelector("#cx-save-payment-method").onclick = async () => {
      try{
        const payload = {
          user_id: user.id,
          method_type: panel.querySelector("#cx-method-type").value,
          account_name: panel.querySelector("#cx-account-name").value.trim(),
          upi_id: panel.querySelector("#cx-upi-id").value.trim(),
          paypal_email: panel.querySelector("#cx-paypal-email").value.trim(),
          extra_details: panel.querySelector("#cx-extra-details").value.trim(),
          is_primary: true
        };

        await client
          .from("user_payment_methods")
          .update({ is_primary:false })
          .eq("user_id", user.id);

        const { error } = await client
          .from("user_payment_methods")
          .insert(payload);

        if(error) throw error;

        status.textContent = "Primary payment method saved successfully.";
      }catch(error){
        status.textContent = error.message || "Unable to save payment method.";
      }
    };

    loadMethod();
  }

  async function initAdminPayouts(){
    const { client, user } = await getSessionUser();
    if(!client || !user) return;

    injectPayoutStyles();

    const main = findMain();

    let panel = document.getElementById("cx-admin-live-payouts");
    if(!panel){
      panel = document.createElement("section");
      panel.id = "cx-admin-live-payouts";
      panel.className = "cx-admin-payout-card";
      panel.innerHTML = `
        <h2 style="margin:0 0 8px;">Live payout requests</h2>
        <p class="cx-muted" style="margin:0 0 16px;">Requests created by clippers after withdrawal. Mark paid only after finance transfer is complete.</p>
        <div id="cx-admin-payout-list"><p class="cx-muted">Loading payout requests...</p></div>
      `;

      const h = Array.from(document.querySelectorAll("h1,h2,h3")).find(x =>
        lower(x.textContent).includes("payout")
      );

      if(h && h.parentElement){
        h.parentElement.appendChild(panel);
      }else{
        main.prepend(panel);
      }
    }

    async function loadRequests(){
      const list = panel.querySelector("#cx-admin-payout-list");

      const { data, error } = await client
        .from("payout_requests")
        .select("*")
        .order("requested_at", { ascending:false })
        .limit(100);

      if(error){
        list.innerHTML = `<p class="cx-danger">${error.message}</p>`;
        return;
      }

      const rows = data || [];

      if(!rows.length){
        list.innerHTML = `<p class="cx-muted">No payout requests yet.</p>`;
        return;
      }

      list.innerHTML = rows.map(r => {
        const p = r.payment_snapshot || {};
        const method = [
          p.method_type,
          p.upi_id ? `UPI: ${p.upi_id}` : "",
          p.paypal_email ? `PayPal: ${p.paypal_email}` : "",
          p.extra_details ? p.extra_details : ""
        ].filter(Boolean).join(" • ");

        const date = r.requested_at ? new Date(r.requested_at).toLocaleString() : "";

        return `
          <div class="cx-admin-payout-row" data-payout-id="${r.id}">
            <div>
              <strong>${r.display_name || "Clipper"}</strong>
              <div class="cx-muted">${r.email || ""}</div>
              <div class="cx-muted">${date}</div>
              <div style="margin-top:8px;"><strong>Payment:</strong> ${method || "No payment method snapshot"}</div>
              ${r.admin_note ? `<div class="cx-muted">Note: ${r.admin_note}</div>` : ""}
            </div>
            <div style="text-align:right;min-width:180px;">
              <strong style="font-size:22px;">${money(r.amount)}</strong>
              <div class="cx-muted">${r.status}</div>
              <div class="cx-admin-payout-actions">
                ${
                  lower(r.status) !== "paid"
                    ? `<button class="paid" data-action="paid">Mark paid</button>`
                    : ""
                }
                ${
                  lower(r.status) === "pending"
                    ? `<button data-action="processing">Processing</button><button data-action="rejected">Reject</button>`
                    : ""
                }
              </div>
            </div>
          </div>
        `;
      }).join("");
    }

    panel.addEventListener("click", async function(e){
      const btn = e.target.closest("button[data-action]");
      if(!btn) return;

      const row = btn.closest("[data-payout-id]");
      const id = row && row.dataset.payoutId;
      const action = btn.dataset.action;

      if(!id || !action) return;

      const updates = {
        status: action,
        processed_by: user.id
      };

      if(action === "paid"){
        updates.paid_at = new Date().toISOString();
        updates.approved_at = new Date().toISOString();
      }

      if(action === "processing"){
        updates.approved_at = new Date().toISOString();
      }

      if(action === "rejected"){
        updates.rejected_at = new Date().toISOString();
      }

      const { error } = await client
        .from("payout_requests")
        .update(updates)
        .eq("id", id);

      if(error){
        showNotice("Payout update failed", error.message);
        return;
      }

      await loadRequests();
    });

    loadRequests();
    setInterval(loadRequests, 60000);
  }

  function boot(){
    const path = location.pathname.replace(/\/+$/, "");

    if(path === "/payouts"){
      initClipperPayouts();
    }

    if(path === "/wallet"){
      initWalletPaymentMethod();
    }

    if(path === "/admin/payouts"){
      initAdminPayouts();
    }
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", boot);
  }else{
    boot();
  }

  window.addEventListener("load", boot);
})();
