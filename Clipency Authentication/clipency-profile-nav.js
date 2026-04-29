(function () {

  const cxAuthRoutes = ["/login", "/signup", "/auth.html", "/login.html", "/signup.html"];
  if (cxAuthRoutes.includes(window.location.pathname)) return;

  if (window.__clipencyProfileNavLoaded) return;
  window.__clipencyProfileNavLoaded = true;

  const creatorRoutes = ["/campaigns", "/stats", "/payouts", "/wallet", "/profile", "/dashboard"];

  if (!creatorRoutes.includes(window.location.pathname)) return;

  function getSidebar() {
    return document.querySelector(".sidebar, .dashboard-sidebar, aside");
  }

  function hasProfileLink(sidebar) {
    return Array.from(sidebar.querySelectorAll("a, button")).some((el) => {
      const text = (el.textContent || "").trim().toLowerCase();
      const href = el.getAttribute("href") || "";
      const route = el.dataset.route || el.dataset.page || el.dataset.nav || "";

      return text === "profile" || href === "/profile" || route === "/profile" || route === "profile";
    });
  }

  function findWalletItem(sidebar) {
    return Array.from(sidebar.querySelectorAll("a, button, [role='button']")).find((el) => {
      const text = (el.textContent || "").trim().toLowerCase();
      const href = el.getAttribute("href") || "";
      const route = el.dataset.route || el.dataset.page || el.dataset.nav || "";

      return text.includes("wallet") || href === "/wallet" || route === "/wallet" || route === "wallet";
    });
  }

  function createProfileLink() {
    const link = document.createElement("a");
    link.href = "/profile";
    link.className = "cx-profile-nav-link";
    link.setAttribute("data-route", "/profile");

    link.innerHTML = `
      <span class="cx-profile-nav-icon" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M20 21a8 8 0 0 0-16 0" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.8"/>
        </svg>
      </span>
      <span>Profile</span>
    `;

    return link;
  }

  function addProfileNav() {
    const sidebar = getSidebar();
    if (!sidebar || sidebar.dataset.cxProfileNavReady) return;

    if (hasProfileLink(sidebar)) {
      sidebar.dataset.cxProfileNavReady = "true";
      return;
    }

    const profileLink = createProfileLink();
    const walletItem = findWalletItem(sidebar);

    if (walletItem) {
      const row = walletItem.closest("li, .nav-item, .sidebar-link, .nav-link, a, button") || walletItem;
      row.insertAdjacentElement("afterend", profileLink);
    } else {
      const nav = sidebar.querySelector("nav") || sidebar;
      nav.appendChild(profileLink);
    }

    sidebar.dataset.cxProfileNavReady = "true";
  }

  function makeBottomProfileClickable() {
    document.querySelectorAll(".sidebar-user, .sidebar-profile, .bottom-profile-card").forEach((card) => {
      if (card.dataset.cxProfileCardReady) return;

      card.dataset.cxProfileCardReady = "true";
      card.style.cursor = "pointer";
      card.setAttribute("title", "Open profile");

      card.addEventListener("click", (event) => {
        const logoutClicked = event.target.closest(".logout, .logout-btn, [data-logout], [aria-label='Logout']");
        if (logoutClicked) return;

        window.location.href = "/profile";
      });
    });
  }

  function markActiveProfile() {
    if (window.location.pathname !== "/profile") return;

    document.querySelectorAll(".cx-profile-nav-link").forEach((link) => {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    });
  }

  function boot() {
    addProfileNav();
    makeBottomProfileClickable();
    markActiveProfile();
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
