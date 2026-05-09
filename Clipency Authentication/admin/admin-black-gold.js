
/* =====================================================
   CLIPENCY ADMIN BLACK GOLD JS
   Cursor + transitions + logs nav
   ===================================================== */
(function(){
  function addTransition(){
    if(document.querySelector(".cx-bg-transition")) return;
    const layer = document.createElement("div");
    layer.className = "cx-bg-transition";
    document.body.appendChild(layer);
  }

  function setupCursor(){
    if(window.matchMedia("(pointer: coarse)").matches) return;

    document.body.classList.add("cx-bg-cursor");

    let dot = document.querySelector(".cx-bg-dot");
    let glow = document.querySelector(".cx-bg-glow");

    if(!glow){
      glow = document.createElement("div");
      glow.className = "cx-bg-glow";
      document.body.appendChild(glow);
    }

    if(!dot){
      dot = document.createElement("div");
      dot.className = "cx-bg-dot";
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
    }, { passive: true });

    function loop(){
      gx += (x - gx) * 0.18;
      gy += (y - gy) * 0.18;
      glow.style.left = gx + "px";
      glow.style.top = gy + "px";
      requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);

    document.addEventListener("mouseover", function(e){
      if(e.target.closest("a,button,input,select,textarea,[role='button'],[class*='card'],[class*='nav'],[class*='button']")){
        document.body.classList.add("cx-bg-hovering");
      }
    }, true);

    document.addEventListener("mouseout", function(e){
      if(e.target.closest("a,button,input,select,textarea,[role='button'],[class*='card'],[class*='nav'],[class*='button']")){
        document.body.classList.remove("cx-bg-hovering");
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
      document.body.classList.add("cx-bg-leaving");

      setTimeout(function(){
        window.location.href = href;
      }, 170);
    }, true);
  }

  function addLogsToNativeSidebar(){
    if(location.pathname.includes("/admin/logs")) return;

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
    if(existing.length) return;

    const links = Array.from(sidebar.querySelectorAll("a,button"));
    const ref =
      links.find(el => String(el.textContent || "").trim().toLowerCase() === "users") ||
      links.find(el => String(el.textContent || "").trim().toLowerCase() === "payouts") ||
      links[links.length - 1];

    if(!ref || !ref.parentElement) return;

    let clone = ref.cloneNode(true);

    if(clone.tagName.toLowerCase() !== "a"){
      const a = document.createElement("a");
      a.className = clone.className;
      a.innerHTML = clone.innerHTML;
      clone = a;
    }

    clone.href = "/admin/logs/";
    clone.classList.remove("active");

    const textNodes = Array.from(clone.querySelectorAll("*")).filter(el => {
      const t = String(el.textContent || "").trim().toLowerCase();
      return t === "users" || t === "payouts";
    });

    if(textNodes.length){
      textNodes[textNodes.length - 1].textContent = "Logs";
    } else {
      clone.textContent = "◷ Logs";
    }

    ref.parentElement.insertBefore(clone, ref.nextSibling);
  }

  function boot(){
    document.body.classList.add("cx-bg-entering");
    addTransition();
    setupCursor();
    setupTransitions();
    addLogsToNativeSidebar();

    setTimeout(setupCursor, 400);
    setTimeout(addLogsToNativeSidebar, 500);
    setTimeout(addLogsToNativeSidebar, 1500);
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  window.addEventListener("load", boot);
})();
