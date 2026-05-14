(function () {
  if (window.__clipencySafeProfileLoaded) return;
  window.__clipencySafeProfileLoaded = true;

  const CLIPPER_ROUTES = ["/campaigns", "/stats", "/payouts", "/wallet", "/profile"];
  if (!CLIPPER_ROUTES.includes(window.location.pathname)) return;

  function text(el) {
    return String(el?.textContent || "").trim().toLowerCase();
  }

  function sidebar() {
    return document.querySelector("aside, .sidebar, .dashboard-sidebar, .clipper-sidebar");
  }

  function isSafeProfileLink(el) {
    return !!el?.closest?.(".cx-safe-profile-link");
  }

  function removeUnsafeProfileRoutes() {
    document.querySelectorAll('a[href*="profile"], [onclick*="profile"], [data-route*="profile"], [data-page*="profile"], [data-profile-link]').forEach((el) => {
      if (isSafeProfileLink(el)) return;

      const insideSidebar = !!el.closest("aside, .sidebar, .dashboard-sidebar, .clipper-sidebar");
      const insideTopbar = !!el.closest("header, .topbar, .navbar");

      // Anything outside explicit sidebar/topbar profile link is unsafe.
      if (!insideSidebar && !insideTopbar) {
        el.removeAttribute("href");
        el.removeAttribute("onclick");
        el.removeAttribute("data-route");
        el.removeAttribute("data-page");
        el.removeAttribute("data-profile-link");
        el.classList.add("cx-profile-route-disabled");
        return;
      }

      // Even inside sidebar/topbar, only our safe profile button should route.
      if (!el.classList.contains("cx-safe-profile-link") && !el.closest(".cx-safe-profile-link")) {
        el.removeAttribute("href");
        el.removeAttribute("onclick");
        el.removeAttribute("data-route");
        el.removeAttribute("data-page");
        el.removeAttribute("data-profile-link");
      }
    });
  }

  function addProfileButton() {
    const side = sidebar();
    if (!side) return;

    side.querySelectorAll(".cx-safe-profile-link").forEach((el, index) => {
      if (index > 0) el.remove();
    });

    if (side.querySelector(".cx-safe-profile-link")) return;

    const link = document.createElement("a");
    link.href = "/profile";
    link.className = "cx-safe-profile-link";
    link.setAttribute("aria-label", "Open profile");
    link.innerHTML = `
      <span class="cx-safe-profile-icon">👤</span>
      <strong>Profile</strong>
    `;

    link.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      window.location.href = "/profile";
    });

    const currencyLabel = Array.from(side.querySelectorAll("*")).find((el) => text(el) === "currency");
    const walletLabel = Array.from(side.querySelectorAll("*")).find((el) => text(el) === "wallet");

    if (currencyLabel) {
      currencyLabel.insertAdjacentElement("beforebegin", link);
    } else if (walletLabel) {
      const walletRow = walletLabel.closest("a, button, li, div") || walletLabel;
      walletRow.insertAdjacentElement("afterend", link);
    } else {
      side.appendChild(link);
    }
  }

  document.addEventListener("click", function (event) {
    if (isSafeProfileLink(event.target)) return;

    const unsafeProfileTarget = event.target.closest(
      'a[href*="profile"], [onclick*="profile"], [data-route*="profile"], [data-page*="profile"], [data-profile-link]'
    );

    if (!unsafeProfileTarget) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    console.warn("Blocked unsafe profile redirect:", unsafeProfileTarget);
  }, true);

  function boot() {
    addProfileButton();
    removeUnsafeProfileRoutes();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  let scheduled = false;
  new MutationObserver(function () {
    if (scheduled) return;
    scheduled = true;

    requestAnimationFrame(function () {
      scheduled = false;
      boot();
    });
  }).observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["href", "onclick", "data-route", "data-page", "data-profile-link"]
  });
})();
