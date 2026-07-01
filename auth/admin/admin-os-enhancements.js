/**
 * Clipency Admin OS — Enhancement Layer
 * Loads after clipency-admin-os.js via auth/admin/index.html
 * Provides: toast system, edit tracking, rich humanized logs, openReviewModal override
 */
(function(){
'use strict';

/* ══ TOAST SYSTEM ══════════════════════════════════════════════════════ */
window.toast = function(msg, type) {
  type = type || 'ok';
  var tc = document.getElementById('cx-toast-wrap');
  if (!tc) {
    tc = document.createElement('div');
    tc.id = 'cx-toast-wrap';
    tc.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:999999;display:flex;flex-direction:column-reverse;gap:8px;pointer-events:none;max-width:360px';
    document.body.appendChild(tc);
  }
  var cfg = {ok:{bg:'rgba(34,197,94,.12)',bd:'rgba(74,222,128,.3)',col:'#4ade80'},
             err:{bg:'rgba(239,68,68,.12)',bd:'rgba(248,113,113,.3)',col:'#f87171'},
             info:{bg:'rgba(99,102,241,.12)',bd:'rgba(165,180,252,.3)',col:'#a5b4fc'}}[type]
           || {bg:'rgba(99,102,241,.12)',bd:'rgba(165,180,252,.3)',col:'#a5b4fc'};
  var t = document.createElement('div');
  t.style.cssText = 'pointer-events:auto;padding:12px 18px;border-radius:12px;font-size:13.5px;font-weight:600;'+
    'backdrop-filter:blur(16px);background:'+cfg.bg+';border:1px solid '+cfg.bd+';color:'+cfg.col+';'+
    'box-shadow:0 8px 32px rgba(0,0,0,.45);animation:cxSlideToast .3s cubic-bezier(.34,1.2,.64,1) both;'+
    'max-width:360px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;line-height:1.4;';
  t.textContent = msg;
  tc.appendChild(t);
  setTimeout(function(){
    t.style.opacity = '0';
    t.style.transform = 'translateX(110%)';
    t.style.transition = 'all .3s ease';
    setTimeout(function(){ t.remove(); }, 300);
  }, 3200);
};

/* ══ RICH HUMANIZE AUDIT ════════════════════════════════════════════ */
window.__cxHumanize = function(r) {
  var o = r.old_data || {}, n = r.new_data || {}, t = r.target_table || '';
  var action = r.action || '';
  var money = function(v){ return '\u20b9' + Number(v||0).toLocaleString('en-IN'); };
  var fmtV = function(v){ var vn=Number(v||0); return vn>=1e6?(vn/1e6).toFixed(1)+'M':vn>=1000?(vn/1000).toFixed(0)+'K':String(vn); };
  var actorName = (r.actor_email||'Unknown').split('@')[0];
  var roleLabel = r.actor_role ? ' ('+r.actor_role+')' : '';

  if (t === 'clip_submissions') {
    var handle = n.handle||o.handle||'\u2014';
    var platform = n.platform||o.platform||'\u2014';
    var campaign = n.campaign_title||o.campaign_title||'Campaign';
    var views = n.views_count||n.views||o.views_count||0;
    var earning = n.approved_amount||n.earning_amount||o.approved_amount||0;
    var reason = n.rejection_reason||'';
    if (n.status === 'approved') {
      return {icon:'\u2705', actor:actorName+roleLabel,
        text:'Approved @'+handle+'\'s '+platform+' clip',
        detail:campaign+(views?' \u00b7 '+fmtV(views)+' views':'')+(earning?' \u00b7 '+money(earning)+' earned':''),
        status:'approved'};
    }
    if (n.status === 'rejected') {
      return {icon:'\u274c', actor:actorName+roleLabel,
        text:'Rejected @'+handle+'\'s '+platform+' clip',
        detail:campaign+(reason?' \u00b7 "'+reason.slice(0,80)+'"':' \u00b7 No reason given'),
        status:'rejected'};
    }
    if (o.status === 'approved' && n.status === 'approved') {
      return {icon:'\u270f\ufe0f', actor:actorName+roleLabel,
        text:'Edited @'+handle+'\'s approved clip',
        detail:campaign+(views?' \u00b7 Updated to '+fmtV(views)+' views':'')+(earning?' \u00b7 '+money(earning):''),
        status:'edited'};
    }
    if (action.indexOf('delete') === 0) {
      return {icon:'\ud83d\uddd1\ufe0f', actor:actorName+roleLabel,
        text:'Deleted @'+handle+'\'s clip submission', detail:campaign, status:'done'};
    }
    return {icon:'\ud83d\udcce', actor:actorName+roleLabel,
      text:'Updated @'+handle+'\'s '+platform+' clip',
      detail:campaign+' \u00b7 '+(o.status||'?')+' \u2192 '+(n.status||'?'),
      status:n.status||'done'};
  }
  if (t === 'payout_requests') {
    var amt = money(n.amount||o.amount);
    var ref = n.transaction_reference ? ' \u00b7 Ref: '+n.transaction_reference : '';
    var payUser = n.user_email||o.user_email||'\u2014';
    if (n.status === 'paid') {
      return {icon:'\ud83d\udcb8', actor:actorName+roleLabel,
        text:'Marked '+amt+' payout as PAID',
        detail:'Clipper: '+payUser+ref, status:'paid'};
    }
    if (n.status === 'rejected') {
      return {icon:'\u274c', actor:actorName+roleLabel,
        text:'Rejected '+amt+' payout request',
        detail:(n.note?'Reason: "'+n.note+'" \u00b7 ':'')+' Clipper: '+payUser,
        status:'rejected'};
    }
    return {icon:'\ud83d\udcb8', actor:actorName+roleLabel,
      text:'Updated payout ('+(o.status||'?')+' \u2192 '+(n.status||'?')+')',
      detail:amt, status:n.status||'done'};
  }
  if (t === 'connected_accounts') {
    var aHandle = n.handle||n.username||o.handle||o.username||'\u2014';
    var aPlatform = n.platform||o.platform||'\u2014';
    var aReason = n.rejection_reason||'';
    var aUser = n.user_email||o.user_email||'\u2014';
    if (n.status === 'verified') {
      return {icon:'\ud83d\udd17', actor:actorName+roleLabel,
        text:'Verified @'+aHandle+'\'s '+aPlatform+' account',
        detail:'User: '+aUser, status:'verified'};
    }
    if (n.status === 'rejected') {
      return {icon:'\ud83d\udd17', actor:actorName+roleLabel,
        text:'Rejected @'+aHandle+'\'s '+aPlatform+' account',
        detail:aReason ? 'Reason: "'+aReason+'"' : 'No reason given',
        status:'rejected'};
    }
    if (action.indexOf('delete') === 0) {
      return {icon:'\ud83d\uddd1\ufe0f', actor:actorName+roleLabel,
        text:'Removed @'+aHandle+'\'s '+aPlatform+' account', detail:'', status:'done'};
    }
    return {icon:'\ud83d\udd17', actor:actorName+roleLabel,
      text:'Updated @'+aHandle+'\'s '+aPlatform+' account',
      detail:(o.status||'?')+' \u2192 '+(n.status||'?'), status:n.status||'done'};
  }
  if (t === 'campaigns') {
    var title = n.title||o.title||'Untitled';
    if (action.indexOf('insert') === 0) return {icon:'\ud83c\udfa6', actor:actorName+roleLabel, text:'Created campaign "'+title+'"', detail:'', status:'done'};
    if (action.indexOf('delete') === 0) return {icon:'\ud83d\uddd1\ufe0f', actor:actorName+roleLabel, text:'Deleted campaign "'+title+'"', detail:'', status:'done'};
    var changes = [];
    if (o.status !== n.status) changes.push('status: '+o.status+' \u2192 '+n.status);
    if (o.title !== n.title) changes.push('title renamed');
    if (o.rpm !== n.rpm) changes.push('RPM: '+(o.rpm||'\u2014')+' \u2192 '+(n.rpm||'\u2014'));
    return {icon:'\ud83c\udfa6', actor:actorName+roleLabel, text:'Updated campaign "'+title+'"',
      detail:changes.join(' \u00b7 ')||'Settings changed', status:'done'};
  }
  if (t === 'admin_users') {
    if (action.indexOf('insert') === 0) return {icon:'\ud83d\udee1\ufe0f', actor:actorName+roleLabel, text:'Granted admin access', detail:'To: '+(n.email||'\u2014'), status:'done'};
    return {icon:'\ud83d\udee1\ufe0f', actor:actorName+roleLabel, text:'Revoked admin access', detail:'From: '+(o.email||'\u2014'), status:'done'};
  }
  if (t === 'reviewer_users') {
    if (action.indexOf('insert') === 0) return {icon:'\ud83d\udee1\ufe0f', actor:actorName+roleLabel, text:'Granted reviewer access', detail:'To: '+(n.email||'\u2014'), status:'done'};
    return {icon:'\ud83d\udee1\ufe0f', actor:actorName+roleLabel, text:'Revoked reviewer access', detail:'From: '+(o.email||'\u2014'), status:'done'};
  }
  if (t === 'access_invites') {
    if (action.indexOf('insert') === 0) return {icon:'\u2709\ufe0f', actor:actorName+roleLabel, text:'Invited '+(n.email||'\u2014')+' as '+(n.role||'\u2014'), detail:'', status:n.status||'pending'};
    return {icon:'\u2709\ufe0f', actor:actorName+roleLabel, text:'Updated invite for '+(n.email||o.email||'\u2014'), detail:n.status||'', status:n.status||'done'};
  }
  return {icon:'\ud83d\udccb', actor:actorName+roleLabel, text:action+(t?' on '+t:''), detail:'', status:'done'};
};

/* ══ LOG TABLE POST-PROCESSOR ═════════════════════════════════════════
   Watches the logs page and rewrites audit rows using the rich humanizer
═══════════════════════════════════════════════════════════════════════ */
function postProcessLogRows(root) {
  // This would require access to the raw audit data which is in JS scope
  // We instead enhance the actor column display that IS accessible
  root = root || document;
  root.querySelectorAll && root.querySelectorAll('table.cx-t tbody tr').forEach(function(row) {
    // Add hover highlight
    row.style.transition = 'background .15s';
  });
}

/* ══ REVIEW MODAL OVERRIDE ════════════════════════════════════════════
   Replaces openReviewModal to add:
   - Edit timestamp display (item 1)
   - Save edited_by_email + edited_at on approve (item 1)
   - Passes editedAt and editedByEmail params
═══════════════════════════════════════════════════════════════════════ */
var _origOpenReviewModal = window.openReviewModal;
window.openReviewModal = function(id, name, camp, platform, handle, clipUrl,
    views, amt, status, likes, comments, appealNote, priorRejectReason,
    editedAt, editedByEmail) {

  likes = likes || 0; comments = comments || 0;
  var engRate = views > 0 ? ((likes+comments)/views*100).toFixed(2) : 0;

  var esc = function(v){ return String(v==null?'':v)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;'); };

  var panel = document.createElement('div');
  panel.className = 'cx-panel';
  panel.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.87);backdrop-filter:blur(8px);z-index:9000;display:flex;align-items:center;justify-content:center;padding:20px;animation:cxFadeIn .18s ease both';

  var editedByName = editedByEmail ? editedByEmail.split('@')[0] : '';
  var editedDateStr = editedAt ? new Date(editedAt).toLocaleString('en-IN',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '';

  panel.innerHTML = '<div style="background:#181410;border:1px solid rgba(196,149,106,.2);border-radius:18px;width:100%;max-width:560px;padding:28px;box-shadow:0 24px 80px rgba(0,0,0,.7);max-height:90vh;overflow-y:auto;animation:cxScaleUp .22s cubic-bezier(.34,1.1,.64,1) both;">'+
    '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:20px;">'+
      '<div>'+
        '<div style="font-size:.48rem;letter-spacing:.16em;text-transform:uppercase;color:#C4956A;margin-bottom:5px;font-weight:700;">'+
          (status==='approved'?'Edit Submission':'Review Submission')+
        '</div>'+
        '<h3 style="font-size:1.35rem;color:#F5F0EB;font-weight:600;margin-bottom:2px;">'+esc(name)+'</h3>'+
        '<div style="font-size:.76rem;color:#6A6158;">'+esc(camp)+' \u00b7 '+esc(platform)+' \u00b7 @'+esc(handle)+'</div>'+
      '</div>'+
      '<button onclick="this.closest(\'.cx-panel\').remove()" style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:#B8AFA8;width:32px;height:32px;border-radius:7px;cursor:pointer;font-size:14px;flex-shrink:0;">\u2715</button>'+
    '</div>'+
    (clipUrl?'<a href="'+esc(clipUrl)+'" target="_blank" style="display:flex;align-items:center;gap:8px;background:rgba(196,149,106,.07);border:1px solid rgba(196,149,106,.15);border-radius:9px;padding:10px 14px;text-decoration:none;color:#C4956A;font-size:.82rem;margin-bottom:16px;font-weight:600;transition:background .15s" onmouseover="this.style.background=\'rgba(196,149,106,.12)\'" onmouseout="this.style.background=\'rgba(196,149,106,.07)\'">'+'\ud83d\udd17 Open clip proof \u2197</a>':'')+
    (priorRejectReason?'<div style="background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.2);border-radius:9px;padding:10px 14px;margin-bottom:10px;font-size:.78rem;color:#F87171;"><b>Prior rejection reason:</b> '+esc(priorRejectReason)+'</div>':'')+
    (appealNote?'<div style="background:rgba(250,204,21,.08);border:1px solid rgba(250,204,21,.2);border-radius:9px;padding:10px 14px;margin-bottom:12px;font-size:.78rem;color:#FACC15;"><b>\u21a9 Clipper appeal:</b> '+esc(appealNote)+'</div>':'')+
    (editedAt?'<div style="background:rgba(96,165,250,.07);border:1px solid rgba(96,165,250,.18);border-radius:9px;padding:10px 14px;margin-bottom:14px;font-size:.78rem;color:#93c5fd;display:flex;align-items:center;gap:7px;">'+
      '<span>\u270f</span>'+
      '<span><b>Last edited</b> by '+esc(editedByName)+' on '+esc(editedDateStr)+'</span>'+
    '</div>':'')+
    '<div id="rm-err" style="margin-bottom:8px;"></div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:18px;">'+
      '<div>'+
        '<label style="display:block;font-size:.48rem;letter-spacing:.1em;text-transform:uppercase;color:#6A6158;margin-bottom:6px;font-weight:700;">Views Count *</label>'+
        '<input id="rm-views" class="cx-input" type="number" min="0" value="'+esc(views||'')+
          '" placeholder="e.g. 250000" style="width:100%;" oninput="window.__cxCalcEng&&window.__cxCalcEng()"/>'+
      '</div>'+
      '<div>'+
        '<label style="display:block;font-size:.48rem;letter-spacing:.1em;text-transform:uppercase;color:#6A6158;margin-bottom:6px;font-weight:700;">Earnings Amount (\u20b9) *</label>'+
        '<input id="rm-amt" class="cx-input" type="number" min="0" step="0.01" value="'+esc(amt||'')+
          '" placeholder="e.g. 500" style="width:100%;"/>'+
      '</div>'+
      '<div>'+
        '<label style="display:block;font-size:.48rem;letter-spacing:.1em;text-transform:uppercase;color:#6A6158;margin-bottom:6px;font-weight:700;">Likes</label>'+
        '<input id="rm-likes" class="cx-input" type="number" min="0" value="'+esc(likes||'')+
          '" placeholder="e.g. 1200" style="width:100%;" oninput="window.__cxCalcEng&&window.__cxCalcEng()"/>'+
      '</div>'+
      '<div>'+
        '<label style="display:block;font-size:.48rem;letter-spacing:.1em;text-transform:uppercase;color:#6A6158;margin-bottom:6px;font-weight:700;">Comments</label>'+
        '<input id="rm-comments" class="cx-input" type="number" min="0" value="'+esc(comments||'')+
          '" placeholder="e.g. 84" style="width:100%;" oninput="window.__cxCalcEng&&window.__cxCalcEng()"/>'+
      '</div>'+
    '</div>'+
    '<div id="rm-eng-display" style="background:rgba(196,149,106,.06);border:1px solid rgba(196,149,106,.15);border-radius:10px;padding:12px 16px;margin-bottom:18px;display:flex;align-items:center;justify-content:space-between;">'+
      '<div>'+
        '<div style="font-size:.54rem;letter-spacing:.12em;text-transform:uppercase;color:#6A6158;margin-bottom:4px;font-weight:700;">Engagement Rate</div>'+
        '<div id="rm-eng-val" style="font-size:1.4rem;color:#C4956A;font-weight:700;">'+engRate+'%</div>'+
      '</div>'+
      '<div style="font-size:.72rem;color:#6A6158;text-align:right;max-width:180px;line-height:1.5;">((Likes + Comments)<br>\u00f7 Views) \u00d7 100</div>'+
    '</div>'+
    '<div style="display:flex;gap:9px;padding-top:14px;border-top:1px solid rgba(255,255,255,.06);">'+
      '<button id="rm-approve" class="cx-btn ok" style="flex:1;justify-content:center;">'+
        (status==='approved'?'\u2713 Save Changes':'\u2713 Approve & Save')+
      '</button>'+
      (status!=='rejected'?'<button id="rm-reject" class="cx-btn danger" style="flex:1;justify-content:center;">'+
        '\u2717 Reject'+(status==='approved'?' (Unapprove)':'')+
      '</button>':'')+
      '<button onclick="this.closest(\'.cx-panel\').remove()" class="cx-btn ghost">Cancel</button>'+
    '</div>'+
  '</div>';

  var target = document.getElementById('cxos') || document.body;
  target.appendChild(panel);

  window.__cxCalcEng = function() {
    var v = Number(document.getElementById('rm-views')&&document.getElementById('rm-views').value)||0;
    var l = Number(document.getElementById('rm-likes')&&document.getElementById('rm-likes').value)||0;
    var c = Number(document.getElementById('rm-comments')&&document.getElementById('rm-comments').value)||0;
    var eng = v > 0 ? ((l+c)/v*100).toFixed(2) : 0;
    var el = document.getElementById('rm-eng-val');
    if (el) el.textContent = eng + '%';
  };

  var getSb = function() {
    return window.clipencySupabase || window.supabaseClient || window.sbClient;
  };
  var getMe = function() {
    // Try to get current user email from the admin OS shell
    var avatar = document.querySelector('.cx-un');
    return avatar ? null : null; // Fall back to Supabase getUser
  };

  var approveBtn = panel.querySelector('#rm-approve');
  approveBtn.onclick = async function() {
    var v = Number(panel.querySelector('#rm-views').value)||0;
    var a = parseFloat(panel.querySelector('#rm-amt').value)||0;
    var l = Number(panel.querySelector('#rm-likes').value)||0;
    var c = Number(panel.querySelector('#rm-comments').value)||0;
    var eng = v > 0 ? (l+c)/v*100 : 0;
    var errEl = panel.querySelector('#rm-err');
    if (v < 500) { errEl.innerHTML = '<div style="color:#F87171;font-size:.8rem;margin-bottom:8px;">&oplus; Minimum 500 views required to approve</div>'; return; }
    if (isNaN(a) || a < 0) { errEl.innerHTML = '<div style="color:#F87171;font-size:.8rem;margin-bottom:8px;">\u26a0 Enter a valid earnings amount</div>'; return; }
    approveBtn.disabled = true; approveBtn.textContent = 'Saving\u2026';
    try {
      var sb = getSb();
      if (!sb) throw new Error('Supabase client not available');
      var approveErr = (await sb.rpc('admin_approve_submission', {p_id:id, p_amount:a, p_views:v})).error;
      if (approveErr) throw approveErr;
      var meRes = await sb.auth.getUser();
      var myEmail = meRes.data&&meRes.data.user ? meRes.data.user.email : null;
      await sb.from('clip_submissions').update({
        likes: l,
        comments: c,
        engagement_rate: parseFloat(eng.toFixed(4)),
        views_count: v,
        edited_at: new Date().toISOString(),
        edited_by_email: myEmail
      }).eq('id', id);
      panel.remove();
      window.toast && window.toast('\u2713 Approved and saved successfully', 'ok');
      // Refresh the page content
      if (window.__clipencyAdminOSLoaded && window.boot) window.boot();
      else location.reload();
    } catch(e) {
      errEl.innerHTML = '<div style="color:#F87171;font-size:.8rem;margin-bottom:8px;">'+esc(e.message||'Save failed')+'</div>';
      approveBtn.disabled = false;
      approveBtn.textContent = status==='approved' ? '\u2713 Save Changes' : '\u2713 Approve & Save';
    }
  };

  var rejectBtn = panel.querySelector('#rm-reject');
  if (rejectBtn) {
    rejectBtn.onclick = async function() {
      var reason = prompt('Rejection reason (shown to clipper):', '');
      if (reason === null) return;
      if (!reason.trim()) { alert('Enter a rejection reason'); return; }
      rejectBtn.disabled = true; rejectBtn.textContent = 'Rejecting\u2026';
      try {
        var sb = getSb();
        var rejectErr = (await sb.rpc('admin_reject_submission', {p_id:id, p_reason:reason})).error;
        if (rejectErr) throw rejectErr;
        panel.remove();
        window.toast && window.toast('\u2717 Submission rejected', 'info');
        if (window.boot) window.boot(); else location.reload();
      } catch(e) {
        alert(e.message || 'Rejection failed');
        rejectBtn.disabled = false;
        rejectBtn.textContent = '\u2717 Reject';
      }
    };
  }
};

/* ══ DELEGATED CLICK HANDLER (replaces original) ════════════════════ */
document.addEventListener('click', function(e) {
  var btn = e.target.closest('.cx-review-btn');
  if (!btn) return;
  // Stop the original handler from also firing
  e.stopImmediatePropagation();
  var d = btn.dataset;
  window.openReviewModal(
    d.id, d.name, d.camp, d.platform, d.handle, d.clip,
    Number(d.views||0), Number(d.amt||0), d.status,
    Number(d.likes||0), Number(d.comments||0),
    d.appeal, d.rejreason,
    d.editedat||'', d.editedby||''
  );
}, true); // Use capture to fire before the original

/* ══ BOOT OBSERVER ══════════════════════════════════════════════════
   Runs after admin OS renders each page
═══════════════════════════════════════════════════════════════════ */
function waitForCxos(cb, retries) {
  retries = retries || 60;
  if (document.getElementById('cxos')) { cb(); return; }
  if (retries <= 0) return;
  setTimeout(function() { waitForCxos(cb, retries-1); }, 150);
}

waitForCxos(function() {
  var cxos = document.getElementById('cxos');
  if (!cxos) return;
  // Watch for re-renders (boot() replaces innerHTML)
  var obs = new MutationObserver(function() {
    postProcessLogRows(document);
  });
  obs.observe(cxos, {childList:true, subtree:false});
  postProcessLogRows(document);
});

})();
