(function () {
  if (window.__clipencyProfileFinalLoaded) return;
  window.__clipencyProfileFinalLoaded = true;

  const routes = ["/campaigns", "/stats", "/payouts", "/wallet", "/profile", "/dashboard"];
  if (!routes.includes(window.location.pathname)) return;

  function text(el) {
    return (el.textContent || "").trim().toLowerCase();
  }

  function getSidebar() {
    return document.querySelector(".sidebar, .dashboard-sidebar, aside");
  }

  function createProfileButton() {
    const a = document.createElement("a");
    a.href = "/profile";
    a.className = "cx-final-profile-button";
    a.innerHTML = `
      <span class="cx-final-profile-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M20 21a8 8 0 0 0-16 0" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>
          <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.9"/>
        </svg>
      </span>
      <span>Profile</span>
    `;

    if (window.location.pathname === "/profile") {
      a.classList.add("active");
    }

    a.addEventListener("click", function (e) {
      e.preventDefault();
      window.location.href = "/profile";
    });

    return a;
  }

  function insertProfile() {
    const sidebar = getSidebar();
    if (!sidebar) return;

    // Remove failed/duplicate profile buttons.
    sidebar.querySelectorAll(".cx-final-profile-button, .cx-forced-profile-link, .cx-profile-nav-link").forEach(el => el.remove());

    // If a real profile button exists, leave it.
    const existingReal = Array.from(sidebar.querySelectorAll("a, button")).find((el) => {
      const href = el.getAttribute("href") || "";
      const route = el.dataset.route || el.dataset.page || el.dataset.nav || "";
      return href === "/profile" || route === "/profile" || route === "profile" || text(el) === "profile";
    });

    if (existingReal) {
      existingReal.style.display = "flex";
      return;
    }

    const button = createProfileButton();

    // Find the CURRENCY label and insert Profile above it.
    const currencyNode = Array.from(sidebar.querySelectorAll("*")).find((el) => text(el) === "currency");

    if (currencyNode) {
      currencyNode.insertAdjacentElement("beforebegin", button);
      return;
    }

    // Fallback: insert after Wallet.
    const walletNode = Array.from(sidebar.querySelectorAll("a, button, div")).find((el) => text(el).includes("wallet"));

    if (walletNode) {
      const row = walletNode.closest("a, button, li, .nav-item, .nav-link, .sidebar-link") || walletNode;
      row.insertAdjacentElement("afterend", button);
      return;
    }

    sidebar.appendChild(button);
  }

  function makeBottomCardOpenProfile() {
    const sidebar = getSidebar();
    if (!sidebar) return;

    const profileCard = Array.from(sidebar.querySelectorAll("div, a, button")).find((el) => {
      const t = text(el);
      return t.includes("smit bharat patil") && !t.includes("campaigns");
    });

    if (!profileCard || profileCard.dataset.cxFinalProfileCardReady) return;

    profileCard.dataset.cxFinalProfileCardReady = "true";
    profileCard.style.cursor = "pointer";

    profileCard.addEventListener("click", function (e) {
      if (e.target.closest("[data-logout], .logout, .logout-btn, [aria-label='Logout']")) return;
      window.location.href = "/profile";
    });
  }

  function boot() {
    insertProfile();
    makeBottomCardOpenProfile();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  // Sidebar is being re-rendered by other scripts, so keep it enforced.
  setInterval(boot, 600);

  new MutationObserver(boot).observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
