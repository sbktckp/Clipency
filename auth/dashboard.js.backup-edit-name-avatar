
function getCreatorDisplayName(profile, user) {
  return (
    profile?.full_name ||
    profile?.first_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Creator"
  );
}

/* ── Data ── */
let campaigns = [
  { id:1, title:"WoT Heat", type:"Clipping", rpm:1250, budget:4785, budgetUsed:0, creators:13, tags:["Clipping"], color:"#6C5DD3", platforms:["TikTok","YouTube"], genre:"Gaming", views:[120,200,180,350,420,500,610,720,800,950,1100,1250] },
  { id:2, title:"We Do What We Want", type:"Edits", rpm:1000, budget:5000, budgetUsed:0, creators:20, tags:["Music","Edits"], color:"#14B8A6", platforms:["TikTok","Instagram"], genre:"Music", views:[80,160,240,300,450,520,680,900,1100,1300,1500,1800] },
  { id:3, title:"La Isla Bonita", type:"Music", rpm:150, budget:1000, budgetUsed:2, creators:61, tags:["Music"], color:"#FACC15", platforms:["Instagram","YouTube"], genre:"Music", views:[50,90,130,200,280,350,420,500,560,620,700,800] },
  { id:4, title:"Dom Dolla [SPORTS]", type:"Music", rpm:800, budget:1250, budgetUsed:1, creators:16, tags:["Music"], color:"#EC4899", platforms:["TikTok","Instagram","YouTube"], genre:"Sports", views:[30,80,140,210,300,380,460,540,620,700,780,850] },
  { id:5, title:"Something 'Bout", type:"Edits", rpm:1000, budget:5000, budgetUsed:2, creators:12, tags:["Music"], color:"#F97316", platforms:["TikTok","YouTube"], genre:"Music", views:[60,100,180,250,340,420,510,600,700,820,940,1080] },
  { id:6, title:"Geometry Dash - Slowed", type:"Music", rpm:130, budget:1660, budgetUsed:6, creators:79, tags:["Music"], color:"#A78BFA", platforms:["YouTube","TikTok"], genre:"Gaming", views:[200,400,620,800,1050,1300,1600,1900,2200,2500,2800,3100] },
  { id:7, title:"Doja Cat x Bebe Rexha", type:"Clipping", rpm:800, budget:3000, budgetUsed:23, creators:321, tags:["Clipping"], color:"#22C55E", platforms:["TikTok","Instagram"], genre:"Music", views:[500,900,1400,2100,2900,3800,4800,6000,7200,8500,9800,11200] },
  { id:8, title:"Unfollow Me [EDITS]", type:"Edits", rpm:1300, budget:1980, budgetUsed:1, creators:28, tags:["Music"], color:"#6C5DD3", platforms:["Instagram","YouTube"], genre:"UGC", views:[40,90,150,230,320,410,510,620,740,870,1010,1160] },
];

const topPerformers = [
  { rank:1, name:"Alex Rivera", handle:"@alexriv", views:"4.2M", earnings:"$420", avatar:"AR" },
  { rank:2, name:"Mia Chen", handle:"@miachen", views:"3.8M", earnings:"$380", avatar:"MC" },
  { rank:3, name:"Jake Storm", handle:"@jakestorm", views:"2.9M", earnings:"$290", avatar:"JS" },
  { rank:4, name:"Priya Singh", handle:"@priyasg", views:"2.4M", earnings:"$240", avatar:"PS" },
  { rank:5, name:"Leo Martinez", handle:"@leomart", views:"1.9M", earnings:"$190", avatar:"LM" },
];

const transactions = [
  { date:"Apr 20", desc:"Doja Cat x Bebe Rexha payout", amount:"+$284", status:"Paid" },
  { date:"Apr 14", desc:"Geometry Dash campaign", amount:"+$156", status:"Paid" },
  { date:"Apr 7", desc:"WoT Heat campaign", amount:"+$420", status:"Paid" },
  { date:"Mar 28", desc:"La Isla Bonita payout", amount:"+$180", status:"Paid" },
];

const accounts = { TikTok:["@ayushbera","@myaccount2"], Instagram:["@ayush.bera"], YouTube:["Ayush Bera Channel"] };

/* ── State ── */
let activeSection = "campaigns";
let selectedGenre = "All";
let activeCampaign = null;
let modalStep = 1;
let modalPlatform = null;
let modalAccount = null;

/* ── Currency System ── */
let currentCurrency = 'USD';
let currentSymbol = '$';
let exchangeRates = { USD: 1 };

async function fetchExchangeRates() {
  try {
    const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const data = await res.json();
    exchangeRates = data.rates;
    // Update rate displays in sidebar
    ['USD','INR','EUR','GBP','JPY','AUD','CAD'].forEach(code => {
      const el = document.getElementById('rate-' + code);
      if (el && exchangeRates[code]) el.textContent = exchangeRates[code].toFixed(code === 'JPY' ? 0 : 2);
    });
  } catch (e) {
    console.warn('Exchange rate fetch failed, using fallback');
    exchangeRates = { USD:1, INR:83.5, EUR:0.92, GBP:0.79, JPY:154.5, AUD:1.53, CAD:1.36 };
    ['USD','INR','EUR','GBP','JPY','AUD','CAD'].forEach(code => {
      const el = document.getElementById('rate-' + code);
      if (el) el.textContent = exchangeRates[code].toFixed(code === 'JPY' ? 0 : 2);
    });
  }
}

function smartRound(value, code) {
  if (code === 'JPY') return Math.round(value / 100) * 100;
  if (code === 'INR') {
    if (value >= 10000) return Math.round(value / 100) * 100;
    if (value >= 1000) return Math.round(value / 10) * 10;
    return Math.round(value);
  }
  if (['USD','EUR','GBP','AUD','CAD'].includes(code)) {
    if (value >= 1000) return Math.round(value);
    return Math.round(value * 100) / 100;
  }
  return Math.round(value * 100) / 100;
}

function convertCurrency(usdAmount) {
  const rate = exchangeRates[currentCurrency] || 1;
  const converted = usdAmount * rate;
  const rounded = smartRound(converted, currentCurrency);
  return currentSymbol + rounded.toLocaleString();
}

function initCurrencySelector() {
  const toggle = document.getElementById('currency-toggle');
  const menu = document.getElementById('currency-menu');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.toggle('hidden');
  });

  document.addEventListener('click', () => menu.classList.add('hidden'));
  menu.addEventListener('click', (e) => e.stopPropagation());

  menu.querySelectorAll('.currency-option').forEach(opt => {
    opt.addEventListener('click', () => {
      const code = opt.dataset.code;
      const symbol = opt.dataset.symbol;
      currentCurrency = code;
      currentSymbol = symbol;
      document.getElementById('currency-flag').textContent = symbol;
      document.getElementById('currency-code').textContent = code;
      menu.querySelectorAll('.currency-option').forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      menu.classList.add('hidden');
      // Re-render everything with new currency
      refreshDashboardCurrency();
    });
  });

  fetchExchangeRates();
  // Refresh rates every 5 minutes
  setInterval(fetchExchangeRates, 300000);
}

function refreshDashboardCurrency() {
  if (activeSection === 'campaigns') renderCampaigns();
  if (activeSection === 'payout') { renderPayoutSection(); renderTransactions(); }
  if (activeSection === 'stats') renderStatsChart();
}


/* ── Auth guard ── */
let _authUser = null;

(async () => {
  // Small delay so Supabase SDK can restore session from localStorage
  await new Promise(r => setTimeout(r, 300));
  const { data: { session } } = await window.supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = "index.html";
    return;
  }
  _authUser = session.user;
  const meta = session.user.user_metadata || {};
  const name = [meta.first_name, meta.last_name].filter(Boolean).join(" ") || session.user.email.split("@")[0];
  document.getElementById("user-name").textContent = name;
  document.getElementById("user-avatar").textContent = name.charAt(0).toUpperCase();
  // Populate sidebar user
  const sidebarName = document.getElementById("sidebar-user-name");
  const sidebarAvatar = document.getElementById("sidebar-avatar");
  if (sidebarName) sidebarName.textContent = name;
  if (sidebarAvatar) sidebarAvatar.textContent = name.charAt(0).toUpperCase();
  buildProfile(session.user);
  // Fade out loading overlay
  const overlay = document.getElementById("loading-overlay");
  if (overlay) { overlay.classList.add("fade-out"); setTimeout(() => overlay.remove(), 400); }
  // Init renders after auth confirmed
  initCurrencySelector();
  renderCampaigns();
  renderPayoutSection();
  renderTransactions();
  renderPayments();
})();

window.supabaseClient.auth.onAuthStateChange((event) => {
  if (event === "SIGNED_OUT") window.location.href = "index.html";
});

document.getElementById("btn-signout").addEventListener("click", async () => {
  await window.supabaseClient.auth.signOut();
});

/* ── Nav ── */
document.querySelectorAll(".nav-item").forEach(btn => {
  btn.addEventListener("click", () => {
    const sec = btn.dataset.section;
    document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
    document.getElementById("section-" + sec).classList.add("active");
    activeSection = sec;
    if (sec === "campaigns") { activeCampaign = null; renderCampaigns(); }
    if (sec === "payout") { renderPayoutSection(); renderTransactions(); }
    if (sec === "payment") renderPayments();
    if (sec === "stats") renderStatsChart();
  });
});

