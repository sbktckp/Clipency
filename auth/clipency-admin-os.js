(function () {
  'use strict';
  if (window.__clipencyAdminOSLoaded) return;
  window.__clipencyAdminOSLoaded = true;

  const PATH = window.location.pathname;
  const ADMIN_PATHS = ['/admin', '/admin/reviews', '/admin/campaigns', '/admin/leads', '/admin/payouts', '/admin/users', '/workspace'];
  if (!ADMIN_PATHS.includes(PATH)) return;

  /* ── STYLES ── */
  const css = `
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body.cx-on{font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Helvetica Neue',Arial,sans-serif;background:#000;color:#f5f5f7;height:100vh;overflow:hidden}
    body.cx-on>*:not(#cx-os){display:none!important}
    #cx-os{display:flex;height:100vh;overflow:hidden}

    /* sidebar */
    .cx-side{width:232px;flex-shrink:0;background:rgba(255,255,255,.03);border-right:1px solid rgba(255,255,255,.07);display:flex;flex-direction:column;overflow-y:auto}
    .cx-brand{padding:24px 20px 20px;display:flex;align-items:center;gap:10px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,.07)}
    .cx-brand img{height:24px;width:auto}
    .cx-brand-label{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.28)}
    .cx-nav-group{padding:16px 10px 0}
    .cx-nav-group-label{font-size:10.5px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:rgba(255,255,255,.25);padding:0 8px 6px}
    .cx-nav a{display:flex;align-items:center;gap:9px;padding:8px 10px;border-radius:8px;color:rgba(255,255,255,.55);text-decoration:none;font-size:13.5px;font-weight:500;transition:all .15s;margin-bottom:1px}
    .cx-nav a:hover{background:rgba(255,255,255,.07);color:#f5f5f7}
    .cx-nav a.active{background:rgba(99,102,241,.18);color:#a5b4fc}
    .cx-nav a svg{width:15px;height:15px;flex-shrink:0;opacity:.75}
    .cx-nav a.active svg{opacity:1}
    .cx-spacer{flex:1}
    .cx-user{padding:12px;border-top:1px solid rgba(255,255,255,.07)}
    .cx-user-card{display:flex;align-items:center;gap:9px;padding:10px;border-radius:10px;background:rgba(255,255,255,.04)}
    .cx-av{width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;flex-shrink:0}
    .cx-ui{flex:1;min-width:0}
    .cx-un{font-size:12.5px;font-weight:600;color:#f5f5f7;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .cx-ur{font-size:10.5px;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:.06em}
    .cx-out{background:none;border:none;color:rgba(255,255,255,.28);cursor:pointer;font-size:15px;padding:3px 5px;border-radius:4px;transition:color .15s;flex-shrink:0}
    .cx-out:hover{color:#f5f5f7}

    /* main */
    .cx-main{flex:1;overflow-y:auto;background:#000}
    .cx-wrap{max-width:960px;padding:44px 48px 80px}
    .cx-kicker{font-size:11.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#6366f1;margin-bottom:10px}
    .cx-h1{font-size:40px;font-weight:700;letter-spacing:-.02em;line-height:1.05;color:#f5f5f7;margin-bottom:10px}
    .cx-sub{font-size:16px;color:rgba(255,255,255,.45);line-height:1.6;margin-bottom:38px;max-width:520px}

    /* stats */
    .cx-stats{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px;margin-bottom:38px}
    .cx-stat{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:20px;transition:all .2s}
    .cx-stat:hover{background:rgba(255,255,255,.065);transform:translateY(-1px)}
    .cx-stat-l{font-size:11px;font-weight:600;letter-spacing:.07em;text-transform:uppercase;color:rgba(255,255,255,.38);margin-bottom:10px}
    .cx-stat-v{font-size:34px;font-weight:700;letter-spacing:-.02em;color:#f5f5f7;line-height:1}
    .cx-stat-s{font-size:11.5px;color:rgba(255,255,255,.3);margin-top:5px}

    /* section */
    .cx-sec{margin-bottom:36px}
    .cx-sec-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:14px}
    .cx-sec-title{font-size:17px;font-weight:600;color:#f5f5f7;margin-bottom:3px}
    .cx-sec-desc{font-size:12.5px;color:rgba(255,255,255,.38)}

    /* table */
    .cx-tbl-wrap{border:1px solid rgba(255,255,255,.08);border-radius:14px;overflow:hidden}
    .cx-tbl{width:100%;border-collapse:collapse;font-size:13.5px}
    .cx-tbl th{background:rgba(255,255,255,.035);padding:10px 16px;text-align:left;font-size:10.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:rgba(255,255,255,.3);border-bottom:1px solid rgba(255,255,255,.06)}
    .cx-tbl td{padding:12px 16px;border-bottom:1px solid rgba(255,255,255,.045);color:rgba(255,255,255,.75);vertical-align:middle}
    .cx-tbl tr:last-child td{border-bottom:none}
    .cx-tbl tr:hover td{background:rgba(255,255,255,.025)}

    /* badge */
    .cx-badge{display:inline-flex;align-items:center;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:.04em}
    .cx-badge.pending{background:rgba(245,158,11,.13);color:#fbbf24}
    .cx-badge.approved{background:rgba(34,197,94,.13);color:#4ade80}
    .cx-badge.rejected{background:rgba(239,68,68,.13);color:#f87171}
    .cx-badge.admin{background:rgba(99,102,241,.18);color:#a5b4fc}
    .cx-badge.reviewer{background:rgba(20,184,166,.13);color:#2dd4bf}
    .cx-badge.active{background:rgba(34,197,94,.13);color:#4ade80}
    .cx-badge.inactive{background:rgba(255,255,255,.08);color:rgba(255,255,255,.4)}

    /* btns */
    .cx-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;border:none;text-decoration:none;transition:all .15s;font-family:inherit}
    .cx-btn:disabled{opacity:.4;cursor:not-allowed}
    .cx-btn.primary{background:#6366f1;color:#fff}
    .cx-btn.primary:hover{background:#4f46e5}
    .cx-btn.ghost{background:rgba(255,255,255,.07);color:rgba(255,255,255,.8);border:1px solid rgba(255,255,255,.1)}
    .cx-btn.ghost:hover{background:rgba(255,255,255,.11)}
    .cx-btn.danger{background:rgba(239,68,68,.12);color:#f87171;border:1px solid rgba(239,68,68,.18)}
    .cx-btn.danger:hover{background:rgba(239,68,68,.2)}
    .cx-btn.green{background:rgba(34,197,94,.12);color:#4ade80;border:1px solid rgba(34,197,94,.18)}
    .cx-btn.green:hover{background:rgba(34,197,94,.2)}
    .cx-btns{display:flex;gap:8px;flex-wrap:wrap}

    /* form */
    .cx-form{display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end}
    .cx-input,.cx-select{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:8px;color:#f5f5f7;font-size:13.5px;padding:9px 14px;outline:none;transition:border-color .15s;font-family:inherit}
    .cx-input{min-width:230px}
    .cx-select{min-width:130px}
    .cx-input:focus,.cx-select:focus{border-color:#6366f1}
    .cx-input::placeholder{color:rgba(255,255,255,.22)}
    .cx-select option{background:#1c1c1e}

    /* empty */
    .cx-empty{padding:48px 24px;text-align:center;color:rgba(255,255,255,.28);font-size:14px}

    /* loader */
    .cx-loader{position:fixed;inset:0;background:#000;display:flex;align-items:center;justify-content:center;z-index:99999}
    .cx-spinner{width:28px;height:28px;border:2px solid rgba(255,255,255,.1);border-top-color:#6366f1;border-radius:50%;animation:cx-spin .7s linear infinite}
    @keyframes cx-spin{to{transform:rotate(360deg)}}

    /* quick actions */
    .cx-quick{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px;margin-top:14px}
    .cx-qc{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:16px 18px;text-decoration:none;color:rgba(255,255,255,.65);font-size:13.5px;font-weight:500;transition:all .15s;display:block}
    .cx-qc:hover{background:rgba(255,255,255,.07);color:#f5f5f7;border-color:rgba(255,255,255,.13)}
    .cx-qc-label{font-size:10.5px;text-transform:uppercase;letter-spacing:.08em;color:rgba(255,255,255,.3);margin-bottom:6px}
    .cx-qc-val{font-size:20px;font-weight:700;color:#f5f5f7;letter-spacing:-.01em}
  `;
  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ── ICONS ── */
  const SVG = {
    grid: '<path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" stroke="currentColor" stroke-width="1.7" fill="none"/>',
    check: '<path d="M20 6 9 17l-5-5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    play: '<path d="M7 5v14l12-7-12-7Z" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linejoin="round"/>',
    mail: '<path d="M4 6h16v12H4z" stroke="currentColor" stroke-width="1.7" fill="none"/><path d="m4 8 8 6 8-6" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round"/>',
    wallet: '<path d="M4 7h16v11H4z" stroke="currentColor" stroke-width="1.7" fill="none"/><path d="M16 12h4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
    users: '<path d="M16 21a5 5 0 0 0-10 0" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round"/><circle cx="11" cy="8" r="4" stroke="currentColor" stroke-width="1.7" fill="none"/><path d="M20 21a4 4 0 0 0-3-3.87" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/>',
    finance: '<path d="M5 19V5M5 19h14M9 16v-5M13 16V8M17 16v-7" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
  };
  const icon = n => `<svg viewBox="0 0 24 24" fill="none">${SVG[n]||SVG.grid}</svg>`;

  const NAV_ITEMS = [
    ['Command Center', '/admin', 'grid'],
    ['Reviews', '/admin/reviews', 'check'],
    ['Campaigns', '/admin/campaigns', 'play'],
    ['Leads', '/admin/leads', 'mail'],
    ['Payouts', '/admin/payouts', 'wallet'],
    ['Users', '/admin/users', 'users'],
    ['Finance OS', 'https://v0-clipency-finance-dashboard.vercel.app/login', 'finance', true],
    ['Clipper View', '/campaigns', 'external', true],
  ];

  const esc = v => String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  /* ── SUPABASE ── */
  let sb = null, currentUser = null;

  async function wait(ms){ return new Promise(r => setTimeout(r, ms)); }

  async function getClient() {
    for (let i = 0; i < 80; i++) {
      const c = window.clipencySupabase || window.supabaseClient || window.sbClient;
      if (c?.auth) return c;
      await wait(100);
    }
    throw new Error('Supabase client unavailable.');
  }

  async function safeCount(table) {
    try {
      const { count } = await sb.from(table).select('*', { count:'exact', head:true });
      return count ?? 0;
    } catch { return 0; }
  }

  async function safeRows(table, cols='*', limit=30) {
    try {
      const { data, error } = await sb.from(table).select(cols).limit(limit).order('created_at', { ascending: false }).catch(()=>({data:null,error:true}));
      if (error) return [];
      return data || [];
    } catch { return []; }
  }

  /* ── AUTH ── */
  async function initAuth() {
    sb = await getClient();
    const { data, error } = await sb.auth.getUser();
    if (error || !data?.user) { window.location.replace('/login'); return false; }
    currentUser = data.user;

    let role = 'clipper';
    try {
      const { data: ac } = await sb.rpc('admin_access_check');
      role = ac?.role || 'clipper';
    } catch {
      const { data: rows } = await sb.from('admin_users').select('email').eq('email', currentUser.email).limit(1);
      role = rows?.length ? 'admin' : 'clipper';
    }

    if (role !== 'admin') {
      document.body.innerHTML = `<div style="min-height:100vh;display:grid;place-items:center;background:#000;color:#f5f5f7;font-family:-apple-system,sans-serif;padding:32px"><div style="max-width:500px;text-align:center"><div style="color:#6366f1;font-weight:700;letter-spacing:.1em;font-size:11px;text-transform:uppercase;margin-bottom:16px">Access Denied</div><h1 style="font-size:40px;font-weight:700;letter-spacing:-.02em;margin-bottom:12px">Admin only.</h1><p style="color:rgba(255,255,255,.5);font-size:16px;margin-bottom:28px">Signed in as <b>${esc(currentUser.email)}</b> — not an admin account.</p><a href="/login" style="background:#6366f1;color:#fff;padding:11px 22px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px">Sign in with admin account</a></div></div>`;
      return false;
    }
    return true;
  }

  /* ── SHELL ── */
  function shell(content) {
    const email = currentUser?.email || '';
    const name = currentUser?.user_metadata?.full_name || email.split('@')[0] || 'Admin';
    const initial = name[0]?.toUpperCase() || 'A';

    const navHtml = NAV_ITEMS.map(([label, href, ic, ext]) => {
      const active = !ext && (PATH === href || (href !== '/admin' && PATH.startsWith(href)));
      return `<a href="${href}" class="${active?'active':''}" ${ext?'target="_blank" rel="noopener noreferrer"':''}>${icon(ic)}<span>${label}</span></a>`;
    }).join('');

    return `<div id="cx-os">
      <aside class="cx-side">
        <div class="cx-brand" onclick="location.href='/admin'">
          <img src="/assets/clipency-logo.png" onerror="this.src='/clipency-logo.png'" alt="Clipency"/>
          <span class="cx-brand-label">Admin OS</span>
        </div>
        <div class="cx-nav-group">
          <div class="cx-nav-group-label">Operations</div>
          <nav class="cx-nav">${navHtml}</nav>
        </div>
        <div class="cx-spacer"></div>
        <div class="cx-user">
          <div class="cx-user-card">
            <div class="cx-av">${esc(initial)}</div>
            <div class="cx-ui">
              <div class="cx-un">${esc(name)}</div>
              <div class="cx-ur">Admin</div>
            </div>
            <button class="cx-out" id="cx-logout" title="Sign out">↗</button>
          </div>
        </div>
      </aside>
      <main class="cx-main"><div class="cx-wrap">${content}</div></main>
    </div>`;
  }

  function page({ kicker, title, sub, body }) {
    return shell(`<div class="cx-kicker">${esc(kicker)}</div><h1 class="cx-h1">${esc(title)}</h1><p class="cx-sub">${esc(sub)}</p>${body||''}`);
  }

  /* ── PAGES ── */
  async function renderCommand() {
    const [profiles, campaigns, payouts, leads, admins, reviewers] = await Promise.all([
      safeCount('profiles'), safeCount('campaigns'), safeCount('payouts'),
      safeCount('leads'), safeCount('admin_users'), safeCount('reviewer_users'),
    ]);

    const statsHtml = [
      ['Clippers', profiles, 'Registered users'],
      ['Campaigns', campaigns, 'Active campaigns'],
      ['Payouts', payouts, 'Processed'],
      ['Leads', leads, 'Inbound'],
      ['Admins', admins, 'Staff members'],
      ['Reviewers', reviewers, 'Review team'],
    ].map(([l,v,s])=>`<div class="cx-stat"><div class="cx-stat-l">${l}</div><div class="cx-stat-v">${v}</div><div class="cx-stat-s">${s}</div></div>`).join('');

    const quickHtml = [
      ['/admin/reviews', 'Review Queue', 'Approve submissions'],
      ['/admin/campaigns', 'Campaigns', 'Manage campaigns'],
      ['/admin/leads', 'Leads', 'Client pipeline'],
      ['/admin/payouts', 'Payouts', 'Finance control'],
      ['/admin/users', 'Users', 'Access management'],
      ['https://v0-clipency-finance-dashboard.vercel.app/login', 'Finance OS', 'External dashboard', true],
    ].map(([href,label,desc,ext])=>`<a class="cx-qc" href="${href}" ${ext?'target="_blank" rel="noopener noreferrer"':''}><div class="cx-qc-label">${desc}</div><div class="cx-qc-val">${label} →</div></a>`).join('');

    return page({
      kicker: 'Command Center',
      title: 'Platform operations.',
      sub: 'Everything that keeps Clipency moving — in one place.',
      body: `<div class="cx-stats">${statsHtml}</div>
        <div class="cx-sec">
          <div class="cx-sec-head"><div><div class="cx-sec-title">Quick access</div><div class="cx-sec-desc">Jump to any section of the operating system.</div></div></div>
          <div class="cx-quick">${quickHtml}</div>
        </div>`
    });
  }

  async function renderReviews() {
    // try multiple possible table names for submissions
    let rows = [], tableUsed = null;
    const candidates = ['admin_submissions_view', 'clip_submissions', 'submissions', 'clips'];
    for (const t of candidates) {
      const { data, error } = await sb.from(t).select('*').limit(25).order('created_at',{ascending:false}).catch(()=>({data:null,error:true}));
      if (!error && data !== null) { rows = data; tableUsed = t; break; }
    }

    const rowsHtml = rows.length ? `
      <div class="cx-tbl-wrap"><table class="cx-tbl">
        <thead><tr><th>Creator</th><th>Campaign</th><th>Status</th><th>Submitted</th></tr></thead>
        <tbody>${rows.map(r=>`<tr>
          <td><strong>${esc(r.creator_email||r.email||r.user_email||'—')}</strong></td>
          <td>${esc(r.campaign_title||r.campaign_name||r.campaign||'—')}</td>
          <td><span class="cx-badge ${(r.status||'pending').toLowerCase()}">${esc(r.status||'Pending')}</span></td>
          <td>${r.created_at?new Date(r.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}):'—'}</td>
        </tr>`).join('')}</tbody>
      </table></div>` : `<div class="cx-empty">No submissions yet${!tableUsed?' — submissions table not found':''}.${!tableUsed?'<br><small style="margin-top:8px;display:block">Create a <code>clip_submissions</code> table in Supabase.</small>':''}</div>`;

    return page({
      kicker: 'Review Control',
      title: 'Submissions.',
      sub: 'Approve clips with the exact earning amount. Approved earnings instantly increase the clipper\'s payout balance.',
      body: `<div class="cx-sec"><div class="cx-sec-head"><div><div class="cx-sec-title">Pending review</div><div class="cx-sec-desc">${rows.length} submission${rows.length!==1?'s':''} found.</div></div></div>${rowsHtml}</div>`
    });
  }

  async function renderCampaigns() {
    const rows = await safeRows('campaigns', 'id,title,status,created_at,budget', 20);
    const html = rows.length ? `
      <div class="cx-tbl-wrap"><table class="cx-tbl">
        <thead><tr><th>Campaign</th><th>Status</th><th>Budget</th><th>Created</th></tr></thead>
        <tbody>${rows.map(r=>`<tr>
          <td><strong>${esc(r.title||r.name||r.id)}</strong></td>
          <td><span class="cx-badge ${r.status==='active'?'active':'inactive'}">${esc(r.status||'Draft')}</span></td>
          <td>${r.budget?'₹'+Number(r.budget).toLocaleString('en-IN'):'—'}</td>
          <td>${r.created_at?new Date(r.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short'}):'—'}</td>
        </tr>`).join('')}</tbody>
      </table></div>` : `<div class="cx-empty">No campaigns yet.</div>`;

    return page({ kicker:'Campaign Control', title:'Campaigns.', sub:'Manage campaign visibility, performance and creator availability.',
      body:`<div class="cx-sec"><div class="cx-sec-head"><div><div class="cx-sec-title">All campaigns</div><div class="cx-sec-desc">${rows.length} total</div></div></div>${html}</div>` });
  }

  async function renderLeads() {
    const rows = await safeRows('leads', '*', 30);
    const html = rows.length ? `
      <div class="cx-tbl-wrap"><table class="cx-tbl">
        <thead><tr><th>Name</th><th>Email</th><th>Company</th><th>Date</th></tr></thead>
        <tbody>${rows.map(r=>`<tr>
          <td><strong>${esc(r.name||r.full_name||'—')}</strong></td>
          <td>${esc(r.email||'—')}</td>
          <td>${esc(r.company||r.brand||'—')}</td>
          <td>${r.created_at?new Date(r.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short'}):'—'}</td>
        </tr>`).join('')}</tbody>
      </table></div>` : `<div class="cx-empty">No leads yet.</div>`;

    return page({ kicker:'Lead Desk', title:'Leads.', sub:'Track inbound brand and client interest.',
      body:`<div class="cx-sec"><div class="cx-sec-head"><div><div class="cx-sec-title">Inbound leads</div><div class="cx-sec-desc">${rows.length} total</div></div></div>${html}</div>` });
  }

  async function renderPayouts() {
    const rows = await safeRows('payouts', '*', 30);
    const html = rows.length ? `
      <div class="cx-tbl-wrap"><table class="cx-tbl">
        <thead><tr><th>Clipper</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
        <tbody>${rows.map(r=>`<tr>
          <td><strong>${esc(r.email||r.user_email||r.clipper_email||'—')}</strong></td>
          <td>${r.amount?'₹'+Number(r.amount).toLocaleString('en-IN'):'—'}</td>
          <td><span class="cx-badge ${(r.status||'pending').toLowerCase()}">${esc(r.status||'Pending')}</span></td>
          <td>${r.created_at?new Date(r.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short'}):'—'}</td>
        </tr>`).join('')}</tbody>
      </table></div>` : `<div class="cx-empty">No payouts yet.</div>`;

    return page({ kicker:'Payout Control', title:'Payouts.', sub:'Payout approvals stay connected with the finance system.',
      body:`<div class="cx-sec">
        <div class="cx-sec-head"><div><div class="cx-sec-title">Payout requests</div><div class="cx-sec-desc">${rows.length} total</div></div>
        <a class="cx-btn green" href="https://v0-clipency-finance-dashboard.vercel.app/login" target="_blank" rel="noopener">Open Finance OS</a></div>
        ${html}</div>` });
  }

  async function renderUsers() {
    const [{ data: admins }, { data: reviewers }] = await Promise.all([
      sb.from('admin_users').select('id,email,user_id,created_at').order('created_at',{ascending:false}),
      sb.from('reviewer_users').select('id,email,user_id,created_at').order('created_at',{ascending:false}),
    ]);

    const map = new Map();
    (admins||[]).forEach(r => map.set(r.email.toLowerCase(), { email:r.email, role:'admin', created_at:r.created_at }));
    (reviewers||[]).forEach(r => { const e=r.email.toLowerCase(); if (!map.has(e)) map.set(e, { email:r.email, role:'reviewer', created_at:r.created_at }); });
    const users = [...map.values()].sort((a,b)=> a.role==='admin'&&b.role!=='admin'?-1:b.role==='admin'&&a.role!=='admin'?1:a.email.localeCompare(b.email));
    const me = currentUser?.email?.toLowerCase();

    const tableHtml = `<div class="cx-tbl-wrap"><table class="cx-tbl">
      <thead><tr><th>Email</th><th>Role</th><th>Added</th><th>Actions</th></tr></thead>
      <tbody>${users.length ? users.map(u => {
        const isSelf = u.email.toLowerCase()===me;
        return `<tr>
          <td><strong>${esc(u.email)}</strong>${isSelf?'<div style="font-size:11px;color:rgba(255,255,255,.35);margin-top:2px">You</div>':''}</td>
          <td><span class="cx-badge ${u.role}">${u.role==='admin'?'Admin':'Reviewer'}</span></td>
          <td>${u.created_at?new Date(u.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}):'—'}</td>
          <td><div class="cx-btns">
            <button class="cx-btn ghost" data-ra="admin" data-email="${esc(u.email)}" ${u.role==='admin'?'disabled':''} style="padding:6px 12px;font-size:12px">Admin</button>
            <button class="cx-btn ghost" data-ra="reviewer" data-email="${esc(u.email)}" ${u.role==='reviewer'?'disabled':''} style="padding:6px 12px;font-size:12px">Reviewer</button>
            <button class="cx-btn danger" data-ra="revoke" data-email="${esc(u.email)}" ${isSelf?'disabled':''} style="padding:6px 12px;font-size:12px">Revoke</button>
          </div></td>
        </tr>`;
      }).join('') : `<tr><td colspan="4"><div class="cx-empty">No users found.</div></td></tr>`}</tbody>
    </table></div>`;

    return page({ kicker:'Access Control', title:'Users & roles.', sub:'Add, upgrade, downgrade or revoke access for the team.',
      body:`<div class="cx-sec">
        <div class="cx-sec-head"><div><div class="cx-sec-title">Add or update access</div><div class="cx-sec-desc">Changes apply the next time they sign in.</div></div></div>
        <div class="cx-form" id="cx-role-form">
          <input class="cx-input" id="cx-role-email" type="email" placeholder="name@example.com" required/>
          <select class="cx-select" id="cx-role-select"><option value="reviewer">Reviewer</option><option value="admin">Admin</option></select>
          <button class="cx-btn primary" id="cx-role-save">Save access</button>
        </div>
      </div>
      <div class="cx-sec"><div class="cx-sec-head"><div><div class="cx-sec-title">Current team</div><div class="cx-sec-desc">${users.length} people with admin or reviewer access.</div></div></div>${tableHtml}</div>` });
  }

  async function renderRoute() {
    if (PATH==='/admin'||PATH==='/workspace') return renderCommand();
    if (PATH==='/admin/reviews') return renderReviews();
    if (PATH==='/admin/campaigns') return renderCampaigns();
    if (PATH === '/admin/leads') return renderLeads();
    if (PATH==='/admin/payouts') return renderPayouts();
    if (PATH==='/admin/users') return renderUsers();
    return renderCommand();
  }

  /* ── EVENTS ── */
  function bindEvents() {
    document.getElementById('cx-logout')?.addEventListener('click', async()=>{
      try { await sb.auth.signOut({scope:'global'}); } catch {}
      window.location.replace('/login');
    });

    document.getElementById('cx-role-save')?.addEventListener('click', async()=>{
      const email = document.getElementById('cx-role-email')?.value?.trim();
      const role = document.getElementById('cx-role-select')?.value;
      const btn = document.getElementById('cx-role-save');
      if (!email||!email.includes('@')) return alert('Enter a valid email.');
      try {
        btn.disabled=true; btn.textContent='Saving…';
        if (role==='admin') {
          await sb.from('admin_users').upsert({email},{onConflict:'email'});
          await sb.from('reviewer_users').delete().eq('email',email);
        } else {
          await sb.from('reviewer_users').upsert({email},{onConflict:'email'});
          await sb.from('admin_users').delete().eq('email',email);
        }
        await boot();
      } catch(e) { alert(e.message||'Could not save.'); btn.disabled=false; btn.textContent='Save access'; }
    });

    document.querySelectorAll('[data-ra]').forEach(btn=>{
      btn.addEventListener('click', async()=>{
        const action=btn.dataset.ra, email=btn.dataset.email;
        if (!email) return;
        if (action==='revoke' && !confirm(`Revoke access for ${email}?`)) return;
        try {
          btn.disabled=true;
          if (action==='revoke') {
            await sb.from('reviewer_users').delete().eq('email',email);
            await sb.from('admin_users').delete().eq('email',email);
          } else if (action==='admin') {
            await sb.from('admin_users').upsert({email},{onConflict:'email'});
            await sb.from('reviewer_users').delete().eq('email',email);
          } else {
            await sb.from('reviewer_users').upsert({email},{onConflict:'email'});
            await sb.from('admin_users').delete().eq('email',email);
          }
          await boot();
        } catch(e) { alert(e.message||'Error'); btn.disabled=false; }
      });
    });
  }

  /* ── BOOT ── */
  async function boot() {
    document.body.classList.add('cx-on');
    document.body.innerHTML='<div class="cx-loader"><div class="cx-spinner"></div></div>';
    try {
      const ok = await initAuth();
      if (!ok) return;
      document.body.innerHTML = await renderRoute();
      document.title = 'Clipency | Admin OS';
      bindEvents();
    } catch(e) {
      document.body.innerHTML=`<div class="cx-loader"><div style="text-align:center;max-width:440px"><h2 style="color:#f5f5f7;margin-bottom:10px;font-size:24px">Something went wrong.</h2><p style="color:rgba(255,255,255,.45);font-size:14px;line-height:1.6">${esc(e.message||'Please refresh.')}</p><a class="cx-btn primary" href="/admin" style="margin-top:20px;display:inline-flex">Retry</a></div></div>`;
    }
  }

  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
