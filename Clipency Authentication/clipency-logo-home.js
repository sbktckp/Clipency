(function () {
  if (window.__clipencyLogoHomeLoaded) return;
  window.__clipencyLogoHomeLoaded = true;

  const clipperRoutes = ["/campaigns", "/stats", "/payouts", "/wallet", "/profile"];

  if (!clipperRoutes.includes(window.location.pathname)) return;

  function getSidebar() {
    return document.querySelector(".sidebar, .dashboard-sidebar, aside");
  }

  function addLogoHomeHitbox() {
    const sidebar = getSidebar();
    if (!sidebar) return;

    if (sidebar.querySelector(".cx-logo-home-hitbox")) return;

    sidebar.classList.add("cx-logo-home-sidebar");

    const link = document.createElement("a");
    link.href = "/campaigns";
    link.className = "cx-logo-home-hitbox";
    link.setAttribute("aria-label", "Go to campaigns");
    link.setAttribute("title", "Go to campaigns");

    link.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      window.location.href = "/campaigns";
    });

    sidebar.appendChild(link);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", addLogoHomeHitbox);
  } else {
    addLogoHomeHitbox();
  }

  new MutationObserver(function () {
    addLogoHomeHitbox();
  }).observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
