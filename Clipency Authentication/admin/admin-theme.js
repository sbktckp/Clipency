
/* ===== CLIPENCY ADMIN THEME JS V2 ===== */
(function(){
  function addTransitionLayer(){
    if(document.querySelector(".cx-page-transition")) return;
    const layer = document.createElement("div");
    layer.className = "cx-page-transition";
    document.body.appendChild(layer);
  }

  function addLogsNav(){
    const sidebar =
      document.querySelector(".sidebar") ||
      document.querySelector(".admin-sidebar") ||
      document.querySelector("aside") ||
      document.querySelector("nav");

    if(!sidebar) return;

    let existing = document.querySelector(".cx-logs-nav");
    if(existing){
      existing.classList.toggle("active", location.pathname.includes("/admin/logs"));
      return;
    }

    const link = document.createElement("a");
    link.href = "/admin/logs/";
    link.className = "cx-logs-nav" + (location.pathname.includes("/admin/logs") ? " active" : "");
    link.innerHTML = `<span style="width:22px;text-align:center;">◷</span><span>Logs</span>`;

    const items = Array.from(sidebar.querySelectorAll("a,button,div,span"));
    const usersItem = items.find(el => String(el.textContent || "").trim().toLowerCase() === "users");
    const payoutsItem = items.find(el => String(el.textContent || "").trim().toLowerCase() === "payouts");

    const target = usersItem || payoutsItem;

    if(target && target.parentElement){
      target.parentElement.insertBefore(link, target.nextSibling);
    }else{
      sidebar.appendChild(link);
    }
  }

  function setActiveAdminLink(){
    const path = location.pathname.replace(/\/+$/,"");
    document.querySelectorAll("a,button,.cx-logs-nav").forEach(el => {
      const href = el.getAttribute && el.getAttribute("href");
      if(!href) return;
      const clean = href.replace(location.origin,"").replace(/\/+$/,"");
      if(clean && clean === path){
        el.classList.add("active");
      }
    });
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

    function place(){
      dot.style.left = x + "px";
      dot.style.top = y + "px";
      glow.style.left = gx + "px";
      glow.style.top = gy + "px";
    }

    place();

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

    requestAnimationFrame(loop);

    document.addEventListener("mouseover", function(e){
      if(e.target.closest("a,button,input,select,textarea,[role='button'],.card,[class*='card']")){
        document.body.classList.add("cx-cursor-hover");
      }
    }, true);

    document.addEventListener("mouseout", function(e){
      if(e.target.closest("a,button,input,select,textarea,[role='button'],.card,[class*='card']")){
        document.body.classList.remove("cx-cursor-hover");
      }
    }, true);
  }

  function setupAdminTransitions(){
    document.addEventListener("click", function(e){
      const link = e.target.closest("a[href]");
      if(!link) return;

      const href = link.getAttribute("href") || "";
      if(!href.startsWith("/admin")) return;
      if(link.target === "_blank") return;
      if(e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;

      e.preventDefault();

      document.body.classList.add("cx-page-leaving");

      setTimeout(function(){
        window.location.href = href;
      }, 190);
    }, true);
  }

  function boot(){
    document.body.classList.add("cx-page-entering");
    addTransitionLayer();
    addLogsNav();
    setActiveAdminLink();
    setupCursor();
    setupAdminTransitions();

    setTimeout(addLogsNav, 300);
    setTimeout(addLogsNav, 1000);
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", boot);
  }else{
    boot();
  }

  window.addEventListener("load", boot);
})();
