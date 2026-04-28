(function () {
  const creatorRoutes = ["/dashboard", "/campaigns", "/stats", "/payouts", "/wallet", "/profile"];
  if (!creatorRoutes.includes(window.location.pathname)) return;

  const routeMap = {
    dashboard: "/dashboard",
    campaigns: "/campaigns",
    stats: "/stats",
    payouts: "/payouts",
    payout: "/payouts",
    wallet: "/wallet",
    profile: "/profile"
  };

  function routeFromText(text) {
    const clean = String(text || "").trim().toLowerCase();

    if (clean.includes("dashboard")) return "/dashboard";
    if (clean.includes("campaign")) return "/campaigns";
    if (clean.includes("stats")) return "/stats";
    if (clean.includes("payout")) return "/payouts";
    if (clean.includes("wallet")) return "/wallet";
    if (clean.includes("profile")) return "/profile";

    return null;
  }

  function routeFromElement(el) {
    const explicit =
      el.getAttribute("href") ||
      el.dataset.href ||
      el.dataset.route ||
      el.dataset.page ||
      el.dataset.nav ||
      el.getAttribute("data-target");

    if (explicit) {
      if (explicit.startsWith("/")) return explicit;

      const lowered = explicit.toLowerCase().replace("#", "").replace(".", "");
      if (routeMap[lowered]) return routeMap[lowered];
    }

    return routeFromText(el.textContent);
  }

  function markActive() {
    const current = window.location.pathname;

    document.querySelectorAll(".sidebar a, .sidebar button, .dashboard-sidebar a, .dashboard-sidebar button").forEach((el) => {
      const route = routeFromElement(el);
      if (!route) return;

      el.classList.toggle("active", route === current);
      el.setAttribute("aria-current", route === current ? "page" : "false");
    });
  }

  function bindSidebar() {
    const sidebar = document.querySelector(".sidebar, .dashboard-sidebar, aside.sidebar");
    if (!sidebar || sidebar.dataset.cxSidebarNavReady) return;

    sidebar.dataset.cxSidebarNavReady = "true";

    sidebar.addEventListener("click", (event) => {
      const item = event.target.closest("a, button, [role='button'], [data-route], [data-page], [data-nav], [data-target]");
      if (!item || !sidebar.contains(item)) return;

      const route = routeFromElement(item);
      if (!route) return;

      event.preventDefault();

      if (window.location.pathname === route) {
        document.body.classList.remove("cx-mobile-sidebar-open");
        return;
      }

      window.location.href = route;
    });

    markActive();
  }

  function bindBottomProfile() {
    const profileAreas = document.querySelectorAll(".sidebar-user, .sidebar-profile, .bottom-profile-card");

    profileAreas.forEach((area) => {
      if (area.dataset.cxProfileBound) return;
      area.dataset.cxProfileBound = "true";

      area.style.cursor = "pointer";

      area.addEventListener("click", (event) => {
        const clickedLogout = event.target.closest(".logout, .logout-btn, [data-logout], [aria-label='Logout']");
        if (clickedLogout) return;

        window.location.href = "/profile";
      });
    });
  }

  function bindLogout() {
    document.querySelectorAll(".sidebar .logout, .dashboard-sidebar .logout, .sidebar [data-logout], .dashboard-sidebar [data-logout], .sidebar [aria-label='Logout'], .dashboard-sidebar [aria-label='Logout']").forEach((button) => {
      if (button.dataset.cxLogoutBound) return;
      button.dataset.cxLogoutBound = "true";

      button.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();

        try {
          if (window.supabaseClient) {
            await window.supabaseClient.auth.signOut();
          }
        } finally {
          window.location.href = "/login";
        }
      });
    });
  }

  function boot() {
    bindSidebar();
    bindBottomProfile();
    bindLogout();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  new MutationObserver(boot).observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
