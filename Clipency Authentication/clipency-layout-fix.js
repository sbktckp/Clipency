(function () {
  if (window.__clipencyLayoutFixLoaded) return;
  window.__clipencyLayoutFixLoaded = true;

  const creatorRoutes = [
    "/dashboard",
    "/campaigns",
    "/stats",
    "/payouts",
    "/wallet",
    "/profile"
  ];

  const isCreatorRoute = creatorRoutes.includes(window.location.pathname);

  function ensureBodyClass() {
    if (isCreatorRoute) {
      document.body.classList.add("cx-creator-route");
    }
    if (window.location.pathname === "/") {
      document.body.classList.add("cx-landing-route");
    }
  }

  function addSidebarToggle() {
    if (!isCreatorRoute) return;
    if (document.querySelector(".cx-sidebar-toggle")) return;

    const btn = document.createElement("button");
    btn.className = "cx-sidebar-toggle";
    btn.type = "button";
    btn.setAttribute("aria-label", "Toggle sidebar");
    btn.innerHTML = "☰";
    document.body.appendChild(btn);

    btn.addEventListener("click", function () {
      document.body.classList.toggle("cx-mobile-sidebar-open");
    });

    document.addEventListener("click", function (e) {
      if (!document.body.classList.contains("cx-mobile-sidebar-open")) return;
      const sidebar = document.querySelector(".sidebar, .dashboard-sidebar, aside.sidebar");
      const clickedToggle = e.target.closest(".cx-sidebar-toggle");
      const clickedInsideSidebar = sidebar && sidebar.contains(e.target);

      if (!clickedToggle && !clickedInsideSidebar) {
        document.body.classList.remove("cx-mobile-sidebar-open");
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 900) {
        document.body.classList.remove("cx-mobile-sidebar-open");
      }
    });
  }

  function shrinkQuickSwitch() {
    const quick = document.querySelector(".cx-command-trigger");
    if (quick) {
      quick.style.transform = "scale(0.88)";
      quick.style.transformOrigin = "left bottom";
    }
  }

  function run() {
    ensureBodyClass();
    addSidebarToggle();
    shrinkQuickSwitch();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