/* ── SVG Sparkline ── */
function sparkline(data, color) {
  const max = Math.max(...data);
  const pts = data.map((v,i) => `${(i/(data.length-1))*100},${100-(v/max)*80}`).join(" ");
  return `<svg class="sparkline" viewBox="0 0 100 100">
    <defs><linearGradient id="sg${color.replace('#','')}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${color}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
    </linearGradient></defs>
    <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <polygon points="0,100 ${pts} 100,100" fill="url(#sg${color.replace('#','')})"/>
  </svg>`;
}

/* ── Big Chart (canvas) ── */
function drawBigChart(canvasId, data, color) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const parent = canvas.parentElement;
  canvas.width = (parent ? parent.offsetWidth - 48 : 0) || 600;
  canvas.height = 120;
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = 110;
  const max = Math.max(...data);
  const pts = data.map((v,i) => ({ x:(i/(data.length-1))*W, y:H-(v/max)*(H-10) }));
  ctx.clearRect(0,0,W,H+10);
  // grid lines
  [0,0.5,1].forEach(f => {
    ctx.beginPath(); ctx.moveTo(0,H-f*(H-10)); ctx.lineTo(W,H-f*(H-10));
    ctx.strokeStyle="rgba(255,255,255,0.06)"; ctx.lineWidth=1; ctx.stroke();
  });
  // fill
  const grad = ctx.createLinearGradient(0,0,0,H);
  grad.addColorStop(0, color+"66"); grad.addColorStop(1, color+"00");
  ctx.beginPath(); ctx.moveTo(pts[0].x,H);
  pts.forEach(p => ctx.lineTo(p.x,p.y));
  ctx.lineTo(pts[pts.length-1].x,H); ctx.closePath();
  ctx.fillStyle=grad; ctx.fill();
  // line
  ctx.beginPath(); ctx.moveTo(pts[0].x,pts[0].y);
  pts.forEach(p => ctx.lineTo(p.x,p.y));
  ctx.strokeStyle=color; ctx.lineWidth=2.5; ctx.lineJoin="round"; ctx.stroke();
  // dots
  pts.forEach(p => { ctx.beginPath(); ctx.arc(p.x,p.y,3,0,Math.PI*2); ctx.fillStyle=color; ctx.fill(); });
}

/* ── Campaigns ── */
function renderCampaigns() {
  const grid = document.getElementById("campaign-grid");
  const detail = document.getElementById("campaign-detail");
  if (activeCampaign) {
    grid.classList.add("hidden"); document.querySelector(".filters").classList.add("hidden");
    detail.classList.remove("hidden");
    detail.innerHTML = buildDetail(activeCampaign);
    detail.querySelector(".back-btn").addEventListener("click", () => { activeCampaign=null; renderCampaigns(); });
    detail.querySelector(".submit-btn").addEventListener("click", () => openModal(activeCampaign));
    setTimeout(() => drawBigChart("detail-chart", activeCampaign.views, activeCampaign.color), 50);
    return;
  }
  grid.classList.remove("hidden"); document.querySelector(".filters").classList.remove("hidden");
  detail.classList.add("hidden");
  const filtered = campaigns.filter(c => selectedGenre==="All" || c.genre===selectedGenre || c.tags.includes(selectedGenre) || c.type===selectedGenre);
  document.getElementById("campaign-count").textContent = filtered.length + " campaigns";
  grid.innerHTML = "";
  grid.innerHTML = filtered.map(c => {
    const used = (c.budgetUsed/100)*c.budget;
    return `
    <div class="campaign-card" data-id="${c.id}">
      <div class="card-top">
        <div class="card-icon" style="border:2px solid ${c.color}30">🎵</div>
        <div style="flex:1;min-width:0">
          <div class="card-title">${c.title}</div>
          <div class="tag-row">
            ${[...new Set(c.tags)].map(t=>`<span class="tag">${t}</span>`).join("")}
            <span class="tag tag-green">New</span>
          </div>
        </div>
      </div>
      ${sparkline(c.views, c.color)}
      <div class="card-rpm">
        <div><div class="rpm-label">Rate per 1M Views</div><div class="rpm-value">${convertCurrency(c.rpm)}</div></div>
        <div><div class="creators-label">Creators</div><div class="creators-value">${c.creators}</div></div>
      </div>
      <div class="card-hover-budget">
        <div class="hover-budget-header">
          <span class="hover-budget-label">Budget</span>
          <span class="hover-budget-val">${convertCurrency(used)} / ${convertCurrency(c.budget)}</span>
        </div>
        <div class="progress-bar" style="height:6px;margin-bottom:0"><div class="progress-fill" style="width:${c.budgetUsed}%;background:#B6ABEA"></div></div>
      </div>
    </div>
  `}).join("");
  grid.querySelectorAll(".campaign-card").forEach(card => {
    card.addEventListener("click", () => {
      activeCampaign = campaigns.find(c => String(c.id) === String(card.dataset.id));
      renderCampaigns();
    });
  });
}

function buildDetail(c) {
  const totalViews = c.views[c.views.length-1] * 1000;
  const used = (c.budgetUsed/100)*c.budget;
  return `
    <div class="detail-header">
      <button class="back-btn">←</button>
      <div><p class="eyebrow">CAMPAIGN</p><h2 style="margin:0;font-size:22px;font-weight:800">${c.title}</h2></div>
      <div style="margin-left:auto;display:flex;gap:8px">${[...new Set(c.tags)].map(t=>`<span class="tag">${t}</span>`).join("")}</div>
    </div>
    <div class="detail-grid">
      <div class="card">
        <div style="width:64px;height:64px;border-radius:16px;background:rgba(108,93,211,0.15);border:2px solid ${c.color}30;display:flex;align-items:center;justify-content:center;font-size:26px;margin-bottom:16px">🎵</div>
        <h3 style="font-size:18px;margin-bottom:4px">${c.title}</h3>
        <p style="color:rgba(255,255,255,0.4);font-size:13px;margin-bottom:20px">${c.genre} · ${c.type}</p>
        <div class="detail-stat"><span class="detail-stat-label">RPM Rate</span><span class="detail-stat-value" style="color:#22C55E">${convertCurrency(c.rpm)}</span></div>
        <div class="detail-stat"><span class="detail-stat-label">Total Budget</span><span class="detail-stat-value" style="color:#FACC15">${convertCurrency(c.budget)}</span></div>
        <div class="detail-stat"><span class="detail-stat-label">Active Creators</span><span class="detail-stat-value" style="color:#A78BFA">${c.creators}</span></div>
        <div class="detail-stat"><span class="detail-stat-label">Platforms</span><span class="detail-stat-value">${c.platforms.join(", ")}</span></div>
      </div>
      <div class="card" style="display:flex;flex-direction:column">
        <div style="margin-bottom:20px">
          <p style="color:rgba(255,255,255,0.4);font-size:12px;margin-bottom:4px">Total Views Generated</p>
          <h3 style="font-size:28px;font-weight:800;margin-bottom:4px">${(totalViews/1000000).toFixed(1)}M</h3>
          <span style="color:#22C55E;font-size:12px;font-weight:600">↑ 12.4% this week</span>
        </div>
        <canvas id="detail-chart" style="width:100%;height:120px;flex:1"></canvas>
        <div style="margin-top:20px;display:flex;justify-content:flex-end">
          <button class="submit-btn" style="padding:14px 28px;font-size:15px">Submit Your Clip →</button>
        </div>
      </div>
    </div>

    <!-- Budget Progress -->
    <div class="card">
      <div style="display:flex;justify-content:space-between;margin-bottom:12px">
        <h4>Budget Progress</h4>
        <span style="color:rgba(255,255,255,0.5);font-size:13px">${convertCurrency(used)} / ${convertCurrency(c.budget)}</span>
      </div>
      <div class="progress-bar"><div class="progress-fill" style="width:${c.budgetUsed}%;background:#B6ABEA"></div></div>
      <div style="display:flex;justify-content:space-between;margin-bottom:20px">
        <span style="color:rgba(255,255,255,0.4);font-size:12px">${c.budgetUsed}% used</span>
        <span style="color:#22C55E;font-size:12px;font-weight:600">RPM: ${convertCurrency(c.rpm)}/M views</span>
      </div>
      <div class="mini-stats">
        <div class="mini-stat"><div class="mini-stat-label">Views This Month</div><div class="mini-stat-value">${(c.views[11]*1.2).toFixed(0)}K</div></div>
        <div class="mini-stat"><div class="mini-stat-label">Est. Earnings</div><div class="mini-stat-value">${convertCurrency((c.views[11]*c.rpm)/1000)}</div></div>
        <div class="mini-stat"><div class="mini-stat-label">Submissions</div><div class="mini-stat-value">${c.creators*3}</div></div>
        <div class="mini-stat"><div class="mini-stat-label">Avg RPM</div><div class="mini-stat-value">${convertCurrency(c.rpm)}</div></div>
      </div>
    </div>

    <!-- Requirements -->
    <div class="card requirements-card">
      <h4 style="margin-bottom:20px;text-align:center;font-size:17px">Requirements</h4>
      <div class="req-checklist">
        <div class="req-check-item"><span class="req-check-icon">✅</span><span>STANDARD CLIPPING / REPOST THE VIDEOS IN THE CONTENT FOLDER</span></div>
        <div class="req-check-item"><span class="req-check-icon">✅</span><span>10s MINIMUM CLIP LENGTH</span></div>
        <div class="req-check-item"><span class="req-check-icon">✅</span><span>TAG @CLIPENCY ON YOUR POST</span></div>
        <div class="req-check-item"><span class="req-check-icon">✅</span><span>USE ORIGINAL AUDIO ONLY</span></div>
        <div class="req-check-item"><span class="req-check-icon">✅</span><span>NO EXPLICIT OR NSFW CONTENT</span></div>
      </div>
      <p style="text-align:center;margin-top:16px;color:rgba(255,255,255,0.3);font-size:12px">📄 For full Campaign RULES, check the brief</p>
    </div>

    <!-- Top 5 Performers -->
    <div class="card">
      <h4 style="margin-bottom:16px">Top 5 Performers</h4>
      ${topPerformers.map((p,i)=>`
        <div class="performer-item">
          <span class="perf-rank" style="color:${i<3?'#FACC15':'rgba(255,255,255,0.3)'}">#${p.rank}</span>
          <div class="perf-av">${p.avatar}</div>
          <div style="flex:1"><div class="perf-name">${p.name}</div><div class="perf-handle">${p.handle}</div></div>
          <div><div class="perf-views">${p.views}</div><div class="perf-earn">${p.earnings}</div></div>
        </div>`).join("")}
    </div>
  `;
}

