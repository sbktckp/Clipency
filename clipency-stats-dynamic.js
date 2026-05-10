(function(){
  window.CLIPENCY_STATS_DYNAMIC = "stats-dynamic-v1";

  function clean(v){
    return String(v || "").replace(/\s+/g, " ").trim();
  }

  function money(n){
    const value = Number(n || 0);
    return "$" + value.toLocaleString(undefined, {
      minimumFractionDigits: value % 1 ? 2 : 0,
      maximumFractionDigits: 2
    });
  }

  function compact(n){
    const value = Number(n || 0);
    if(value >= 1000000) return (value / 1000000).toFixed(value % 1000000 ? 1 : 0) + "M";
    if(value >= 1000) return (value / 1000).toFixed(value % 1000 ? 1 : 0) + "K";
    return String(value);
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

  function leavesInside(el){
    return Array.from(el.querySelectorAll("*")).filter(x => !x.children.length);
  }

  function findSmallCard(label){
    const lower = label.toLowerCase();
    return Array.from(document.querySelectorAll("section,article,div"))
      .filter(el => {
        const txt = clean(el.textContent).toLowerCase();
        const r = el.getBoundingClientRect();
        return txt.includes(lower) && r.height > 70 && r.height < 260 && r.width > 170;
      })
      .sort((a,b) => a.getBoundingClientRect().height - b.getBoundingClientRect().height)[0];
  }

  function setMetric(label, value){
    const card = findSmallCard(label);
    if(!card) return;

    const leaves = leavesInside(card);
    const target = leaves.find(el => {
      const txt = clean(el.textContent);
      return /^\$?[\d,.]+[KM]?%?$/.test(txt);
    });

    if(target) target.textContent = value;
  }

  function findChartBox(){
    const candidates = Array.from(document.querySelectorAll("section,article,div"))
      .filter(el => {
        const txt = clean(el.textContent).toLowerCase();
        const r = el.getBoundingClientRect();
        return txt.includes("earnings") &&
               txt.includes("views") &&
               txt.includes("submissions") &&
               r.width > 500 &&
               r.height > 220;
      })
      .sort((a,b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width);

    return candidates[0] || null;
  }

  function renderChart(points){
    const box = findChartBox();
    if(!box) return;

    box.querySelectorAll(".cx-stats-live-chart").forEach(el => el.remove());

    Array.from(box.children).forEach(child => {
      child.style.display = "none";
    });

    const data = points && points.length ? points : [
      {label:"Mon", earned:0}, {label:"Tue", earned:0}, {label:"Wed", earned:0},
      {label:"Thu", earned:0}, {label:"Fri", earned:0}, {label:"Sat", earned:0}, {label:"Sun", earned:0}
    ];

    const max = Math.max(...data.map(p => Number(p.earned || 0)), 1);
    const w = 900;
    const h = 260;
    const pad = 34;

    const coords = data.map((p, i) => {
      const x = pad + i * ((w - pad * 2) / Math.max(data.length - 1, 1));
      const y = h - pad - ((Number(p.earned || 0) / max) * (h - pad * 2));
      return {x, y, label:p.label, earned:Number(p.earned || 0)};
    });

    const path = coords.map((p,i) => `${i ? "L" : "M"} ${p.x} ${p.y}`).join(" ");

    const wrap = document.createElement("div");
    wrap.className = "cx-stats-live-chart";
    wrap.style.padding = "28px 32px";
    wrap.style.minHeight = "360px";

    wrap.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:24px;">
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <span style="background:rgba(224,172,120,.15);color:#e0ac78;border:1px solid rgba(224,172,120,.25);padding:9px 16px;border-radius:12px;font-weight:900;">Earnings</span>
          <span style="background:rgba(255,255,255,.04);color:rgba(216,199,180,.72);border:1px solid rgba(255,255,255,.08);padding:9px 16px;border-radius:12px;font-weight:900;">Live</span>
        </div>
        <span style="color:rgba(216,199,180,.68);font-weight:800;">Last 7 days</span>
      </div>

      <svg viewBox="0 0 ${w} ${h}" width="100%" height="280" preserveAspectRatio="none">
        <defs>
          <linearGradient id="cxStatsArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#e0ac78" stop-opacity="0.35"/>
            <stop offset="100%" stop-color="#e0ac78" stop-opacity="0"/>
          </linearGradient>
        </defs>

        ${[0,1,2,3].map(i => {
          const y = pad + i * ((h - pad * 2) / 3);
          return `<line x1="${pad}" y1="${y}" x2="${w-pad}" y2="${y}" stroke="rgba(224,172,120,.10)" stroke-width="1"/>`;
        }).join("")}

        <path d="${path} L ${coords[coords.length-1].x} ${h-pad} L ${coords[0].x} ${h-pad} Z" fill="url(#cxStatsArea)"/>
        <path d="${path}" fill="none" stroke="#e0ac78" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>

        ${coords.map(p => `
          <circle cx="${p.x}" cy="${p.y}" r="6" fill="#0b0704" stroke="#e0ac78" stroke-width="4"/>
        `).join("")}

        ${coords.map(p => `
          <text x="${p.x}" y="${h-6}" fill="rgba(216,199,180,.55)" font-size="15" text-anchor="middle">${p.label}</text>
        `).join("")}
      </svg>
    `;

    box.appendChild(wrap);
  }

  function statusPill(status){
    const s = clean(status || "pending").toLowerCase();
    const color =
      s === "approved" ? "#72f0aa" :
      s === "rejected" ? "#ff9b9b" :
      "#ffd35a";

    const bg =
      s === "approved" ? "rgba(80,230,150,.12)" :
      s === "rejected" ? "rgba(255,90,90,.12)" :
      "rgba(255,211,90,.12)";

    return `<span style="display:inline-block;padding:7px 12px;border-radius:999px;background:${bg};color:${color};font-weight:950;text-transform:capitalize;">${s.replaceAll("_"," ")}</span>`;
  }

  function findSubmissionsBox(){
    const candidates = Array.from(document.querySelectorAll("section,article,div"))
      .filter(el => {
        const txt = clean(el.textContent).toLowerCase();
        const r = el.getBoundingClientRect();
        return txt.includes("my submissions") &&
               txt.includes("rejected submissions") &&
               r.width > 500 &&
               r.height > 220;
      })
      .sort((a,b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width);

    return candidates[0] || null;
  }

  function renderTables(submissions, rejected){
    const box = findSubmissionsBox();
    if(!box) return;

    const rows = Array.isArray(submissions) ? submissions : [];
    const rej = Array.isArray(rejected) ? rejected : [];

    box.querySelectorAll(".cx-stats-live-table").forEach(el => el.remove());

    Array.from(box.children).forEach(child => {
      child.style.display = "none";
    });

    const wrap = document.createElement("div");
    wrap.className = "cx-stats-live-table";
    wrap.style.padding = "34px";
    wrap.style.display = "grid";
    wrap.style.gap = "30px";

    function table(title, items, empty){
      return `
        <div>
          <div style="
            color:#e0ac78;
            font-weight:950;
            font-size:18px;
            margin-bottom:18px;
            padding-bottom:14px;
            border-bottom:2px solid rgba(224,172,120,.75);
          ">${title}</div>

          ${items.length ? `
            <div style="display:grid;gap:0;">
              <div style="
                display:grid;
                grid-template-columns:2fr 1fr 1fr 1fr 1fr 120px;
                gap:16px;
                color:rgba(224,172,120,.85);
                letter-spacing:.16em;
                text-transform:uppercase;
                font-size:12px;
                font-weight:950;
                padding:14px 0;
                border-bottom:1px solid rgba(224,172,120,.12);
              ">
                <span>Campaign</span><span>Platform</span><span>Views</span><span>Earned</span><span>Status</span><span>Link</span>
              </div>

              ${items.map(item => `
                <div style="
                  display:grid;
                  grid-template-columns:2fr 1fr 1fr 1fr 1fr 120px;
                  gap:16px;
                  align-items:center;
                  padding:18px 0;
                  border-bottom:1px solid rgba(224,172,120,.08);
                ">
                  <strong style="color:#fff8ef;">${clean(item.campaign || "Campaign")}</strong>
                  <span style="color:rgba(216,199,180,.82);">${clean(item.platform || "—")}</span>
                  <span style="color:rgba(216,199,180,.82);">${Number(item.views || 0) ? compact(item.views) : "—"}</span>
                  <span style="color:#72f0aa;font-weight:950;">${Number(item.earned || 0) ? money(item.earned) : "—"}</span>
                  <span>${statusPill(item.status)}</span>
                  <span>
                    ${item.link ? `<a href="${item.link}" target="_blank" rel="noopener" style="color:#fff8ef;text-decoration:none;border:1px solid rgba(255,255,255,.1);padding:9px 13px;border-radius:11px;">↗ Open</a>` : "—"}
                  </span>
                </div>
              `).join("")}
            </div>
          ` : `
            <div style="color:rgba(216,199,180,.72);font-weight:850;padding:20px 0;">${empty}</div>
          `}
        </div>
      `;
    }

    wrap.innerHTML =
      table("My Submissions", rows, "No submissions yet.") +
      table("Rejected Submissions", rej, "No rejected submissions.");

    box.appendChild(wrap);
  }

  async function load(){
    const sb = await waitForSupabase();

    const { data, error } = await sb.rpc("clipency_my_stats_dashboard");
    if(error) throw error;

    const row = Array.isArray(data) ? data[0] : data || {};

    let submissions = row.submissions || [];
    let rejected = row.rejected_submissions || [];
    let chart = row.chart || [];

    if(typeof submissions === "string") {
      try { submissions = JSON.parse(submissions); } catch { submissions = []; }
    }

    if(typeof rejected === "string") {
      try { rejected = JSON.parse(rejected); } catch { rejected = []; }
    }

    if(typeof chart === "string") {
      try { chart = JSON.parse(chart); } catch { chart = []; }
    }

    setMetric("Total Views", compact(row.total_views || 0));
    setMetric("Total Earned", money(row.total_earned || 0));
    setMetric("Approval Rate", Math.round(Number(row.approval_rate || 0)) + "%");
    setMetric("Pending Review", String(Number(row.pending_review || 0)));

    renderChart(chart);
    renderTables(submissions, rejected);
  }

  function boot(){
    load().catch(error => {
      console.error("[Clipency Stats Dynamic]", error);

      setMetric("Total Views", "0");
      setMetric("Total Earned", "$0");
      setMetric("Approval Rate", "0%");
      setMetric("Pending Review", "0");

      renderChart([]);
      renderTables([], []);
    });
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", boot);
  }else{
    boot();
  }

  window.addEventListener("load", function(){
    setTimeout(boot, 500);
  });
})();
