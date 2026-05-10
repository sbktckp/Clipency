(function(){
  window.CLIPENCY_SOCIAL_OAUTH = "social-oauth-youtube-only-v1";

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
      for(const p of platforms){
        if(txt.includes(p)) return p;
      }
      node = node.parentElement;
    }

    return null;
  }

  async function startYouTubeOAuth(){
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
        alert("Please login again before connecting YouTube.");
        busy = false;
        return;
      }

      const res = await fetch("/api/social/connect", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ platform: "youtube" })
      });

      const text = await res.text();
      let data = {};

      try { data = JSON.parse(text); }
      catch { data = { error: text }; }

      if(!res.ok || !data.url){
        alert("Could not start YouTube connection: " + (data.error || "Unknown error"));
        busy = false;
        return;
      }

      window.location.href = data.url;
    }catch(error){
      alert("YouTube connection failed: " + (error.message || error));
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

    if(platform !== "youtube"){
      alert(platform.charAt(0).toUpperCase() + platform.slice(1) + " OAuth is coming soon. YouTube is live first.");
      return;
    }

    startYouTubeOAuth();
  }

  window.addEventListener("pointerdown", intercept, true);
  window.addEventListener("mousedown", intercept, true);
  window.addEventListener("click", intercept, true);
})();
