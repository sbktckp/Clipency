(function(){
  window.CLIPENCY_ADMIN_REVIEW_LIVE_FINAL = "review-live-v1";

  function isReviewPage(){
    return location.pathname.replace(/\/+$/, "") === "/admin/review" ||
           location.pathname.replace(/\/+$/, "") === "/admin/reviews";
  }

  function sb(){
    return window.clipencySupabase || window.supabaseClient || window.sbClient || null;
  }

  async function rpc(name, body){
    const client = sb();
    if(!client?.auth?.getSession) throw new Error("Supabase client missing");

    const session = await client.auth.getSession();
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
    if(!res.ok) throw new Error(text);

    try { return JSON.parse(text); }
    catch(e) { return text; }
  }

  function findReviewTable(){
    const headings = Array.from(document.querySelectorAll("h1,h2,h3,div,strong"))
      .filter(el => /review queue|submissions/i.test(el.textContent || ""));

    const h = headings[0];
    if(!h) return null;

    let node = h;
    for(let i = 0; i < 10 && node; i++){
      const r = node.getBoundingClientRect();
      if(r.width > 500 && r.height > 180) return node;
      node = node.parentElement;
    }
    return h.parentElement;
  }

  function money(n){
    return "$" + Number(n || 0).toLocaleString(undefined, {
      maximumFractionDigits: 2
    });
  }

  async function approve(id){
    const entered = prompt("Enter payout amount for this approved clip:", "0");
    if(entered === null) return;

    const amount = Number(String(entered).replace(/[^0-9.]/g, ""));
    if(Number.isNaN(amount) || amount < 0){
      alert("Enter a valid amount.");
      return;
    }

    await rpc("approve_submission_with_earning", {
      p_submission_id: id,
      p_earning: amount
    });

    alert("Submission approved.");
    await load();
  }

  async function reject(id){
    const reason = prompt("Reason for rejection:", "");
    if(reason === null) return;

    await rpc("reject_submission_with_reason", {
      p_submission_id: id,
      p_reason: reason
    });

    alert("Submission rejected.");
    await load();
  }

  function render(rows){
    const panel = findReviewTable();
    if(!panel) return;

    panel.innerHTML = `
      <div style="padding:28px;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:18px;">
          <h2 style="margin:0;color:#fff8ef;font-size:34px;">Review queue</h2>
          <span style="padding:10px 16px;border-radius:999px;background:rgba(224,172,120,.14);color:#e0ac78;font-weight:800;">
            Live
          </span>
        </div>

        <div style="overflow:auto;border-top:1px solid rgba(224,172,120,.18);">
          <table style="width:100%;border-collapse:collapse;min-width:980px;">
            <thead>
              <tr style="color:#e0ac78;text-transform:uppercase;letter-spacing:.14em;font-size:12px;">
                <th style="text-align:left;padding:16px 10px;">Creator</th>
                <th style="text-align:left;padding:16px 10px;">Campaign</th>
                <th style="text-align:left;padding:16px 10px;">Proof</th>
                <th style="text-align:left;padding:16px 10px;">Platform</th>
                <th style="text-align:left;padding:16px 10px;">Earnings</th>
                <th style="text-align:left;padding:16px 10px;">Status</th>
                <th style="text-align:right;padding:16px 10px;">Actions</th>
              </tr>
            </thead>
            <tbody id="cx-review-body"></tbody>
          </table>
        </div>
      </div>
    `;

    const body = panel.querySelector("#cx-review-body");

    if(!rows || !rows.length){
      body.innerHTML = `
        <tr>
          <td colspan="7" style="padding:26px 10px;color:rgba(216,199,180,.72);font-weight:700;">
            No submitted clips found.
          </td>
        </tr>
      `;
      return;
    }

    body.innerHTML = rows.map(row => {
      const status = String(row.review_status || row.status || "pending").toLowerCase();
      const proof = row.proof_url || row.post_url || row.video_url || "";

      return `
        <tr style="border-top:1px solid rgba(224,172,120,.12);color:#fff8ef;">
          <td style="padding:18px 10px;">
            <strong>${row.creator_name || "Creator"}</strong>
            <div style="color:rgba(216,199,180,.62);font-size:13px;">${row.account_handle || ""}</div>
          </td>
          <td style="padding:18px 10px;">
            <strong>${row.campaign_title || "Campaign"}</strong>
          </td>
          <td style="padding:18px 10px;">
            ${proof ? `<a href="${proof}" target="_blank" style="color:#e0ac78;">Open</a>` : `<span style="color:rgba(216,199,180,.55);">No link</span>`}
          </td>
          <td style="padding:18px 10px;">${row.platform || "Instagram"}</td>
          <td style="padding:18px 10px;">${money(row.current_earnings || row.earnings || 0)}</td>
          <td style="padding:18px 10px;text-transform:capitalize;">${status}</td>
          <td style="padding:18px 10px;text-align:right;">
            ${
              status === "pending"
              ? `
                <button data-approve="${row.id}" style="padding:10px 14px;border-radius:999px;border:1px solid rgba(139,92,246,.5);background:#5b2bbf;color:white;font-weight:800;">Approve</button>
                <button data-reject="${row.id}" style="padding:10px 14px;border-radius:999px;border:1px solid rgba(255,80,80,.35);background:rgba(255,80,80,.12);color:#ffb4b4;font-weight:800;margin-left:8px;">Reject</button>
              `
              : `<span style="color:rgba(216,199,180,.6);">Reviewed</span>`
            }
          </td>
        </tr>
      `;
    }).join("");

    body.querySelectorAll("[data-approve]").forEach(btn => {
      btn.addEventListener("click", () => approve(btn.dataset.approve));
    });

    body.querySelectorAll("[data-reject]").forEach(btn => {
      btn.addEventListener("click", () => reject(btn.dataset.reject));
    });
  }

  async function load(){
    if(!isReviewPage()) return;

    try{
      const rows = await rpc("admin_review_queue", {});
      render(Array.isArray(rows) ? rows : []);
    }catch(error){
      console.error("[Admin Review Live]", error);
      const panel = findReviewTable();
      if(panel){
        panel.innerHTML = `
          <div style="padding:28px;color:#ff7777;font-weight:800;">
            Could not load review queue: ${error.message || error}
          </div>
        `;
      }
    }
  }

  function boot(){
    if(!isReviewPage()) return;
    load();
    setInterval(load, 15000);
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", boot);
  }else{
    boot();
  }

  window.addEventListener("load", boot);
})();