/* ── Genre filter ── */
document.getElementById("genre-filters").addEventListener("click", e => {
  const btn = e.target.closest(".filter-btn");
  if (!btn) return;
  document.querySelectorAll(".filter-btn").forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");
  selectedGenre = btn.dataset.genre;
  renderCampaigns();
});

/* ── Stats (real data from Supabase) ── */
function fmtNum(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

async function renderStatsSection() {
  if (!_authUser) return;

  // Fetch all user submissions
  const { data: subs, error } = await _supabase
    .from('submissions')
      .select('id, user_id, clipper_id, campaign_id, campaign_title, platform, account_handle, video_url, post_url, views, likes, comments, shares, earnings, status, submitted_at')
    .eq('user_id', _authUser.id);

  if (error) {
    console.warn('Stats fetch error:', error.message);
    renderStatsFallback();
    return;
  }

  // Aggregate
  const totalViews    = subs.reduce((s, r) => s + (r.views    || 0), 0);
  const totalEarnings = subs.reduce((s, r) => s + Number(r.earnings || 0), 0);
  const activeCampaigns = new Set(subs.map(r => r.campaign_id)).size;

  // Update stat cards
  const cards = document.querySelectorAll('#section-stats .stat-card');
  if (cards[0]) cards[0].querySelector('.stat-value').textContent = fmtNum(totalViews);
  if (cards[1]) cards[1].querySelector('.stat-value').textContent = '$' + totalEarnings.toFixed(2);
  if (cards[2]) cards[2].querySelector('.stat-value').textContent = String(activeCampaigns);

  // Build monthly earnings chart data from submissions
  const monthly = Array(12).fill(0);
  subs.forEach(r => {
    const month = new Date(r.submitted_at).getMonth();
    monthly[month] += Number(r.earnings || 0);
  });
  // Ensure at least some data for chart
  const chartData = monthly.some(v => v > 0) ? monthly : [80,140,220,310,280,400,520,490,620,710,840,960];
  setTimeout(() => drawBigChart('stats-chart', chartData, '#6C5DD3'), 50);

  // Show submissions table
  renderSubmissionsTable(subs);
}

function renderStatsFallback() {
  setTimeout(() => drawBigChart('stats-chart', [80,140,220,310,280,400,520,490,620,710,840,960], '#6C5DD3'), 50);
}

function renderSubmissionsTable(subs) {
  let el = document.getElementById('submissions-table');
  if (!el) return;
  if (!subs || subs.length === 0) {
    el.innerHTML = '<p style="color:rgba(255,255,255,0.3);font-size:13px;text-align:center;padding:20px">No submissions yet. Submit your first clip!</p>';
    return;
  }
  el.innerHTML = subs.slice().reverse().map(s => `
    <div class="tx-item">
      <div class="tx-icon" style="font-size:14px;background:rgba(108,93,211,0.15)">📎</div>
      <div style="flex:1">
        <div class="tx-desc">${s.campaign_title || s.campaign?.title || 'Campaign'} · ${s.platform || 'Submitted'}</div>
        <div class="tx-date">${new Date(s.submitted_at).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</div>
      </div>
      <div style="text-align:right">
        <div style="color:#fff;font-size:13px;font-weight:600">${fmtNum(s.views||0)} views</div>
        <div style="color:#A78BFA;font-size:12px">${fmtNum(s.likes||0)} likes · ${fmtNum(s.comments||0)} comments</div>
        <div style="color:#22C55E;font-size:12px;font-weight:700">$${Number(s.earnings||0).toFixed(2)}</div>
      </div>
    </div>`).join('');
}

function renderStatsChart() { renderStatsSection(); }

/* ── Payout Section ── */
function renderPayoutSection() {
  const el = document.getElementById("payout-cards");
  if (!el) return;
  el.innerHTML = `
    <div class="card card-purple">
      <p class="label-sm" style="color:#A78BFA">Available Balance</p>
      <h2 class="balance">${convertCurrency(1240)}</h2>
      <button class="btn-primary">Withdraw →</button>
    </div>
    <div class="card">
      <p class="label-sm" style="color:rgba(255,255,255,0.4)">Pending</p>
      <h2 class="balance" style="color:#FACC15">${convertCurrency(320)}</h2>
      <p style="color:rgba(255,255,255,0.3);font-size:12px">Expected within 5-7 days</p>
    </div>`;
}

/* ── Transactions ── */
function renderTransactions() {
  const txAmounts = [284, 156, 420, 180];
  document.getElementById("tx-list").innerHTML = transactions.map((t, i)=>`
    <div class="tx-item">
      <div class="tx-icon">💸</div>
      <div style="flex:1"><div class="tx-desc">${t.desc}</div><div class="tx-date">${t.date}</div></div>
      <div><div class="tx-amount">+${convertCurrency(txAmounts[i] || 0)}</div><div class="tx-status">${t.status}</div></div>
    </div>`).join("");
}

/* ── Payments ── */
const PAY_KEY = 'clipency_payment_methods';

function getPaymentMethods() {
  try { return JSON.parse(localStorage.getItem(PAY_KEY)) || []; }
  catch { return []; }
}
function savePaymentMethods(arr) { localStorage.setItem(PAY_KEY, JSON.stringify(arr)); }

const payLogos = { UPI: 'upilogo.png', PayPal: 'paypallogo.png', Crypto: null };
const cryptoLogos = { USDC: 'usdclogo.png', SOL: 'sollogo.png' };
const payColors = { UPI: '#22C55E', PayPal: '#3B7DDD', Crypto: '#F97316' };

function getPayLogo(m) {
  if (m.type === 'Crypto' && m.subtype && cryptoLogos[m.subtype]) {
    return `<img src="${cryptoLogos[m.subtype]}" alt="${m.subtype}" class="pay-logo-img">`;
  }
  if (payLogos[m.type]) {
    return `<img src="${payLogos[m.type]}" alt="${m.type}" class="pay-logo-img">`;
  }
  return '🪙';
}

function renderPayments() {
  const methods = getPaymentMethods();
  const list = document.getElementById("payment-list");
  if (methods.length === 0) {
    list.innerHTML = `<div class="pay-empty"><p>No payment methods added yet.</p><p style="font-size:12px;color:rgba(255,255,255,0.3)">Add a method to start receiving payouts</p></div>`;
    return;
  }
  list.innerHTML = methods.map((m, i) => {
    const isPrimary = m.primary === true;
    return `
    <div class="payment-item ${isPrimary ? 'primary' : ''}" style="border-color:${isPrimary ? '#B6ABEA40' : payColors[m.type] + '25'}">
      <div class="pay-icon" style="background:${payColors[m.type]}15">${getPayLogo(m)}</div>
      <div style="flex:1">
        <div class="pay-name">${m.type}${m.subtype ? ' · ' + m.subtype : ''}${isPrimary ? '<span class="badge-primary" style="margin-left:8px">Primary</span>' : ''}</div>
        <div class="pay-detail">${m.detail}</div>
      </div>
      <button class="pay-primary-btn ${isPrimary ? 'is-primary' : ''}" data-idx="${i}" title="${isPrimary ? 'Primary method' : 'Set as primary'}">
        ${isPrimary ? '★' : '☆'}
      </button>
      <button class="pay-delete-btn" data-idx="${i}" title="Delete this method">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button>
    </div>
  `}).join("");
  // Delete handlers
  list.querySelectorAll(".pay-delete-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const idx = +btn.dataset.idx;
      const methods = getPaymentMethods();
      const name = methods[idx].type;
      methods.splice(idx, 1);
      savePaymentMethods(methods);
      renderPayments();
      showPayToast(`${name} payment method removed`, 'info');
    });
  });
  // Primary handlers
  list.querySelectorAll(".pay-primary-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const idx = +btn.dataset.idx;
      const methods = getPaymentMethods();
      methods.forEach((m, i) => m.primary = (i === idx));
      savePaymentMethods(methods);
      renderPayments();
      showPayToast(`${methods[idx].type} set as primary payment method`, 'success');
    });
  });
}

