(function () {
  if (window.__clipencyProfileEntryLoaded) return;
  window.__clipencyProfileEntryLoaded = true;

  const routes = ["/campaigns", "/stats", "/payouts", "/wallet", "/profile"];
  const authRoutes = ["/login", "/signup", "/auth.html", "/login.html", "/signup.html"];

  if (authRoutes.includes(window.location.pathname)) return;
  if (!routes.includes(window.location.pathname)) return;

  let scheduled = false;
  const readyCards = new WeakSet();

  function text(el) {
    return (el?.textContent || "").trim().toLowerCase();
  }

  function getSidebar() {
    return document.querySelector(".sidebar, .dashboard-sidebar, aside");
  }

  function createProfileButton() {
    const link = document.createElement("a");
    link.href = "/profile";
    link.className = "cx-profile-entry-link";
    link.setAttribute("data-route", "/profile");

    if (window.location.pathname === "/profile") {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    }

    link.innerHTML = `
      <span class="cx-profile-entry-icon" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M20 21a8 8 0 0 0-16 0" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.8"/>
        </svg>
      </span>
      <span>Profile</span>
    `;

    return link;
  }

  function cleanupOldDuplicateProfileButtons(sidebar) {
    sidebar
      .querySelectorAll(".cx-sidebar-profile-only-link, .cx-final-profile-button, .cx-forced-profile-link, .cx-profile-nav-link")
      .forEach((el) => el.remove());

    const profileLinks = Array.from(sidebar.querySelectorAll(".cx-profile-entry-link"));
    profileLinks.slice(1).forEach((el) => el.remove());
  }

  function insertProfileButton() {
    const sidebar = getSidebar();
    if (!sidebar) return;

    cleanupOldDuplicateProfileButtons(sidebar);

    const existing = sidebar.querySelector(".cx-profile-entry-link");

    if (existing) {
      existing.classList.toggle("active", window.location.pathname === "/profile");
      return;
    }

    const profileButton = createProfileButton();

    const currencyLabel = Array.from(sidebar.querySelectorAll("*")).find((el) => {
      return text(el) === "currency";
    });

    if (currencyLabel) {
      currencyLabel.insertAdjacentElement("beforebegin", profileButton);
      return;
    }

    const walletNode = Array.from(sidebar.querySelectorAll("*")).find((el) => {
      return text(el) === "wallet";
    });

    if (walletNode) {
      const row = walletNode.closest("a, button, li, .nav-item, .nav-link, .sidebar-link, div") || walletNode;
      row.insertAdjacentElement("afterend", profileButton);
      return;
    }

    const nav = sidebar.querySelector("nav") || sidebar;
    nav.appendChild(profileButton);
  }

  function isLogoutTarget(event) {
    return !!event.target.closest("[data-logout], .logout, .logout-btn, [title='Logout'], [aria-label*='Logout'], [aria-label*='logout']");
  }

  function makeNameCardsOpenProfile() {
    const candidates = Array.from(document.querySelectorAll("a, button, div, span"))
      .filter((el) => text(el).includes("smit bharat patil"));

    candidates.forEach((el) => {
      const card =
        el.closest("a, button, [role='button'], .profile-chip, .user-chip, .sidebar-user, .sidebar-profile, .bottom-profile-card, div") ||
        el;

      if (!card || readyCards.has(card)) return;

      readyCards.add(card);
      card.style.cursor = "pointer";
      card.setAttribute("title", "Open profile");

      card.addEventListener("click", function (event) {
        if (isLogoutTarget(event)) return;

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        window.location.href = "/profile";
      }, true);
    });
  }

  function boot() {
    insertProfileButton();
    makeNameCardsOpenProfile();

    document.documentElement.classList.remove("cx-route-booting");
    document.documentElement.classList.remove("cx-smooth-booting");
    document.documentElement.classList.add("cx-route-ready");
  }

  function scheduleBoot() {
    if (scheduled) return;

    scheduled = true;

    requestAnimationFrame(function () {
      scheduled = false;
      boot();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  const observer = new MutationObserver(scheduleBoot);

  observer.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true
  });

  setTimeout(boot, 400);
  setTimeout(boot, 1200);
})();
