(function(){
'use strict';
if(window.__clipencyAdminOSLoaded)return;
window.__clipencyAdminOSLoaded=true;

const PATH=window.location.pathname;
const ADMIN_PATHS=['/admin','/admin/reviews','/admin/campaigns','/admin/leads',
  '/admin/payouts','/admin/users','/admin/accounts','/admin/connected-accounts','/workspace'];
if(!ADMIN_PATHS.includes(PATH))return;

/* ══ CSS ══════════════════════════════════════════════════════════════════ */
const STYLE=`
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body.cxon{font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Helvetica Neue',Arial,sans-serif;background:#000;color:#f5f5f7;height:100vh;overflow:hidden}
body.cxon>*:not(#cxos):not(.cx-loader):not(.cx-overlay){display:none!important}
#cxos{display:flex;height:100vh;overflow:hidden}
.cx-side{width:232px;flex-shrink:0;background:rgba(255,255,255,.03);border-right:1px solid rgba(255,255,255,.07);display:flex;flex-direction:column;overflow-y:auto}
.cx-brand{padding:22px 20px 18px;display:flex;align-items:center;gap:10px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,.07)}
.cx-brand img{height:22px;width:auto}
.cx-brand span{font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.28)}
.cx-ng{padding:14px 10px 0}
.cx-nl{font-size:10px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:rgba(255,255,255,.25);padding:0 8px 6px}
.cx-nav a{display:flex;align-items:center;gap:9px;padding:8px 10px;border-radius:8px;color:rgba(255,255,255,.55);text-decoration:none;font-size:13.5px;font-weight:500;transition:all .15s;margin-bottom:1px}
.cx-nav a:hover{background:rgba(255,255,255,.07);color:#f5f5f7}
.cx-nav a.active{background:rgba(99,102,241,.18);color:#a5b4fc}
.cx-nav a svg{width:15px;height:15px;flex-shrink:0;opacity:.7}
.cx-nav a.active svg{opacity:1}
.cx-spacer{flex:1}
.cx-user{padding:12px;border-top:1px solid rgba(255,255,255,.07)}
.cx-uc{display:flex;align-items:center;gap:9px;padding:10px;border-radius:10px;background:rgba(255,255,255,.04)}
.cx-av{width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0}
.cx-ui{flex:1;min-width:0}
.cx-un{font-size:12px;font-weight:600;color:#f5f5f7;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cx-ur{font-size:10px;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:.05em}
.cx-out{background:none;border:none;color:rgba(255,255,255,.28);cursor:pointer;font-size:14px;padding:3px 5px;border-radius:4px;transition:color .15s}
.cx-out:hover{color:#f87171}
.cx-main{flex:1;overflow-y:auto;background:#000}
.cx-wrap{max-width:1020px;padding:40px 44px 80px}
.cx-kicker{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#6366f1;margin-bottom:8px}
.cx-h1{font-size:38px;font-weight:700;letter-spacing:-.02em;line-height:1.05;margin-bottom:8px}
.cx-sub{font-size:15px;color:rgba(255,255,255,.45);line-height:1.6;margin-bottom:32px;max-width:520px}
.cx-stats{display:grid;grid-template-columns:repeat(auto-fill,minmax(155px,1fr));gap:10px;margin-bottom:36px}
.cx-stat{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:18px;transition:all .2s;cursor:default}
.cx-stat:hover{background:rgba(255,255,255,.065);transform:translateY(-1px)}
.cx-stat-l{font-size:10.5px;font-weight:600;letter-spacing:.07em;text-transform:uppercase;color:rgba(255,255,255,.38);margin-bottom:8px}
.cx-stat-v{font-size:32px;font-weight:700;letter-spacing:-.02em;line-height:1}
.cx-stat-s{font-size:11px;color:rgba(255,255,255,.3);margin-top:4px}
.cx-stat.warn .cx-stat-v{color:#fbbf24}
.cx-stat.ok .cx-stat-v{color:#4ade80}
.cx-stat.info .cx-stat-v{color:#a5b4fc}
.cx-sec{margin-bottom:32px}
.cx-sh{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:12px;flex-wrap:wrap}
.cx-st{font-size:16px;font-weight:600;margin-bottom:2px}
.cx-sd{font-size:12px;color:rgba(255,255,255,.38)}
.cx-tabs{display:flex;gap:4px;margin-bottom:14px}
.cx-tab{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);border-radius:7px;padding:6px 14px;font-size:12.5px;font-weight:600;color:rgba(255,255,255,.5);cursor:pointer;transition:all .15s;font-family:inherit}
.cx-tab:hover{background:rgba(255,255,255,.1);color:#f5f5f7}
.cx-tab.on{background:rgba(99,102,241,.2);border-color:rgba(99,102,241,.4);color:#a5b4fc}
.cx-tw{border:1px solid rgba(255,255,255,.08);border-radius:14px;overflow:hidden}
table.cx-t{width:100%;border-collapse:collapse;font-size:13px}
table.cx-t th{background:rgba(255,255,255,.035);padding:9px 14px;text-align:left;font-size:10px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:rgba(255,255,255,.3);border-bottom:1px solid rgba(255,255,255,.06)}
table.cx-t td{padding:11px 14px;border-bottom:1px solid rgba(255,255,255,.04);color:rgba(255,255,255,.75);vertical-align:middle}
table.cx-t tr:last-child td{border-bottom:none}
table.cx-t tr:hover td{background:rgba(255,255,255,.02)}
.cx-badge{display:inline-flex;align-items:center;padding:3px 9px;border-radius:20px;font-size:10.5px;font-weight:700;letter-spacing:.03em}
.cx-badge.pending{background:rgba(245,158,11,.13);color:#fbbf24}
.cx-badge.approved,.cx-badge.verified,.cx-badge.active,.cx-badge.paid{background:rgba(34,197,94,.13);color:#4ade80}
.cx-badge.rejected{background:rgba(239,68,68,.13);color:#f87171}
.cx-badge.draft{background:rgba(255,255,255,.08);color:rgba(255,255,255,.4)}
.cx-badge.paused{background:rgba(245,158,11,.1);color:#fb923c}
.cx-btn{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:8px;font-size:12.5px;font-weight:600;cursor:pointer;border:none;text-decoration:none;transition:all .15s;font-family:inherit;white-space:nowrap}
.cx-btn:disabled{opacity:.4;cursor:not-allowed}
.cx-btn.pri{background:#6366f1;color:#fff}
.cx-btn.pri:hover:not(:disabled){background:#4f46e5}
.cx-btn.ghost{background:rgba(255,255,255,.07);color:rgba(255,255,255,.8);border:1px solid rgba(255,255,255,.1)}
.cx-btn.ghost:hover:not(:disabled){background:rgba(255,255,255,.12)}
.cx-btn.ok{background:rgba(34,197,94,.12);color:#4ade80;border:1px solid rgba(34,197,94,.2)}
.cx-btn.ok:hover:not(:disabled){background:rgba(34,197,94,.2)}
.cx-btn.danger{background:rgba(239,68,68,.12);color:#f87171;border:1px solid rgba(239,68,68,.2)}
.cx-btn.danger:hover:not(:disabled){background:rgba(239,68,68,.2)}
.cx-btn.sm{padding:5px 10px;font-size:11.5px}
.cx-btns{display:flex;gap:6px;flex-wrap:wrap}
.cx-empty{padding:44px 24px;text-align:center;color:rgba(255,255,255,.28);font-size:13.5px}
.cx-loader{position:fixed;inset:0;background:#000;display:flex;align-items:center;justify-content:center;z-index:99999}
.cx-spinner{width:26px;height:26px;border:2px solid rgba(255,255,255,.1);border-top-color:#6366f1;border-radius:50%;animation:cxspin .7s linear infinite}
@keyframes cxspin{to{transform:rotate(360deg)}}
/* Modal */
.cx-overlay{position:fixed;inset:0;background:rgba(0,0,0,.75);backdrop-filter:blur(4px);z-index:9000;display:flex;align-items:center;justify-content:center;padding:20px}
.cx-modal{background:#111;border:1px solid rgba(255,255,255,.12);border-radius:16px;width:100%;max-width:480px;padding:28px;box-shadow:0 24px 80px rgba(0,0,0,.6)}
.cx-modal h3{font-size:18px;font-weight:700;margin-bottom:6px}
.cx-modal p{font-size:13px;color:rgba(255,255,255,.5);margin-bottom:20px;line-height:1.6}
.cx-modal label{display:block;font-size:11.5px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:rgba(255,255,255,.4);margin-bottom:6px}
.cx-input,.cx-select,.cx-textarea{width:100%;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:8px;color:#f5f5f7;font-size:13.5px;padding:9px 13px;outline:none;transition:border-color .15s;font-family:inherit;margin-bottom:14px}
.cx-input:focus,.cx-select:focus,.cx-textarea:focus{border-color:#6366f1}
.cx-input::placeholder,.cx-textarea::placeholder{color:rgba(255,255,255,.22)}
.cx-select option{background:#1c1c1e}
.cx-textarea{resize:vertical;min-height:80px}
.cx-mf{display:flex;gap:8px;justify-content:flex-end;margin-top:6px}
/* Campaign form panel */
.cx-panel{position:fixed;inset:0;background:#000;z-index:8000;overflow-y:auto;padding:40px}
.cx-panel-head{max-width:700px;margin:0 auto 28px;display:flex;align-items:center;justify-content:space-between}
.cx-panel-head h2{font-size:24px;font-weight:700}
.cx-form-grid{max-width:700px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:14px}
.cx-form-grid .full{grid-column:1/-1}
.cx-fl{font-size:11.5px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:rgba(255,255,255,.4);margin-bottom:6px;display:block}
.cx-banner-drop{width:100%;aspect-ratio:16/5;border:2px dashed rgba(255,255,255,.15);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;position:relative;overflow:hidden;background:rgba(255,255,255,.03)}
.cx-banner-drop:hover{border-color:rgba(99,102,241,.5);background:rgba(99,102,241,.05)}
.cx-banner-drop img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:10px}
.cx-banner-drop input{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%}
.cx-banner-label{font-size:13px;color:rgba(255,255,255,.4);pointer-events:none;z-index:1;text-align:center;line-height:1.8}
/* Inline alert */
.cx-alert{padding:12px 16px;border-radius:8px;font-size:13px;margin-bottom:14px;line-height:1.5}
.cx-alert.err{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.2);color:#f87171}
.cx-alert.suc{background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.2);color:#4ade80}
.cx-code-box{background:rgba(99,102,241,.12);border:1px solid rgba(99,102,241,.3);border-radius:10px;padding:16px;text-align:center;margin-bottom:14px}
.cx-code-box .code{font-size:36px;font-weight:800;letter-spacing:.25em;color:#a5b4fc;font-family:monospace}
.cx-code-box small{font-size:11.5px;color:rgba(255,255,255,.4);display:block;margin-top:4px}
`;
const styleEl=document.createElement('style');
styleEl.textContent=STYLE;
document.head.appendChild(styleEl);

/* ══ ICONS ══════════════════════════════════════════════════════════════ */
const I={
  grid:'<path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" stroke="currentColor" stroke-width="1.7" fill="none"/>',
  check:'<path d="M20 6 9 17l-5-5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  play:'<path d="M7 5v14l12-7-12-7Z" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linejoin="round"/>',
  mail:'<path d="M4 6h16v12H4z" stroke="currentColor" stroke-width="1.7" fill="none"/><path d="m4 8 8 6 8-6" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round"/>',
  wallet:'<path d="M4 7h16v11H4z" stroke="currentColor" stroke-width="1.7" fill="none"/><path d="M16 12h4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
  users:'<path d="M16 21a5 5 0 0 0-10 0" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round"/><circle cx="11" cy="8" r="4" stroke="currentColor" stroke-width="1.7" fill="none"/>',
  link:'<path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1.5 1.5" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1.5-1.5" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/>',
  finance:'<path d="M5 19V5M5 19h14M9 16v-5M13 16V8M17 16v-7" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  ext:'<path d="M14 4h6v6M20 4l-9 9" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/>',
  x:'<path d="M18 6 6 18M6 6l12 12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>',
  plus:'<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>',
  edit:'<path d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M17.5 2.5a2.121 2.121 0 0 1 3 3L12 14l-4 1 1-4 8.5-8.5z" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
};
const svg=n=>`<svg viewBox="0 0 24 24" fill="none">${I[n]||I.grid}</svg>`;

const NAV=[
  ['Command Center','/admin','grid'],
  ['Accounts','/admin/connected-accounts','link'],
  ['Campaigns','/admin/campaigns','play'],
  ['Reviews','/admin/reviews','check'],
  ['Leads','/admin/leads','mail'],
  ['Payouts','/admin/payouts','wallet'],
  ['Users','/admin/users','users'],
  ['Finance OS','https://v0-clipency-finance-dashboard.vercel.app/login','finance',true],
  ['Clipper View','/campaigns','ext',true],
];

const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const fmt=n=>n!=null?Number(n).toLocaleString('en-IN'):'—';
const fmtDate=d=>d?new Date(d).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}):'—';
const fmtMoney=n=>n!=null?'₹'+fmt(n):'—';

