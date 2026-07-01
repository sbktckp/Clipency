// Block legacy admin scripts that conflict
window.__clipencyAdminLaunchBlocked = true;
window.reviews = ()=>{};
window.accounts = ()=>{};
window.campaigns_legacy = ()=>{};
window.payouts = ()=>{};
window.submissions = ()=>{};
window.leads = ()=>{};

(function(){
'use strict';
if(window.__clipencyAdminOSLoaded)return;
window.__clipencyAdminOSLoaded=true;

const PATH=window.location.pathname;
const ADMIN_PATHS=['/admin','/admin/reviews','/admin/review','/admin/logs','/admin/analytics','/admin/campaigns','/admin/leads',
  '/admin/payouts','/admin/users','/admin/accounts','/admin/connected-accounts','/workspace'];
if(!ADMIN_PATHS.includes(PATH))return;

/* ══ CSS ═══════════════════════════════════════════════════════════════════════════ */
const STYLE=`
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body.cxon{font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Helvetica Neue',Arial,sans-serif;background:#000;color:#f5f5f7;height:100vh;overflow:hidden}
body.cxon>*:not(#cxos):not(.cx-loader):not(.cx-overlay):not(.cx-panel){display:none!important}
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
/* ── KEYFRAMES ──────────────────────────────────────────────────────── */
@keyframes cxFadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@keyframes cxFadeIn{from{opacity:0}to{opacity:1}}
@keyframes cxScaleUp{from{opacity:0;transform:scale(.93)}to{opacity:1;transform:scale(1)}}
@keyframes cxSlideToast{from{opacity:0;transform:translateX(110%)}to{opacity:1;transform:translateX(0)}}
@keyframes cxRowIn{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
@keyframes cxPulse{0%,100%{opacity:1}50%{opacity:.7}}
@keyframes cxShimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
@keyframes cxGlow{0%,100%{box-shadow:0 0 8px var(--glow,rgba(99,102,241,.3))}50%{box-shadow:0 0 20px var(--glow,rgba(99,102,241,.5))}}
/* ── PAGE ───────────────────────────────────────────────────────────────── */
.cx-wrap{animation:cxFadeUp .38s cubic-bezier(.4,0,.2,1) both}
.cx-kicker{animation:cxFadeUp .32s ease both}
.cx-h1{animation:cxFadeUp .38s cubic-bezier(.4,0,.2,1) .04s both}
.cx-sub{animation:cxFadeUp .38s cubic-bezier(.4,0,.2,1) .08s both}
/* ── STAT CARDS ────────────────────────────────────────────────────── */
.cx-stat{animation:cxFadeUp .48s cubic-bezier(.34,1.1,.64,1) both;position:relative;overflow:hidden;transition:transform .25s cubic-bezier(.4,0,.2,1),background .2s,box-shadow .25s!important}
.cx-stat:nth-child(1){animation-delay:.04s}.cx-stat:nth-child(2){animation-delay:.08s}
.cx-stat:nth-child(3){animation-delay:.12s}.cx-stat:nth-child(4){animation-delay:.16s}
.cx-stat:nth-child(5){animation-delay:.20s}.cx-stat:nth-child(6){animation-delay:.24s}
.cx-stat:nth-child(7){animation-delay:.28s}.cx-stat:nth-child(8){animation-delay:.32s}
.cx-stat:nth-child(n+9){animation-delay:.36s}
.cx-stat:hover{background:rgba(255,255,255,.07)!important;transform:translateY(-3px) scale(1.015)!important;box-shadow:0 10px 32px rgba(0,0,0,.5),0 0 0 1px rgba(99,102,241,.15)!important}
.cx-stat.ok:hover{box-shadow:0 10px 32px rgba(0,0,0,.5),0 0 0 1px rgba(74,222,128,.2)!important}
.cx-stat.warn:hover{box-shadow:0 10px 32px rgba(0,0,0,.5),0 0 0 1px rgba(251,191,36,.2)!important}
.cx-stat.info:hover{box-shadow:0 10px 32px rgba(0,0,0,.5),0 0 0 1px rgba(165,180,252,.2)!important}
.cx-stat-v{transition:transform .2s cubic-bezier(.34,1.5,.64,1)}.cx-stat:hover .cx-stat-v{transform:scale(1.05)}
/* ── NAV ─────────────────────────────────────────────────────────────────── */
.cx-nav a{position:relative;overflow:hidden;transition:all .2s cubic-bezier(.4,0,.2,1)}
.cx-nav a::after{content:'';position:absolute;left:0;top:50%;width:3px;height:0;background:linear-gradient(180deg,#6366f1,#8b5cf6);border-radius:0 3px 3px 0;transform:translateY(-50%);transition:height .22s cubic-bezier(.4,0,.2,1)}
.cx-nav a.active::after{height:65%}
.cx-nav a svg{transition:transform .2s cubic-bezier(.34,1.5,.64,1)}.cx-nav a:hover svg{transform:scale(1.12)}
/* ── TABLE ROWS ────────────────────────────────────────────────────── */
table.cx-t tbody tr{animation:cxRowIn .3s cubic-bezier(.4,0,.2,1) both;transition:background .15s}
table.cx-t tbody tr:nth-child(1){animation-delay:.03s}table.cx-t tbody tr:nth-child(2){animation-delay:.06s}
table.cx-t tbody tr:nth-child(3){animation-delay:.09s}table.cx-t tbody tr:nth-child(4){animation-delay:.12s}
table.cx-t tbody tr:nth-child(5){animation-delay:.15s}table.cx-t tbody tr:nth-child(6){animation-delay:.18s}
table.cx-t tbody tr:nth-child(7){animation-delay:.21s}table.cx-t tbody tr:nth-child(8){animation-delay:.24s}
table.cx-t tbody tr:nth-child(n+9){animation-delay:.27s}
table.cx-t tr:hover td{background:rgba(99,102,241,.04)!important}
/* ── TABLE WRAPPER ─────────────────────────────────────────────────── */
.cx-tw{box-shadow:0 2px 24px rgba(0,0,0,.3);transition:box-shadow .3s}.cx-tw:hover{box-shadow:0 6px 44px rgba(0,0,0,.45)}
/* ── BADGES ─────────────────────────────────────────────────────────── */
.cx-badge{transition:all .2s;letter-spacing:.04em}
.cx-badge.approved,.cx-badge.verified,.cx-badge.active,.cx-badge.paid{box-shadow:0 0 10px rgba(74,222,128,.22)}
.cx-badge.pending{box-shadow:0 0 10px rgba(251,191,36,.22);animation:cxPulse 2.8s ease-in-out infinite}
.cx-badge.rejected{box-shadow:0 0 10px rgba(248,113,113,.22)}
/* ── BUTTONS ────────────────────────────────────────────────────────── */
.cx-btn{position:relative;overflow:hidden;transition:all .18s cubic-bezier(.4,0,.2,1)}
.cx-btn:active:not(:disabled){transform:scale(.97)!important}
.cx-btn.pri:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 6px 20px rgba(99,102,241,.38)}
.cx-btn.ok:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 6px 20px rgba(74,222,128,.28)}
.cx-btn.danger:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 6px 20px rgba(248,113,113,.28)}
.cx-btn.ghost:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 4px 16px rgba(0,0,0,.3)}
/* ── MODAL ───────────────────────────────────────────────────────────────── */
.cx-overlay{animation:cxFadeIn .18s ease both}.cx-modal{animation:cxScaleUp .22s cubic-bezier(.34,1.1,.64,1) both}
/* ── INPUT ───────────────────────────────────────────────────────────────── */
.cx-input:focus,.cx-select:focus,.cx-textarea:focus{border-color:rgba(99,102,241,.7)!important;box-shadow:0 0 0 3px rgba(99,102,241,.14)!important}
/* ── SCROLLBARS ────────────────────────────────────────────────────── */
.cx-main::-webkit-scrollbar{width:5px}.cx-main::-webkit-scrollbar-track{background:transparent}
.cx-main::-webkit-scrollbar-thumb{background:rgba(255,255,255,.08);border-radius:10px}
.cx-main::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,.16)}
.cx-side::-webkit-scrollbar{width:3px}.cx-side::-webkit-scrollbar-track{background:transparent}
.cx-side::-webkit-scrollbar-thumb{background:rgba(255,255,255,.06);border-radius:10px}
/* ── BRAND ───────────────────────────────────────────────────────────────── */
.cx-brand{transition:background .2s}.cx-brand:hover{background:rgba(255,255,255,.04)}
.cx-brand img{transition:transform .3s cubic-bezier(.34,1.5,.64,1)}.cx-brand:hover img{transform:scale(1.07)}
/* ── TABS ───────────────────────────────────────────────────────────── */
.cx-tab{transition:all .18s cubic-bezier(.4,0,.2,1)}.cx-tab:hover:not(.on){transform:translateY(-1px)}
/* ── SECTIONS ─────────────────────────────────────────────────────────── */
.cx-sec{animation:cxFadeUp .38s cubic-bezier(.4,0,.2,1) .06s both}
.cx-st{font-size:17px;letter-spacing:-.015em}
/* ── TOAST CONTAINER ─────────────────────────────────────────────────── */
#cx-toast-wrap{position:fixed;bottom:24px;right:24px;z-index:999999;display:flex;flex-direction:column-reverse;gap:8px;pointer-events:none;max-width:360px}
/* ── EDIT BADGE ─────────────────────────────────────────────────────── */
.cx-edited{display:inline-block;font-size:9.5px;font-weight:600;color:#60a5fa;background:rgba(96,165,250,.1);border:1px solid rgba(96,165,250,.2);padding:1px 6px;border-radius:4px;margin-top:3px}
/* ── LOG CELLS ───────────────────────────────────────────────────────── */
.cx-log-who{font-size:11px;font-weight:700;letter-spacing:.04em}
.cx-log-what{font-size:12.5px;font-weight:600;color:#f5f5f7;line-height:1.4}
.cx-log-detail{font-size:11px;color:rgba(255,255,255,.4);margin-top:2px;line-height:1.5}
.cx-av{transition:transform .3s cubic-bezier(.34,1.5,.64,1)}.cx-uc:hover .cx-av{transform:scale(1.1)}
`;
const styleEl=document.createElement('style');
styleEl.textContent=STYLE;
document.head.appendChild(styleEl);