function showPayToast(msg, type) {
  // Reuse the main toast if available, otherwise console
  if (typeof showToast === 'function') { showToast(msg, type); return; }
  console.log(`[${type}] ${msg}`);
}

// ── Payment modal logic ──
let payModalMode = 'add'; // 'add' or 'edit'

function openPayModal(mode) {
  payModalMode = mode;
  document.getElementById("pay-modal").classList.remove("hidden");
  renderPayModalStep1();
}
function closePayModal() { document.getElementById("pay-modal").classList.add("hidden"); }

document.getElementById("pay-modal")?.addEventListener("click", e => {
  if (e.target === document.getElementById("pay-modal")) closePayModal();
});

document.getElementById("btn-add-payment")?.addEventListener("click", () => openPayModal('add'));
document.getElementById("btn-change-payment")?.addEventListener("click", () => {
  const methods = getPaymentMethods();
  if (methods.length === 0) {
    showPayToast('No payment methods to edit. Add one first.', 'error');
    return;
  }
  openPayModal('edit');
});

function renderPayModalStep1() {
  const box = document.getElementById("pay-modal-box");
  const methods = getPaymentMethods();
  const existingTypes = methods.map(m => m.type);
  const title = payModalMode === 'add' ? 'Add Payment Method' : 'Change Payment Info';
  const subtitle = payModalMode === 'add' ? 'Select a payment method to add' : 'Select which method to update';
  box.innerHTML = `
    <div class="pay-modal-head">
      <div>
        <p style="color:#B6ABEA;font-size:11px;font-weight:700;letter-spacing:1.5px;margin-bottom:4px">${payModalMode === 'add' ? 'ADD METHOD' : 'EDIT METHOD'}</p>
        <h3 style="font-size:18px;font-weight:700">${title}</h3>
      </div>
      <button class="modal-close-btn" id="pay-close">×</button>
    </div>
    <div class="pay-modal-body">
      <p style="color:rgba(255,255,255,0.5);font-size:13px;margin-bottom:20px">${subtitle}</p>
      <div class="pay-type-grid">
        <button class="pay-type-btn ${payModalMode === 'add' && existingTypes.includes('UPI') ? 'disabled' : ''}" data-type="UPI" ${payModalMode === 'add' && existingTypes.includes('UPI') ? 'disabled' : ''}>
          <img src="upilogo.png" alt="UPI" class="pay-type-logo">
          <span class="pay-type-name">UPI</span>
          ${existingTypes.includes('UPI') ? '<span class="pay-type-badge">Added</span>' : ''}
        </button>
        <button class="pay-type-btn ${payModalMode === 'add' && existingTypes.includes('PayPal') ? 'disabled' : ''}" data-type="PayPal" ${payModalMode === 'add' && existingTypes.includes('PayPal') ? 'disabled' : ''}>
          <img src="paypallogo.png" alt="PayPal" class="pay-type-logo">
          <span class="pay-type-name">PayPal</span>
          ${existingTypes.includes('PayPal') ? '<span class="pay-type-badge">Added</span>' : ''}
        </button>
        <button class="pay-type-btn ${payModalMode === 'add' && existingTypes.includes('Crypto') ? 'disabled' : ''}" data-type="Crypto" ${payModalMode === 'add' && existingTypes.includes('Crypto') ? 'disabled' : ''}>
          <span class="pay-type-icon" style="color:#F97316;font-size:20px">🪙</span>
          <span class="pay-type-name">Crypto</span>
          ${existingTypes.includes('Crypto') ? '<span class="pay-type-badge">Added</span>' : ''}
        </button>
      </div>
    </div>`;
  box.querySelector("#pay-close").addEventListener("click", closePayModal);
  box.querySelectorAll(".pay-type-btn:not(.disabled)").forEach(btn => {
    btn.addEventListener("click", () => {
      const type = btn.dataset.type;
      if (payModalMode === 'add') {
        const existing = getPaymentMethods();
        if (existing.find(m => m.type === type)) {
          showPayToast(`${type} payment info already exists. Use "Change Payment Info" to update it.`, 'error');
          return;
        }
      }
      if (type === 'Crypto') { renderPayModalCryptoSelect(type); }
      else { renderPayModalForm(type, null); }
    });
  });
}

function renderPayModalCryptoSelect() {
  const box = document.getElementById("pay-modal-box");
  box.innerHTML = `
    <div class="pay-modal-head">
      <div>
        <p style="color:#B6ABEA;font-size:11px;font-weight:700;letter-spacing:1.5px;margin-bottom:4px">CRYPTO</p>
        <h3 style="font-size:18px;font-weight:700">Select Token</h3>
      </div>
      <button class="modal-close-btn" id="pay-close">×</button>
    </div>
    <div class="pay-modal-body">
      <p style="color:rgba(255,255,255,0.5);font-size:13px;margin-bottom:20px">Choose your preferred cryptocurrency</p>
      <div class="pay-crypto-grid">
        <button class="pay-crypto-btn" data-token="USDC">
          <img src="usdclogo.png" alt="USDC" class="crypto-token-logo">
          <div>
            <div style="font-weight:700;font-size:15px">USDC</div>
            <div style="color:rgba(255,255,255,0.4);font-size:11px">USD Coin</div>
          </div>
        </button>
        <button class="pay-crypto-btn" data-token="SOL">
          <img src="sollogo.png" alt="SOL" class="crypto-token-logo">
          <div>
            <div style="font-weight:700;font-size:15px">SOL</div>
            <div style="color:rgba(255,255,255,0.4);font-size:11px">Solana</div>
          </div>
        </button>
      </div>
      <button class="btn-link" id="crypto-back" style="margin-top:12px">← Back</button>
    </div>`;
  box.querySelector("#pay-close").addEventListener("click", closePayModal);
  box.querySelector("#crypto-back").addEventListener("click", () => renderPayModalStep1());
  box.querySelectorAll(".pay-crypto-btn").forEach(btn => {
    btn.addEventListener("click", () => renderPayModalForm('Crypto', btn.dataset.token));
  });
}

function renderPayModalForm(type, subtype) {
  const box = document.getElementById("pay-modal-box");
  const methods = getPaymentMethods();
  const existing = methods.find(m => m.type === type);
  let label, placeholder, currentVal = '';
  if (type === 'UPI') { label = 'UPI ID'; placeholder = 'yourname@upi'; }
  else if (type === 'PayPal') { label = 'PayPal Email'; placeholder = 'you@example.com'; }
  else { label = `${subtype} Wallet Address`; placeholder = 'Paste your wallet address'; }
  if (payModalMode === 'edit' && existing) { currentVal = existing.detail; }

  box.innerHTML = `
    <div class="pay-modal-head">
      <div>
        <p style="color:#B6ABEA;font-size:11px;font-weight:700;letter-spacing:1.5px;margin-bottom:4px">${payModalMode === 'add' ? 'ADD' : 'EDIT'} · ${type.toUpperCase()}</p>
        <h3 style="font-size:18px;font-weight:700">${payModalMode === 'add' ? 'Enter' : 'Update'} ${label}</h3>
      </div>
      <button class="modal-close-btn" id="pay-close">×</button>
    </div>
    <div class="pay-modal-body">
      <label class="pay-form-label">${label}</label>
      <input class="url-input pay-form-input" id="pay-input" type="text" placeholder="${placeholder}" value="${currentVal}" autocomplete="off">
      <div class="modal-btn-row" style="margin-top:20px">
        <button class="btn-back" id="pay-form-back">← Back</button>
        <button class="btn-submit pay-form-submit" id="pay-form-save" style="background:linear-gradient(135deg,#6C5DD3,#B6ABEA);flex:2">${payModalMode === 'add' ? 'Add Method' : 'Save Changes'}</button>
      </div>
    </div>`;
  box.querySelector("#pay-close").addEventListener("click", closePayModal);
  box.querySelector("#pay-form-back").addEventListener("click", () => {
    if (type === 'Crypto') renderPayModalCryptoSelect();
    else renderPayModalStep1();
  });
  const input = box.querySelector("#pay-input");
  input.focus();
  box.querySelector("#pay-form-save").addEventListener("click", () => {
    const val = input.value.trim();
    if (!val) { input.style.borderColor = '#EC4899'; return; }
    const methods = getPaymentMethods();
    if (payModalMode === 'add') {
      if (methods.find(m => m.type === type)) {
        showPayToast(`${type} payment info already exists! Use "Change Payment Info" to update or delete it first.`, 'error');
        closePayModal();
        return;
      }
      methods.push({ type, subtype: subtype || null, detail: val });
    } else {
      const idx = methods.findIndex(m => m.type === type);
      if (idx >= 0) {
        methods[idx].detail = val;
        if (subtype) methods[idx].subtype = subtype;
      } else {
        methods.push({ type, subtype: subtype || null, detail: val });
      }
    }
    savePaymentMethods(methods);
    renderPayments();
    closePayModal();
    showPayToast(`${type} payment method ${payModalMode === 'add' ? 'added' : 'updated'} successfully!`, 'success');
  });
}