/* ══ STATE ══════════════════════════════════════════════════════════════ */
let sb=null,me=null;

async function wait(ms){return new Promise(r=>setTimeout(r,ms));}
async function getClient(){
  for(let i=0;i<80;i++){
    const c=window.clipencySupabase||window.supabaseClient||window.sbClient;
    if(c?.auth)return c;
    await wait(100);
  }
  throw new Error('Supabase client not available');
}

/* ══ AUTH ══════════════════════════════════════════════════════════════ */
async function initAuth(){
  sb=await getClient();
  const{data,error}=await sb.auth.getUser();
  if(error||!data?.user){window.location.replace('/login');return false;}
  me=data.user;
  let role='clipper';
  try{
    const{data:ac}=await sb.rpc('admin_access_check');
    role=ac?.role||'clipper';
  }catch{
    const{data:rows}=await sb.from('admin_users').select('email').eq('email',me.email).limit(1);
    role=rows?.length?'admin':'clipper';
  }
  if(role!=='admin'){
    document.body.innerHTML=`<div style="min-height:100vh;display:grid;place-items:center;background:#000;color:#f5f5f7;font-family:-apple-system,sans-serif"><div style="text-align:center;max-width:440px;padding:32px"><div style="color:#6366f1;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:14px">Access Denied</div><h1 style="font-size:36px;font-weight:700;margin-bottom:10px">Admin only.</h1><p style="color:rgba(255,255,255,.5);margin-bottom:24px">You're signed in as <b>${esc(me.email)}</b> which is not an admin account.</p><a href="/login" style="background:#6366f1;color:#fff;padding:10px 22px;border-radius:8px;text-decoration:none;font-weight:600">Sign in as admin</a></div></div>`;
    return false;
  }
  return true;
}

