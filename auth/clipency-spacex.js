(function () {
  if (window.ClipencySpaceXOptimised) return;
  window.ClipencySpaceXOptimised = true;

  const creatorRoutes = [
    "/dashboard",
    "/campaigns",
    "/stats",
    "/payouts",
    "/wallet",
    "/profile"
  ];

  const isCreatorRoute = creatorRoutes.includes(window.location.pathname);

  function isMobile() {
    return window.matchMedia("(max-width: 900px)").matches;
  }

  function installCreatorSidebarToggle() {
    if (!isCreatorRoute) return;

    document.body.classList.add("cx-creator-route");

    if (document.querySelector(".cx-sidebar-toggle")) return;

    const button = document.createElement("button");
    button.className = "cx-sidebar-toggle";
    button.type = "button";
    button.setAttribute("aria-label", "Toggle sidebar");
    button.innerHTML = "☰";

    document.body.appendChild(button);

    const stored = localStorage.getItem("clipencySidebarCollapsed");

    if (stored === "true" && !isMobile()) {
      document.body.classList.add("cx-sidebar-collapsed");
      button.innerHTML = "☰";
    }

    button.addEventListener("click", () => {
      if (isMobile()) {
        document.body.classList.toggle("cx-mobile-sidebar-open");
        button.innerHTML = document.body.classList.contains("cx-mobile-sidebar-open") ? "×" : "☰";
        return;
      }

      document.body.classList.toggle("cx-sidebar-collapsed");
      const collapsed = document.body.classList.contains("cx-sidebar-collapsed");
      localStorage.setItem("clipencySidebarCollapsed", String(collapsed));
      button.innerHTML = collapsed ? "☰" : "‹";
    });

    document.addEventListener("click", (event) => {
      if (!isMobile()) return;
      if (!document.body.classList.contains("cx-mobile-sidebar-open")) return;

      const sidebar = document.querySelector(".sidebar, .dashboard-sidebar, aside:not(.staff-sidebar):not(.finance-launcher-side)");
      const clickedButton = event.target.closest(".cx-sidebar-toggle");
      const clickedSidebar = sidebar && sidebar.contains(event.target);

      if (!clickedButton && !clickedSidebar) {
        document.body.classList.remove("cx-mobile-sidebar-open");
        button.innerHTML = "☰";
      }
    });

    window.addEventListener("resize", () => {
      document.body.classList.remove("cx-mobile-sidebar-open");
      button.innerHTML = document.body.classList.contains("cx-sidebar-collapsed") ? "☰" : "‹";
    });
  }

  function preventHorizontalScroll() {
    const offenders = Array.from(document.querySelectorAll("body *")).filter((el) => {
      const rect = el.getBoundingClientRect();
      return rect.width > window.innerWidth + 20;
    });

    offenders.slice(0, 12).forEach((el) => {
      el.style.maxWidth = "100%";
      el.style.overflowX = "hidden";
    });
  }

  function renameQuickSwitchOnDashboard() {
    if (!isCreatorRoute) return;

    const trigger = document.querySelector(".cx-command-trigger span");
    if (trigger) {
      trigger.textContent = "Switch";
    }
  }

  function improveDashboardMicrocopy() {
    if (!isCreatorRoute) return;

    const replacements = new Map([
      ["Your dashboard is now tuned around your submissions, approved payouts and campaign performance. Start with the campaigns that fit your momentum, then track every clip from submission to payout.", "Track campaigns, submissions and payouts from one clean creator workspace."],
      ["Best campaigns for you", "Best campaigns"],
      ["Recommended next steps", "Next steps"],
      ["Clips waiting for admin approval.", "Awaiting review."],
      ["Campaigns you have submitted to.", "Submitted campaigns."]
    ]);

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);

    const nodes = [];

    while (walker.nextNode()) {
      nodes.push(walker.currentNode);
    }

    nodes.forEach((node) => {
      const clean = node.nodeValue.trim();

      if (replacements.has(clean)) {
        node.nodeValue = node.nodeValue.replace(clean, replacements.get(clean));
      }
    });
  }

  function boot() {
    installCreatorSidebarToggle();
    renameQuickSwitchOnDashboard();
    improveDashboardMicrocopy();

    setTimeout(preventHorizontalScroll, 500);
    setTimeout(preventHorizontalScroll, 1500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
