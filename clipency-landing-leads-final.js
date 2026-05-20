/* ═══ CLIPENCY — Landing Lead Capture ═══ */
(function(){
  const _orig = window.submitForm;
  async function saveLead(type){
    const sb=window.supabase||window.clipencySupabase||window.supabaseClient;
    if(!sb)return;
    const g=id=>(document.getElementById(id)||{}).value||'';
    try{
      await sb.from('leads').insert([{
        full_name:g('cf-name'), email:g('cf-email'),
        phone:(g('cf-country')||'+91')+' '+g('cf-phone'),
        company:g('cf-brand'), brand_name:g('cf-brand'),
        campaign_type:g('cf-type')||'Brand Campaign',
        budget:g('cf-budget'), message:g('cf-goal'),
        source_page:window.location.href, status:'new',
        raw_payload:JSON.stringify({type,timestamp:new Date().toISOString()}),
      }]);
      console.log('[leads] saved ✅');
    }catch(e){console.warn('[leads]',e.message);}
  }
  window.submitForm=async function(type){
    await saveLead(type);
    if(typeof _orig==='function') _orig(type);
    else{
      const p=document.getElementById('panel-'+type);
      const s=document.getElementById('form-success-msg');
      if(p) p.style.display='none';
      if(s){s.style.display='flex';}
    }
  };
})();