/* ══ SHELL ══════════════════════════════════════════════════════════════ */
function shell(content){
  const email=me?.email||'';
  const name=me?.user_metadata?.full_name||email.split('@')[0]||'Admin';
  const init=name[0]?.toUpperCase()||'A';
  const nav=NAV.map(([label,href,ic,ext])=>{
    const active=!ext&&(PATH===href||(href!=='/admin'&&PATH.startsWith(href)));
    return`<a href="${href}" class="${active?'active':''}" ${ext?'target="_blank" rel="noopener noreferrer"':''}>${svg(ic)}<span>${label}</span></a>`;
  }).join('');
  return`<div id="cxos"><aside class="cx-side">
    <div class="cx-brand" onclick="location.href='/admin'">
      <img src="/assets/clipency-logo.png" onerror="this.src='/clipency-logo.png'" alt="Clipency"/>
      <span>Admin OS</span>
    </div>
    <div class="cx-ng"><div class="cx-nl">Operations</div><nav class="cx-nav">${nav}</nav></div>
    <div class="cx-spacer"></div>
    <div class="cx-user"><div class="cx-uc">
      <div class="cx-av">${esc(init)}</div>
      <div class="cx-ui"><div class="cx-un">${esc(name)}</div><div class="cx-ur">Admin</div></div>
      <button class="cx-out" id="cx-logout" title="Sign out">↗</button>
    </div></div>
  </aside>
  <main class="cx-main"><div class="cx-wrap">${content}</div></main></div>`;
}

function page({kicker,title,sub,body}){
  return shell(`<div class="cx-kicker">${esc(kicker)}</div><h1 class="cx-h1">${esc(title)}</h1><p class="cx-sub">${esc(sub)}</p>${body||''}`);
}

/* ══ MODAL ══════════════════════════════════════════════════════════════ */
function showModal({title,desc,fields,confirmLabel,confirmClass,onConfirm}){
  return new Promise(resolve=>{
    const id='cxm'+Date.now();
    const fieldsHtml=(fields||[]).map(f=>{
      if(f.type==='textarea')return`<label>${esc(f.label)}</label><textarea class="cx-textarea" id="${id}_${f.key}" placeholder="${esc(f.placeholder||'')}" ${f.required?'required':''}></textarea>`;
      return`<label>${esc(f.label)}</label><input class="cx-input" id="${id}_${f.key}" type="${f.type||'text'}" placeholder="${esc(f.placeholder||'')}" min="${f.min||''}" step="${f.step||''}" ${f.required?'required':''}/>`;
    }).join('');
    const el=document.createElement('div');
    el.className='cx-overlay';
    el.innerHTML=`<div class="cx-modal">
      <h3>${esc(title)}</h3>${desc?`<p>${esc(desc)}</p>`:''}
      <div id="${id}_err"></div>
      ${fieldsHtml}
      <div class="cx-mf">
        <button class="cx-btn ghost" id="${id}_cancel">Cancel</button>
        <button class="cx-btn ${confirmClass||'pri'}" id="${id}_ok">${esc(confirmLabel||'Confirm')}</button>
      </div>
    </div>`;
    document.body.appendChild(el);
    const close=()=>document.body.removeChild(el);
    el.querySelector('#'+id+'_cancel').onclick=()=>{close();resolve(null);};
    el.querySelector('#'+id+'_ok').onclick=async()=>{
      const vals={};
      let ok=true;
      for(const f of fields||[]){
        const el2=document.getElementById(id+'_'+f.key);
        if(!el2)continue;
        const v=el2.value.trim();
        if(f.required&&!v){el2.focus();ok=false;break;}
        vals[f.key]=f.type==='number'?parseFloat(v):v;
      }
      if(!ok)return;
      const errEl=document.getElementById(id+'_err');
      try{
        el.querySelector('#'+id+'_ok').disabled=true;
        el.querySelector('#'+id+'_ok').textContent='Saving…';
        await onConfirm(vals);
        close();
        resolve(vals);
      }catch(e){
        errEl.innerHTML=`<div class="cx-alert err">${esc(e.message||'Error')}</div>`;
        el.querySelector('#'+id+'_ok').disabled=false;
        el.querySelector('#'+id+'_ok').textContent=confirmLabel||'Confirm';
      }
    };
  });
}

/* ══ COMMAND CENTER ══════════════════════════════════════════════════ */
async function renderCommand(){
  const{data:stats}=await sb.rpc('admin_get_stats');
  const s=stats||{};
  const cards=[
    ['Clippers',s.total_clippers||0,'Registered users','info'],
    ['Active Campaigns',s.active_campaigns||0,'Live now','ok'],
    ['Pending Reviews',s.pending_reviews||0,'Awaiting review','warn'],
    ['Pending Accounts',s.pending_accounts||0,'Awaiting verification','warn'],
    ['Pending Payouts',s.pending_payouts||0,'Withdrawal requests','warn'],
    ['Total Paid Out',fmtMoney(s.total_paid_out||0),'Processed','ok'],
    ['Total Approved',fmtMoney(s.total_earnings_approved||0),'Earned by clippers','info'],
    ['Rejected',s.rejected_submissions||0,'Clip rejections',''],
  ].map(([l,v,s2,cls])=>`<div class="cx-stat ${cls}"><div class="cx-stat-l">${l}</div><div class="cx-stat-v">${v}</div><div class="cx-stat-s">${s2}</div></div>`).join('');
  const quick=[
    ['/admin/connected-accounts','Pending Accounts','Verify clippers'],
    ['/admin/reviews','Review Queue','Approve clips'],
    ['/admin/campaigns','Campaigns','Manage active'],
    ['/admin/payouts','Payouts','Process withdrawals'],
    ['/admin/users','Users','Manage access'],
    ['https://v0-clipency-finance-dashboard.vercel.app/login','Finance OS','External',true],
  ].map(([href,l,d,ext])=>`<a href="${href}" style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:14px 16px;text-decoration:none;display:block;transition:all .15s" ${ext?'target="_blank" rel="noopener noreferrer"':''}
    onmouseover="this.style.background='rgba(255,255,255,.07)'" onmouseout="this.style.background='rgba(255,255,255,.04)'">
    <div style="font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:rgba(255,255,255,.3);margin-bottom:4px">${d}</div>
    <div style="font-size:18px;font-weight:700;color:#f5f5f7">${l} →</div>
  </a>`).join('');
  return page({kicker:'Command Center',title:'Platform operations.',sub:'Everything that keeps Clipency running.',
    body:`<div class="cx-stats">${cards}</div>
    <div class="cx-sec"><div class="cx-sh"><div><div class="cx-st">Quick access</div><div class="cx-sd">Jump to any section of the OS</div></div></div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px">${quick}</div></div>`});
}

