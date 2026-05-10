(function(){
  window.CLIPENCY_REJECTION_APPEAL_V1 = "appeal-live-v1";

  function clean(v){
    return String(v || "").replace(/\s+/g, " ").trim();
  }

  function path(){
    return location.pathname.replace(/\/+$/, "").toLowerCase();
  }

  function isStats(){
    return path() === "/stats";
  }

  function isAdminReview(){
    return path() === "/admin/review" || path() === "/admin/reviews";
  }

  function sb(){
    return window.clipencySupabase || window.supabaseClient || window.sbClient || null;
  }

  async function rpc(name, payload){
    const client = sb();
    if(!client?.rpc) throw new Error("Supabase client missing.");

    const { data, error } = await client.rpc(name, payload || {});
    if(error) throw error;

    return data;
  }

  function formatDate(v){
    if(!v) return "—";
    try { return new Date(v).toLocaleString(); }
    catch(e){ return "—"; }
  }

  function findRejectedPanel(){
    const headings = Array.from(document.querySelectorAll("body *"))
      .filter(el => /rejected submissions/i.test(clean(el.textContent)));

    const heading = headings[0];
    if(!heading) return null;

    let node = heading;
    for(let i = 0; i < 10 && node; i++){
      const r = node.getBoundingClientRect();
      if(r.width > 500 && r.height > 140) return node;
      node = node.parentElement;
    }

    return heading.parentElement;
  }

  function showAppealModal(row){
    const old = document.getElementById("cx-appeal-modal");
    if(old) old.remove();

    const modal = document.createElement("div");
    modal.id = "cx-appeal-modal";
    modal.style.cssText = `
      position:fixed;inset:0;z-index:999999;
      background:rgba(0,0,0,.72);
      display:flex;align-items:center;justify-content:center;
      padding:24px;
      backdrop-filter:blur(10px);
    `;

    modal.innerHTML = `
      <div style="
        width:min(560px,96vw);
        background:linear-gradient(145deg,rgba(33,24,18,.98),rgba(15,11,8,.98));
        border:1px solid rgba(224,172,120,.28);
        border-radius:26px;
        padding:28px;
        color:#fff8ef;
        box-shadow:0 30px 90px rgba(0,0,0,.55);
      ">
        <div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start;">
          <div>
            <div style="color:#ff6b6b;letter-spacing:.18em;text-transform:uppercase;font-size:11px;font-weight:900;">
              Rejection Notice
            </div>
            <h2 style="margin:10px 0 8px;font-size:25px;">
              ${row.campaign_title || "Rejected clip"} · ${row.platform || "Platform"}
            </h2>
          </div>
          <button id="cx-close-appeal" style="
            width:40px;height:40px;border-radius:12px;border:1px solid rgba(255,255,255,.12);
            background:rgba(255,255,255,.06);color:white;font-size:24px;cursor:pointer;
          ">×</button>
        </div>

        <div style="
          margin-top:18px;
          padding:18px;
          border-radius:16px;
          border:1px solid rgba(255,90,90,.24);
          background:rgba(255,80,80,.08);
          color:rgba(255,248,239,.86);
          line-height:1.6;
        ">
          <strong style="color:#ffb4b4;">Reason:</strong><br>
          ${row.rejection_reason || "No rejection reason added by admin."}
        </div>

        <div style="margin-top:16px;">
          <strong>Rejected clip:</strong>
          ${
            row.proof_url
            ? `<a href="${row.proof_url}" target="_blank" style="color:#e0ac78;margin-left:8px;">Open submitted clip ↗</a>`
            : `<span style="color:rgba(216,199,180,.65);margin-left:8px;">No proof link found</span>`
          }
        </div>

        ${
          row.appeal_note
          ? `
            <div style="
              margin-top:16px;
              padding:14px 16px;
              border-radius:14px;
              background:rgba(224,172,120,.08);
              border:1px solid rgba(224,172,120,.2);
              color:rgba(255,248,239,.82);
            ">
              <strong>Your appeal:</strong><br>${row.appeal_note}
              <div style="margin-top:8px;color:#e0ac78;text-transform:capitalize;">
                Status: ${row.appeal_status || "pending"}
              </div>
            </div>
          `
          : `
            <label style="display:block;margin-top:20px;color:rgba(216,199,180,.8);">
              Send an appeal note to admin for re-review:
            </label>
            <textarea id="cx-appeal-note" style="
              width:100%;min-height:110px;margin-top:10px;
              border-radius:16px;border:1px solid rgba(224,172,120,.55);
              background:rgba(255,255,255,.04);color:#fff8ef;
              padding:14px;font-size:16px;outline:none;resize:vertical;
            " placeholder="Explain why this clip should be reviewed again..."></textarea>

            <button id="cx-send-appeal" style="
              width:100%;margin-top:16px;padding:15px 18px;border-radius:16px;
              border:0;background:#e0ac78;color:#090706;font-weight:900;
              cursor:pointer;font-size:16px;
            ">Send Appeal</button>
          `
        }
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector("#cx-close-appeal")?.addEventListener("click", () => modal.remove());

    modal.querySelector("#cx-send-appeal")?.addEventListener("click", async () => {
      const note = clean(modal.querySelector("#cx-appeal-note")?.value);

      if(!note){
        alert("Please write an appeal note.");
        return;
      }

      try{
        await rpc("appeal_rejected_submission_v2", {
          p_submission_id: row.id,
          p_appeal_note: note
        });

        alert("Appeal sent to admin.");
        modal.remove();
        loadRejectedStats();
      }catch(error){
        console.error(error);
        alert("Appeal failed: " + (error.message || JSON.stringify(error)));
      }
    });
  }

  function renderRejectedStats(rows){
    const panel = findRejectedPanel();
    if(!panel) return;

    panel.innerHTML = `
      <div style="padding:28px 34px;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:18px;">
          <h2 style="margin:0;color:#fff8ef;font-size:26px;">Rejected Submissions</h2>
          <span style="padding:9px 14px;border-radius:999px;background:rgba(255,80,80,.12);color:#ffb4b4;font-weight:900;">
            Live
          </span>
        </div>
        <div id="cx-rejected-list"></div>
      </div>
    `;

    const list = panel.querySelector("#cx-rejected-list");

    if(!rows || !rows.length){
      list.innerHTML = `
        <div style="padding:24px 0;color:rgba(216,199,180,.72);font-weight:700;">
          No rejected submissions yet.
        </div>
      `;
      return;
    }

    list.innerHTML = rows.map((row, i) => `
      <div style="
        display:grid;
        grid-template-columns:1.4fr .7fr .6fr .8fr;
        gap:16px;
        align-items:center;
        padding:18px 0;
        border-top:1px solid rgba(224,172,120,.13);
        color:#fff8ef;
      ">
        <div>
          <strong>${row.campaign_title || "Campaign"}</strong>
          <div style="font-size:13px;color:rgba(216,199,180,.62);margin-top:4px;">
            ${row.proof_url ? "Rejected clip attached" : "No clip link"}
          </div>
        </div>
        <div>${row.platform || "Instagram"}</div>
        <div style="color:#ff8b8b;font-weight:800;">Rejected</div>
        <div style="text-align:right;">
          <button data-appeal-index="${i}" style="
            padding:10px 14px;border-radius:12px;
            border:1px solid rgba(224,172,120,.28);
            background:rgba(224,172,120,.12);
            color:#e0ac78;font-weight:900;cursor:pointer;
          ">
            ${row.appeal_note ? "View Appeal" : "Note / Appeal"}
          </button>
        </div>
      </div>
    `).join("");

    list.querySelectorAll("[data-appeal-index]").forEach(btn => {
      btn.addEventListener("click", () => {
        const row = rows[Number(btn.dataset.appealIndex)];
        showAppealModal(row);
      });
    });
  }

  async function loadRejectedStats(){
    if(!isStats()) return;

    try{
      const rows = await rpc("my_rejected_submissions_v2", {});
      renderRejectedStats(Array.isArray(rows) ? rows : []);
    }catch(error){
      console.error("[Clipency Rejected Stats]", error);
    }
  }

  function renderAdminAppeals(rows){
    let panel = document.getElementById("cx-admin-appeals-panel");

    if(!panel){
      panel = document.createElement("section");
      panel.id = "cx-admin-appeals-panel";
      panel.style.cssText = `
        margin:40px auto;
        max-width:1100px;
        border:1px solid rgba(224,172,120,.22);
        border-radius:28px;
        background:linear-gradient(145deg,rgba(33,24,18,.86),rgba(12,9,7,.92));
        color:#fff8ef;
        overflow:hidden;
      `;

      const main = document.querySelector("main") || document.querySelector(".admin-main") || document.body;
      main.appendChild(panel);
    }

    panel.innerHTML = `
      <div style="padding:30px 34px;border-bottom:1px solid rgba(224,172,120,.15);">
        <div style="color:#e0ac78;letter-spacing:.18em;text-transform:uppercase;font-size:12px;font-weight:900;">
          Appeal Desk
        </div>
        <h2 style="margin:10px 0 0;font-size:38px;">Clipper appeals.</h2>
        <p style="color:rgba(216,199,180,.72);font-size:18px;margin:10px 0 0;">
          Appeals submitted by clippers after rejected submissions.
        </p>
      </div>

      <div id="cx-admin-appeals-list" style="padding:6px 34px 28px;"></div>
    `;

    const list = panel.querySelector("#cx-admin-appeals-list");

    if(!rows || !rows.length){
      list.innerHTML = `
        <div style="padding:28px 0;color:rgba(216,199,180,.72);font-weight:800;">
          No appeals submitted yet.
        </div>
      `;
      return;
    }

    list.innerHTML = rows.map(row => `
      <div style="
        padding:22px 0;
        border-top:1px solid rgba(224,172,120,.13);
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:18px;
      ">
        <div>
          <div style="font-weight:900;font-size:20px;">${row.campaign_title || "Campaign"}</div>
          <div style="color:rgba(216,199,180,.62);margin-top:4px;">
            ${row.creator_name || "Creator"} · ${row.platform || "Platform"} · ${formatDate(row.appealed_at)}
          </div>
          <div style="margin-top:10px;">
            ${
              row.proof_url
              ? `<a href="${row.proof_url}" target="_blank" style="color:#e0ac78;font-weight:800;">Open rejected clip ↗</a>`
              : `<span style="color:rgba(216,199,180,.55);">No proof link</span>`
            }
          </div>
        </div>

        <div>
          <div style="
            padding:14px 16px;border-radius:14px;
            background:rgba(255,80,80,.08);
            border:1px solid rgba(255,80,80,.2);
            margin-bottom:12px;
          ">
            <strong style="color:#ffb4b4;">Admin rejection reason:</strong><br>
            ${row.rejection_reason || "No reason added."}
          </div>

          <div style="
            padding:14px 16px;border-radius:14px;
            background:rgba(224,172,120,.08);
            border:1px solid rgba(224,172,120,.2);
          ">
            <strong style="color:#e0ac78;">Clipper appeal:</strong><br>
            ${row.appeal_note || "No appeal note."}
          </div>
        </div>
      </div>
    `).join("");
  }

  async function loadAdminAppeals(){
    if(!isAdminReview()) return;

    try{
      const rows = await rpc("admin_appeals_queue_v2", {});
      renderAdminAppeals(Array.isArray(rows) ? rows : []);
    }catch(error){
      console.error("[Clipency Admin Appeals]", error);
    }
  }

  function boot(){
    loadRejectedStats();
    loadAdminAppeals();

    if(isStats()) setInterval(loadRejectedStats, 15000);
    if(isAdminReview()) setInterval(loadAdminAppeals, 15000);
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", boot);
  }else{
    boot();
  }

  window.addEventListener("load", boot);
})();
