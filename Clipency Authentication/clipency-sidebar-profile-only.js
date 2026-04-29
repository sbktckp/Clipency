(function () {
  if (window.__clipencySidebarProfileOnlyLoaded) return;
  window.__clipencySidebarProfileOnlyLoaded = true;

  const routes = ["/campaigns", "/stats", "/payouts", "/wallet", "/profile"];
  if (!routes.includes(window.location.pathname)) return;

  function getSidebar() {
    return document.querySelector(".sidebar, .dashboard-sidebar, aside");
  }

  function text(el) {
    return (el.textContent || "").trim().toLowerCase();
  }

  function createProfileButton() {
    const link = document.createElement("a");
    link.href = "/profile";
    link.className = "cx-sidebar-profile-only-link";
    link.setAttribute("data-route", "/profile");

    if (window.location.pathname === "/profile") {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    }

    link.innerHTML = `
      <span class="cx-sidebar-profile-only-icon" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M20 21a8 8 0 0 0-16 0" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.8"/>
        </svg>
      </span>
      <span>Profile</span>
    `;

    return link;
  }

  function hasProfileButton(sidebar) {
    return Array.from(sidebar.querySelectorAll("a, button")).some((el) => {
      const href = el.getAttribute("href") || "";
      const route = el.dataset.route || el.dataset.page || el.dataset.nav || "";

      return (
        el.classList.contains("cx-sidebar-profile-only-link") ||
        href === "/profile" ||
        route === "/profile" ||
        route === "profile" ||
        text(el) === "profile"
      );
    });
  }

  function insertProfileButton() {
    const sidebar = getSidebar();
    if (!sidebar) return;

    sidebar.querySelectorAll(".cx-sidebar-profile-only-link, .cx-final-profile-button, .cx-forced-profile-link, .cx-profile-nav-link").forEach((el) => el.remove());

    if (hasProfileButton(sidebar)) return;

    const profileButton = createProfileButton();

    const currencyLabel = Array.from(sidebar.querySelectorAll("*")).find((el) => text(el) === "currency");

    if (currencyLabel) {
      currencyLabel.insertAdjacentElement("beforebegin", profileButton);
      return;
    }

    const walletItem = Array.from(sidebar.querySelectorAll("a, button, div")).find((el) => text(el).includes("wallet"));

    if (walletItem) {
      const row = walletItem.closest("a, button, li, .nav-item, .nav-link, .sidebar-link") || walletItem;
      row.insertAdjacentElement("afterend", profileButton);
      return;
    }

    sidebar.appendChild(profileButton);
  }

  function disableBottomProfileCardClick() {
    const sidebar = getSidebar();
    if (!sidebar) return;

    const bottomCards = Array.from(sidebar.querySelectorAll("div, a, button")).filter((el) => {
      const t = text(el);
      return t.includes("smit bharat patil") && !t.includes("campaigns");
    });

    bottomCards.forEach((card) => {
      if (card.dataset.cxBottomCardDisabled) return;
      card.dataset.cxBottomCardDisabled = "true";

      card.addEventListener("click", function (event) {
        if (event.target.closest("[data-logout], .logout, .logout-btn, [aria-label*='Logout'], button, a[title='Logout']")) return;

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      }, true);
    });
  }

  function boot() {
    insertProfileButton();
    disableBottomProfileCardClick();
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
