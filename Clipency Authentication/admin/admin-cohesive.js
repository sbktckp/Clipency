
/* ===== CLIPENCY ADMIN COHESIVE JS ===== */
(function(){
  function addOverlay(){
    if(document.querySelector(".cx-admin-route-overlay")) return;
    const overlay = document.createElement("div");
    overlay.className = "cx-admin-route-overlay";
    document.body.appendChild(overlay);
  }

  function setupCursor(){
    if(window.matchMedia("(pointer: coarse)").matches) return;

    document.body.classList.add("cx-admin-cursor");

    let dot = document.querySelector(".cx-admin-cursor-dot");
    let glow = document.querySelector(".cx-admin-cursor-glow");

    if(!glow){
      glow = document.createElement("div");
      glow.className = "cx-admin-cursor-glow";
      document.body.appendChild(glow);
    }

    if(!dot){
      dot = document.createElement("div");
      dot.className = "cx-admin-cursor-dot";
      document.body.appendChild(dot);
    }

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let gx = x;
    let gy = y;

    function setDot(){
      dot.style.left = x + "px";
      dot.style.top = y + "px";
    }

    window.addEventListener("mousemove", function(e){
      x = e.clientX;
      y = e.clientY;
      setDot();
    }, { passive: true });

    function loop(){
      gx += (x - gx) * 0.18;
      gy += (y - gy) * 0.18;
      glow.style.left = gx + "px";
      glow.style.top = gy + "px";
      requestAnimationFrame(loop);
    }

    setDot();
    glow.style.left = gx + "px";
    glow.style.top = gy + "px";
    loop();

    document.addEventListener("mouseover", function(e){
      if(e.target.closest("a,button,input,select,textarea,[role='button'],[class*='card'],[class*='nav']")){
        document.body.classList.add("cx-admin-hovering");
      }
    }, true);

    document.addEventListener("mouseout", function(e){
      if(e.target.closest("a,button,input,select,textarea,[role='button'],[class*='card'],[class*='nav']")){
        document.body.classList.remove("cx-admin-hovering");
      }
    }, true);
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
      document.body.classList.add("cx-admin-leaving");

      setTimeout(function(){
        window.location.href = href;
      }, 170);
    }, true);
  }

  function makeLogsNavCohesive(){
    const sidebar =
      document.querySelector(".sidebar") ||
      document.querySelector(".admin-sidebar") ||
      document.querySelector("aside") ||
      document.querySelector("nav");

    if(!sidebar) return;

    const existingLogs = Array.from(sidebar.querySelectorAll("a[href*='/admin/logs'], a[href='/admin/logs/']"));

    if(existingLogs.length > 1){
      existingLogs.slice(1).forEach(x => x.remove());
    }

    if(existingLogs.length){
      existingLogs[0].classList.toggle("active", location.pathname.includes("/admin/logs"));
      return;
    }

    const ref = Array.from(sidebar.querySelectorAll("a,button")).find(el =>
      String(el.textContent || "").trim().toLowerCase() === "users"
    ) || Array.from(sidebar.querySelectorAll("a,button")).find(el =>
      String(el.textContent || "").trim().toLowerCase() === "payouts"
    );

    let link;

    if(ref){
      link = ref.cloneNode(true);

      if(link.tagName.toLowerCase() !== "a"){
        const a = document.createElement("a");
        a.className = link.className;
        a.innerHTML = link.innerHTML;
        link = a;
      }

      link.href = "/admin/logs/";
      link.classList.remove("active");

      const textNodes = Array.from(link.querySelectorAll("*")).filter(el =>
        String(el.textContent || "").trim().toLowerCase() === "users" ||
        String(el.textContent || "").trim().toLowerCase() === "payouts"
      );

      if(textNodes.length){
        textNodes[textNodes.length - 1].textContent = "Logs";
      }else{
        link.textContent = "◷ Logs";
      }

      const icons = Array.from(link.querySelectorAll("svg, i, span")).filter(el =>
        String(el.textContent || "").trim().length <= 2
      );

      if(icons.length){
        icons[0].textContent = "◷";
      }

      ref.parentElement.insertBefore(link, ref.nextSibling);
    }
  }

  function boot(){
    document.body.classList.add("cx-admin-entering");
    addOverlay();
    setupCursor();
    setupTransitions();
    makeLogsNavCohesive();

    setTimeout(setupCursor, 500);
    setTimeout(makeLogsNavCohesive, 500);
    setTimeout(makeLogsNavCohesive, 1500);
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", boot);
  }else{
    boot();
  }

  window.addEventListener("load", boot);
})();
