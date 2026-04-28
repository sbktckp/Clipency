(function () {
  if (window.__clipencyRemoveDashboardLoaded) return;
  window.__clipencyRemoveDashboardLoaded = true;

  function isDashboardItem(el) {
    const text = (el.textContent || "").trim().toLowerCase();
    const href = el.getAttribute?.("href") || "";
    const route = el.dataset?.route || el.dataset?.page || el.dataset?.nav || "";

    return (
      text === "dashboard" ||
      href === "/dashboard" ||
      route === "dashboard" ||
      route === "/dashboard"
    );
  }

  function removeDashboardNav() {
    document
      .querySelectorAll(".sidebar a, .sidebar button, .dashboard-sidebar a, .dashboard-sidebar button, aside a, aside button")
      .forEach((item) => {
        if (!isDashboardItem(item)) return;

        const row = item.closest("li, .nav-item, .sidebar-link, a, button") || item;
        row.remove();
      });
  }

  function protectDashboardLinks() {
    document.querySelectorAll('a[href="/dashboard"]').forEach((link) => {
      link.setAttribute("href", "/stats");
    });

    document.querySelectorAll("[data-route='/dashboard'], [data-page='/dashboard'], [data-nav='/dashboard']").forEach((el) => {
      el.dataset.route = "/stats";
      el.dataset.page = "/stats";
      el.dataset.nav = "/stats";
    });
  }

  function boot() {
    removeDashboardNav();
    protectDashboardLinks();
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
