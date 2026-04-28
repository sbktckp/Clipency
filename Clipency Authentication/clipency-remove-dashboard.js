(function () {
  if (window.__clipencyRemoveDashboardLoaded) return;
  window.__clipencyRemoveDashboardLoaded = true;

  if (window.location.pathname === "/dashboard") {
    window.location.replace("/stats");
    return;
  }

  function isDashboardItem(el) {
    const text = (el.textContent || "").trim().toLowerCase();
    const href = el.getAttribute?.("href") || "";
    const data = [
      el.dataset?.route,
      el.dataset?.page,
      el.dataset?.nav,
      el.dataset?.target
    ].filter(Boolean).join(" ").toLowerCase();

    return (
      text === "dashboard" ||
      text.includes("dashboard") ||
      href === "/dashboard" ||
      data.includes("dashboard") ||
      data.includes("/dashboard")
    );
  }

  function removeDashboard() {
    document
      .querySelectorAll(".sidebar a, .sidebar button, .dashboard-sidebar a, .dashboard-sidebar button, aside a, aside button")
      .forEach((item) => {
        if (!isDashboardItem(item)) return;
        const row = item.closest("li, .nav-item, .sidebar-link, .nav-link, a, button") || item;
        row.remove();
      });

    document.querySelectorAll('a[href="/dashboard"]').forEach((a) => {
      a.href = "/stats";
    });
  }

  function boot() {
    removeDashboard();
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

(function () {
  function removeOrphanAccountLabel() {
    document.querySelectorAll(".sidebar *, .dashboard-sidebar *, aside *").forEach((el) => {
      const text = (el.textContent || "").trim().toLowerCase();

      if (text === "account") {
        el.remove();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", removeOrphanAccountLabel);
  } else {
    removeOrphanAccountLabel();
  }

  new MutationObserver(removeOrphanAccountLabel).observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
