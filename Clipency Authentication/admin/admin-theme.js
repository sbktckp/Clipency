
/* ===== CLIPENCY ADMIN THEME JS ===== */
(function(){
  function addLogsNav(){
    if(document.querySelector(".cx-logs-nav")) return;

    const sidebar =
      document.querySelector(".sidebar") ||
      document.querySelector("aside") ||
      document.querySelector("nav");

    if(!sidebar) return;

    const link = document.createElement("a");
    link.href = "/admin/logs/";
    link.className = "cx-logs-nav" + (location.pathname.includes("/admin/logs") ? " active" : "");
    link.innerHTML = `<span>🕒</span><span>Logs</span>`;

    const usersItem = Array.from(sidebar.querySelectorAll("a,button,div")).find(el =>
      String(el.textContent || "").trim().toLowerCase() === "users"
    );

    if(usersItem && usersItem.parentElement){
      usersItem.parentElement.insertBefore(link, usersItem.nextSibling);
    }else{
      sidebar.appendChild(link);
    }
  }

  function setupCursor(){
    if(document.querySelector(".cx-cursor-dot")) return;
    if(!window.matchMedia("(pointer:fine)").matches) return;

    document.body.classList.add("cx-custom-cursor");

    const dot = document.createElement("div");
    dot.className = "cx-cursor-dot";

    const glow = document.createElement("div");
    glow.className = "cx-cursor-glow";

    document.body.appendChild(glow);
    document.body.appendChild(dot);

    let x = innerWidth / 2, y = innerHeight / 2;
    let gx = x, gy = y;

    window.addEventListener("mousemove", e => {
      x = e.clientX;
      y = e.clientY;
      dot.style.left = x + "px";
      dot.style.top = y + "px";
    }, { passive:true });

    function loop(){
      gx += (x - gx) * .18;
      gy += (y - gy) * .18;
      glow.style.left = gx + "px";
      glow.style.top = gy + "px";
      requestAnimationFrame(loop);
    }
    loop();

    document.addEventListener("mouseover", e => {
      if(e.target.closest("a,button,input,select,textarea,[role='button']")){
        document.body.classList.add("cx-cursor-hover");
      }
    });

    document.addEventListener("mouseout", e => {
      if(e.target.closest("a,button,input,select,textarea,[role='button']")){
        document.body.classList.remove("cx-cursor-hover");
      }
    });
  }

  function boot(){
    addLogsNav();
    setupCursor();
    setTimeout(addLogsNav, 500);
    setTimeout(addLogsNav, 1500);
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", boot);
  }else{
    boot();
  }
  window.addEventListener("load", boot);
})();
