
/* ===== CLIPENCY FORCE ADMIN CURSOR ===== */
(function(){
  const STYLE_ID = "cx-force-admin-cursor-style";
  const DOT_ID = "cx-force-admin-cursor-dot";
  const GLOW_ID = "cx-force-admin-cursor-glow";

  function addStyle(){
    if(document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      @media (pointer:fine){
        html.cx-force-cursor,
        html.cx-force-cursor *,
        body.cx-force-cursor,
        body.cx-force-cursor *{
          cursor:none!important;
        }

        #${DOT_ID},
        #${GLOW_ID}{
          position:fixed!important;
          left:0!important;
          top:0!important;
          pointer-events:none!important;
          z-index:2147483647!important;
          display:block!important;
          opacity:1!important;
          visibility:visible!important;
          contain:layout style paint!important;
          will-change:transform,width,height!important;
        }

        #${DOT_ID}{
          width:8px!important;
          height:8px!important;
          margin-left:-4px!important;
          margin-top:-4px!important;
          border-radius:999px!important;
          background:#fff!important;
          box-shadow:
            0 0 10px rgba(255,255,255,.95),
            0 0 28px rgba(224,172,120,.95),
            0 0 54px rgba(224,172,120,.45)!important;
        }

        #${GLOW_ID}{
          width:50px!important;
          height:50px!important;
          margin-left:-25px!important;
          margin-top:-25px!important;
          border-radius:999px!important;
          border:1px solid rgba(224,172,120,.62)!important;
          background:radial-gradient(circle,rgba(224,172,120,.24),rgba(224,172,120,.08) 42%,transparent 72%)!important;
          box-shadow:0 0 50px rgba(224,172,120,.22)!important;
          transition:width .16s ease,height .16s ease,margin .16s ease,border-color .16s ease,opacity .16s ease!important;
        }

        html.cx-force-hover #${GLOW_ID}{
          width:78px!important;
          height:78px!important;
          margin-left:-39px!important;
          margin-top:-39px!important;
          border-color:rgba(224,172,120,.9)!important;
          opacity:1!important;
        }
      }

      @media (pointer:coarse), (max-width:760px){
        #${DOT_ID},
        #${GLOW_ID}{
          display:none!important;
        }

        html.cx-force-cursor,
        html.cx-force-cursor *,
        body.cx-force-cursor,
        body.cx-force-cursor *{
          cursor:auto!important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function ensureCursor(){
    addStyle();

    if(!window.matchMedia("(pointer:fine)").matches) return;

    document.documentElement.classList.add("cx-force-cursor");
    if(document.body) document.body.classList.add("cx-force-cursor");

    let dot = document.getElementById(DOT_ID);
    let glow = document.getElementById(GLOW_ID);

    if(!glow){
      glow = document.createElement("div");
      glow.id = GLOW_ID;
      document.body.appendChild(glow);
    }

    if(!dot){
      dot = document.createElement("div");
      dot.id = DOT_ID;
      document.body.appendChild(dot);
    }

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let gx = x;
    let gy = y;

    function moveDot(){
      dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }

    function moveGlow(){
      glow.style.transform = `translate3d(${gx}px, ${gy}px, 0)`;
    }

    moveDot();
    moveGlow();

    if(!window.__cxForceCursorBound){
      window.__cxForceCursorBound = true;

      window.addEventListener("mousemove", function(e){
        x = e.clientX;
        y = e.clientY;

        const d = document.getElementById(DOT_ID);
        if(d) d.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }, { passive:true });

      function loop(){
        gx += (x - gx) * 0.18;
        gy += (y - gy) * 0.18;

        const g = document.getElementById(GLOW_ID);
        if(g) g.style.transform = `translate3d(${gx}px, ${gy}px, 0)`;

        requestAnimationFrame(loop);
      }
      loop();

      document.addEventListener("mouseover", function(e){
        if(e.target.closest("a,button,input,select,textarea,[role='button'],[class*='card'],[class*='button'],[class*='nav']")){
          document.documentElement.classList.add("cx-force-hover");
        }
      }, true);

      document.addEventListener("mouseout", function(e){
        if(e.target.closest("a,button,input,select,textarea,[role='button'],[class*='card'],[class*='button'],[class*='nav']")){
          document.documentElement.classList.remove("cx-force-hover");
        }
      }, true);
    }
  }

  function boot(){
    if(!document.body){
      setTimeout(boot, 50);
      return;
    }

    ensureCursor();

    // Recreate cursor if any page script removes it
    setInterval(function(){
      if(!document.getElementById(DOT_ID) || !document.getElementById(GLOW_ID)){
        ensureCursor();
      }
    }, 1000);
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", boot);
  }else{
    boot();
  }

  window.addEventListener("load", boot);
})();