/* ── Profile ── */
function buildProfile(user) {
  const meta = user.user_metadata || {};
  const name = [meta.first_name, meta.last_name].filter(Boolean).join(" ") || "Creator";
  const email = user.email || "";
  document.getElementById("profile-hero").innerHTML = `
    <div class="profile-avatar">${name.charAt(0).toUpperCase()}</div>
    <div style="flex:1">
      <div class="profile-name-row">
        <span class="profile-name" id="profile-display-name">${name}</span>
        <button class="profile-edit-btn" id="edit-name-btn" title="Edit username">✏️</button>
      </div>
      <div class="profile-edit-row hidden" id="edit-name-row">
        <input type="text" class="profile-name-input" id="edit-name-input" value="${name}" placeholder="Enter new username">
        <button class="profile-save-btn" id="save-name-btn">Save</button>
        <button class="profile-cancel-btn" id="cancel-name-btn">Cancel</button>
      </div>
      <div class="profile-email">${email}</div>
      <span class="badge-verified">✓ Account Verified</span>
    </div>`;

  // Edit name handlers
  document.getElementById("edit-name-btn").addEventListener("click", () => {
    document.getElementById("edit-name-row").classList.remove("hidden");
    document.getElementById("profile-display-name").classList.add("hidden");
    document.getElementById("edit-name-btn").classList.add("hidden");
    document.getElementById("edit-name-input").focus();
  });
  document.getElementById("cancel-name-btn").addEventListener("click", () => {
    document.getElementById("edit-name-row").classList.add("hidden");
    document.getElementById("profile-display-name").classList.remove("hidden");
    document.getElementById("edit-name-btn").classList.remove("hidden");
  });
  document.getElementById("save-name-btn").addEventListener("click", async () => {
    const newName = document.getElementById("edit-name-input").value.trim();
    if (!newName) return;
    const btn = document.getElementById("save-name-btn");
    btn.textContent = "Saving…"; btn.disabled = true;
    const parts = newName.split(" ");
    const firstName = parts[0] || newName;
    const lastName = parts.slice(1).join(" ") || "";
    const { error } = await window.supabaseClient.auth.updateUser({
      data: { first_name: firstName, last_name: lastName }
    });
    if (!error) {
      document.getElementById("profile-display-name").textContent = newName;
      document.getElementById("user-name").textContent = newName;
      document.getElementById("user-avatar").textContent = newName.charAt(0).toUpperCase();
      const sn = document.getElementById("sidebar-user-name");
      const sa = document.getElementById("sidebar-avatar");
      if (sn) sn.textContent = newName;
      if (sa) sa.textContent = newName.charAt(0).toUpperCase();
    }
    btn.textContent = "Save"; btn.disabled = false;
    document.getElementById("edit-name-row").classList.add("hidden");
    document.getElementById("profile-display-name").classList.remove("hidden");
    document.getElementById("edit-name-btn").classList.remove("hidden");
  });

  const conns = [
    { platform:"TikTok", account:"@ayushbera", icon:"♪", connected:true },
    { platform:"Instagram", account:"@ayush.bera", icon:"◉", connected:true },
    { platform:"YouTube", account:"Ayush Bera Channel", icon:"▶", connected:false },
  ];
  document.getElementById("connected-accounts").innerHTML = `
    <h4 style="margin-bottom:20px">Connected Accounts</h4>
    ${conns.map(a=>`
      <div class="connected-item">
        <div class="conn-icon">${a.icon}</div>
        <div><div class="conn-name">${a.platform}</div><div class="conn-handle">${a.account}</div></div>
        <span class="conn-status ${a.connected?'connected':'disconnected'}">${a.connected?'Connected':'Connect'}</span>
      </div>`).join("")}`;
}

/* ── Modal ── */
function openModal(campaign) {
  modalStep=1; modalPlatform=null; modalAccount=null;
  document.getElementById("submit-modal").classList.remove("hidden");
  renderModal(campaign);
}

function closeModal() { document.getElementById("submit-modal").classList.add("hidden"); }

document.getElementById("submit-modal").addEventListener("click", e => {
  if (e.target === document.getElementById("submit-modal")) closeModal();
});

function renderModal(campaign) {
  const box = document.getElementById("modal-box");
  const steps = [1,2,3].map(s=>`<div class="modal-step ${modalStep>=s?'done':''}"></div>`).join("");
  let body = "";
  if (modalStep===1) {
    body = `
      <p style="color:rgba(255,255,255,0.6);font-size:13px;margin-bottom:20px">Select the platform where you posted your clip</p>
      <div class="platform-grid">
        ${campaign.platforms.map(p=>`
          <button class="platform-btn" data-plat="${p}">
            <div class="platform-icon">${p==="TikTok"?"♪":p==="Instagram"?"◉":"▶"}</div>
            <div class="platform-name">${p}</div>
          </button>`).join("")}
      </div>`;
  } else if (modalStep===2) {
    body = `
      <p style="color:rgba(255,255,255,0.6);font-size:13px;margin-bottom:20px">Select your connected ${modalPlatform} account</p>
      ${(accounts[modalPlatform]||[]).map(acc=>`
        <button class="account-btn" data-acc="${acc}">
          <div class="acc-av">${acc.charAt(1).toUpperCase()}</div>
          <div><div class="acc-name">${acc}</div><div class="acc-sub">Connected account</div></div>
        </button>`).join("")}
      <button class="btn-link" id="modal-back1">← Back</button>`;
  } else if (modalStep===3) {
    body = `
      <p style="color:rgba(255,255,255,0.6);font-size:13px;margin-bottom:8px">Paste your ${modalPlatform} video URL</p>
      <p style="color:rgba(255,255,255,0.3);font-size:11px;margin-bottom:16px">Account: ${modalAccount}</p>
      <input class="url-input" id="clip-url" type="url" placeholder="https://${modalPlatform.toLowerCase()}.com/...">
      <div class="modal-btn-row">
        <button class="btn-back" id="modal-back2">← Back</button>
        <button class="btn-submit" id="modal-submit" style="background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.3);cursor:not-allowed">Submit Clip →</button>
      </div>`;
  }
  box.innerHTML = `
    <div class="modal-head">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div>
          <p style="color:#A78BFA;font-size:12px;margin-bottom:4px;font-weight:600;letter-spacing:1px">SUBMIT CLIP</p>
          <h2 style="font-size:20px;font-weight:700">${campaign.title}</h2>
        </div>
        <button class="modal-close-btn" id="modal-close">×</button>
      </div>
      <div class="modal-steps">${steps}</div>
    </div>
    <div class="modal-body">${body}</div>`;

  box.querySelector("#modal-close").addEventListener("click", closeModal);

  if (modalStep===1) {
    box.querySelectorAll(".platform-btn").forEach(btn=>{
      btn.addEventListener("click",()=>{ modalPlatform=btn.dataset.plat; modalStep=2; renderModal(campaign); });
    });
  } else if (modalStep===2) {
    box.querySelectorAll(".account-btn").forEach(btn=>{
      btn.addEventListener("click",()=>{ modalAccount=btn.dataset.acc; modalStep=3; renderModal(campaign); });
    });
    box.querySelector("#modal-back1").addEventListener("click",()=>{ modalStep=1; renderModal(campaign); });
  } else if (modalStep===3) {
    const urlInput = box.querySelector("#clip-url");
    const submitBtn = box.querySelector("#modal-submit");
    urlInput.addEventListener("input",()=>{
      if(urlInput.value) {
        submitBtn.style.background="linear-gradient(135deg,#6C5DD3,#8F7EE7)";
        submitBtn.style.color="#fff"; submitBtn.style.cursor="pointer";
      } else {
        submitBtn.style.background="rgba(255,255,255,0.06)";
        submitBtn.style.color="rgba(255,255,255,0.3)"; submitBtn.style.cursor="not-allowed";
      }
    });
    submitBtn.addEventListener("click", async () => {
      if (!urlInput.value) return;
      // Show loading state
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting…';

      const { error } = await window.supabaseClient.from('submissions').insert({
        user_id:        _authUser.id,
        campaign_id:    campaign.id,
        
            campaign_title: activeCampaign?.title || campaign?.title || "Campaign",campaign_title: activeCampaign?.title || campaign?.title || "Campaign",
        platform:       modalPlatform,
        account_handle: modalAccount,
        video_url:      urlInput.value,
        
            post_url: urlInput.value,views:    0,
        likes:    0,
        comments: 0,
        earnings: 0,
        status:   'pending'
      });

      if (error) {
        box.innerHTML = `
          <div style="padding:48px;text-align:center">
            <div style="font-size:40px;margin-bottom:16px">⚠️</div>
            <h3 style="font-size:18px;font-weight:700;margin-bottom:8px;color:#fff">Submission Failed</h3>
            <p style="color:rgba(255,255,255,0.5);font-size:13px">${error.message}</p>
          </div>`;
        setTimeout(closeModal, 3000);
        return;
      }

      box.innerHTML = `
        <div style="padding:48px;text-align:center">
          <div class="success-check">✓</div>
          <h3 style="font-size:22px;font-weight:700;margin-bottom:8px">Clip Submitted!</h3>
          <p style="color:rgba(255,255,255,0.5);font-size:14px">Your clip is being tracked. Stats update within 24 hours.</p>
        </div>`;
      setTimeout(closeModal, 2200);
    });
    box.querySelector("#modal-back2").addEventListener("click",()=>{ modalStep=2; renderModal(campaign); });
  }
}

