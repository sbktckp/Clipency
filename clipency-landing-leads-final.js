/* ═══ CLIPENCY — Landing Lead Capture ═══ */
(function(){
  const _orig = window.submitForm;

  async function saveLead(type){
    /* clipencySupabase is the actual client — NOT window.supabase (that's the CDN module) */
    const sb = window.clipencySupabase || window.supabaseClient || window.sbClient;
    if(!sb || !sb.from){
      console.warn('[leads] no supabase client');
      return;
    }
    const g = id => (document.getElementById(id)||{}).value || '';
    const payload = {
      full_name:     g('cf-name'),
      email:         g('cf-email'),
      phone:         (g('cf-country')||'+91') + ' ' + g('cf-phone'),
      company:       g('cf-brand'),
      brand_name:    g('cf-brand'),
      campaign_type: g('cf-type') || 'Brand Campaign',
      budget:        g('cf-budget'),
      message:       g('cf-goal'),
      source_page:   window.location.href,
      status:        'new',
    };
    console.log('[leads] saving:', payload);
    const { error } = await sb.from('leads').insert([payload]);
    if(error) console.warn('[leads] error:', error.message, error);
    else       console.log('[leads] ✅ saved');
  }

  window.submitForm = async function(type){
    await saveLead(type);
    if(typeof _orig === 'function') _orig(type);
    else {
      const p = document.getElementById('panel-' + type);
      const s = document.getElementById('form-success-msg');
      if(p) p.style.display = 'none';
      if(s) { s.style.display = 'flex'; }
    }
  };
})();
