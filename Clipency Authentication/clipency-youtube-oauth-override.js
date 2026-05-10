(function(){
  window.CLIPENCY_YOUTUBE_OAUTH_OVERRIDE = "youtube-oauth-override-v1";

  let connecting = false;

  function clean(v){
    return String(v || "").replace(/\s+/g, " ").trim();
  }

  function isProfilePage(){
    return location.pathname.replace(/\/+$/, "").toLowerCase() === "/profile";
  }

  function sb(){
    return window.clipencySupabase || window.supabaseClient || window.sbClient || null;
  }

  function isYouTubeButton(target){
    const btn = target.closest("button,a,[role='button']");
    if(!btn) return null;

    const btnText = clean(btn.textContent).toLowerCase();

    if(
      !btnText.includes("add") &&
      !btnText.includes("connect") &&
      !btnText.includes("edit") &&
      !btnText.includes("pending")
    ){
      return null;
    }

    let node = btn;

    for(let i = 0; i < 10 && node; i++){
      const txt = clean(node.textContent).toLowerCase();

      if(txt.includes("youtube")){
        return btn;
      }

      node = node.parentElement;
    }

    return null;
  }

  async function startYouTubeOAuth(){
    if(connecting) return;
    connecting = true;

    try{
      const client = sb();

      if(!client?.auth?.getSession){
        alert("Session not found. Please login again.");
        connecting = false;
        return;
      }

      const sessionResult = await client.auth.getSession();
      const token = sessionResult?.data?.session?.access_token;

      if(!token){
        alert("Please login again before connecting YouTube.");
        connecting = false;
        return;
      }

      const res = await fetch("/api/youtube/connect", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: "{}"
      });

      const data = await res.json().catch(() => ({}));

      if(!res.ok || !data.url){
        alert("Could not start YouTube connection: " + (data.error || "Unknown error"));
        connecting = false;
        return;
      }

      window.location.href = data.url;
    }catch(error){
      alert("YouTube connection failed: " + (error.message || error));
      connecting = false;
    }
  }

  function intercept(e){
    if(!isProfilePage()) return;

    const btn = isYouTubeButton(e.target);
    if(!btn) return;

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    startYouTubeOAuth();
  }

  // Pointerdown runs before old click handlers, so old verification modal cannot open.
  window.addEventListener("pointerdown", intercept, true);
  window.addEventListener("mousedown", intercept, true);
  window.addEventListener("click", intercept, true);
})();