/* ── Init handled after auth resolves above ── */




/* =========================
   FORCE LIVE CAMPAIGNS FROM SUPABASE
   ========================= */

async function loadLiveCampaignsFromSupabase() {
  try {
    if (!window.supabaseClient) {
      console.error("Supabase client not found");
      return;
    }

    const { data, error } = await window.supabaseClient
      .from("campaigns")
      .select("id,title,slug,type,genre,description,requirements,rpm,rate_label,budget,currency,creators_count,status,is_new,created_at")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Campaign fetch error:", error);
      return;
    }

    campaigns.length = 0;

    data.forEach((campaign, index) => {
      campaigns.push({
        id: campaign.id,
        title: campaign.title,
        category: campaign.genre || campaign.type || "Campaign",
        type: campaign.type || campaign.genre || "Campaign",
        genre: campaign.genre || campaign.type || "Campaign",
        tags: [campaign.genre, campaign.type].filter(Boolean),
        rate: campaign.rpm || 0,
        rpm: campaign.rpm || 0,
        budget: campaign.budget || 0,
        budgetUsed: 0,
        currency: campaign.currency || "USD",
        creators: campaign.creators_count || 0,
        isNew: campaign.is_new ?? true,
        description: campaign.description || "",
        requirements: campaign.requirements || "",
        status: campaign.status || "active",
        genre: campaign.genre || campaign.type || "Campaign",
        budgetUsed: 0,
        color: ["#6C5DD3", "#14B8A6", "#FACC15", "#EC4899", "#F97316", "#A78BFA"][index % 6],
        platforms: ["TikTok", "Instagram", "YouTube"],
        views: [120,200,300,420,560,720,900,1100,1300,1500,1750,2000],
        color: ["#6C5DD3", "#14B8A6", "#FACC15", "#EC4899", "#F97316", "#A78BFA"][index % 6],
        platforms: ["Instagram", "TikTok", "YouTube Shorts"],
        views: [80, 160, 240, 360, 480, 620, 760, 900, 1050, 1200, 1380, 1550]
      });
    });

    window.campaigns = campaigns;

    const campaignCountEls = document.querySelectorAll(".campaign-count, #campaign-count");
    campaignCountEls.forEach((el) => {
      el.textContent = `${campaigns.length} campaigns`;
    });

    if (typeof renderCampaigns === "function") {
      renderCampaigns();
    }

    console.log("✅ Live campaigns loaded from Supabase:", campaigns.length);
  } catch (err) {
    console.error("Live campaigns load failed:", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(loadLiveCampaignsFromSupabase, 800);
});










/* =========================
   PREMIUM DASHBOARD OVERVIEW
   ========================= */

