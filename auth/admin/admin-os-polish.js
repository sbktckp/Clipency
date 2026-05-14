
/* =====================================================
   CLIPENCY ADMIN OS POLISH JS
   Cursor + nav + transitions
   ===================================================== */
(function(){
  function addTransitionLayer(){
    if(document.querySelector(".cx-page-transition")) return;
    const layer = document.createElement("div");
    layer.className = "cx-page-transition";
    document.body.appendChild(layer);
  }

  function setupCursor(){
    if(window.matchMedia("(pointer:coarse)").matches) return;

    document.body.classList.add("cx-admin-cursor");

    let dot = document.querySelector(".cx-cursor-dot");
    let glow = document.querySelector(".cx-cursor-glow");

    if(!glow){
      glow = document.createElement("div");
      glow.className = "cx-cursor-glow";
      document.body.appendChild(glow);
    }

    if(!dot){
      dot = document.createElement("div");
      dot.className = "cx-cursor-dot";
      document.body.appendChild(dot);
    }

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let gx = x;
    let gy = y;

    dot.style.left = x + "px";
    dot.style.top = y + "px";
    glow.style.left = gx + "px";
    glow.style.top = gy + "px";

    window.addEventListener("mousemove", function(e){
      x = e.clientX;
      y = e.clientY;
      dot.style.left = x + "px";
      dot.style.top = y + "px";
    }, { passive:true });

    function loop(){
      gx += (x - gx) * 0.18;
      gy += (y - gy) * 0.18;
      glow.style.left = gx + "px";
      glow.style.top = gy + "px";
      requestAnimationFrame(loop);
    }
    loop();

    document.addEventListener("mouseover", function(e){
      if(e.target.closest("a,button,input,select,textarea,[role='button'],.card,[class*='card'],.cx-admin-nav-item")){
        document.body.classList.add("cx-cursor-hover");
      }
    }, true);

    document.addEventListener("mouseout", function(e){
      if(e.target.closest("a,button,input,select,textarea,[role='button'],.card,[class*='card'],.cx-admin-nav-item")){
        document.body.classList.remove("cx-cursor-hover");
      }
    }, true);
  }

  function injectLogsIntoExistingSidebar(){
    const sidebar =
      document.querySelector(".sidebar") ||
      document.querySelector(".admin-sidebar") ||
      document.querySelector("aside") ||
      document.querySelector("nav");

    if(!sidebar) return;

    if(document.querySelector('[data-cx-logs-link="true"]')) return;

    const link = document.createElement("a");
    link.href = "/admin/logs/";
    link.setAttribute("data-cx-logs-link","true");
    link.className = "cx-admin-nav-item" + (location.pathname.includes("/admin/logs") ? " active" : "");
    link.innerHTML = '<span class="ico">◷</span><span>Logs</span>';

    const labels = Array.from(sidebar.querySelectorAll("a,button,div,span"));
    const users = labels.find(el => String(el.textContent || "").trim().toLowerCase() === "users");
    const payouts = labels.find(el => String(el.textContent || "").trim().toLowerCase() === "payouts");
    const target = users || payouts;

    if(target && target.parentElement){
      target.parentElement.insertBefore(link, target.nextSibling);
    }else{
      sidebar.appendChild(link);
    }
  }

  function highlightCurrentLink(){
    const path = location.pathname.replace(/\/+$/,"");
    document.querySelectorAll("a[href]").forEach(a => {
      const href = a.getAttribute("href") || "";
      if(!href.startsWith("/admin")) return;
      const clean = href.replace(/\/+$/,"");
      if(clean === path){
        a.classList.add("active");
      }
    });
  }

  function setupTransitions(){
    document.addEventListener("click", function(e){
      const a = e.target.closest("a[href]");
      if(!a) return;

      const href = a.getAttribute("href") || "";
      if(!href.startsWith("/admin")) return;
      if(a.target === "_blank") return;
      if(e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;

      e.preventDefault();
      document.body.classList.add("cx-page-leaving");

      setTimeout(function(){
        window.location.href = href;
      }, 180);
    }, true);
  }

  function boot(){
    document.body.classList.add("cx-page-entering");
    addTransitionLayer();
    setupCursor();
    injectLogsIntoExistingSidebar();
    highlightCurrentLink();
    setupTransitions();

    setTimeout(injectLogsIntoExistingSidebar, 400);
    setTimeout(injectLogsIntoExistingSidebar, 1200);
    setTimeout(setupCursor, 600);
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", boot);
  }else{
    boot();
  }

  window.addEventListener("load", boot);
})();
