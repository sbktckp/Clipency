(function(){
  window.CLIPENCY_SOCIAL_OAUTH = "social-oauth-v1";

  let busy = false;

  function clean(v){
    return String(v || "").replace(/\s+/g, " ").trim();
  }

  function isProfilePage(){
    return location.pathname.replace(/\/+$/, "").toLowerCase() === "/profile";
  }

  function sb(){
    return window.clipencySupabase || window.supabaseClient || window.sbClient || null;
  }

  function platformFromButton(btn){
    const platforms = ["youtube", "instagram", "tiktok"];

    let node = btn;

    for(let i = 0; i < 8 && node; i++){
      const txt = clean(node.textContent).toLowerCase();
      const rect = node.getBoundingClientRect();

      if(rect.height < 160 && txt.length < 220){
        for(const p of platforms){
          if(txt.includes(p)) return p;
        }
      }

      node = node.parentElement;
    }

    const btnRect = btn.getBoundingClientRect();
    let best = null;

    document.querySelectorAll("body *").forEach(el => {
      if(el.children.length) return;

      const txt = clean(el.textContent).toLowerCase();
      if(!platforms.includes(txt)) return;

      const r = el.getBoundingClientRect();
      const dist = Math.abs((r.top + r.bottom) / 2 - (btnRect.top + btnRect.bottom) / 2);

      if(!best || dist < best.dist){
        best = { platform: txt, dist };
      }
    });

    return best && best.dist < 80 ? best.platform : null;
  }

  async function startOAuth(platform){
    if(busy) return;
    busy = true;

    try{
      const client = sb();

      if(!client?.auth?.getSession){
        alert("Session not found. Please login again.");
        busy = false;
        return;
      }

      const sessionResult = await client.auth.getSession();
      const token = sessionResult?.data?.session?.access_token;

      if(!token){
        alert("Please login again before connecting your account.");
        busy = false;
        return;
      }

      const res = await fetch("/api/social/connect", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ platform })
      });

      const text = await res.text();
      let data = {};

      try{
        data = JSON.parse(text);
      }catch(e){
        data = { error: text };
      }

      if(!res.ok || !data.url){
        alert("Could not start " + platform + " connection: " + (data.error || "Unknown error"));
        busy = false;
        return;
      }

      window.location.href = data.url;
    }catch(error){
      alert("Connection failed: " + (error.message || error));
      busy = false;
    }
  }

  function intercept(e){
    if(!isProfilePage()) return;

    const btn = e.target.closest("button,a,[role='button']");
    if(!btn) return;

    const text = clean(btn.textContent).toLowerCase();

    if(
      !text.includes("add") &&
      !text.includes("connect") &&
      !text.includes("edit") &&
      !text.includes("pending")
    ){
      return;
    }

    const platform = platformFromButton(btn);
    if(!platform) return;

    if(!["youtube", "instagram", "tiktok"].includes(platform)) return;

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    startOAuth(platform);
  }

  window.addEventListener("pointerdown", intercept, true);
  window.addEventListener("mousedown", intercept, true);
  window.addEventListener("click", intercept, true);
})();