function clipencyMoney(amount) {
  const n = Number(amount || 0);
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function clipencyCompact(n) {
  n = Number(n || 0);
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return `${n}`;
}

function getRecommendedCampaigns(submissions = []) {
  const approved = submissions.filter(s => s.status === "approved");
  const bestCampaignIds = new Set(approved.map(s => s.campaign_id).filter(Boolean));

  const recommended = campaigns
    .map(c => {
      let score = 0;

      if (bestCampaignIds.has(c.id)) score += 40;
      score += Number(c.rpm || 0) / 40;
      score += Number(c.creators || 0) / 10;

      if ((c.tags || []).some(t => ["Music", "Clipping", "Edits"].includes(t))) score += 8;

      return { ...c, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return recommended;
}

async function renderPremiumDashboard() {
  const root = document.getElementById("premium-dashboard-content");
  if (!root) return;

  let submissions = [];

  try {
    if (window.supabaseClient && _authUser) {
      const { data, error } = await window.supabaseClient
        .from("submissions")
        .select("id, campaign_id, campaign_title, platform, views, likes, comments, earnings, status, submitted_at")
        .eq("user_id", _authUser.id)
        .order("submitted_at", { ascending: false });

      if (!error && data) submissions = data;
    }
  } catch (err) {
    console.warn("Dashboard summary fetch failed:", err);
  }

  const totalViews = submissions.reduce((sum, s) => sum + Number(s.views || 0), 0);
  const approvedEarnings = submissions
    .filter(s => s.status === "approved" || s.status === "paid")
    .reduce((sum, s) => sum + Number(s.earnings || 0), 0);

  const activeCampaigns = new Set(submissions.map(s => s.campaign_id).filter(Boolean)).size;
  const pendingSubmissions = submissions.filter(s => s.status === "pending").length;
  const recommended = getRecommendedCampaigns(submissions);

  root.innerHTML = `
    <div class="overview-grid">
      <div class="overview-card hero-card">
        <span class="card-label">Total Views</span>
        <strong>${clipencyCompact(totalViews)}</strong>
        <p>Generated across all submitted clips.</p>
      </div>

      <div class="overview-card hero-card">
        <span class="card-label">Approved Earnings</span>
        <strong>${clipencyMoney(approvedEarnings)}</strong>
        <p>Cleared earnings from reviewed submissions.</p>
      </div>

      <div class="overview-card hero-card">
        <span class="card-label">Active Campaigns</span>
        <strong>${activeCampaigns}</strong>
        <p>Campaigns you have submitted to.</p>
      </div>

      <div class="overview-card hero-card">
        <span class="card-label">Pending Review</span>
        <strong>${pendingSubmissions}</strong>
        <p>Clips waiting for approval.</p>
      </div>
    </div>

    <div class="dashboard-split">
      <div class="overview-panel">
        <div class="panel-head">
          <div>
            <span class="eyebrow">SMART MATCHING</span>
            <h2>Best campaigns for you</h2>
          </div>
          <a class="premium-link" href="/campaigns">View all campaigns →</a>
        </div>

        <div class="recommended-list">
          ${recommended.map(c => `
            <div class="recommended-card">
              <div class="campaign-mark" style="border-color:${c.color || '#6C5DD3'}">
                ♫
              </div>
              <div class="recommended-main">
                <h3>${c.title}</h3>
                <p>${[...new Set(c.tags || [])].join(" · ") || c.genre || "Campaign"}</p>
              </div>
              <div class="recommended-metric">
                <span>${clipencyMoney(c.rpm)}</span>
                <small>per 1M views</small>
              </div>
            </div>
          `).join("")}
        </div>
      </div>

      <div class="overview-panel">
        <div class="panel-head">
          <div>
            <span class="eyebrow">RECENT ACTIVITY</span>
            <h2>Your latest clips</h2>
          </div>
          <a class="premium-link" href="/stats">Open stats →</a>
        </div>

        <div class="activity-list">
          ${
            submissions.length
              ? submissions.slice(0, 5).map(s => `
                  <div class="activity-row">
                    <div>
                      <strong>${s.campaign_title || "Campaign"}</strong>
                      <span>${s.platform || "Submitted"} · ${new Date(s.submitted_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                    </div>
                    <div class="activity-status ${s.status || "pending"}">${s.status || "pending"}</div>
                  </div>
                `).join("")
              : `<div class="empty-state">No clips submitted yet. Start with a campaign that matches your audience.</div>`
          }
        </div>
      </div>
    </div>
  `;
}

/* =========================
   CLEAN PREMIUM ROUTING
   ========================= */

(function setupClipencyPremiumRoutes() {
  const routeMap = {
    "/dashboard": "dashboard",
    "/campaigns": "campaigns",
    "/stats": "stats",
    "/payouts": "payout",
    "/wallet": "payment",
    "/profile": "profile"
  };

  const pageToPath = {
    dashboard: "/dashboard",
    campaigns: "/campaigns",
    stats: "/stats",
    payout: "/payouts",
    payment: "/wallet",
    profile: "/profile"
  };

  const labels = {
    dashboard: ["dashboard", "overview"],
    campaigns: ["campaigns", "campaign"],
    stats: ["stats", "statistics"],
    payout: ["payouts", "payout"],
    payment: ["wallet", "payment"],
    profile: ["profile"]
  };

  function pageFromUrl() {
    const path = window.location.pathname.toLowerCase();
    const query = new URLSearchParams(window.location.search).get("page");

    if (routeMap[path]) return routeMap[path];
    if (query && pageToPath[query]) return query;

    return "dashboard";
  }

  function openPage(page, push = true) {
    const cleanPage = pageToPath[page] ? page : "dashboard";

    document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));

    const section = document.getElementById("section-" + cleanPage);
    if (section) section.classList.add("active");

    const nav = Array.from(document.querySelectorAll(".nav-item")).find(el => {
      const text = (el.textContent || "").toLowerCase();
      const data = (el.dataset.section || "").toLowerCase();
      return (labels[cleanPage] || []).some(word => text.includes(word) || data.includes(word));
    });

    if (nav) nav.classList.add("active");

    activeSection = cleanPage;

    if (cleanPage === "dashboard") renderPremiumDashboard();
    if (cleanPage === "campaigns") {
      activeCampaign = null;
      renderCampaigns();
    }
    if (cleanPage === "stats") renderStatsChart();
    if (cleanPage === "payout") {
      renderPayoutSection();
      renderTransactions();
    }
    if (cleanPage === "payment") renderPayments();

    const targetPath = pageToPath[cleanPage] || "/dashboard";

    if (push && window.location.pathname !== targetPath) {
      window.history.pushState({ page: cleanPage }, "", targetPath);
    }

    const titleName = cleanPage === "dashboard" ? "Dashboard" : cleanPage.charAt(0).toUpperCase() + cleanPage.slice(1);
    document.title = `Clipency | ${titleName}`;
  }

  document.addEventListener("click", function(event) {
    const nav = event.target.closest(".nav-item");
    if (!nav) return;

    const section = nav.dataset.section;
    if (!section) return;

    setTimeout(() => openPage(section, true), 60);
  });

  window.addEventListener("popstate", function() {
    openPage(pageFromUrl(), false);
  });

  document.addEventListener("DOMContentLoaded", function() {
    setTimeout(() => openPage(pageFromUrl(), false), 1200);
  });
})();


/* ================================
   UNIVERSAL DISPLAY NAME + PREMIUM PROFILE
   ================================ */

async function clipencyGetProfile() {
  try {
    const { data: sessionData } = await window.supabaseClient.auth.getSession();
    const user = sessionData?.session?.user || window._authUser || _authUser;

    if (!user) return { user: null, profile: null };

    const { data: profile } = await window.supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    return { user, profile };
  } catch (error) {
    console.warn("Profile fetch failed:", error);
    return { user: window._authUser || _authUser || null, profile: null };
  }
}

function clipencyDisplayName(profile, user) {
  const meta = user?.user_metadata || {};

  const firstLast = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    profile?.full_name ||
    firstLast ||
    meta.full_name ||
    meta.name ||
    [meta.first_name, meta.last_name].filter(Boolean).join(" ").trim() ||
    user?.email?.split("@")[0] ||
    "Creator"
  );
}

function clipencyInitial(name) {
  return (name || "C").trim().charAt(0).toUpperCase();
}

async function clipencyUpdateVisibleIdentity() {
  const { user, profile } = await clipencyGetProfile();
  if (!user) return;

  const name = clipencyDisplayName(profile, user);
  const emailPrefix = user.email?.split("@")[0];

  document.querySelectorAll("body *").forEach((el) => {
    if (!el.children.length && el.textContent) {
      const text = el.textContent.trim();

      if (
        text === emailPrefix ||
        text === profile?.username ||
        text === "patilsmit2006"
      ) {
        el.textContent = name;
      }

      if (text === "Creator" && el.closest("#section-profile")) {
        el.textContent = name;
      }
    }
  });

  document.querySelectorAll(".avatar, .user-avatar, [class*='avatar']").forEach((el) => {
    if ((el.textContent || "").trim().length <= 2) {
      el.textContent = clipencyInitial(name);
    }
  });
}

async function renderPremiumProfilePage() {
  const section = document.getElementById("section-profile");
  if (!section || !section.classList.contains("active")) return;

  const { user, profile } = await clipencyGetProfile();
  if (!user) return;

  const name = clipencyDisplayName(profile, user);
  const role = profile?.role || "clipper";
  const email = profile?.email || user.email || "";
  const country = profile?.country || "India";
  const username = profile?.username || email.split("@")[0] || "creator";

  let submissions = [];
  try {
    const { data } = await window.supabaseClient
      .from("submissions")
      .select("id, views, earnings, status, campaign_id")
      .eq("user_id", user.id);

    submissions = data || [];
  } catch {}

  const totalViews = submissions.reduce((sum, s) => sum + Number(s.views || 0), 0);
  const totalEarned = submissions
    .filter(s => s.status === "approved" || s.status === "paid")
    .reduce((sum, s) => sum + Number(s.earnings || 0), 0);

  const activeCampaigns = new Set(submissions.map(s => s.campaign_id).filter(Boolean)).size;
  const approvedClips = submissions.filter(s => s.status === "approved" || s.status === "paid").length;

  let clipencyRank = "—";
  let totalCreators = "—";

  try {
    const { data: rankRows } = await window.supabaseClient
      .from("creator_payout_rankings")
      .select("user_id, clipency_rank")
      .order("clipency_rank", { ascending: true });

    if (rankRows && rankRows.length) {
      totalCreators = rankRows.length;
      const mine = rankRows.find(row => row.user_id === user.id);
      if (mine) clipencyRank = mine.clipency_rank;
    }
  } catch (err) {
    console.warn("Rank fetch failed:", err);
  }

  section.innerHTML = `
    <div class="premium-profile-shell">
      <div class="premium-profile-hero">
        <div class="premium-avatar-xl">${clipencyInitial(name)}</div>

        <div class="premium-profile-copy">
          <span class="eyebrow">CREATOR PROFILE</span>
          <h1>${name}</h1>
          <p>${email}</p>

          <div class="premium-profile-badges">
            <span class="premium-pill success">✓ Account Verified</span>
            <span class="premium-pill">${role === "admin" ? "Creator" : role.charAt(0).toUpperCase() + role.slice(1)}</span>
            <span class="premium-pill">${country}</span>
          </div>
        </div>

        <div class="profile-score-card">
          <span>Clipency Rank</span>
          <strong>${clipencyRank === "—" ? "—" : "#" + clipencyRank}</strong>
          <small>By approved payouts across ${totalCreators} creators</small>
        </div>
      </div>

      <div class="premium-profile-grid">
        <div class="premium-profile-panel">
          <h2>Performance Identity</h2>

          <div class="profile-info-list">
            <div class="profile-info-row">
              <span>Display Name</span>
              <strong>${name}</strong>
            </div>

            <div class="profile-info-row">
              <span>Username</span>
              <strong>@${username}</strong>
            </div>

            <div class="profile-info-row">
              <span>Total Views</span>
              <strong>${Number(totalViews || 0).toLocaleString()}</strong>
            </div>

            <div class="profile-info-row">
              <span>Total Earned</span>
              <strong>$${Number(totalEarned || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong>
            </div>

            <div class="profile-info-row">
              <span>Clipency Rank</span>
              <strong>${clipencyRank === "—" ? "Not ranked yet" : "#" + clipencyRank + " of " + totalCreators}</strong>
            </div>

            <div class="profile-info-row">
              <span>Campaigns Submitted</span>
              <strong>${activeCampaigns}</strong>
            </div>
          </div>
        </div>

        <div class="premium-profile-panel">
          <h2>Connected Accounts</h2>

          <div class="connected-premium-list">
            <div class="connected-premium-row">
              <div class="connected-premium-icon">♪</div>
              <div class="connected-premium-main">
                <strong>TikTok</strong>
                <span>Ready for campaign submissions</span>
              </div>
              <div class="connected-premium-status">Connected</div>
            </div>

            <div class="connected-premium-row">
              <div class="connected-premium-icon">◎</div>
              <div class="connected-premium-main">
                <strong>Instagram</strong>
                <span>Ready for reels and creator proof</span>
              </div>
              <div class="connected-premium-status">Connected</div>
            </div>

            <div class="connected-premium-row">
              <div class="connected-premium-icon">▶</div>
              <div class="connected-premium-main">
                <strong>YouTube</strong>
                <span>Connect Shorts for more campaign access</span>
              </div>
              <div class="connected-premium-status muted">Connect</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  clipencyUpdateVisibleIdentity();
}

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(clipencyUpdateVisibleIdentity, 800);
  setTimeout(clipencyUpdateVisibleIdentity, 1800);
  setTimeout(renderPremiumProfilePage, 1200);
});

document.addEventListener("click", () => {
  setTimeout(clipencyUpdateVisibleIdentity, 300);
  setTimeout(renderPremiumProfilePage, 500);
});

window.addEventListener("popstate", () => {
  setTimeout(clipencyUpdateVisibleIdentity, 300);
  setTimeout(renderPremiumProfilePage, 500);
});

/* ================================
   USERNAME EDIT: ONCE PER 30 DAYS
   ================================ */

async function clipencyUpdateUsername() {
  const input = document.getElementById("clipency-username-input");
  const message = document.getElementById("clipency-username-message");
  const button = document.getElementById("clipency-username-save");

  if (!input || !message || !button) return;

  const username = input.value.trim().toLowerCase();

  message.className = "username-edit-message";
  message.textContent = "Checking availability…";
  button.disabled = true;
  button.style.opacity = "0.6";

  try {
    const { data, error } = await window.supabaseClient.rpc("update_my_username", {
      new_username: username
    });

    if (error) throw error;

    if (!data?.success) {
      message.className = "username-edit-message error";
      message.textContent = data?.message || "Username update failed.";
      return;
    }

    message.className = "username-edit-message success";
    message.textContent = data.message || "Username updated successfully.";

    setTimeout(() => {
      window.location.reload();
    }, 900);
  } catch (err) {
    message.className = "username-edit-message error";
    message.textContent = err.message || "Something went wrong.";
  } finally {
    button.disabled = false;
    button.style.opacity = "1";
  }
}

function clipencyInjectUsernameEditor(profile) {
  const infoList = document.querySelector(".profile-info-list");
  if (!infoList || document.getElementById("clipency-username-input")) return;

  const currentUsername = profile?.username || "";

  const card = document.createElement("div");
  card.className = "username-edit-card";
  card.innerHTML = `
    <strong>Username</strong>
    <div class="username-edit-row">
      <input 
        id="clipency-username-input" 
        value="${currentUsername}" 
        placeholder="choose_username"
        maxlength="24"
      />
      <button id="clipency-username-save">Save</button>
    </div>
    <div class="username-edit-note">
      Usernames are unique and can be changed only once every 30 days. Use lowercase letters, numbers and underscores only.
    </div>
    <div id="clipency-username-message" class="username-edit-message"></div>
  `;

  infoList.appendChild(card);

  document
    .getElementById("clipency-username-save")
    ?.addEventListener("click", clipencyUpdateUsername);
}

const oldRenderPremiumProfilePageForUsername = typeof renderPremiumProfilePage === "function"
  ? renderPremiumProfilePage
  : null;

if (oldRenderPremiumProfilePageForUsername) {
  renderPremiumProfilePage = async function() {
    await oldRenderPremiumProfilePageForUsername();

    const { profile } = await clipencyGetProfile();

    clipencyInjectUsernameEditor(profile);

    document.querySelectorAll(".premium-pill").forEach((pill) => {
      const text = (pill.textContent || "").trim().toLowerCase();
      if (text === "admin") {
        pill.textContent = "Creator";
      }
    });
  };
}

/* ================================
   MASTERCLASS PERSONALISED DASHBOARD
   ================================ */

async function clipencyDashboardIdentity() {
  try {
    const { data: sessionData } = await window.supabaseClient.auth.getSession();
    const user = sessionData?.session?.user || window._authUser || _authUser;

    if (!user) return { user: null, profile: null };

    const { data: profile } = await window.supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    return { user, profile };
  } catch {
    return { user: window._authUser || _authUser || null, profile: null };
  }
}

function clipencyName(profile, user) {
  const meta = user?.user_metadata || {};
  const fromParts = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim();

  return (
    profile?.full_name ||
    fromParts ||
    meta.full_name ||
    meta.name ||
    [meta.first_name, meta.last_name].filter(Boolean).join(" ").trim() ||
    user?.email?.split("@")[0] ||
    "Creator"
  );
}

function clipencyUsername(profile, user) {
  return (
    profile?.username ||
    user?.email?.split("@")[0] ||
    "creator"
  );
}

function clipencyGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function clipencyFormatMoney(value) {
  return `$${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function clipencyFormatCompact(value) {
  const n = Number(value || 0);
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return `${n}`;
}

async function clipencyGetRank(userId) {
  try {
    const { data } = await window.supabaseClient
      .from("creator_payout_rankings")
      .select("user_id, clipency_rank")
      .order("clipency_rank", { ascending: true });

    if (!data || !data.length) return { rank: "—", total: "—" };

    const mine = data.find(row => row.user_id === userId);

    return {
      rank: mine?.clipency_rank || "—",
      total: data.length
    };
  } catch {
    return { rank: "—", total: "—" };
  }
}

function clipencyPickRecommendations(submissions) {
  const submittedTypes = new Set(
    submissions
      .map(s => (s.campaign_title || "").toLowerCase())
      .filter(Boolean)
  );

  return campaigns
    .map(c => {
      let score = 0;
      score += Number(c.rpm || 0) / 35;
      score += Number(c.creators || 0) / 12;

      if ((c.tags || []).some(t => ["Music", "Clipping", "Edits"].includes(t))) score += 10;
      if (submittedTypes.has((c.title || "").toLowerCase())) score -= 8;

      return { ...c, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

async function renderPremiumDashboard() {
  const root = document.getElementById("premium-dashboard-content");
  const section = document.getElementById("section-dashboard");

  if (!root || !section) return;

  const { user, profile } = await clipencyDashboardIdentity();
  if (!user) return;

  const name = clipencyName(profile, user);
  const username = clipencyUsername(profile, user);

  let submissions = [];

  try {
    const { data } = await window.supabaseClient
      .from("submissions")
      .select("id, campaign_id, campaign_title, platform, views, likes, comments, earnings, status, submitted_at")
      .eq("user_id", user.id)
      .order("submitted_at", { ascending: false });

    submissions = data || [];
  } catch {}

  const totalViews = submissions.reduce((sum, s) => sum + Number(s.views || 0), 0);
  const approvedEarnings = submissions
    .filter(s => s.status === "approved" || s.status === "paid")
    .reduce((sum, s) => sum + Number(s.earnings || 0), 0);

  const pending = submissions.filter(s => s.status === "pending").length;
  const activeCampaigns = new Set(submissions.map(s => s.campaign_id).filter(Boolean)).size;
  const rank = await clipencyGetRank(user.id);
  const recommendations = clipencyPickRecommendations(submissions);

  root.innerHTML = `
    <div class="master-dashboard-shell">
      <section class="master-welcome">
        <div class="master-welcome-copy">
          <div class="master-kicker">Creator Intelligence</div>
          <h1>${clipencyGreeting()}, <span>${name}</span></h1>

          <div class="master-username-line">
            <span>Your creator handle</span>
            <span class="master-username-pill">${username}</span>
          </div>

          <p class="master-helper">
            Your dashboard is now tuned around your submissions, approved payouts and campaign performance.
            Start with the campaigns that fit your momentum, then track every clip from submission to payout.
          </p>

          <div class="master-actions">
            <a class="master-btn primary" href="/campaigns">Explore campaigns</a>
            <a class="master-btn" href="/stats">Review performance</a>
            <a class="master-btn" href="/profile">Edit profile</a>
          </div>
        </div>

        <aside class="master-side-card">
          <div class="master-side-top">
            <div class="master-avatar">${name.charAt(0).toUpperCase()}</div>
            <div>
              <strong>${name}</strong>
              <span>@${username}</span>
            </div>
          </div>

          <div class="master-rank-strip">
            <div class="master-mini-stat">
              <span>Clipency Rank</span>
              <strong>${rank.rank === "—" ? "—" : "#" + rank.rank}</strong>
            </div>

            <div class="master-mini-stat">
              <span>Creators</span>
              <strong>${rank.total}</strong>
            </div>

            <div class="master-mini-stat">
              <span>Views</span>
              <strong>${clipencyFormatCompact(totalViews)}</strong>
            </div>

            <div class="master-mini-stat">
              <span>Earned</span>
              <strong>${clipencyFormatMoney(approvedEarnings)}</strong>
            </div>
          </div>
        </aside>
      </section>

      <div class="overview-grid">
        <div class="overview-card hero-card">
          <span class="card-label">Total Views</span>
          <strong>${clipencyFormatCompact(totalViews)}</strong>
          <p>Across all submitted clips.</p>
        </div>

        <div class="overview-card hero-card">
          <span class="card-label">Approved Earnings</span>
          <strong>${clipencyFormatMoney(approvedEarnings)}</strong>
          <p>Cleared from approved submissions.</p>
        </div>

        <div class="overview-card hero-card">
          <span class="card-label">Pending Review</span>
          <strong>${pending}</strong>
          <p>Clips waiting for admin approval.</p>
        </div>

        <div class="overview-card hero-card">
          <span class="card-label">Active Campaigns</span>
          <strong>${activeCampaigns}</strong>
          <p>Campaigns you have submitted to.</p>
        </div>
      </div>

      <section class="master-guidance-grid">
        <div class="master-panel">
          <div class="master-panel-head">
            <div>
              <span class="eyebrow">RECOMMENDED FOR YOU</span>
              <h2>Best campaigns for you</h2>
            </div>
            <a class="premium-link" href="/campaigns">View all →</a>
          </div>

          <div class="master-recommend-list">
            ${recommendations.map(c => `
              <div class="master-recommend-card">
                <div class="master-campaign-icon">♫</div>
                <div class="master-recommend-main">
                  <strong>${c.title}</strong>
                  <span>${[...new Set(c.tags || [])].join(" · ") || c.genre || "Campaign"}</span>
                </div>
                <div class="master-recommend-money">
                  <strong>${clipencyFormatMoney(c.rpm)}</strong>
                  <span>per 1M views</span>
                </div>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="master-panel">
          <div class="master-panel-head">
            <div>
              <span class="eyebrow">WHAT TO DO NOW</span>
              <h2>Recommended next steps</h2>
            </div>
          </div>

          <div class="master-next-steps">
            <div class="master-step">
              <div class="master-step-index">1</div>
              <div>
                <strong>Submit to one high-RPM campaign</strong>
                <span>Prioritise campaigns with strong payout per million views and matching content style.</span>
              </div>
            </div>

            <div class="master-step">
              <div class="master-step-index">2</div>
              <div>
                <strong>Keep proof links clean</strong>
                <span>Submit direct public URLs so approvals and payouts move faster.</span>
              </div>
            </div>

            <div class="master-step">
              <div class="master-step-index">3</div>
              <div>
                <strong>Track approvals from Stats</strong>
                <span>Use your Stats page to see views, earnings and pending submissions in one place.</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;

  document.querySelectorAll("body *").forEach((el) => {
    if (!el.children.length && (el.textContent || "").trim() === username) {
      el.textContent = name;
    }
  });
}
