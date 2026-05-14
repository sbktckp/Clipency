(function(){
  window.CLIPENCY_PROFILE_ACCOUNTS_STATUS = "profile-accounts-status-v1";

  const platforms = ["youtube", "instagram", "tiktok"];

  function clean(v){
    return String(v || "").replace(/\s+/g, " ").trim();
  }

  function isProfile(){
    return location.pathname.replace(/\/+$/, "").toLowerCase() === "/profile";
  }

  function sb(){
    return window.clipencySupabase || window.supabaseClient || window.sbClient || null;
  }

  async function rpc(name, payload){
    const client = sb();
    if(!client || !client.rpc) return [];
    const { data, error } = await client.rpc(name, payload || {});
    if(error) throw error;
    return data || [];
  }

  function label(p){
    if(p === "youtube") return "YouTube";
    if(p === "instagram") return "Instagram";
    if(p === "tiktok") return "TikTok";
    return p;
  }

  function stateText(status){
    if(status === "verified") return "Connected";
    if(status === "pending") return "Under Verification";
    if(status === "rejected") return "Rejected";
    if(status === "expired") return "Retry";
    return "+ Add";
  }

  function findConnectedBlock(){
    return Array.from(document.querySelectorAll("section, article, div"))
      .filter(el => /connected accounts/i.test(clean(el.textContent)))
      .sort((a,b) => a.getBoundingClientRect().height - b.getBoundingClientRect().height)[0];
  }

  function findPlatformRow(block, platform){
    if(!block) return null;
    const text = label(platform).toLowerCase();

    return Array.from(block.querySelectorAll("div, li, section, article"))
      .filter(el => {
        const r = el.getBoundingClientRect();
        return r.height > 35 && r.height < 160 && clean(el.textContent).toLowerCase().includes(text);
      })
      .sort((a,b) => a.getBoundingClientRect().height - b.getBoundingClientRect().height)[0];
  }

  function findButton(row){
    if(!row) return null;
    return Array.from(row.querySelectorAll("button,a,[role='button']"))
      .find(el => /add|edit|connect|pending|verification|connected|retry|rejected/i.test(clean(el.textContent)));
  }

  function updateRow(row, account){
    if(!row) return;

    const btn = findButton(row);
    if(btn){
      btn.textContent = stateText(account ? account.status : null);
      btn.style.pointerEvents = "auto";
      btn.style.cursor = "pointer";
      btn.onclick = function(e){
        e.preventDefault();
        e.stopPropagation();
        window.location.href = "/accounts";
      };
    }

    const leaves = Array.from(row.querySelectorAll("*")).filter(el => !el.children.length);
    const subtitle = leaves.find(el => /no accounts connected|connected|under verification|rejected|expired|pending/i.test(clean(el.textContent)));

    if(subtitle){
      if(!account){
        subtitle.textContent = "No account connected";
      }else if(account.status === "verified"){
        subtitle.textContent = `@${account.handle} · Connected`;
      }else if(account.status === "pending"){
        subtitle.textContent = `@${account.handle} · Under verification`;
      }else if(account.status === "rejected"){
        subtitle.textContent = `@${account.handle} · Rejected`;
      }else if(account.status === "expired"){
        subtitle.textContent = `@${account.handle} · Code expired`;
      }
    }
  }

  async function load(){
    if(!isProfile()) return;

    try{
      const rows = await rpc("clipency_my_connected_accounts", {});
      const byPlatform = {};
      rows.forEach(row => {
        if(row.platform) byPlatform[row.platform] = row;
      });

      const block = findConnectedBlock();

      platforms.forEach(platform => {
        updateRow(findPlatformRow(block, platform), byPlatform[platform]);
      });
    }catch(error){
      console.warn("[Profile Accounts] Could not load", error);
    }
  }

  document.addEventListener("DOMContentLoaded", load);
  window.addEventListener("load", load);
  setTimeout(load, 800);
  setTimeout(load, 1800);
})();
