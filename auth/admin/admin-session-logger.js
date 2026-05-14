
/* ===== CLIPENCY USER SESSION LOGGER ===== */
(function(){
  const STORAGE_KEY = "clipency_session_log_key_v1";
  const ROW_KEY = "clipency_session_row_id_v1";

  function uuid(){
    if(crypto && crypto.randomUUID) return crypto.randomUUID();
    return "sess-" + Date.now() + "-" + Math.random().toString(36).slice(2);
  }

  function getClient(){
    return window.clipencySupabase || window.supabaseClient || window.sbClient || null;
  }

  function loadScript(src){
    return new Promise((resolve,reject)=>{
      if(document.querySelector(`script[src="${src}"]`)) return resolve();
      const s=document.createElement("script");
      s.src=src;
      s.onload=resolve;
      s.onerror=reject;
      document.head.appendChild(s);
    });
  }

  async function waitClient(){
    for(let i=0;i<20;i++){
      const c=getClient();
      if(c && c.auth && c.from) return c;
      await new Promise(r=>setTimeout(r,150));
    }

    try{
      await loadScript("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2");
      await loadScript("/supabaseClient.js?v=session-logger");
    }catch(e){}

    for(let i=0;i<30;i++){
      const c=getClient();
      if(c && c.auth && c.from) return c;
      await new Promise(r=>setTimeout(r,150));
    }

    return null;
  }

  function getSessionKey(){
    let key = localStorage.getItem(STORAGE_KEY);
    if(!key){
      key = uuid();
      localStorage.setItem(STORAGE_KEY, key);
    }
    return key;
  }

  function displayName(user){
    const meta = user.user_metadata || {};
    return meta.full_name || meta.name || meta.display_name || user.email || "User";
  }

  async function startOrUpdate(){
    const client = await waitClient();
    if(!client) return;

    const { data } = await client.auth.getSession();
    const session = data && data.session;
    if(!session || !session.user) return;

    const user = session.user;
    const sessionKey = getSessionKey();

    const payload = {
      session_key: sessionKey,
      user_id: user.id,
      email: user.email || "",
      display_name: displayName(user),
      last_seen_at: new Date().toISOString(),
      status: "active",
      last_path: location.pathname,
      user_agent: navigator.userAgent
    };

    if(!localStorage.getItem(ROW_KEY)){
      payload.login_at = new Date().toISOString();
      payload.entry_path = location.pathname;
    }

    const { data: row, error } = await client
      .from("user_session_logs")
      .upsert(payload, { onConflict: "session_key" })
      .select("id")
      .single();

    if(!error && row && row.id){
      localStorage.setItem(ROW_KEY, row.id);
    }
  }

  async function heartbeat(){
    const client = getClient();
    const key = localStorage.getItem(STORAGE_KEY);
    if(!client || !key) return;

    try{
      await client
        .from("user_session_logs")
        .update({
          last_seen_at: new Date().toISOString(),
          last_path: location.pathname,
          status: "active"
        })
        .eq("session_key", key);
    }catch(e){}
  }

  async function closeSession(){
    const client = getClient();
    const key = localStorage.getItem(STORAGE_KEY);
    if(!client || !key) return;

    try{
      await client
        .from("user_session_logs")
        .update({
          logout_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString(),
          last_path: location.pathname,
          status: "logged_out"
        })
        .eq("session_key", key);
    }catch(e){}

    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ROW_KEY);
  }

  async function patchSignOut(){
    const client = await waitClient();
    if(!client || !client.auth || client.__cxSignOutPatched) return;

    const original = client.auth.signOut.bind(client.auth);
    client.auth.signOut = async function(){
      await closeSession();
      return original.apply(this, arguments);
    };

    client.__cxSignOutPatched = true;

    client.auth.onAuthStateChange(function(event){
      if(event === "SIGNED_OUT") closeSession();
    });
  }

  window.addEventListener("load", function(){
    startOrUpdate();
    patchSignOut();
    setInterval(heartbeat, 60000);
  });

  document.addEventListener("visibilitychange", function(){
    if(document.visibilityState === "hidden") heartbeat();
  });

  window.addEventListener("pagehide", heartbeat);
})();