/* ══ ACCOUNTS ════════════════════════════════════════════════════════ */
async function renderAccounts(){
  const tab=new URLSearchParams(location.search).get('tab')||'pending';
  // Direct query — avoids ambiguous status column in RPC
  const caQuery = await sb
    .from('connected_accounts')
    .select('id,user_id,platform,username,handle,verification_code,status,rejection_reason,created_at,expires_at,verified_at,is_verified,profiles(email,full_name)')
    .order('created_at',{ascending:false});
  const rows = caQuery.error ? [] : (tab==='all' ? caQuery.data : (caQuery.data||[]).filter(x=>x.status===tab))
    .map(x=>({...x,acct_status:x.status,user_email:x.profiles?.email,user_name:x.profiles?.full_name}));
  const tabs=['pending','verified','rejected','all'].map(t=>`<button class="cx-tab${tab===t?' on':''}" onclick="location.search='?tab=${t}'">${t.charAt(0).toUpperCase()+t.slice(1)}</button>`).join('');
  const platformIcon={youtube:'📹',instagram:'📸',tiktok:'🎵',yt:'📹',ig:'📸',tt:'🎵'};
  const rowsHtml=(rows||[]).length?`<div class="cx-tw"><table class="cx-t">
    <thead><tr><th>Platform</th><th>Handle</th><th>Clipper</th><th>Code</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
    <tbody>${(rows||[]).map(r=>`<tr>
      <td>${platformIcon[r.platform?.toLowerCase()]||'🔗'} ${esc(r.platform||'—')}</td>
      <td><strong>@${esc(r.handle||r.username||'—')}</strong></td>
      <td><div style="font-size:12px">${esc(r.user_email||'—')}</div><div style="font-size:11px;color:rgba(255,255,255,.35)">${esc(r.user_name||'')}</div></td>
      <td>${r.status==='pending'?`<code style="background:rgba(99,102,241,.15);color:#a5b4fc;padding:3px 8px;border-radius:5px;font-family:monospace;font-size:13px;font-weight:700;letter-spacing:.1em">${esc(r.verification_code||'—')}</code>`:'<span style="color:rgba(255,255,255,.3)">—</span>'}</td>
      <td><span class="cx-badge ${r.status}">${esc(r.status||'—')}</span></td>
      <td style="font-size:11.5px;color:rgba(255,255,255,.4)">${fmtDate(r.created_at)}</td>
      <td><div class="cx-btns">
        ${r.status==='pending'?`
          <button class="cx-btn ok sm" data-approve-acct="${esc(r.id)}">Approve</button>
          <button class="cx-btn danger sm" data-reject-acct="${esc(r.id)}">Reject</button>
        `:'<span style="font-size:11.5px;color:rgba(255,255,255,.3)">—</span>'}
      </div></td>
    </tr>`).join('')}</tbody>
  </table></div>`:`<div class="cx-empty">No ${tab} accounts.</div>`;
  return page({kicker:'Accounts',title:'Connected accounts.',sub:'Verify social media accounts connected by clippers. Check the verification code is in their bio.',
    body:`<div class="cx-sec"><div class="cx-sh"><div><div class="cx-st">Account verification</div><div class="cx-sd">${(rows||[]).length} account${(rows||[]).length!==1?'s':''} in ${tab}</div></div></div>
    <div class="cx-tabs">${tabs}</div>${rowsHtml}</div>`});
}

/* ══ CAMPAIGNS ════════════════════════════════════════════════════════ */
async function renderCampaigns(){
  let rows=[];
  try{const r=await sb.from('campaigns').select('*').order('created_at',{ascending:false});rows=r.data||[];}catch(e){rows=[];}

  const STATUS_COLOR={active:'approved',draft:'draft',paused:'paused',ended:'inactive'};
  const PLAT_COLOR={youtube:'rgba(255,0,0,.15)',instagram:'rgba(225,48,108,.15)',tiktok:'rgba(255,255,255,.08)',all:'rgba(196,149,106,.1)'};
  const PLAT_TC={youtube:'#FF4444',instagram:'#E1306C',tiktok:'rgba(255,255,255,.8)',all:'#C4956A'};

  const cardsHtml = rows.length ? `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px;margin-top:4px">
    ${rows.map(r=>{
      const plat=(r.platform||'All').toLowerCase();
      return`<div style="background:linear-gradient(135deg,rgba(24,20,16,.95),rgba(14,12,9,.8));border:1px solid rgba(196,149,106,.14);border-radius:16px;overflow:hidden;transition:all .2s;cursor:pointer" onmouseover="this.style.borderColor='rgba(196,149,106,.35)';this.style.transform='translateY(-2px)'" onmouseout="this.style.borderColor='rgba(196,149,106,.14)';this.style.transform='none'">
        ${r.asset_url?`<div style="width:100%;height:120px;overflow:hidden"><img src="${esc(r.asset_url)}" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.style.display='none'"/></div>`:`<div style="width:100%;height:6px;background:linear-gradient(90deg,#C4956A,rgba(196,149,106,.3))"></div>`}
        <div style="padding:16px 18px 18px">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:10px">
            <div>
              <div style="font-family:'Instrument Serif',serif;font-size:1.1rem;color:#F5F0EB;line-height:1.2;margin-bottom:4px">${esc(r.title||'—')}</div>
              ${r.brand_name?`<div style="font-size:.72rem;color:#6A6158">${esc(r.brand_name)}</div>`:''}
            </div>
            <span class="cx-badge ${STATUS_COLOR[r.status]||'draft'}" style="flex-shrink:0">${esc(r.status||'draft')}</span>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
            <span style="background:${PLAT_COLOR[plat]||PLAT_COLOR.all};color:${PLAT_TC[plat]||PLAT_TC.all};padding:3px 10px;border-radius:20px;font-size:.7rem;font-weight:700;font-family:'Space Mono',monospace">${esc(r.platform||'All')}</span>
            ${r.genre||r.category?`<span style="background:rgba(196,149,106,.1);color:#C4956A;padding:3px 10px;border-radius:20px;font-size:.7rem;font-weight:600">${esc(r.genre||r.category)}</span>`:''}
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
            <div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:8px;padding:8px 10px">
              <div style="font-family:'Space Mono',monospace;font-size:.48rem;letter-spacing:.12em;text-transform:uppercase;color:#6A6158;margin-bottom:3px">RPM</div>
              <div style="font-size:.95rem;font-weight:700;color:#C4956A">${r.rpm?'₹'+Number(r.rpm).toLocaleString('en-IN'):'—'}</div>
            </div>
            <div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:8px;padding:8px 10px">
              <div style="font-family:'Space Mono',monospace;font-size:.48rem;letter-spacing:.12em;text-transform:uppercase;color:#6A6158;margin-bottom:3px">Budget</div>
              <div style="font-size:.95rem;font-weight:700;color:#F5F0EB">${r.budget?'₹'+Number(r.budget).toLocaleString('en-IN'):'—'}</div>
            </div>
          </div>
          <div style="display:flex;gap:6px">
            <button class="cx-btn pri" style="flex:1;justify-content:center;background:#C4956A;color:#0A0908;font-size:.76rem" data-camp-id="${esc(r.id)}">Edit Campaign</button>
            <button class="cx-btn ghost" style="font-size:.76rem;padding:6px 10px" onclick="toggleCampStatus('${esc(r.id)}','${esc(r.status)}')">${r.status==='active'?'Pause':'Activate'}</button>
          </div>
        </div>
      </div>`;
    }).join('')}
  </div>` : `<div class="cx-empty" style="border:1px dashed rgba(196,149,106,.15);border-radius:14px">No campaigns yet. Create your first one.</div>`;

  return page({kicker:'Campaign Control',title:'Campaigns.',sub:'Create and manage campaigns. Upload banners, set rates and control visibility.',
    body:`<div class="cx-sec">
    <div class="cx-sh">
      <div>
        <div class="cx-st">All campaigns</div>
        <div class="cx-sd">${rows.length} total · ${rows.filter(r=>r.status==='active').length} active</div>
      </div>
      <button class="cx-btn pri" id="cx-new-campaign" style="background:#C4956A;color:#0A0908">${svg('plus')} New Campaign</button>
    </div>
    ${cardsHtml}</div>`});
}

