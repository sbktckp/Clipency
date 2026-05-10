#!/usr/bin/env bash
set -euo pipefail

cd "${1:-/workspaces/Clipency}"

echo "[Clipency] Applying launch-stable end-to-end patch..."

# Remove broken Vercel serverless OAuth/API attempts. This is a static Supabase RPC flow.
rm -rf api/social api/youtube api/tiktok api/instagram oauth-helpers.js 2>/dev/null || true
rm -rf "Clipency Authentication/api/social" "Clipency Authentication/api/youtube" "Clipency Authentication/api/tiktok" "Clipency Authentication/api/instagram" "Clipency Authentication/oauth-helpers.js" 2>/dev/null || true
rm -f clipency-social-oauth.js clipency-youtube-oauth.js clipency-youtube-oauth-override.js 2>/dev/null || true
rm -f "Clipency Authentication/clipency-social-oauth.js" "Clipency Authentication/clipency-youtube-oauth.js" "Clipency Authentication/clipency-youtube-oauth-override.js" 2>/dev/null || true

cat > clipency-launch-flow.js <<'EOF'
(function(){
  if (window.CLIPENCY_LAUNCH_FLOW_V2) return;
  window.CLIPENCY_LAUNCH_FLOW_V2 = true;

  const PLATFORMS = [
    { id:'youtube', name:'YouTube', icon:'▶', placeholder:'https://youtube.com/@yourchannel' },
    { id:'instagram', name:'Instagram', icon:'◎', placeholder:'https://instagram.com/yourhandle' },
    { id:'tiktok', name:'TikTok', icon:'♪', placeholder:'https://tiktok.com/@yourhandle' }
  ];

  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const clean = v => String(v ?? '').replace(/\s+/g,' ').trim();
  const path = () => location.pathname.replace(/\/+$/,'').toLowerCase() || '/';
  const money = n => '$' + Number(n || 0).toLocaleString(undefined,{maximumFractionDigits:2});
  const fmt = v => v ? new Date(v).toLocaleString() : '—';

  function wait(ms){ return new Promise(r=>setTimeout(r,ms)); }

  async function client(){
    for(let i=0;i<80;i++){
      const c = window.clipencySupabase || window.supabaseClient || window.sbClient;
      if(c && c.auth && c.rpc) return c;
      await wait(80);
    }
    throw new Error('Supabase client missing. Refresh once or check supabaseClient.js loading.');
  }

  async function rpc(name, payload={}){
    const c = await client();
    const {data,error} = await c.rpc(name, payload);
    if(error) throw error;
    return data || [];
  }

  function toast(msg, type='ok'){
    let box = $('#cx-toast');
    if(!box){
      box = document.createElement('div');
      box.id = 'cx-toast';
      box.style.cssText = 'position:fixed;right:22px;bottom:22px;z-index:999999;background:rgba(28,20,15,.96);color:#fff8ef;border:1px solid rgba(224,172,120,.24);border-radius:16px;padding:14px 16px;font-weight:800;box-shadow:0 24px 80px rgba(0,0,0,.45);max-width:420px';
      document.body.appendChild(box);
    }
    box.textContent = msg;
    box.style.borderColor = type === 'error' ? 'rgba(255,90,90,.45)' : 'rgba(224,172,120,.28)';
    clearTimeout(box._t);
    box._t = setTimeout(()=>box.remove(),4500);
  }

  function modal(html){
    const old = $('#cx-modal'); if(old) old.remove();
    const wrap = document.createElement('div');
    wrap.id='cx-modal';
    wrap.style.cssText='position:fixed;inset:0;z-index:999998;background:rgba(0,0,0,.74);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;padding:22px';
    wrap.innerHTML = `<div style="width:min(620px,96vw);max-height:90vh;overflow:auto;background:linear-gradient(145deg,rgba(34,25,18,.98),rgba(9,7,5,.98));border:1px solid rgba(224,172,120,.28);border-radius:28px;padding:30px;color:#fff8ef;box-shadow:0 35px 100px rgba(0,0,0,.58);font-family:inherit;position:relative"><button data-close style="position:absolute;right:20px;top:18px;width:40px;height:40px;border-radius:13px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:white;font-size:24px;cursor:pointer">×</button>${html}</div>`;
    document.body.appendChild(wrap);
    $('[data-close]',wrap).onclick=()=>wrap.remove();
    return wrap;
  }

  function statusLabel(s){
    s=String(s||'').toLowerCase();
    if(s==='verified') return 'Connected';
    if(s==='pending') return 'Under Verification';
    if(s==='approved') return 'Approved';
    if(s==='paid') return 'Paid';
    if(s==='rejected') return 'Rejected';
    if(s==='expired') return 'Expired';
    return 'Not Connected';
  }

  function badge(s){
    s=String(s||'').toLowerCase();
    const colors = {
      verified:['rgba(80,230,150,.12)','#72f0aa'], approved:['rgba(80,230,150,.12)','#72f0aa'], paid:['rgba(80,230,150,.12)','#72f0aa'],
      pending:['rgba(255,211,90,.12)','#ffd35a'], rejected:['rgba(255,90,90,.12)','#ff9b9b'], expired:['rgba(255,90,90,.12)','#ff9b9b']
    };
    const c=colors[s]||['rgba(255,255,255,.07)','rgba(216,199,180,.72)'];
    return `<span style="display:inline-flex;border-radius:999px;padding:8px 12px;background:${c[0]};color:${c[1]};font-weight:900;font-size:12px;white-space:nowrap">${statusLabel(s)}</span>`;
  }

  function ensureSidebarAccounts(){
    if(!['/campaigns','/stats','/payouts','/wallet','/profile','/accounts'].includes(path())) return;
    if($('a[href="/accounts"]')) return;
    const links=$$('a');
    const profile=links.find(a=>/profile/i.test(clean(a.textContent)));
    const wallet=links.find(a=>/wallet/i.test(clean(a.textContent)));
    const ref=profile||wallet; if(!ref||!ref.parentElement) return;
    const a=ref.cloneNode(true);
    a.href='/accounts';
    function replace(n){ if(n.nodeType===3) n.nodeValue=n.nodeValue.replace(/Profile|Wallet/gi,'Accounts'); else n.childNodes.forEach(replace); }
    replace(a);
    if(!/accounts/i.test(clean(a.textContent))) a.appendChild(document.createTextNode(' Accounts'));
    a.classList.remove('active','selected','current');
    if(path()==='/accounts') { a.classList.add('active'); a.style.background='rgba(224,172,120,.11)'; a.style.color='#e0ac78'; }
    ref.parentElement.insertBefore(a, profile||ref);
  }

  async function openAccountModal(platformId, existing){
    const p = PLATFORMS.find(x=>x.id===platformId); if(!p) return;
    const wrap=modal(`
      <div style="color:#e0ac78;letter-spacing:.18em;text-transform:uppercase;font-size:11px;font-weight:900">Connect Account</div>
      <h2 style="margin:10px 0 8px;font-size:30px;font-family:Georgia,serif">Connect ${p.name}</h2>
      <p style="margin:0 0 20px;color:rgba(216,199,180,.72);line-height:1.55">Enter your ${p.name} username and profile URL. Clipency generates a 6-digit code. Verification is usually completed within 24 hours.</p>
      <label style="display:block;color:#e0ac78;font-size:12px;font-weight:900;letter-spacing:.16em;text-transform:uppercase">Username / Handle</label>
      <input id="cx-handle" value="${existing?.handle ? '@'+existing.handle : ''}" placeholder="@yourhandle" style="width:100%;margin:9px 0 16px;border-radius:16px;border:1px solid rgba(224,172,120,.38);background:rgba(255,255,255,.045);color:#fff8ef;padding:15px 17px;font-size:16px;outline:none;box-sizing:border-box">
      <label style="display:block;color:#e0ac78;font-size:12px;font-weight:900;letter-spacing:.16em;text-transform:uppercase">Profile URL</label>
      <input id="cx-url" value="${existing?.profile_url || ''}" placeholder="${p.placeholder}" style="width:100%;margin:9px 0 18px;border-radius:16px;border:1px solid rgba(224,172,120,.38);background:rgba(255,255,255,.045);color:#fff8ef;padding:15px 17px;font-size:16px;outline:none;box-sizing:border-box">
      ${existing?.status==='pending'?`<div style="padding:18px;border-radius:18px;border:1px solid rgba(224,172,120,.25);background:rgba(224,172,120,.08);text-align:center;margin-bottom:18px"><div style="color:#e0ac78;font-size:11px;letter-spacing:.16em;font-weight:900;text-transform:uppercase">Your verification code</div><strong style="display:block;margin-top:10px;color:#e0ac78;font-size:42px;letter-spacing:.24em">${existing.verification_code||'—'}</strong><p style="text-align:left;color:rgba(216,199,180,.74);line-height:1.5;margin:14px 0 0">Paste this code in your ${p.name} bio/profile. Your account will be reviewed and verified within 24 hours.</p></div>`:''}
      <button id="cx-submit-account" style="width:100%;border:0;border-radius:16px;background:#e0ac78;color:#080604;font-weight:950;padding:16px;cursor:pointer;font-size:16px">Generate 6-digit code →</button>`);
    $('#cx-submit-account',wrap).onclick = async()=>{
      const handle=clean($('#cx-handle',wrap).value); const url=clean($('#cx-url',wrap).value);
      if(!handle) return toast('Please enter your username.','error');
      try{
        const rows=await rpc('clipency_request_connected_account',{p_platform:platformId,p_handle:handle,p_profile_url:url});
        const row=Array.isArray(rows)?rows[0]:rows;
        wrap.remove(); toast(`${p.name} verification code generated: ${row.verification_code}. Reviewed within 24 hours.`);
        if(path()==='/accounts') renderAccountsPage(); else renderProfileAccountStatus();
      }catch(e){ toast(e.message||'Could not generate code.','error'); }
    };
  }

  async function renderAccountsPage(){
    if(path()!=='/accounts') return;
    const grid=$('#accounts-grid'); const err=$('#accounts-error'); if(!grid) return;
    if(err) err.textContent='';
    grid.innerHTML = PLATFORMS.map(()=>`<div class="cx-card"><div class="cx-skeleton"></div><div class="cx-skeleton short"></div><div class="cx-skeleton tiny"></div></div>`).join('');
    try{
      const rows=await rpc('clipency_my_connected_accounts');
      const map={}; rows.forEach(r=>map[r.platform]=r);
      grid.innerHTML=PLATFORMS.map(p=>{
        const a=map[p.id]; const st=a?.status || 'empty';
        return `<article class="cx-card">
          <div class="cx-top"><div class="cx-icon">${p.icon}</div><div><h2>${p.name}</h2><p>${a?.handle?'@'+a.handle:'No account added'}</p></div>${badge(st)}</div>
          <div class="cx-meta"><div><span>Verification code</span><strong>${a?.verification_code||'—'}</strong></div><div><span>Review timeline</span><strong>Within 24 hours</strong></div></div>
          <div class="cx-notice ${st}">${st==='verified'?'This account is connected.':st==='pending'?'Paste the 6-digit code in your bio/profile. Your account will be reviewed and verified within 24 hours.':st==='rejected'?(a.rejection_reason||'Rejected. Please retry with correct details.'):st==='expired'?'Previous code expired. Generate a new code.':'Add your account to start submitting clips from this platform.'}</div>
          ${a?.profile_url?`<a class="cx-link" href="${a.profile_url}" target="_blank">Open profile ↗</a>`:`<span class="cx-link muted">${p.placeholder}</span>`}
          <button class="cx-btn" data-add-account="${p.id}" ${st==='verified'?'disabled':''}>${st==='verified'?'Connected':st==='pending'?'View Status':st==='rejected'?'Retry':st==='expired'?'Generate New Code':'Add Account'}</button>
        </article>`;
      }).join('');
      $$('[data-add-account]',grid).forEach(btn=>btn.onclick=()=>openAccountModal(btn.dataset.addAccount,map[btn.dataset.addAccount]));
    }catch(e){ grid.innerHTML=''; if(err) err.textContent='Could not load connected accounts: '+(e.message||e); }
  }

  function createAccountsPageIfStatic(){
    if(path()!=='/accounts') return;
    if($('#accounts-grid')) return;
    document.body.innerHTML = `<div class="cx-shell"><aside class="cx-side"><div class="cx-logo">✂ CLIPENCY</div><div class="cx-label">Clipper</div><nav><a href="/campaigns">▻ Campaigns</a><a href="/stats">⌁ Stats</a><a href="/payouts">▭ Payouts</a><a href="/wallet">▣ Wallet</a><a class="active" href="/accounts">🔗 Accounts</a></nav><div class="cx-label">Account</div><nav><a href="/profile">♙ Profile</a></nav></aside><main class="cx-main"><div class="cx-eyebrow">Creator verification</div><h1>Accounts.</h1><p class="cx-sub">Connect your creator platforms with a 6-digit verification code. Verification is usually completed within 24 hours.</p><section id="accounts-grid" class="cx-grid"></section><div id="accounts-error" class="cx-error"></div></main></div>`;
  }

  async function renderProfileAccountStatus(){
    if(path()!=='/profile') return;
    try{
      const rows=await rpc('clipency_my_connected_accounts'); const map={}; rows.forEach(r=>map[r.platform]=r);
      const blocks=$$('section,article,div').filter(el=>/connected accounts/i.test(clean(el.textContent))).sort((a,b)=>a.getBoundingClientRect().height-b.getBoundingClientRect().height);
      const block=blocks[0]; if(!block) return;
      PLATFORMS.forEach(p=>{
        const row=$$('div,li,section,article',block).filter(el=>{const r=el.getBoundingClientRect();return r.height>35&&r.height<170&&clean(el.textContent).toLowerCase().includes(p.name.toLowerCase());}).sort((a,b)=>a.getBoundingClientRect().height-b.getBoundingClientRect().height)[0];
        if(!row) return;
        const a=map[p.id];
        const btn=$$('button,a,[role="button"]',row).find(x=>/add|edit|connect|verification|connected|retry|rejected/i.test(clean(x.textContent)));
        if(btn){ btn.textContent=a?statusLabel(a.status):'+ Add'; btn.style.pointerEvents='auto'; btn.style.cursor='pointer'; btn.onclick=(e)=>{e.preventDefault();e.stopPropagation();location.href='/accounts';}; }
        const leaves=$$('*',row).filter(el=>!el.children.length);
        const sub=leaves.find(el=>/no accounts connected|connected|under verification|rejected|expired|pending/i.test(clean(el.textContent)));
        if(sub){ sub.textContent=!a?'No account connected':a.status==='verified'?`@${a.handle} · Connected`:a.status==='pending'?`@${a.handle} · Under verification`:a.status==='rejected'?`@${a.handle} · Rejected`:`@${a.handle} · Code expired`; }
      });
    }catch(e){ console.warn('[Clipency profile account status]',e); }
  }

  function campaignInfo(){
    const title = clean($('h1')?.textContent || document.title || 'Campaign');
    const id = location.search.match(/[?&]id=([^&]+)/)?.[1] || location.hash.replace('#','') || title.toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,80);
    return { id, title };
  }

  async function openSubmitClipModal(){
    try{
      const accs=await rpc('clipency_verified_accounts');
      if(!accs.length) { toast('Please connect and verify at least one social account before submitting clips.','error'); location.href='/accounts'; return; }
      const c=campaignInfo();
      const opts=accs.map(a=>`<option value="${a.id}">${a.platform} · @${a.handle}</option>`).join('');
      const wrap=modal(`<div style="color:#e0ac78;letter-spacing:.18em;text-transform:uppercase;font-size:11px;font-weight:900">Submit Clip</div><h2 style="font-family:Georgia,serif;font-size:30px;margin:10px 0">${c.title}</h2><p style="color:rgba(216,199,180,.72);line-height:1.55">Only connected accounts can submit clips. Your submission will go to Admin Reviews.</p><label class="cx-modal-label">Connected Account</label><select id="cx-submit-account-select" class="cx-modal-input">${opts}</select><label class="cx-modal-label">Clip/Post URL</label><input id="cx-submit-url" class="cx-modal-input" placeholder="https://..."><label class="cx-modal-label">Views / Proof metric</label><input id="cx-submit-views" class="cx-modal-input" type="number" value="0" min="0"><button id="cx-submit-clip" class="cx-modal-btn">Submit for Review →</button>`);
      $('#cx-submit-clip',wrap).onclick=async()=>{
        const account=$('#cx-submit-account-select',wrap).value; const url=clean($('#cx-submit-url',wrap).value); const views=Number($('#cx-submit-views',wrap).value||0);
        if(!url) return toast('Please paste the clip/post URL.','error');
        try{ await rpc('clipency_submit_clip',{p_campaign_id:c.id,p_campaign_title:c.title,p_connected_account_id:account,p_clip_url:url,p_views:views,p_proof_url:url}); wrap.remove(); toast('Clip submitted for admin review.'); }
        catch(e){ toast(e.message||'Clip submission failed.','error'); }
      };
    }catch(e){ toast(e.message||'Could not start clip submission.','error'); }
  }

  function bindCampaignSubmit(){
    if(path()!=='/campaigns') return;
    $$('button,a,[role="button"]').filter(el=>/submit.*clip|submit your clip/i.test(clean(el.textContent))).forEach(btn=>{
      if(btn.dataset.cxSubmitBound) return; btn.dataset.cxSubmitBound='1';
      btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openSubmitClipModal();},true);
    });
  }

  async function renderStatsSubmissions(){
    if(path()!=='/stats') return;
    try{
      const rows=await rpc('clipency_my_submissions');
      const panels=$$('section,article,div').filter(el=>/my submissions|rejected submissions/i.test(clean(el.textContent))).sort((a,b)=>b.getBoundingClientRect().width-a.getBoundingClientRect().width);
      const target=panels[0]; if(!target) return;
      target.innerHTML = `<div style="display:flex;gap:14px;align-items:center;justify-content:space-between;margin-bottom:18px"><h2 style="margin:0;font-family:Georgia,serif">My Submissions</h2><span>${rows.length} total</span></div>` + (rows.length?`<div style="display:grid;gap:12px">${rows.map(r=>`<div style="display:grid;grid-template-columns:1.4fr .7fr .7fr .8fr auto;gap:12px;align-items:center;border-top:1px solid rgba(224,172,120,.12);padding:14px 0"><strong>${r.campaign_title||'Campaign'}</strong><span>${r.platform||'—'} @${r.handle||''}</span><span>${r.views||0} views</span>${badge(r.status)}<a style="color:#e0ac78" target="_blank" href="${r.clip_url}">Open</a>${r.rejection_reason?`<small style="grid-column:1/-1;color:#ffb2b2">Reason: ${r.rejection_reason}</small>`:''}${r.approved_amount>0?`<small style="grid-column:1/-1;color:#72f0aa">Approved earning: ${money(r.approved_amount)}</small>`:''}</div>`).join('')}</div>`:`<p style="color:rgba(216,199,180,.72)">No submissions yet.</p>`);
    }catch(e){ console.warn('[Clipency stats submissions]',e); }
  }

  async function renderPayouts(){
    if(path()!=='/payouts') return;
    try{
      const summaryRows=await rpc('clipency_my_payout_summary'); const s=Array.isArray(summaryRows)?summaryRows[0]:summaryRows;
      const history=await rpc('clipency_my_payment_history');
      const bodyText=(document.body.innerText||'');
      function updateCard(label,value){
        const els=$$('div,section,article').filter(el=>clean(el.textContent).toLowerCase().includes(label.toLowerCase())).sort((a,b)=>a.getBoundingClientRect().height-b.getBoundingClientRect().height);
        const card=els[0]; if(!card) return;
        const amounts=$$('*',card).filter(el=>/^\$[\d,]+/.test(clean(el.textContent)) || clean(el.textContent)==='$0');
        const target=amounts.sort((a,b)=>b.getBoundingClientRect().height-a.getBoundingClientRect().height)[0];
        if(target) target.textContent=value;
      }
      updateCard('Available Balance', money(s?.available_balance||0));
      updateCard('Pending Payout', money(s?.pending_payout||0));
      updateCard('Paid', money(s?.paid_total||0));
      $$('button,a,[role="button"]').filter(el=>/withdraw/i.test(clean(el.textContent))).forEach(btn=>{ if(btn.dataset.cxWithdraw) return; btn.dataset.cxWithdraw='1'; btn.onclick=(e)=>{e.preventDefault();e.stopPropagation();openWithdrawModal(Number(s?.available_balance||0));}; });
      const panels=$$('section,article,div').filter(el=>/payout history|payment history/i.test(clean(el.textContent))).sort((a,b)=>b.getBoundingClientRect().width-a.getBoundingClientRect().width);
      const panel=panels[0]; if(panel){ panel.innerHTML=`<h2 style="font-family:Georgia,serif;margin:0 0 20px">Payment History</h2>${history.length?history.map(t=>`<div style="display:grid;grid-template-columns:1fr auto;gap:14px;align-items:center;border-top:1px solid rgba(224,172,120,.12);padding:16px 0"><div><strong>${t.campaign_title||t.note||t.type}</strong><span style="display:block;color:rgba(216,199,180,.62);margin-top:4px">${fmt(t.created_at)} · ${statusLabel(t.status)}</span></div><strong style="color:${Number(t.amount)>=0?'#72f0aa':'#fff8ef'}">${money(t.amount)}</strong></div>`).join(''):`<p style="color:rgba(216,199,180,.72)">No payout history yet.</p>`}`; }
    }catch(e){ console.warn('[Clipency payouts]',e); toast('Could not refresh payout data: '+(e.message||e),'error'); }
  }

  function openWithdrawModal(available){
    const wrap=modal(`<div style="color:#e0ac78;letter-spacing:.18em;text-transform:uppercase;font-size:11px;font-weight:900">Request Payout</div><h2 style="font-family:Georgia,serif;font-size:30px;margin:10px 0">Withdraw earnings</h2><p style="color:rgba(216,199,180,.72)">Available balance: <strong>${money(available)}</strong></p><label class="cx-modal-label">Amount</label><input id="cx-withdraw-amount" class="cx-modal-input" type="number" min="1" max="${available}" value="${available}"><label class="cx-modal-label">Payment note / method</label><input id="cx-withdraw-note" class="cx-modal-input" placeholder="Primary wallet/payment method"><button id="cx-withdraw-submit" class="cx-modal-btn">Request Payout →</button>`);
    $('#cx-withdraw-submit',wrap).onclick=async()=>{
      const amount=Number($('#cx-withdraw-amount',wrap).value||0); const note=clean($('#cx-withdraw-note',wrap).value);
      try{ await rpc('clipency_request_payout',{p_amount:amount,p_payment_method_snapshot:{note},p_note:note}); wrap.remove(); toast('Payout request sent to admin.'); renderPayouts(); }
      catch(e){ toast(e.message||'Could not request payout.','error'); }
    };
  }

  function injectStyles(){
    if($('#cx-launch-style')) return;
    const s=document.createElement('style'); s.id='cx-launch-style';
    s.textContent=`
      .cx-shell{display:grid;grid-template-columns:300px 1fr;min-height:100vh;background:radial-gradient(circle at 12% 12%,rgba(224,172,120,.12),transparent 30%),#050403;color:#fff8ef;font-family:Inter,system-ui,sans-serif}.cx-side{border-right:1px solid rgba(224,172,120,.15);background:linear-gradient(180deg,rgba(22,18,10,.94),rgba(5,4,3,.98));padding:36px 24px;position:sticky;top:0;height:100vh}.cx-logo{font-size:25px;font-weight:950;margin:0 0 58px}.cx-label{font-size:11px;letter-spacing:.28em;color:rgba(216,199,180,.48);font-weight:950;margin:28px 0 16px;text-transform:uppercase}.cx-side nav{display:grid;gap:8px}.cx-side a{color:rgba(216,199,180,.72);text-decoration:none;padding:15px 16px;border-radius:17px;font-weight:850;display:flex;gap:12px}.cx-side a.active,.cx-side a:hover{color:#e0ac78;background:rgba(224,172,120,.11)}.cx-main{padding:64px min(7vw,92px)}.cx-eyebrow{color:#e0ac78;letter-spacing:.24em;text-transform:uppercase;font-size:12px;font-weight:950}.cx-main h1{font-family:Georgia,serif;font-size:clamp(46px,6vw,86px);line-height:.95;letter-spacing:-.065em;margin:14px 0 16px}.cx-sub{color:rgba(216,199,180,.72);font-size:21px;line-height:1.45;max-width:850px;margin:0 0 36px}.cx-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px}.cx-card{min-height:360px;border:1px solid rgba(224,172,120,.22);border-radius:30px;padding:28px;background:linear-gradient(145deg,rgba(31,23,17,.9),rgba(9,7,5,.95));box-shadow:0 30px 90px rgba(0,0,0,.28);transition:.25s ease}.cx-card:hover{transform:translateY(-3px);border-color:rgba(224,172,120,.36)}.cx-top{display:grid;grid-template-columns:58px 1fr auto;gap:16px;align-items:center;margin-bottom:26px}.cx-icon{height:58px;width:58px;border-radius:18px;display:grid;place-items:center;background:rgba(224,172,120,.1);border:1px solid rgba(224,172,120,.22);color:#e0ac78;font-size:24px;font-weight:950}.cx-top h2{margin:0;font-size:23px}.cx-top p{margin:5px 0 0;color:rgba(216,199,180,.72);font-weight:750}.cx-meta{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:18px}.cx-meta div{border:1px solid rgba(224,172,120,.13);background:rgba(255,255,255,.025);border-radius:18px;padding:16px}.cx-meta span{display:block;color:rgba(216,199,180,.48);font-size:11px;letter-spacing:.16em;text-transform:uppercase;font-weight:950}.cx-meta strong{display:block;margin-top:8px;font-size:17px}.cx-notice{border-radius:18px;padding:16px;background:rgba(224,172,120,.08);border:1px solid rgba(224,172,120,.16);color:rgba(216,199,180,.72);line-height:1.45;font-weight:700;margin-bottom:18px;min-height:80px}.cx-link{display:block;color:#e0ac78;text-decoration:none;font-weight:850;margin:10px 0 16px}.cx-link.muted{color:rgba(216,199,180,.48)}.cx-btn,.cx-modal-btn{width:100%;border:0;border-radius:17px;padding:15px 18px;background:#e0ac78;color:#080604;font-weight:950;cursor:pointer;font-size:16px}.cx-btn:disabled{opacity:.65;cursor:not-allowed}.cx-error{margin-top:22px;color:#ffaaaa;font-weight:850}.cx-skeleton{height:18px;border-radius:999px;background:linear-gradient(90deg,rgba(255,255,255,.04),rgba(255,255,255,.11),rgba(255,255,255,.04));margin:16px 0;width:70%;animation:cxPulse 1.2s infinite ease-in-out}.cx-skeleton.short{width:45%}.cx-skeleton.tiny{width:30%}@keyframes cxPulse{50%{opacity:.45}}.cx-modal-label{display:block;color:#e0ac78;font-size:12px;font-weight:900;letter-spacing:.16em;text-transform:uppercase;margin-top:14px}.cx-modal-input{width:100%;margin:8px 0 14px;border-radius:16px;border:1px solid rgba(224,172,120,.38);background:rgba(255,255,255,.045);color:#fff8ef;padding:15px 17px;font-size:16px;outline:none;box-sizing:border-box}@media(max-width:1100px){.cx-shell{grid-template-columns:1fr}.cx-side{position:relative;height:auto}.cx-grid{grid-template-columns:1fr}.cx-main{padding:42px 22px}}
    `; document.head.appendChild(s);
  }

  async function boot(){
    injectStyles(); ensureSidebarAccounts(); createAccountsPageIfStatic();
    await renderAccountsPage(); await renderProfileAccountStatus(); bindCampaignSubmit(); await renderStatsSubmissions(); await renderPayouts();
    setTimeout(()=>{ensureSidebarAccounts(); renderProfileAccountStatus(); bindCampaignSubmit();},1000);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
EOF

cp clipency-launch-flow.js "Clipency Authentication/clipency-launch-flow.js"

cat > clipency-admin-launch.js <<'EOF'
(function(){
  if(window.CLIPENCY_ADMIN_LAUNCH_V2) return; window.CLIPENCY_ADMIN_LAUNCH_V2=true;
  const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
  const money=n=>'$'+Number(n||0).toLocaleString(undefined,{maximumFractionDigits:2});
  const fmt=v=>v?new Date(v).toLocaleString():'—';
  const path=()=>location.pathname.replace(/\/+$/,'').toLowerCase();
  const $=(s,r=document)=>r.querySelector(s); const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  function wait(ms){return new Promise(r=>setTimeout(r,ms));}
  async function client(){for(let i=0;i<80;i++){const c=window.clipencySupabase||window.supabaseClient||window.sbClient;if(c&&c.auth&&c.rpc)return c;await wait(80);}throw new Error('Supabase client missing.');}
  async function rpc(name,payload={}){const c=await client();const {data,error}=await c.rpc(name,payload);if(error)throw error;return data||[];}
  function badge(s){s=String(s||'pending').toLowerCase();const m={pending:['rgba(255,211,90,.12)','#ffd35a','Pending'],verified:['rgba(80,230,150,.12)','#72f0aa','Connected'],approved:['rgba(80,230,150,.12)','#72f0aa','Approved'],paid:['rgba(80,230,150,.12)','#72f0aa','Paid'],rejected:['rgba(255,90,90,.12)','#ff9b9b','Rejected'],expired:['rgba(255,90,90,.12)','#ff9b9b','Expired']};const x=m[s]||m.pending;return `<span class="adm-pill" style="background:${x[0]};color:${x[1]}">${x[2]}</span>`;}
  function toast(msg,type='ok'){let t=$('#adm-toast');if(!t){t=document.createElement('div');t.id='adm-toast';t.style.cssText='position:fixed;right:22px;bottom:22px;z-index:999999;background:rgba(28,20,15,.96);color:#fff8ef;border:1px solid rgba(224,172,120,.24);border-radius:16px;padding:14px 16px;font-weight:800;box-shadow:0 24px 80px rgba(0,0,0,.45)';document.body.appendChild(t);}t.textContent=msg;t.style.borderColor=type==='error'?'rgba(255,90,90,.45)':'rgba(224,172,120,.28)';clearTimeout(t._t);t._t=setTimeout(()=>t.remove(),4500);}
  function styles(){if($('#adm-style'))return;const s=document.createElement('style');s.id='adm-style';s.textContent=`body{margin:0;background:radial-gradient(circle at 10% 10%,rgba(224,172,120,.1),transparent 30%),#050403;color:#fff8ef;font-family:Inter,system-ui,sans-serif}.adm-shell{display:grid;grid-template-columns:300px 1fr;min-height:100vh}.adm-side{border-right:1px solid rgba(224,172,120,.18);background:linear-gradient(180deg,rgba(28,18,12,.95),rgba(5,4,3,.98));padding:42px 28px;position:sticky;top:0;height:100vh}.adm-logo{font-size:28px;font-weight:950;margin-bottom:60px}.adm-label{font-size:12px;letter-spacing:.24em;color:rgba(216,199,180,.48);font-weight:950;margin:24px 0 16px;text-transform:uppercase}.adm-nav{display:grid;gap:10px}.adm-nav a{color:rgba(216,199,180,.72);text-decoration:none;padding:16px 18px;border-radius:18px;font-weight:850;display:flex;gap:12px}.adm-nav a.active,.adm-nav a:hover{color:#e0ac78;background:rgba(224,172,120,.11);box-shadow:inset 0 0 0 1px rgba(224,172,120,.22)}.adm-main{padding:68px min(7vw,90px);overflow:auto}.adm-eye{color:#e0ac78;letter-spacing:.24em;text-transform:uppercase;font-size:13px;font-weight:950}.adm-main h1{font-family:Georgia,serif;font-size:clamp(52px,7vw,96px);line-height:.92;letter-spacing:-.07em;margin:16px 0}.adm-sub{color:rgba(216,199,180,.72);font-size:22px;line-height:1.45;max-width:980px;margin:0 0 36px}.adm-cards{display:grid;grid-template-columns:repeat(4,1fr);gap:22px;margin-bottom:30px}.adm-card{border:1px solid rgba(224,172,120,.22);background:linear-gradient(145deg,rgba(32,23,17,.88),rgba(9,7,5,.92));border-radius:26px;padding:26px;min-height:130px}.adm-card span{color:rgba(216,199,180,.72)}.adm-card strong{display:block;font-size:42px;margin-top:16px}.adm-panel{border:1px solid rgba(224,172,120,.22);border-radius:30px;background:linear-gradient(145deg,rgba(28,20,15,.86),rgba(7,5,4,.96));overflow:hidden}.adm-panel-head{padding:30px 34px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(224,172,120,.16)}.adm-panel h2{margin:0;font-size:44px;letter-spacing:-.05em}.adm-table{width:100%;border-collapse:collapse;min-width:980px}.adm-table-wrap{overflow:auto}.adm-table th,.adm-table td{text-align:left;padding:18px 22px;border-bottom:1px solid rgba(224,172,120,.11);vertical-align:middle}.adm-table th{color:#e0ac78;letter-spacing:.16em;text-transform:uppercase;font-size:12px;font-weight:950}.adm-muted{display:block;color:rgba(216,199,180,.62);font-size:13px;margin-top:4px}.adm-pill{display:inline-flex;padding:8px 12px;border-radius:999px;font-size:12px;font-weight:950}.adm-btn{border:0;background:#e0ac78;color:#090706;border-radius:14px;padding:10px 14px;font-weight:950;cursor:pointer}.adm-btn.secondary{background:rgba(224,172,120,.1);color:#e0ac78;border:1px solid rgba(224,172,120,.26)}.adm-btn.danger{background:rgba(255,90,90,.1);color:#ffaaaa;border:1px solid rgba(255,90,90,.28)}.adm-actions{display:flex;gap:9px;flex-wrap:wrap}.adm-empty{padding:32px;color:rgba(216,199,180,.72);font-weight:850}.adm-filters{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:24px}.adm-input{background:rgba(255,255,255,.035);border:1px solid rgba(224,172,120,.22);color:#fff8ef;border-radius:16px;padding:14px 16px;font-weight:800;min-width:240px}@media(max-width:980px){.adm-shell{grid-template-columns:1fr}.adm-side{position:relative;height:auto}.adm-cards{grid-template-columns:1fr 1fr}.adm-main{padding:44px 22px}}`;document.head.appendChild(s);}
  function shell(title,sub,active){styles();document.body.innerHTML=`<div class="adm-shell"><aside class="adm-side"><div class="adm-logo">✂ CLIPENCY</div><div class="adm-label">Admin OS</div><nav class="adm-nav"><a ${active==='command'?'class="active"':''} href="/admin">⌘ Command Center</a><a ${active==='review'?'class="active"':''} href="/admin/review">✓ Reviews</a><a ${active==='campaigns'?'class="active"':''} href="/admin/campaigns">▷ Campaigns</a><a ${active==='leads'?'class="active"':''} href="/admin/leads">✉ Leads</a><a ${active==='payouts'?'class="active"':''} href="/admin/payouts">▭ Payouts</a><a ${active==='accounts'?'class="active"':''} href="/admin/connected-accounts">🔗 Accounts</a><a ${active==='users'?'class="active"':''} href="/admin/users">♟ Users</a><a ${active==='logs'?'class="active"':''} href="/admin/logs">◷ Logs</a></nav><div class="adm-label">System</div><nav class="adm-nav"><a href="/finance">▥ Finance OS</a><a href="/campaigns">↗ Clipper View</a></nav></aside><main class="adm-main"><div class="adm-eye">${active==='accounts'?'Verification Desk':active==='review'?'Review Control':active==='payouts'?'Payout Control':'Clipency Admin OS'}</div><h1>${title}</h1><p class="adm-sub">${sub}</p><div id="adm-root"></div></main></div>`;}
  async function accounts(){shell('Connected accounts.','Verify creator social accounts using six-digit codes. Verification is usually completed within 24 hours.','accounts');const root=$('#adm-root');root.innerHTML='<div class="adm-empty">Loading verification requests…</div>';try{const rows=await rpc('clipency_admin_connected_accounts');root.innerHTML=`<section class="adm-cards"><div class="adm-card"><span>Total requests</span><strong>${rows.length}</strong></div><div class="adm-card"><span>Under verification</span><strong>${rows.filter(r=>r.status==='pending').length}</strong></div><div class="adm-card"><span>Connected</span><strong>${rows.filter(r=>r.status==='verified').length}</strong></div><div class="adm-card"><span>Closed</span><strong>${rows.filter(r=>['rejected','expired'].includes(r.status)).length}</strong></div></section><section class="adm-panel"><div class="adm-panel-head"><h2>Verification desk</h2><span>${badge('pending')}</span></div><div class="adm-table-wrap">${rows.length?`<table class="adm-table"><thead><tr><th>Creator</th><th>Platform</th><th>Username</th><th>Code</th><th>Expires</th><th>Status</th><th>Actions</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${r.creator_name||'Creator'}<span class="adm-muted">${r.creator_email||''}</span></td><td>${r.platform}</td><td>@${r.handle||'—'}<span class="adm-muted">${r.profile_url?`<a style="color:#e0ac78" target="_blank" href="${r.profile_url}">Open profile ↗</a>`:'No profile URL'}</span></td><td style="letter-spacing:.22em;color:#e0ac78;font-size:20px;font-weight:950">${r.verification_code||'—'}</td><td>${fmt(r.expires_at)}<span class="adm-muted">Created: ${fmt(r.created_at)}</span></td><td>${badge(r.status)}</td><td><div class="adm-actions"><button class="adm-btn" data-verify="${r.id}">Approve</button><button class="adm-btn danger" data-reject="${r.id}">Reject</button></div></td></tr>`).join('')}</tbody></table>`:'<div class="adm-empty">No account verification requests yet.</div>'}</div></section>`;$$('[data-verify]').forEach(b=>b.onclick=async()=>{try{await rpc('clipency_admin_verify_connected_account',{p_account_id:b.dataset.verify});toast('Account approved.');accounts();}catch(e){toast(e.message,'error');}});$$('[data-reject]').forEach(b=>b.onclick=async()=>{const reason=prompt('Reason for rejection:','Verification code not found in public profile/bio.');if(reason===null)return;try{await rpc('clipency_admin_reject_connected_account',{p_account_id:b.dataset.reject,p_reason:reason});toast('Account rejected.');accounts();}catch(e){toast(e.message,'error');}});}catch(e){root.innerHTML=`<div class="adm-empty">Could not load connected accounts: ${e.message||e}</div>`;}}
  async function reviews(){shell('Submissions.','Approve clips with the exact earning amount. Approved earnings instantly increase the clipper available payout balance.','review');const root=$('#adm-root');root.innerHTML='<div class="adm-empty">Loading submissions…</div>';try{const rows=await rpc('clipency_admin_review_queue');root.innerHTML=`<section class="adm-cards"><div class="adm-card"><span>Pending</span><strong>${rows.filter(r=>r.status==='pending').length}</strong></div><div class="adm-card"><span>Approved</span><strong>${rows.filter(r=>r.status==='approved').length}</strong></div><div class="adm-card"><span>Rejected</span><strong>${rows.filter(r=>r.status==='rejected').length}</strong></div><div class="adm-card"><span>Total</span><strong>${rows.length}</strong></div></section><section class="adm-panel"><div class="adm-panel-head"><h2>Review queue</h2><span>${badge('pending')}</span></div><div class="adm-table-wrap">${rows.length?`<table class="adm-table"><thead><tr><th>Creator</th><th>Campaign</th><th>Proof</th><th>Views</th><th>Earnings</th><th>Status</th><th>Submitted</th><th>Actions</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${r.creator_name||'Creator'}<span class="adm-muted">${r.creator_email||''}</span></td><td>${r.campaign_title||'Campaign'}<span class="adm-muted">${r.platform||''} @${r.handle||''}</span></td><td><a style="color:#e0ac78" target="_blank" href="${r.proof_url||r.clip_url}">Open ↗</a></td><td>${r.views||0}</td><td>${money(r.approved_amount||0)}</td><td>${badge(r.status)}${r.rejection_reason?`<span class="adm-muted">${r.rejection_reason}</span>`:''}${r.appeal_note?`<span class="adm-muted">Appeal: ${r.appeal_note}</span>`:''}</td><td>${fmt(r.created_at)}</td><td><div class="adm-actions"><button class="adm-btn" data-approve="${r.id}">Approve</button><button class="adm-btn danger" data-reject-sub="${r.id}">Reject</button></div></td></tr>`).join('')}</tbody></table>`:'<div class="adm-empty">No creator submissions found yet.</div>'}</div></section>`;$$('[data-approve]').forEach(b=>b.onclick=async()=>{const amt=Number(prompt('Enter payout amount for this clip:', '10')||0);if(!amt)return;try{await rpc('clipency_admin_review_submission',{p_submission_id:b.dataset.approve,p_status:'approved',p_amount:amt,p_rejection_reason:null});toast('Submission approved and earning added.');reviews();}catch(e){toast(e.message,'error');}});$$('[data-reject-sub]').forEach(b=>b.onclick=async()=>{const reason=prompt('Reason for rejection:','Proof does not match campaign requirements.');if(reason===null)return;try{await rpc('clipency_admin_review_submission',{p_submission_id:b.dataset.rejectSub,p_status:'rejected',p_amount:0,p_rejection_reason:reason});toast('Submission rejected.');reviews();}catch(e){toast(e.message,'error');}});}catch(e){root.innerHTML=`<div class="adm-empty">Reviews could not load: ${e.message||e}</div>`;}}
  async function payouts(){shell('Payout operations.','Approve withdrawal requests from clippers. Each request includes amount, status, request date, and payment method snapshot.','payouts');const root=$('#adm-root');root.innerHTML='<div class="adm-empty">Loading payout requests…</div>';try{const rows=await rpc('clipency_admin_payout_requests');root.innerHTML=`<section class="adm-cards"><div class="adm-card"><span>Pending requests</span><strong>${rows.filter(r=>r.status==='pending').length}</strong></div><div class="adm-card"><span>Paid requests</span><strong>${rows.filter(r=>r.status==='paid').length}</strong></div><div class="adm-card"><span>Pending amount</span><strong>${money(rows.filter(r=>r.status==='pending').reduce((a,r)=>a+Number(r.amount||0),0))}</strong></div><div class="adm-card"><span>Paid amount</span><strong>${money(rows.filter(r=>r.status==='paid').reduce((a,r)=>a+Number(r.amount||0),0))}</strong></div></section><section class="adm-panel"><div class="adm-panel-head"><h2>Payout requests</h2><span>${badge('pending')}</span></div><div class="adm-table-wrap">${rows.length?`<table class="adm-table"><thead><tr><th>Creator</th><th>Amount</th><th>Status</th><th>Payment method</th><th>Requested</th><th>Reviewed</th><th>Actions</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${r.creator_name||'Creator'}<span class="adm-muted">${r.creator_email||''}</span></td><td><strong>${money(r.amount)}</strong></td><td>${badge(r.status)}</td><td><pre style="white-space:pre-wrap;color:rgba(216,199,180,.72);font-family:inherit">${clean(JSON.stringify(r.payment_method_snapshot||{}))}</pre></td><td>${fmt(r.created_at)}</td><td>${fmt(r.paid_at||r.reviewed_at)}</td><td>${r.status==='pending'?`<button class="adm-btn" data-paid="${r.id}">Mark Paid</button>`:'—'}</td></tr>`).join('')}</tbody></table>`:'<div class="adm-empty">No payout requests yet.</div>'}</div></section>`;$$('[data-paid]').forEach(b=>b.onclick=async()=>{if(!confirm('Mark this payout as paid?'))return;try{await rpc('clipency_admin_mark_payout_paid',{p_payout_request_id:b.dataset.paid,p_note:'Paid by admin'});toast('Payout marked as paid.');payouts();}catch(e){toast(e.message,'error');}});}catch(e){root.innerHTML=`<div class="adm-empty">Payouts could not load: ${e.message||e}</div>`;}}
  async function boot(){const p=path(); if(p==='/admin/connected-accounts') return accounts(); if(p==='/admin/review'||p==='/admin/reviews') return reviews(); if(p==='/admin/payouts') return payouts();}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
EOF

cp clipency-admin-launch.js "Clipency Authentication/clipency-admin-launch.js"

# Minimal route files. The JS renders the full admin shell to keep every admin page unified.
for root in "." "Clipency Authentication"; do
  mkdir -p "$root/accounts" "$root/admin/connected-accounts" "$root/admin/review" "$root/admin/reviews" "$root/admin/payouts"
  cat > "$root/accounts/index.html" <<'EOF'
<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Clipency — Accounts</title><script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script><script src="/supabaseClient.js"></script></head><body><script src="/clipency-launch-flow.js"></script></body></html>
EOF
  for page in admin/connected-accounts admin/review admin/reviews admin/payouts; do
    cat > "$root/$page/index.html" <<'EOF'
<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Clipency | Admin OS</title><script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script><script src="/supabaseClient.js"></script></head><body><script src="/clipency-admin-launch.js"></script></body></html>
EOF
  done
done

python3 <<'PY'
from pathlib import Path
import re
from datetime import datetime
v=datetime.now().strftime('%Y%m%d%H%M%S')

CDN='<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>'
SUP='<script src="/supabaseClient.js?v=launch-flow-'+v+'"></script>'
FLOW='<script defer src="/clipency-launch-flow.js?v=launch-flow-'+v+'"></script>'
ADMIN='<script defer src="/clipency-admin-launch.js?v=admin-launch-'+v+'"></script>'

old_names=['clipency-social-oauth.js','clipency-youtube-oauth.js','clipency-youtube-oauth-override.js']

def remove_old(html):
    for s in old_names:
        html=re.sub(rf'\s*<script[^>]+src=["\'][^"\']*{re.escape(s)}[^"\']*["\'][^>]*>\s*</script>\s*','\n',html,flags=re.I)
    html=re.sub(r'30\s*mins?|30\s*minutes','24 hours',html,flags=re.I)
    html=html.replace('Expires in 29:','Reviewed within 24 hours')
    return html

def ensure_before_body(html, tag):
    if tag.split('?')[0].replace(' defer','') in html or tag in html:
        return html
    return html.replace('</body>', tag+'\n</body>') if '</body>' in html.lower() else html+'\n'+tag

def ensure_head(html, tag):
    if '@supabase/supabase-js' in html and 'supabase-js@2' in tag: return html
    if '/supabaseClient.js' in html and 'supabaseClient.js' in tag: return html
    return html.replace('</head>', tag+'\n</head>') if '</head>' in html.lower() else tag+'\n'+html

# Patch Supabase client to expose the same instance safely.
patch='''\n/* ===== CLIPENCY_LAUNCH_SUPABASE_BRIDGE ===== */\n(function(){\n  try{\n    var c = window.clipencySupabase || window.supabaseClient || window.sbClient;\n    if(!c && window.supabase && window.CLIPENCY_SUPABASE_URL && window.CLIPENCY_SUPABASE_ANON_KEY){\n      c = window.supabase.createClient(window.CLIPENCY_SUPABASE_URL, window.CLIPENCY_SUPABASE_ANON_KEY);\n    }\n    if(c){ window.clipencySupabase = c; window.supabaseClient = c; window.sbClient = c; }\n  }catch(e){ console.warn('[Clipency] Supabase bridge failed', e); }\n})();\n'''
for f in [Path('supabaseClient.js'), Path('Clipency Authentication/supabaseClient.js')]:
    if f.exists():
        txt=f.read_text(encoding='utf-8', errors='ignore')
        if 'CLIPENCY_LAUNCH_SUPABASE_BRIDGE' not in txt:
            f.write_text(txt.rstrip()+patch,encoding='utf-8')
            print('Patched Supabase bridge:',f)

# Patch all app HTML pages with CDN + client + flow. Patch admin pages with admin script.
for f in Path('.').rglob('*.html'):
    if '.git' in f.parts or 'node_modules' in f.parts: continue
    html=f.read_text(encoding='utf-8', errors='ignore')
    old=html
    html=remove_old(html)
    is_admin = 'admin' in f.parts
    is_app = any(x in f.parts for x in ['campaigns','stats','payouts','wallet','profile','accounts']) or is_admin
    if is_app:
        html=ensure_head(html, CDN)
        html=ensure_head(html, SUP)
        html=ensure_before_body(html, ADMIN if is_admin else FLOW)
    if html!=old:
        f.write_text(html, encoding='utf-8')
        print('Patched HTML:',f)

print('Patch version:', v)
PY

git add -A
git status --short

echo "[Clipency] Patch applied. Now run:"
echo "  git commit -m 'Launch stable end to end creator flow'"
echo "  git pull --rebase origin main"
echo "  git push"
