
/* ===== CLIPENCY LOGS HORIZONTAL SCROLL FIX ===== */
(function(){
  function enhanceLogsScroll(){
    const wrap =
      document.querySelector(".cx-logs-table-wrap") ||
      document.querySelector(".cx-final-logs-table-wrap") ||
      document.querySelector("[class*='logs-table-wrap']");

    if(!wrap || wrap.dataset.cxScrollEnhanced === "true") return;

    wrap.dataset.cxScrollEnhanced = "true";

    const topScroll = document.createElement("div");
    topScroll.className = "cx-logs-top-scroll";
    topScroll.innerHTML = `<div class="cx-logs-top-scroll-inner"></div>`;

    wrap.parentElement.insertBefore(topScroll, wrap);

    const inner = topScroll.querySelector(".cx-logs-top-scroll-inner");

    function syncWidth(){
      inner.style.width = wrap.scrollWidth + "px";
    }

    syncWidth();
    setTimeout(syncWidth, 500);
    setTimeout(syncWidth, 1500);
    window.addEventListener("resize", syncWidth);

    topScroll.addEventListener("scroll", function(){
      wrap.scrollLeft = topScroll.scrollLeft;
    });

    wrap.addEventListener("scroll", function(){
      topScroll.scrollLeft = wrap.scrollLeft;
    });

    // Wheel sideways when hovering table
    wrap.addEventListener("wheel", function(e){
      if(wrap.scrollWidth <= wrap.clientWidth) return;

      const mostlyVertical = Math.abs(e.deltaY) > Math.abs(e.deltaX);

      if(mostlyVertical){
        wrap.scrollLeft += e.deltaY;
        topScroll.scrollLeft = wrap.scrollLeft;
        e.preventDefault();
      }
    }, { passive:false });

    // Drag to scroll
    let isDown = false;
    let startX = 0;
    let startLeft = 0;

    wrap.addEventListener("pointerdown", function(e){
      if(e.target.closest("button,a,input,select,textarea")) return;

      isDown = true;
      startX = e.clientX;
      startLeft = wrap.scrollLeft;
      wrap.classList.add("cx-dragging");
      wrap.setPointerCapture(e.pointerId);
    });

    wrap.addEventListener("pointermove", function(e){
      if(!isDown) return;
      const dx = e.clientX - startX;
      wrap.scrollLeft = startLeft - dx;
      topScroll.scrollLeft = wrap.scrollLeft;
    });

    function stopDrag(){
      isDown = false;
      wrap.classList.remove("cx-dragging");
    }

    wrap.addEventListener("pointerup", stopDrag);
    wrap.addEventListener("pointercancel", stopDrag);
    wrap.addEventListener("pointerleave", stopDrag);
  }

  function boot(){
    enhanceLogsScroll();
    setTimeout(enhanceLogsScroll, 500);
    setTimeout(enhanceLogsScroll, 1500);
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", boot);
  }else{
    boot();
  }

  window.addEventListener("load", boot);
})();