window.toggleCampStatus = async function(id, currentStatus){
  const newStatus = currentStatus==='active'?'paused':'active';
  await sb.from('campaigns').update({status:newStatus}).eq('id',id);
  await boot();
}

async function showCampaignForm(existing=null){
  const c=existing||{};
  const selPlatforms = c.platforms||[c.platform||'All'];

  const panel=document.createElement('div');
  panel.className='cx-panel';
  panel.style.cssText='position:fixed;inset:0;background:#0A0908;z-index:8000;overflow-y:auto;padding:0';
  panel.innerHTML=`<div style="max-width:720px;margin:0 auto;padding:40px 32px 80px">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:32px">
      <div>
        <div style="font-family:'Space Mono',monospace;font-size:.52rem;letter-spacing:.16em;text-transform:uppercase;color:#C4956A;margin-bottom:6px">${existing?'Edit Campaign':'New Campaign'}</div>
        <h2 style="font-family:'Instrument Serif',serif;font-size:1.8rem;color:#F5F0EB;font-weight:400">${existing?esc(c.title||''):'Create a new campaign'}</h2>
      </div>
      <button id="cp-close" style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:#B8AFA8;width:36px;height:36px;border-radius:8px;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center">✕</button>
    </div>
    <div id="cp-err"></div>

    <!-- Banner -->
    <div style="margin-bottom:20px">
      <label style="display:block;font-family:'Space Mono',monospace;font-size:.5rem;letter-spacing:.12em;text-transform:uppercase;color:#6A6158;margin-bottom:8px">Campaign Banner</label>
      <div id="cp-banner-drop" style="width:100%;aspect-ratio:16/5;border:2px dashed rgba(196,149,106,.2);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;position:relative;overflow:hidden;background:rgba(196,149,106,.03)">
        ${c.asset_url?`<img src="${esc(c.asset_url)}" id="cp-banner-preview" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">`:''}
        <input type="file" id="cp-banner-file" accept="image/*" style="position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%"/>
        <div id="cp-banner-label" style="font-size:.8rem;color:#6A6158;text-align:center;pointer-events:none;z-index:1;line-height:1.8${c.asset_url?';display:none':''}">🖼<br/>Click to upload banner<br/><span style="font-size:.68rem">1280×400px recommended</span></div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:6px">
      <div style="grid-column:1/-1">
        <label style="display:block;font-family:'Space Mono',monospace;font-size:.5rem;letter-spacing:.12em;text-transform:uppercase;color:#6A6158;margin-bottom:6px">Campaign Title *</label>
        <input id="cp-title" class="cx-input" value="${esc(c.title||'')}" placeholder="e.g. La Isla Bonita · Summer 2026" style="width:100%"/>
      </div>
      <div>
        <label style="display:block;font-family:'Space Mono',monospace;font-size:.5rem;letter-spacing:.12em;text-transform:uppercase;color:#6A6158;margin-bottom:6px">Brand Name</label>
        <input id="cp-brand" class="cx-input" value="${esc(c.brand_name||'')}" placeholder="Client or brand" style="width:100%"/>
      </div>
      <div>
        <label style="display:block;font-family:'Space Mono',monospace;font-size:.5rem;letter-spacing:.12em;text-transform:uppercase;color:#6A6158;margin-bottom:6px">Category</label>
        <select id="cp-genre" class="cx-select" style="width:100%">
          ${['Music','Gaming','UGC','Sports','Clipping','Edits','Finance','Other'].map(g=>`<option value="${g}" ${(c.genre||c.category||'Music')===g?'selected':''}>${g}</option>`).join('')}
        </select>
      </div>
      <div>
        <label style="display:block;font-family:'Space Mono',monospace;font-size:.5rem;letter-spacing:.12em;text-transform:uppercase;color:#6A6158;margin-bottom:6px">Status</label>
        <select id="cp-status" class="cx-select" style="width:100%">
          ${['draft','active','paused','ended'].map(s=>`<option value="${s}" ${(c.status||'draft')===s?'selected':''}>${s[0].toUpperCase()+s.slice(1)}</option>`).join('')}
        </select>
      </div>
      <div>
        <label style="display:block;font-family:'Space Mono',monospace;font-size:.5rem;letter-spacing:.12em;text-transform:uppercase;color:#6A6158;margin-bottom:6px">RPM (₹ per million views)</label>
        <input id="cp-rpm" class="cx-input" type="number" min="0" step="0.01" value="${c.rpm||''}" placeholder="e.g. 250" style="width:100%"/>
      </div>
      <div>
        <label style="display:block;font-family:'Space Mono',monospace;font-size:.5rem;letter-spacing:.12em;text-transform:uppercase;color:#6A6158;margin-bottom:6px">Budget (₹)</label>
        <input id="cp-budget" class="cx-input" type="number" min="0" value="${c.budget||''}" placeholder="e.g. 50000" style="width:100%"/>
      </div>
      <div>
        <label style="display:block;font-family:'Space Mono',monospace;font-size:.5rem;letter-spacing:.12em;text-transform:uppercase;color:#6A6158;margin-bottom:6px">Start Date</label>
        <input id="cp-start" class="cx-input" type="date" value="${c.start_date||''}" style="width:100%;color-scheme:dark"/>
      </div>
      <div>
        <label style="display:block;font-family:'Space Mono',monospace;font-size:.5rem;letter-spacing:.12em;text-transform:uppercase;color:#6A6158;margin-bottom:6px">End Date</label>
        <input id="cp-end" class="cx-input" type="date" value="${c.end_date||''}" style="width:100%;color-scheme:dark"/>
      </div>
    </div>

    <!-- Platforms -->
    <div style="margin:16px 0">
      <label style="display:block;font-family:'Space Mono',monospace;font-size:.5rem;letter-spacing:.12em;text-transform:uppercase;color:#6A6158;margin-bottom:8px">Platforms</label>
      <div style="display:flex;gap:8px">
        ${[['All','#C4956A','rgba(196,149,106,.12)'],['YouTube','#FF4444','rgba(255,0,0,.12)'],['Instagram','#E1306C','rgba(225,48,108,.12)'],['TikTok','rgba(255,255,255,.8)','rgba(255,255,255,.08)']].map(([p,tc,bg])=>`
        <button type="button" class="cp-plat" data-plat="${p}" style="padding:7px 16px;border-radius:20px;border:1px solid ${tc}33;background:${(c.platform||'All')===p?bg:'transparent'};color:${(c.platform||'All')===p?tc:'rgba(255,255,255,.4)'};font-size:.78rem;font-weight:600;cursor:pointer;transition:all .15s;font-family:'DM Sans',sans-serif">${p}</button>`).join('')}
      </div>
    </div>

    <!-- Requirements -->
    <div style="margin:16px 0 20px">
      <label style="display:block;font-family:'Space Mono',monospace;font-size:.5rem;letter-spacing:.12em;text-transform:uppercase;color:#6A6158;margin-bottom:8px">Requirements</label>
      <textarea id="cp-req" class="cx-textarea" style="width:100%;min-height:90px" placeholder="One requirement per line&#10;e.g. Min 30 seconds&#10;Tag @clipency&#10;Use original audio">${esc((c.requirements||[]).join('\n'))}</textarea>
      <div style="font-size:.72rem;color:#6A6158;margin-top:4px">One requirement per line. Shown as checklist to clippers.</div>
    </div>

    <!-- Description -->
    <div style="margin-bottom:24px">
      <label style="display:block;font-family:'Space Mono',monospace;font-size:.5rem;letter-spacing:.12em;text-transform:uppercase;color:#6A6158;margin-bottom:8px">Description</label>
      <textarea id="cp-desc" class="cx-textarea" style="width:100%;min-height:72px" placeholder="Campaign brief for clippers…">${esc(c.description||'')}</textarea>
    </div>

    <div style="display:flex;gap:10px;justify-content:flex-end;padding-top:16px;border-top:1px solid rgba(255,255,255,.07)">
      ${existing?`<button id="cp-delete" class="cx-btn danger">Delete</button>`:''}
      <div style="flex:1"></div>
      <button id="cp-close2" class="cx-btn ghost">Cancel</button>
      <button id="cp-save" class="cx-btn pri" style="background:#C4956A;color:#0A0908;min-width:130px">Save Campaign</button>
    </div>
  </div>`;

  document.body.appendChild(panel);
  const close=()=>document.body.removeChild(panel);
  panel.querySelector('#cp-close').onclick=close;
  panel.querySelector('#cp-close2').onclick=close;

  // Platform toggle
  panel.querySelectorAll('.cp-plat').forEach(btn=>{
    btn.addEventListener('click',()=>{
      panel.querySelectorAll('.cp-plat').forEach(b=>{
        const p=b.dataset.plat;
        const colors={All:['#C4956A','rgba(196,149,106,.12)'],YouTube:['#FF4444','rgba(255,0,0,.12)'],Instagram:['#E1306C','rgba(225,48,108,.12)'],TikTok:['rgba(255,255,255,.8)','rgba(255,255,255,.08)']};
        const[tc,bg]=colors[p]||['#C4956A','rgba(196,149,106,.12)'];
        const active=b===btn;
        b.style.background=active?bg:'transparent';
        b.style.color=active?tc:'rgba(255,255,255,.4)';
      });
    });
  });

  // Banner preview
  const fi=panel.querySelector('#cp-banner-file');
  fi.onchange=()=>{
    const f=fi.files[0];if(!f)return;
    const url=URL.createObjectURL(f);
    let img=panel.querySelector('#cp-banner-preview');
    if(!img){img=document.createElement('img');img.id='cp-banner-preview';img.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:cover';panel.querySelector('#cp-banner-drop').appendChild(img);}
    img.src=url;
    const bl=panel.querySelector('#cp-banner-label');if(bl)bl.style.display='none';
  };

  // Delete
  if(existing){
    panel.querySelector('#cp-delete').onclick=async()=>{
      if(!confirm('Delete this campaign? This cannot be undone.'))return;
      const{error}=await sb.from('campaigns').delete().eq('id',existing.id);
      if(error){alert(error.message);return;}
      close();await boot();
    };
  }

  // Save
  panel.querySelector('#cp-save').onclick=async()=>{
    const btn=panel.querySelector('#cp-save');
    const errEl=panel.querySelector('#cp-err');
    const title=panel.querySelector('#cp-title').value.trim();
    if(!title){panel.querySelector('#cp-title').focus();return;}
    btn.disabled=true;btn.textContent='Saving…';
    try{
      let asset_url=c.asset_url||null;
      const file=fi.files[0];
      if(file){
        const ext=file.name.split('.').pop();
        const path=`banners/${Date.now()}.${ext}`;
        const{error:ue}=await sb.storage.from('campaign-banners').upload(path,file,{upsert:true});
        if(ue)throw ue;
        const{data:{publicUrl}}=sb.storage.from('campaign-banners').getPublicUrl(path);
        asset_url=publicUrl;
      }
      const activePlat=panel.querySelector('.cp-plat[style*="rgb"]:not([style*="transparent"])')||panel.querySelector('.cp-plat[data-plat="All"]');
      const platform=activePlat?.dataset?.plat||'All';
      const reqRaw=panel.querySelector('#cp-req').value;
      const requirements=reqRaw.split('\n').map(x=>x.trim()).filter(Boolean);
      const payload={
        title,brand_name:panel.querySelector('#cp-brand').value.trim()||null,
        genre:panel.querySelector('#cp-genre').value,
        status:panel.querySelector('#cp-status').value,
        platform,
        rpm:parseFloat(panel.querySelector('#cp-rpm').value)||null,
        budget:parseFloat(panel.querySelector('#cp-budget').value)||null,
        start_date:panel.querySelector('#cp-start').value||null,
        end_date:panel.querySelector('#cp-end').value||null,
        requirements,
        description:panel.querySelector('#cp-desc').value.trim()||null,
        asset_url,updated_at:new Date().toISOString()
      };
      let err;
      if(existing){({error:err}=await sb.from('campaigns').update(payload).eq('id',existing.id));}
      else{payload.created_by=me.id;payload.created_at=new Date().toISOString();({error:err}=await sb.from('campaigns').insert(payload));}
      if(err)throw err;
      close();await boot();
    }catch(e){
      errEl.innerHTML=`<div class="cx-alert err" style="margin-bottom:14px">${esc(e.message||'Save failed')}</div>`;
      btn.disabled=false;btn.textContent='Save Campaign';
    }
  };
}

async function renderReviews(){
  const tab=new URLSearchParams(location.search).get('tab')||'pending';
  const{data:rows}=await sb.rpc('admin_get_submissions',{p_status:tab});
  const tabs=['pending','approved','rejected','all'].map(t=>`<button class="cx-tab${tab===t?' on':''}" onclick="location.search='?tab=${t}'">${t.charAt(0).toUpperCase()+t.slice(1)}</button>`).join('');
  const rowsHtml=(rows||[]).length?`<div class="cx-tw"><table class="cx-t">
    <thead><tr><th>Clipper</th><th>Campaign</th><th>Platform / Handle</th><th>Clip</th><th>Views</th><th>Status</th><th>Amount</th><th>Actions</th></tr></thead>
    <tbody>${(rows||[]).map(r=>`<tr>
      <td><div style="font-size:12px">${esc(r.user_email||'—')}</div><div style="font-size:11px;color:rgba(255,255,255,.35)">${esc(r.user_name||'')}</div></td>
      <td style="max-width:140px"><div style="font-size:12.5px;font-weight:600">${esc(r.campaign_title||r.campaign_id||'—')}</div></td>
      <td><div style="font-size:12px">${esc(r.platform||'—')}</div><div style="font-size:11px;color:rgba(255,255,255,.35)">@${esc(r.handle||'—')}</div></td>
      <td>${r.clip_url?`<a href="${esc(r.clip_url)}" target="_blank" style="color:#a5b4fc;font-size:12px;text-decoration:none" title="${esc(r.clip_url)}">🔗 Open clip</a>`:'—'}</td>
      <td style="font-size:12.5px">${r.views_count?fmt(r.views_count):'—'}</td>
      <td><span class="cx-badge ${r.status}">${esc(r.status||'—')}</span></td>
      <td style="font-size:13px;font-weight:600">${r.approved_amount?fmtMoney(r.approved_amount):'—'}
        ${r.rejection_reason?`<div style="font-size:10.5px;color:#f87171;margin-top:2px">${esc(r.rejection_reason.slice(0,40))}${r.rejection_reason.length>40?'…':''}</div>`:''}
      </td>
      <td><div class="cx-btns">
        ${r.status==='pending'?`
          <button class="cx-btn ok sm" data-approve-sub="${esc(r.id)}">Approve</button>
          <button class="cx-btn danger sm" data-reject-sub="${esc(r.id)}">Reject</button>
        `:'<span style="font-size:11px;color:rgba(255,255,255,.3)">—</span>'}
      </div></td>
    </tr>`).join('')}</tbody>
  </table></div>`:`<div class="cx-empty">No ${tab} submissions.</div>`;
  return page({kicker:'Review Control',title:'Clip submissions.',sub:'Review submitted clips. Approve with an amount that gets added to the clipper\'s balance instantly.',
    body:`<div class="cx-sec"><div class="cx-sh"><div><div class="cx-st">Submissions</div><div class="cx-sd">${(rows||[]).length} in ${tab}</div></div></div>
    <div class="cx-tabs">${tabs}</div>${rowsHtml}</div>`});
}

/* ══ PAYOUTS ════════════════════════════════════════════════════════ */
async function renderPayouts(){
  const tab=new URLSearchParams(location.search).get('tab')||'pending';
  const{data:rows}=await sb.rpc('admin_get_payouts',{p_status:tab});
  const totalPending=(rows||[]).filter(r=>r.status==='pending').reduce((a,r)=>a+(r.amount||0),0);
  const tabs=['pending','paid','all'].map(t=>`<button class="cx-tab${tab===t?' on':''}" onclick="location.search='?tab=${t}'">${t.charAt(0).toUpperCase()+t.slice(1)}</button>`).join('');
  const rowsHtml=(rows||[]).length?`<div class="cx-tw"><table class="cx-t">
    <thead><tr><th>Clipper</th><th>Requested</th><th>Available Balance</th><th>Status</th><th>Reference</th><th>Date</th><th>Actions</th></tr></thead>
    <tbody>${(rows||[]).map(r=>`<tr>
      <td><div style="font-size:12.5px;font-weight:600">${esc(r.user_email||'—')}</div><div style="font-size:11px;color:rgba(255,255,255,.35)">${esc(r.user_name||'')}</div></td>
      <td style="font-size:15px;font-weight:700;color:#f5f5f7">${fmtMoney(r.amount)}</td>
      <td style="font-size:13px;color:#4ade80">${fmtMoney(r.available_balance)}</td>
      <td><span class="cx-badge ${r.status}">${esc(r.status||'—')}</span></td>
      <td style="font-size:11.5px;color:rgba(255,255,255,.4)">${esc(r.transaction_reference||'—')}</td>
      <td style="font-size:11.5px;color:rgba(255,255,255,.4)">${fmtDate(r.requested_at)}</td>
      <td><div class="cx-btns">
        ${r.status==='pending'?`<button class="cx-btn ok sm" data-pay="${esc(r.id)}">Mark Paid</button>`:'<span style="font-size:11px;color:rgba(255,255,255,.3)">Done</span>'}
      </div></td>
    </tr>`).join('')}</tbody>
  </table></div>`:`<div class="cx-empty">No ${tab} payouts.</div>`;
  return page({kicker:'Payout Control',title:'Withdrawals.',sub:'Process clipper withdrawal requests. Mark as paid once transferred.',
    body:`<div class="cx-sec">
    ${tab==='pending'&&totalPending>0?`<div style="background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.2);border-radius:12px;padding:16px 20px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between"><span style="color:#fbbf24;font-weight:600">Total pending payout</span><span style="font-size:22px;font-weight:800;color:#f5f5f7">${fmtMoney(totalPending)}</span></div>`:''}
    <div class="cx-sh"><div><div class="cx-st">Payout requests</div><div class="cx-sd">${(rows||[]).length} in ${tab}</div></div>
    <a class="cx-btn ghost" href="https://v0-clipency-finance-dashboard.vercel.app/login" target="_blank" rel="noopener">Open Finance OS</a></div>
    <div class="cx-tabs">${tabs}</div>${rowsHtml}</div>`});
}

/* ══ USERS ═══════════════════════════════════════════════════════════ */
async function renderUsers(){
  const[{data:admins},{data:reviewers}]=await Promise.all([
    sb.from('admin_users').select('id,email,user_id,created_at').order('created_at',{ascending:false}),
    sb.from('reviewer_users').select('id,email,user_id,created_at').order('created_at',{ascending:false}),
  ]);
  const map=new Map();
  (admins||[]).forEach(r=>map.set(r.email.toLowerCase(),{email:r.email,role:'admin',created_at:r.created_at}));
  (reviewers||[]).forEach(r=>{const e=r.email.toLowerCase();if(!map.has(e))map.set(e,{email:r.email,role:'reviewer',created_at:r.created_at});});
  const users=[...map.values()].sort((a,b)=>a.role==='admin'&&b.role!=='admin'?-1:b.role==='admin'&&a.role!=='admin'?1:a.email.localeCompare(b.email));
  const myEmail=me?.email?.toLowerCase();
  const tableHtml=`<div class="cx-tw"><table class="cx-t">
    <thead><tr><th>Email</th><th>Role</th><th>Added</th><th>Actions</th></tr></thead>
    <tbody>${users.length?users.map(u=>{
      const isSelf=u.email.toLowerCase()===myEmail;
      return`<tr><td><strong>${esc(u.email)}</strong>${isSelf?'<div style="font-size:10.5px;color:rgba(255,255,255,.35)">You</div>':''}</td>
        <td><span class="cx-badge ${u.role}">${u.role==='admin'?'Admin':'Reviewer'}</span></td>
        <td style="font-size:11.5px;color:rgba(255,255,255,.4)">${fmtDate(u.created_at)}</td>
        <td><div class="cx-btns">
          <button class="cx-btn ghost sm" data-ra="admin" data-email="${esc(u.email)}" ${u.role==='admin'?'disabled':''}>Admin</button>
          <button class="cx-btn ghost sm" data-ra="reviewer" data-email="${esc(u.email)}" ${u.role==='reviewer'?'disabled':''}>Reviewer</button>
          <button class="cx-btn danger sm" data-ra="revoke" data-email="${esc(u.email)}" ${isSelf?'disabled':''}>Revoke</button>
        </div></td></tr>`;
    }).join(''):`<tr><td colspan="4"><div class="cx-empty">No users yet.</div></td></tr>`}</tbody>
  </table></div>`;
  return page({kicker:'Access Control',title:'Users & roles.',sub:'Manage who can access the Admin OS.',
    body:`<div class="cx-sec"><div class="cx-sh"><div><div class="cx-st">Add / update access</div><div class="cx-sd">Changes take effect on next sign in.</div></div></div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;margin-bottom:20px">
      <input class="cx-input" id="cx-role-email" type="email" placeholder="name@example.com" style="min-width:230px;margin:0"/>
      <select class="cx-select" id="cx-role-select" style="margin:0"><option value="reviewer">Reviewer</option><option value="admin">Admin</option></select>
      <button class="cx-btn pri" id="cx-role-save">Save access</button>
    </div></div>
    <div class="cx-sec"><div class="cx-sh"><div><div class="cx-st">Current team</div><div class="cx-sd">${users.length} people</div></div></div>${tableHtml}</div>`});
}

/* ══ ROUTER ════════════════════════════════════════════════════════ */
async function renderRoute(){
  if(PATH==='/admin'||PATH==='/workspace')return renderCommand();
  if(PATH==='/admin/connected-accounts'||PATH==='/admin/accounts')return renderAccounts();
  if(PATH==='/admin/campaigns')return renderCampaigns();
  if(PATH==='/admin/reviews')return renderReviews();
  if(PATH==='/admin/payouts')return renderPayouts();
  if(PATH==='/admin/users')return renderUsers();
  return renderCommand();
}

/* ══ EVENTS ═════════════════════════════════════════════════════════ */
function bindEvents(){
  document.getElementById('cx-logout')?.addEventListener('click',async()=>{
    try{await sb.auth.signOut({scope:'global'});}catch{}
    window.location.replace('/login');
  });
  // New campaign
  document.getElementById('cx-new-campaign')?.addEventListener('click',()=>showCampaignForm());
  // Edit campaign — fetch from Supabase by id to avoid CSP eval
  document.querySelectorAll('[data-camp-edit]').forEach(btn=>{
    btn.addEventListener('click',async()=>{
      const id=btn.dataset.campEdit;
      const{data}=await sb.from('campaigns').select('*').eq('id',id).maybeSingle();
      if(data)showCampaignForm(data);
    });
  });
  // Approve account
  document.querySelectorAll('[data-approve-acct]').forEach(btn=>{
    btn.addEventListener('click',async()=>{
      if(!confirm('Approve this account?'))return;
      btn.disabled=true;btn.textContent='Approving…';
      const{error}=await sb.rpc('admin_approve_account',{p_id:btn.dataset.approveAcct});
      if(error){alert(error.message);btn.disabled=false;btn.textContent='Approve';return;}
      await boot();
    });
  });
  // Reject account
  document.querySelectorAll('[data-reject-acct]').forEach(btn=>{
    btn.addEventListener('click',async()=>{
      await showModal({title:'Reject Account',desc:'Provide a reason so the clipper knows what to fix.',
        fields:[{key:'reason',label:'Rejection reason',placeholder:'e.g. Code not found in bio',required:true,type:'textarea'}],
        confirmLabel:'Reject',confirmClass:'danger',
        onConfirm:async({reason})=>{
          const{error}=await sb.rpc('admin_reject_account',{p_id:btn.dataset.rejectAcct,p_reason:reason});
          if(error)throw error;
          await boot();
        }
      });
    });
  });
  // Approve submission
  document.querySelectorAll('[data-approve-sub]').forEach(btn=>{
    btn.addEventListener('click',async()=>{
      await showModal({title:'Approve Submission',desc:'Set the earnings amount for this clip. It will be added to the clipper\'s available balance immediately.',
        fields:[{key:'amount',label:'Approved amount (₹)',type:'number',placeholder:'e.g. 250',min:'0',step:'0.01',required:true}],
        confirmLabel:'Approve & Pay',confirmClass:'ok',
        onConfirm:async({amount})=>{
          const{error}=await sb.rpc('admin_approve_submission',{p_id:btn.dataset.approveSub,p_amount:amount});
          if(error)throw error;
          await boot();
        }
      });
    });
  });
  // Reject submission
  document.querySelectorAll('[data-reject-sub]').forEach(btn=>{
    btn.addEventListener('click',async()=>{
      await showModal({title:'Reject Submission',desc:'Provide a clear reason so the clipper can resubmit if applicable.',
        fields:[{key:'reason',label:'Rejection reason',placeholder:'e.g. Clip URL not working, views not matching',required:true,type:'textarea'}],
        confirmLabel:'Reject',confirmClass:'danger',
        onConfirm:async({reason})=>{
          const{error}=await sb.rpc('admin_reject_submission',{p_id:btn.dataset.rejectSub,p_reason:reason});
          if(error)throw error;
          await boot();
        }
      });
    });
  });
  // Mark payout paid
  document.querySelectorAll('[data-pay]').forEach(btn=>{
    btn.addEventListener('click',async()=>{
      await showModal({title:'Mark as Paid',desc:'Enter a transaction reference (UPI ID, UTR number, etc.) for your records.',
        fields:[{key:'ref',label:'Transaction reference (optional)',placeholder:'e.g. UTR123456789',type:'text'}],
        confirmLabel:'Mark as Paid',confirmClass:'ok',
        onConfirm:async({ref})=>{
          const{error}=await sb.rpc('admin_process_payout',{p_id:btn.dataset.pay,p_ref:ref||null});
          if(error)throw error;
          await boot();
        }
      });
    });
  });
  // Role save
  document.getElementById('cx-role-save')?.addEventListener('click',async()=>{
    const email=document.getElementById('cx-role-email')?.value?.trim();
    const role=document.getElementById('cx-role-select')?.value;
    const btn=document.getElementById('cx-role-save');
    if(!email||!email.includes('@'))return alert('Enter a valid email.');
    btn.disabled=true;btn.textContent='Saving…';
    try{
      if(role==='admin'){
        await sb.from('admin_users').upsert({email},{onConflict:'email'});
        await sb.from('reviewer_users').delete().eq('email',email);
      }else{
        await sb.from('reviewer_users').upsert({email},{onConflict:'email'});
        await sb.from('admin_users').delete().eq('email',email);
      }
      await boot();
    }catch(e){alert(e.message||'Error');btn.disabled=false;btn.textContent='Save access';}
  });
  // Role actions
  document.querySelectorAll('[data-ra]').forEach(btn=>{
    btn.addEventListener('click',async()=>{
      const action=btn.dataset.ra,email=btn.dataset.email;
      if(!email)return;
      if(action==='revoke'&&!confirm(`Revoke access for ${email}?`))return;
      btn.disabled=true;
      try{
        if(action==='revoke'){
          await sb.from('reviewer_users').delete().eq('email',email);
          await sb.from('admin_users').delete().eq('email',email);
        }else if(action==='admin'){
          await sb.from('admin_users').upsert({email},{onConflict:'email'});
          await sb.from('reviewer_users').delete().eq('email',email);
        }else{
          await sb.from('reviewer_users').upsert({email},{onConflict:'email'});
          await sb.from('admin_users').delete().eq('email',email);
        }
        await boot();
      }catch(e){alert(e.message||'Error');btn.disabled=false;}
    });
  });
}

/* ══ BOOT ════════════════════════════════════════════════════════════ */
async function boot(){
  document.body.classList.add('cxon');
  document.body.innerHTML='<div class="cx-loader"><div class="cx-spinner"></div></div>';
  try{
    const ok=await initAuth();
    if(!ok)return;
    document.body.innerHTML=await renderRoute();
    document.title='Clipency | Admin OS';
    bindEvents();
  }catch(e){
    document.body.innerHTML=`<div id="cxos" style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#000"><div style="text-align:center;max-width:440px">
      <h2 style="color:#f5f5f7;font-size:22px;margin-bottom:10px">Something went wrong.</h2>
      <p style="color:rgba(255,255,255,.45);font-size:13.5px;line-height:1.6;margin-bottom:20px">${esc(e.message||'Please refresh.')}</p>
      <a class="cx-btn pri" href="/admin">Retry</a>
    </div></div>`;
  }
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
else boot();
})();
