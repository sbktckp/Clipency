
/* ===== CLIPENCY FINAL ADMIN RUNTIME ===== */
(function(){
  function addTransition(){
    if(document.querySelector(".cx-admin-transition")) return;
    const el = document.createElement("div");
    el.className = "cx-admin-transition";
    document.body.appendChild(el);
  }

  function setupCursor(){
    if(window.matchMedia("(pointer: coarse)").matches) return;

    document.body.classList.add("cx-admin-cursor");

    let dot = document.querySelector(".cx-admin-dot");
    let glow = document.querySelector(".cx-admin-glow");

    if(!glow){
      glow = document.createElement("div");
      glow.className = "cx-admin-glow";
      document.body.appendChild(glow);
    }

    if(!dot){
      dot = document.createElement("div");
      dot.className = "cx-admin-dot";
      document.body.appendChild(dot);
    }

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let gx = x;
    let gy = y;

    window.addEventListener("mousemove", function(e){
      x = e.clientX;
      y = e.clientY;
      dot.style.left = x + "px";
      dot.style.top = y + "px";
    }, { passive: true });

    function loop(){
      gx += (x - gx) * 0.18;
      gy += (y - gy) * 0.18;
      glow.style.left = gx + "px";
      glow.style.top = gy + "px";
      requestAnimationFrame(loop);
    }

    dot.style.left = x + "px";
    dot.style.top = y + "px";
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

  function addLogsNavToExistingSidebar(){
    const sidebar =
      document.querySelector(".sidebar") ||
      document.querySelector(".admin-sidebar") ||
      document.querySelector("aside") ||
      document.querySelector("nav");

    if(!sidebar) return;

    const existing = Array.from(sidebar.querySelectorAll("a[href*='/admin/logs']"));
    if(existing.length > 1){
      existing.slice(1).forEach(x => x.remove());
    }
    if(existing.length){
      existing[0].classList.toggle("active", location.pathname.includes("/admin/logs"));
      return;
    }

    const items = Array.from(sidebar.querySelectorAll("a,button"));
    const ref =
      items.find(el => String(el.textContent || "").trim().toLowerCase() === "users") ||
      items.find(el => String(el.textContent || "").trim().toLowerCase() === "payouts") ||
      items[items.length - 1];

    if(!ref || !ref.parentElement) return;

    let link = ref.cloneNode(true);

    if(link.tagName.toLowerCase() !== "a"){
      const a = document.createElement("a");
      a.className = link.className;
      a.innerHTML = link.innerHTML;
      link = a;
    }

    link.href = "/admin/logs/";
    link.classList.remove("active");

    const textTargets = Array.from(link.querySelectorAll("*")).filter(el => {
      const t = String(el.textContent || "").trim().toLowerCase();
      return t === "users" || t === "payouts";
    });

    if(textTargets.length){
      textTargets[textTargets.length - 1].textContent = "Logs";
    } else {
      link.textContent = "◷ Logs";
    }

    ref.parentElement.insertBefore(link, ref.nextSibling);
  }

  function boot(){
    document.body.classList.add("cx-admin-entering");
    addTransition();
    setupCursor();
    setupTransitions();
    addLogsNavToExistingSidebar();

    setTimeout(setupCursor, 600);
    setTimeout(addLogsNavToExistingSidebar, 500);
    setTimeout(addLogsNavToExistingSidebar, 1500);
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  window.addEventListener("load", boot);
})();
