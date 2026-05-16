/**
 * Clipency Profile → Supabase Bridge
 * Hooks into the existing profile page UI to:
 * - Use fixed code 150506 instead of random codes
 * - Save connections to Supabase as 'pending' instead of auto-approving
 * - Load verified/pending accounts from Supabase on page load
 * - Show "Under Review" state instead of "Connected!"
 */
(function(){
'use strict';
if(window.__cxProfileSbLoaded)return;
window.__cxProfileSbLoaded=true;

const FIXED_CODE='150506';
const EXPIRES_HOURS=24;

async function wait(ms){return new Promise(r=>setTimeout(r,ms));}
async function getSb(){
  for(let i=0;i<80;i++){
    const c=window.clipencySupabase||window.supabaseClient;
    if(c?.auth)return c;
    await wait(100);
  }
  throw new Error('Supabase not ready');
}

/* ── Patch renderConnectStep2 to always show fixed code ── */
function patchStep2(){
  const orig=window.renderConnectStep2;
  if(!orig)return;
  window.renderConnectStep2=function(platformName,platformKey){
    // Force fixed code into CONNECT_CODES before original runs
    window.CONNECT_CODES=window.CONNECT_CODES||{};
    window.CONNECT_CODES[platformKey]=FIXED_CODE;
    // Temporarily override generateCode
    const origGen=window.generateCode;
    window.generateCode=()=>FIXED_CODE;
    orig(platformName,platformKey);
    window.generateCode=origGen;
    // Patch DOM after render
    setTimeout(()=>{
      // Override whatever code was displayed
      const codeEl=document.querySelector('.cm-code-val,.cm-code,.connect-code,[class*="code-val"]');
      if(codeEl)codeEl.textContent=FIXED_CODE;
      // Override any digit spans
      document.querySelectorAll('.cm-code-val span,[class*="code-digit"]').forEach((el,i)=>{
        el.textContent=FIXED_CODE[i]||'';
      });
      // Fix expiry text — replace "30 min" or countdown with "24 hours"
      const expEl=document.querySelector('.cm-code-exp,[class*="expire"],[class*="countdown"]');
      if(expEl)expEl.innerHTML='Valid for 24 hours — keep code in your bio';
      // Kill any countdown interval
      if(window._countdownTimer){clearInterval(window._countdownTimer);window._countdownTimer=null;}
    },30);
  };
}

/* ── Override submitForReview to save to Supabase ── */
function patchSubmitForReview(){
  window.submitForReview=async function(platformName,platformKey,username){
    if(window._countdownTimer){clearInterval(window._countdownTimer);window._countdownTimer=null;}
    const handle=username.startsWith('@')?username:'@'+username;
    const box=document.getElementById('connect-modal-box');

    // Show loading
    if(box){
      const loadingHtml=box.innerHTML;
      const submitBtn=box.querySelector('.cm-btn-verify,button[onclick*="submit"]');
      if(submitBtn){submitBtn.disabled=true;submitBtn.textContent='Submitting…';}
    }

    try{
      const sb=await getSb();
      const{data:{user},error:authErr}=await sb.auth.getUser();
      if(authErr||!user)throw new Error('Not logged in');

      // Upsert into connected_accounts
      const{error}=await sb.from('connected_accounts').upsert({
        user_id:user.id,
        platform:platformKey,
        handle:handle,
        username:handle,
        verification_code:FIXED_CODE,
        status:'pending',
        is_verified:false,
        expires_at:new Date(Date.now()+EXPIRES_HOURS*60*60*1000).toISOString(),
        created_at:new Date().toISOString(),
        updated_at:new Date().toISOString()
      },{onConflict:'user_id,platform,handle',ignoreDuplicates:false});

      if(error)throw error;

      // Show pending UI
      if(box){
        box.innerHTML=`
          <button class="cm-close" onclick="closeConnectModal&&closeConnectModal()" style="position:absolute;top:14px;right:14px;background:none;border:none;color:var(--ts,#B8AFA8);cursor:pointer;font-size:1.1rem;">✕</button>
          <div style="text-align:center;padding:8px 0 4px">
            <div style="width:68px;height:68px;border-radius:50%;background:rgba(250,204,21,.1);border:2px solid rgba(250,204,21,.3);display:inline-flex;align-items:center;justify-content:center;font-size:1.9rem;margin-bottom:14px">⏳</div>
            <p style="font-family:'Space Mono',monospace;font-size:.62rem;letter-spacing:.15em;text-transform:uppercase;color:#FACC15;margin-bottom:8px">Under Review</p>
            <h2 style="font-size:1.5rem;font-weight:700;color:var(--tp,#F5F0EB);margin-bottom:10px">Submitted for Verification</h2>
            <p style="font-size:.87rem;color:var(--ts,#B8AFA8);line-height:1.65;margin-bottom:16px">
              Your <strong>${platformName}</strong> account <strong style="color:var(--amber,#C4956A)">${handle}</strong> has been submitted.<br><br>
              The Clipency team will verify within <strong>24 hours</strong>. Once approved, it shows as ✓ Connected.
            </p>
            <div style="background:rgba(250,204,21,.06);border:1px solid rgba(250,204,21,.18);border-radius:11px;padding:12px 15px;margin-bottom:18px;text-align:left;font-size:.8rem;color:var(--ts,#B8AFA8);line-height:1.6">
              ⚠ <strong style="color:#FACC15">Keep the code <span style="font-family:'Space Mono',monospace">${FIXED_CODE}</span> in your bio</strong> until verification is complete.
            </div>
            <button onclick="closeConnectModal&&closeConnectModal()" style="width:100%;padding:12px;background:rgba(196,149,106,.12);border:1px solid rgba(196,149,106,.28);border-radius:10px;color:var(--amber,#C4956A);font-family:'DM Sans',sans-serif;font-size:.9rem;font-weight:600;cursor:pointer;transition:all .2s">Got it — Close</button>
          </div>`;
      }

      // Add to pendingVerifications for UI chips
      if(!window.pendingVerifications)window.pendingVerifications={tiktok:[],instagram:[],youtube:[]};
      const pk=platformKey.toLowerCase();
      if(!window.pendingVerifications[pk])window.pendingVerifications[pk]=[];
      if(!window.pendingVerifications[pk].find(p=>p.handle===handle)){
        window.pendingVerifications[pk].push({handle,status:'pending',platformName});
      }
      if(window.renderPlatformAccounts)window.renderPlatformAccounts(pk);
      if(window.showToast)window.showToast('⏳ Submitted — team reviewing within 24h');

    }catch(e){
      if(box){
        const errDiv=document.createElement('div');
        errDiv.style.cssText='background:rgba(248,113,113,.1);border:1px solid rgba(248,113,113,.25);border-radius:8px;padding:10px 14px;margin-top:10px;font-size:.83rem;color:#F87171';
        errDiv.textContent='Error: '+(e.message||'Could not submit. Please try again.');
        box.appendChild(errDiv);
        const btn=box.querySelector('button[disabled]');
        if(btn){btn.disabled=false;btn.textContent='I\'ve Added the Code';}
      }
    }
  };
}

/* ── Load verified/pending accounts from Supabase into existing UI ── */
async function loadAccountsFromSupabase(){
  try{
    const sb=await getSb();
    const{data:{user}}=await sb.auth.getUser();
    if(!user)return;

    const{data:accounts}=await sb.from('connected_accounts')
      .select('*').eq('user_id',user.id);
    if(!accounts?.length)return;

    // Init state objects if not present
    if(!window.connectedState)window.connectedState={tiktok:[],instagram:[],youtube:[]};
    if(!window.pendingVerifications)window.pendingVerifications={tiktok:[],instagram:[],youtube:[]};

    accounts.forEach(a=>{
      const pk=(a.platform||'').toLowerCase();
      const handle=a.handle||a.username||'';
      if(!handle)return;
      if(a.status==='verified'||a.is_verified===true){
        if(window.connectedState[pk]!==undefined&&!window.connectedState[pk].includes(handle)){
          window.connectedState[pk].push(handle);
        }
        // Remove from pending if it moved to verified
        if(window.pendingVerifications[pk]){
          window.pendingVerifications[pk]=window.pendingVerifications[pk].filter(p=>p.handle!==handle);
        }
      }else if(a.status==='pending'){
        if(window.pendingVerifications[pk]!==undefined&&!window.pendingVerifications[pk].find(p=>p.handle===handle)){
          window.pendingVerifications[pk].push({handle,status:'pending'});
        }
      }else if(a.status==='rejected'){
        // Remove from both — show nothing or could show rejected state
        if(window.pendingVerifications[pk]){
          window.pendingVerifications[pk]=window.pendingVerifications[pk].filter(p=>p.handle!==handle);
        }
      }
    });

    // Re-render all platform chips
    ['tiktok','instagram','youtube'].forEach(k=>{
      if(window.renderPlatformAccounts)window.renderPlatformAccounts(k);
    });
  }catch(e){
    console.warn('[cxProfileSb] loadAccountsFromSupabase:',e.message);
  }
}

/* ── Also patch removeAccount to delete from Supabase ── */
function patchRemoveAccount(){
  const orig=window.removeAccount;
  window.removeAccount=async function(platformKey,handle){
    // Call original UI update
    if(orig)orig(platformKey,handle);
    // Also delete from Supabase
    try{
      const sb=await getSb();
      const{data:{user}}=await sb.auth.getUser();
      if(!user)return;
      await sb.from('connected_accounts')
        .delete()
        .eq('user_id',user.id)
        .eq('platform',platformKey)
        .eq('handle',handle);
    }catch(e){console.warn('[cxProfileSb] removeAccount:',e.message);}
  };
}

/* ── Boot ── */
async function boot(){
  // Wait for the page JS to fully initialise before patching
  await wait(600);
  patchStep2();
  patchSubmitForReview();
  patchRemoveAccount();
  await wait(400);
  await loadAccountsFromSupabase();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
else boot();
})();
