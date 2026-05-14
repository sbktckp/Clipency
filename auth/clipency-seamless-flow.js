(function () {
  if (window.__clipencySeamlessFlowLoaded) return;
  window.__clipencySeamlessFlowLoaded = true;

  const smoothRoutes = [
    "/campaigns",
    "/stats",
    "/payouts",
    "/wallet",
    "/profile"
  ];

  const routeLabels = {
    "/campaigns": "Campaigns",
    "/stats": "Stats",
    "/payouts": "Payouts",
    "/wallet": "Wallet",
    "/profile": "Profile"
  };

  const currentPath = window.location.pathname;

  if (!smoothRoutes.includes(currentPath)) return;

  document.documentElement.classList.add("cx-route-ready");

  function ensureOverlay() {
    if (document.querySelector(".cx-route-transition-overlay")) return;

    const overlay = document.createElement("div");
    overlay.className = "cx-route-transition-overlay";

    const mark = document.createElement("div");
    mark.className = "cx-route-transition-mark";
    mark.innerHTML = `
      <span class="cx-route-transition-dot"></span>
      <span data-route-loading-label>Opening</span>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(mark);
  }

  function isModifiedClick(event) {
    return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
  }

  function getInternalRouteFromClick(event) {
    const link = event.target.closest("a[href], button, [role='button'], [data-route], [data-page], [data-nav]");

    if (!link) return null;

    const raw =
      link.getAttribute("href") ||
      link.dataset.route ||
      link.dataset.page ||
      link.dataset.nav ||
      "";

    if (!raw) {
      const text = (link.textContent || "").trim().toLowerCase();

      if (text.includes("campaign")) return "/campaigns";
      if (text.includes("stats")) return "/stats";
      if (text.includes("payout")) return "/payouts";
      if (text.includes("wallet")) return "/wallet";
      if (text.includes("profile")) return "/profile";

      return null;
    }

    if (raw.startsWith("http")) {
      try {
        const url = new URL(raw);
        if (url.origin !== window.location.origin) return null;
        return url.pathname;
      } catch {
        return null;
      }
    }

    if (raw.startsWith("#")) return null;

    try {
      const url = new URL(raw, window.location.origin);
      return url.pathname;
    } catch {
      return null;
    }
  }

  function premiumNavigate(path) {
    if (!smoothRoutes.includes(path)) return false;

    if (path === window.location.pathname) return true;

    ensureOverlay();

    const label = document.querySelector("[data-route-loading-label]");
    if (label) {
      label.textContent = `Opening ${routeLabels[path] || "workspace"}`;
    }

    document.documentElement.classList.add("cx-page-leaving");

    setTimeout(function () {
      window.location.href = path;
    }, 190);

    return true;
  }

  document.addEventListener("click", function (event) {
    if (isModifiedClick(event)) return;

    const path = getInternalRouteFromClick(event);

    if (!path) return;
    if (!smoothRoutes.includes(path)) return;

    event.preventDefault();
    event.stopPropagation();

    premiumNavigate(path);
  }, true);

  window.addEventListener("pageshow", function () {
    document.documentElement.classList.remove("cx-page-leaving");
    document.documentElement.classList.add("cx-route-ready");
  });

  ensureOverlay();
})();
